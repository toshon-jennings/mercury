import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Copy, Refresh, Stop } from "../../assets/icons";

type TerminalStatus = "connecting" | "connected" | "exited" | "error";

function Terminal(): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const outputRef = useRef("");
  const [status, setStatus] = useState<TerminalStatus>("connecting");
  const [focused, setFocused] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [restartNonce, setRestartNonce] = useState(0);
  const [hasSession, setHasSession] = useState(false);

  const fitTerminal = useCallback(() => {
    const term = termRef.current;
    const fit = fitRef.current;
    const sessionId = sessionIdRef.current;
    if (!term || !fit) return;
    try {
      fit.fit();
      if (sessionId) {
        void window.hermesAPI.terminalResize(sessionId, term.cols, term.rows);
      }
    } catch {
      /* xterm can throw while the container is hidden during tab changes */
    }
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerm({
      cursorBlink: true,
      convertEol: true,
      fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      scrollback: 20000,
      theme: {
        background: "#130e08",
        foreground: "#ede8e0",
        cursor: "#82a6b1",
        selectionBackground: "#66462c",
        black: "#130e08",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#f59e0b",
        blue: "#82a6b1",
        magenta: "#b980ff",
        cyan: "#67e8f9",
        white: "#ede8e0",
        brightBlack: "#8c7e6e",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#fbbf24",
        brightBlue: "#bae6fd",
        brightMagenta: "#d8b4fe",
        brightCyan: "#a5f3fc",
        brightWhite: "#ffffff",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    termRef.current = term;
    fitRef.current = fit;

    const appendOutput = (chunk: string): void => {
      outputRef.current = `${outputRef.current}${chunk}`;
      if (outputRef.current.length > 1_000_000) {
        outputRef.current = outputRef.current.slice(-1_000_000);
      }
    };

    const cleanupData = window.hermesAPI.onTerminalData((payload) => {
      if (payload.sessionId !== sessionIdRef.current) return;
      appendOutput(payload.data);
      term.write(payload.data);
      setStatus("connected");
    });
    const cleanupExit = window.hermesAPI.onTerminalExit((payload) => {
      if (payload.sessionId !== sessionIdRef.current) return;
      const message = `\r\n[Mercury] Terminal exited with code ${payload.exitCode}.\r\n`;
      appendOutput(message);
      term.write(message);
      setStatus("exited");
      sessionIdRef.current = null;
      setHasSession(false);
    });
    const dataDisposable = term.onData((data) => {
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        void window.hermesAPI.terminalInput(sessionId, data);
      }
    });
    const resizeDisposable = term.onResize(({ cols, rows }) => {
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        void window.hermesAPI.terminalResize(sessionId, cols, rows);
      }
    });

    term.attachCustomKeyEventHandler((event) => {
      if (event.type === "keydown" && event.code === "Escape") {
        const textarea = host.querySelector("textarea");
        if (textarea instanceof HTMLTextAreaElement) textarea.blur();
        return false;
      }
      if (event.type !== "keydown" || !(event.ctrlKey || event.metaKey)) {
        return true;
      }
      if (event.code === "KeyC" && term.getSelection()) {
        void navigator.clipboard.writeText(term.getSelection());
        return false;
      }
      return true;
    });

    const handlePaste = (event: ClipboardEvent): void => {
      const sessionId = sessionIdRef.current;
      const text = event.clipboardData?.getData("text");
      if (!sessionId || !text) return;
      event.preventDefault();
      void window.hermesAPI.terminalInput(sessionId, text);
    };
    const handleClick = (): void => term.focus();
    const handleResize = (): number => requestAnimationFrame(fitTerminal);
    const resizeObserver = new ResizeObserver(handleResize);
    const start = async (): Promise<void> => {
      setStatus("connecting");
      requestAnimationFrame(async () => {
        try {
          fitTerminal();
          const result = await window.hermesAPI.terminalStart({
            cols: term.cols,
            rows: term.rows,
          });
          sessionIdRef.current = result.sessionId;
          setHasSession(true);
          setStatus("connected");
          void window.hermesAPI.terminalResize(
            result.sessionId,
            term.cols,
            term.rows,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to start shell.";
          const formatted = `\r\n[Mercury] Terminal failed to start: ${message}\r\n`;
          appendOutput(formatted);
          term.write(formatted);
          setHasSession(false);
          setStatus("error");
        }
      });
    };

    host.addEventListener("paste", handlePaste);
    host.addEventListener("click", handleClick);
    resizeObserver.observe(host);
    window.addEventListener("resize", handleResize);
    void start();

    const focusTimer = window.setTimeout(() => {
      const textarea = host.querySelector("textarea");
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.addEventListener("focus", () => setFocused(true));
        textarea.addEventListener("blur", () => setFocused(false));
      }
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      const sessionId = sessionIdRef.current;
      if (sessionId) void window.hermesAPI.terminalKill(sessionId);
      sessionIdRef.current = null;
      cleanupData();
      cleanupExit();
      dataDisposable.dispose();
      resizeDisposable.dispose();
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      host.removeEventListener("paste", handlePaste);
      host.removeEventListener("click", handleClick);
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [fitTerminal, restartNonce]);

  const handleCopyOutput = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(outputRef.current);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 2000);
  };

  const handleReset = (): void => {
    const resetSequence =
      "\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l\x1b[?1015l\x1b[?1l\x1b[?1049l\x1b[?25h\x1b[0m";
    const sessionId = sessionIdRef.current;
    if (sessionId) void window.hermesAPI.terminalInput(sessionId, resetSequence);
    termRef.current?.reset();
    requestAnimationFrame(fitTerminal);
  };

  const handleStop = (): void => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    void window.hermesAPI.terminalKill(sessionId);
    sessionIdRef.current = null;
    setHasSession(false);
    setStatus("exited");
  };

  const handleRestart = (): void => {
    const sessionId = sessionIdRef.current;
    if (sessionId) void window.hermesAPI.terminalKill(sessionId);
    sessionIdRef.current = null;
    setHasSession(false);
    outputRef.current = "";
    termRef.current?.clear();
    setStatus("connecting");
    setRestartNonce((current) => current + 1);
  };

  const statusLabel =
    status === "connected"
      ? focused
        ? "Typing"
        : "Click to focus"
      : status === "connecting"
        ? "Starting"
        : status === "error"
          ? "Error"
          : "Exited";

  return (
    <div className="terminal-page">
      <div className="terminal-toolbar">
        <div className="terminal-title-block">
          <div className={`terminal-status-dot ${status}`} />
          <div>
            <h1 className="terminal-title">Terminal</h1>
            <p className="terminal-subtitle">{statusLabel}</p>
          </div>
        </div>
        <div className="terminal-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => void handleCopyOutput()}
          >
            <Copy size={14} />
            {copyState === "copied"
              ? "Copied"
              : copyState === "failed"
                ? "Copy Failed"
                : "Copy Output"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={status === "exited" ? handleRestart : handleReset}
          >
            <Refresh size={14} />
            {status === "exited" ? "Restart" : "Reset"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleStop}
            disabled={!hasSession}
          >
            <Stop size={14} />
            Stop
          </button>
        </div>
      </div>
      <div className="terminal-shell" ref={hostRef} />
    </div>
  );
}

export default Terminal;
