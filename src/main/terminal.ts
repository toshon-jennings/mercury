import { existsSync } from "fs";
import { homedir } from "os";
import { randomUUID } from "crypto";
import type { WebContents } from "electron";
import { getEnhancedPath } from "./installer";

type PtyProcess = import("node-pty").IPty;

type TerminalSession = {
  id: string;
  ptyProcess: PtyProcess;
  owner: WebContents;
};

const sessions = new Map<string, TerminalSession>();
// eslint-disable-next-line no-control-regex
const DEVICE_ATTRIBUTE_RESPONSE_PATTERN = /\x1b\[\??[\d;]*c/g;
const PLAIN_DEVICE_ATTRIBUTE_RESPONSE_PATTERN = /^(?:\?1;2c|1;2c)+$/;

function stripTerminalGeneratedInput(input: string): string {
  const withoutEscapedResponse = input.replace(DEVICE_ATTRIBUTE_RESPONSE_PATTERN, "");
  return PLAIN_DEVICE_ATTRIBUTE_RESPONSE_PATTERN.test(withoutEscapedResponse)
    ? ""
    : withoutEscapedResponse;
}

function resolveShell(): string {
  if (process.platform === "win32") return "powershell.exe";

  const shell = process.env.SHELL || "/bin/zsh";
  if (existsSync(shell)) return shell;
  if (existsSync("/bin/zsh")) return "/bin/zsh";
  if (existsSync("/bin/bash")) return "/bin/bash";
  return "/bin/sh";
}

function resolveCwd(cwd?: string): string {
  if (cwd && existsSync(cwd)) return cwd;
  return homedir();
}

export async function startTerminalSession({
  owner,
  cols,
  rows,
  cwd,
}: {
  owner: WebContents;
  cols?: number;
  rows?: number;
  cwd?: string;
}): Promise<{ sessionId: string }> {
  const pty = await import("node-pty");
  const sessionId = randomUUID();
  const shell = resolveShell();
  const ptyProcess = pty.spawn(shell, process.platform === "win32" ? [] : ["-l"], {
    name: "xterm-256color",
    cols: Math.max(20, Math.floor(cols || 80)),
    rows: Math.max(8, Math.floor(rows || 24)),
    cwd: resolveCwd(cwd),
    env: {
      ...process.env,
      PATH: getEnhancedPath(),
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      LANG: process.env.LANG || "en_US.UTF-8",
      LC_ALL: process.env.LC_ALL || "en_US.UTF-8",
    },
  });

  const session: TerminalSession = { id: sessionId, ptyProcess, owner };
  sessions.set(sessionId, session);

  ptyProcess.onData((data) => {
    if (!owner.isDestroyed()) {
      owner.send("terminal-data", { sessionId, data });
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    sessions.delete(sessionId);
    if (!owner.isDestroyed()) {
      owner.send("terminal-exit", { sessionId, exitCode });
    }
  });

  owner.once("destroyed", () => {
    killTerminalSession(sessionId);
  });

  return { sessionId };
}

export function writeTerminalInput(sessionId: string, input: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  const safeInput = stripTerminalGeneratedInput(input);
  if (!safeInput) return true;
  session.ptyProcess.write(safeInput);
  return true;
}

export function resizeTerminalSession(
  sessionId: string,
  cols: number,
  rows: number,
): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  if (!Number.isFinite(cols) || !Number.isFinite(rows)) return false;
  session.ptyProcess.resize(
    Math.max(20, Math.floor(cols)),
    Math.max(8, Math.floor(rows)),
  );
  return true;
}

export function killTerminalSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  sessions.delete(sessionId);
  try {
    session.ptyProcess.kill();
  } catch {
    /* already exited */
  }
  return true;
}

export function killAllTerminalSessions(): void {
  for (const sessionId of [...sessions.keys()]) {
    killTerminalSession(sessionId);
  }
}
