import { BrowserWindow, ipcMain } from "electron";
import { spawn } from "child_process";
import { randomBytes } from "crypto";

export interface SudoPrecacheResult {
  ok: boolean;
  cancelled: boolean;
  stop: () => void;
}

/**
 * Cache sudo credentials upfront so later subprocess sudo calls (Playwright's
 * `--with-deps`, in particular) don't deadlock waiting on a stdin password
 * prompt that never has a TTY.
 *
 * Flow:
 *   1. `sudo -n -v` — does the user already have NOPASSWD or a fresh cache? Done.
 *   2. Otherwise pop a native Electron dialog asking for the password.
 *   3. Validate with `sudo -S -v`. On success, sudo's cred cache is populated
 *      (15 min default TTL).
 *   4. Run a background keep-alive that refreshes the cache every 60s so a
 *      slow install can't outlive the cache.
 *   5. Caller invokes `stop()` when install finishes; we clear with `sudo -k`.
 *
 * Returning `{ ok: false, cancelled: true }` means the user closed the dialog —
 * caller should abort the install with a friendly message instead of hanging.
 */
export async function precacheSudoCredentials(
  parent: BrowserWindow | null,
): Promise<SudoPrecacheResult> {
  // Windows has no sudo at all. macOS Playwright uses Homebrew (no sudo),
  // and the existing askpass bridge already works there if anything does
  // ask — only Linux/WSL needs the upfront cache.
  if (process.platform !== "linux") {
    return { ok: true, cancelled: false, stop: () => {} };
  }

  // On Linux, skip the dialog if sudo wouldn't prompt anyway:
  //   - user has NOPASSWD in /etc/sudoers
  //   - sudo creds already cached from a recent command
  //   - running as root (e.g. Docker container)
  if (await trySudoNonInteractive()) {
    return { ok: true, cancelled: false, stop: startKeepalive() };
  }

  const pw = await showSudoDialog(parent);
  if (pw === null) {
    return { ok: false, cancelled: true, stop: () => {} };
  }

  const valid = await validateSudoPassword(pw);
  if (!valid) {
    return { ok: false, cancelled: false, stop: () => {} };
  }

  return { ok: true, cancelled: false, stop: startKeepalive() };
}

function trySudoNonInteractive(): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn("sudo", ["-n", "-v"], { stdio: "ignore" });
    p.on("close", (code) => resolve(code === 0));
    p.on("error", () => resolve(false));
  });
}

function validateSudoPassword(password: string): Promise<boolean> {
  return new Promise((resolve) => {
    // `-S` reads password from stdin; `-v` validates and caches without
    // running a command. `-p ""` suppresses the "Password:" prompt to stderr.
    const p = spawn("sudo", ["-S", "-p", "", "-v"], {
      stdio: ["pipe", "ignore", "ignore"],
    });
    p.on("close", (code) => resolve(code === 0));
    p.on("error", () => resolve(false));
    try {
      p.stdin?.write(password + "\n");
      p.stdin?.end();
    } catch {
      resolve(false);
    }
  });
}

function startKeepalive(): () => void {
  let stopped = false;
  const interval = setInterval(() => {
    if (stopped) return;
    const p = spawn("sudo", ["-n", "-v"], { stdio: "ignore" });
    p.on("error", () => {
      /* non-fatal: keepalive failure won't crash the install */
    });
  }, 60_000);
  return () => {
    if (stopped) return;
    stopped = true;
    clearInterval(interval);
    const p = spawn("sudo", ["-k"], { stdio: "ignore" });
    p.on("error", () => {
      /* non-fatal */
    });
  };
}

function showSudoDialog(parent: BrowserWindow | null): Promise<string | null> {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 480,
      height: 280,
      parent: parent ?? undefined,
      modal: !!parent,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      title: "Administrator Password",
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const channel = `sudo-precache-${randomBytes(8).toString("hex")}`;
    let settled = false;
    const finish = (value: string | null): void => {
      if (settled) return;
      settled = true;
      ipcMain.removeAllListeners(channel);
      try {
        if (!win.isDestroyed()) win.close();
      } catch {
        /* non-fatal */
      }
      resolve(value);
    };

    ipcMain.on(channel, (_e, value: string | null) => finish(value));
    win.on("closed", () => finish(null));

    win.loadURL(
      "data:text/html;charset=UTF-8;base64," +
        Buffer.from(buildDialogHtml(channel)).toString("base64"),
    );
  });
}

function buildDialogHtml(channel: string): string {
  const safeChannel = channel.replace(/[^a-zA-Z0-9-]/g, "");
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin:0; padding:0; height:100%; }
  body { font-family:-apple-system,system-ui,sans-serif; background:#1e1e1e; color:#eee; padding:22px; box-sizing:border-box; }
  .title { font-size:15px; font-weight:600; margin-bottom:8px; }
  .prompt { font-size:12px; line-height:1.55; margin-bottom:16px; color:#bbb; }
  input { width:100%; padding:9px 11px; border-radius:6px; border:1px solid #444; background:#2a2a2a; color:#fff; font-size:14px; box-sizing:border-box; outline:none; }
  input:focus { border-color:#2563eb; }
  .row { display:flex; gap:8px; justify-content:flex-end; margin-top:20px; }
  button { padding:7px 16px; border-radius:6px; border:1px solid #444; background:#333; color:#fff; cursor:pointer; font-size:13px; font-family:inherit; }
  button.primary { background:#2563eb; border-color:#2563eb; }
  button:hover { opacity:0.9; }
</style></head>
<body>
<div class="title">Hermes needs your computer password</div>
<div class="prompt">The installer will install browser libraries that require administrator access. You'll only be asked once — the password is used locally and never stored.</div>
<input id="pw" type="password" autofocus autocomplete="off" placeholder="Password" />
<div class="row">
  <button id="cancel">Cancel</button>
  <button id="ok" class="primary">Continue</button>
</div>
<script>
  const { ipcRenderer } = require("electron");
  const pw = document.getElementById("pw");
  const submit = (val) => ipcRenderer.send(${JSON.stringify(safeChannel)}, val);
  document.getElementById("ok").onclick = () => submit(pw.value);
  document.getElementById("cancel").onclick = () => submit(null);
  pw.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit(pw.value);
    if (e.key === "Escape") submit(null);
  });
  pw.focus();
</script>
</body></html>`;
}
