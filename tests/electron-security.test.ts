import { describe, expect, it } from "vitest";
import { pathToFileURL } from "url";
import { readFileSync } from "fs";
import { join } from "path";
import {
  hardenWebviewPreferences,
  isAllowedAppNavigationUrl,
  isAllowedExternalUrl,
  isAllowedWebviewUrl,
} from "../src/main/security";

const ROOT = join(__dirname, "..");
const mainSrc = readFileSync(join(ROOT, "src/main/index.ts"), "utf-8");

describe("Electron main process hardening", () => {
  it("keeps the main renderer isolated from Node privileges", () => {
    expect(mainSrc).toContain("nodeIntegration: false");
    expect(mainSrc).toContain("contextIsolation: true");
    expect(mainSrc).toContain("sandbox: true");
    expect(mainSrc).toContain("webSecurity: true");
    expect(mainSrc).toContain("allowRunningInsecureContent: false");
  });

  it("blocks untrusted top-level navigation and webview attachment", () => {
    expect(mainSrc).toContain("setWindowOpenHandler((details) => {");
    expect(mainSrc).toContain('webContents.on("will-navigate"');
    expect(mainSrc).toContain('"will-attach-webview"');
    expect(mainSrc).toContain("isAllowedAppNavigationUrl(");
    expect(mainSrc).toContain("isAllowedWebviewUrl(params.src)");
    expect(mainSrc).toContain("hardenWebviewPreferences(webPreferences)");
  });

  it("routes shell.openExternal through the allowlist helper", () => {
    const directShellOpens = mainSrc.match(/shell\.openExternal\(/g) ?? [];
    expect(directShellOpens).toHaveLength(1);
    expect(mainSrc).toContain(
      "function openExternalUrl(rawUrl: unknown): void",
    );
  });
});

describe("Electron external URL policy", () => {
  it("allows browser-safe external protocols", () => {
    expect(isAllowedExternalUrl("https://example.com/docs")).toBe(true);
    expect(isAllowedExternalUrl("http://localhost:3000")).toBe(true);
    expect(isAllowedExternalUrl("mailto:security@example.com")).toBe(true);
  });

  it("blocks dangerous or ambiguous external URLs", () => {
    expect(isAllowedExternalUrl("javascript:alert(1)")).toBe(false);
    expect(
      isAllowedExternalUrl("data:text/html,<script>alert(1)</script>"),
    ).toBe(false);
    expect(isAllowedExternalUrl("file:///C:/Users/me/token.txt")).toBe(false);
    expect(isAllowedExternalUrl("/relative/path")).toBe(false);
    expect(isAllowedExternalUrl({ href: "https://example.com" })).toBe(false);
  });
});

describe("Electron app navigation policy", () => {
  const rendererHtmlPath = "C:\\app\\out\\renderer\\index.html";
  const rendererUrl = pathToFileURL(rendererHtmlPath).href;

  it("allows the packaged renderer file", () => {
    expect(isAllowedAppNavigationUrl(rendererUrl, rendererHtmlPath)).toBe(true);
    expect(
      isAllowedAppNavigationUrl(`${rendererUrl}#settings`, rendererHtmlPath),
    ).toBe(true);
  });

  it("allows only the configured dev server origin in dev mode", () => {
    expect(
      isAllowedAppNavigationUrl(
        "http://localhost:5173/src/main.tsx",
        rendererHtmlPath,
        "http://localhost:5173",
      ),
    ).toBe(true);
    expect(
      isAllowedAppNavigationUrl(
        "http://localhost:3000",
        rendererHtmlPath,
        "http://localhost:5173",
      ),
    ).toBe(false);
  });

  it("blocks navigation to other local or remote documents", () => {
    expect(
      isAllowedAppNavigationUrl(
        "file:///C:/Users/me/secrets.html",
        rendererHtmlPath,
      ),
    ).toBe(false);
    expect(
      isAllowedAppNavigationUrl("https://example.com", rendererHtmlPath),
    ).toBe(false);
  });
});

describe("Electron webview policy", () => {
  it("allows only loopback HTTP URLs on app-controlled ports", () => {
    expect(isAllowedWebviewUrl("http://localhost:3000")).toBe(true);
    expect(isAllowedWebviewUrl("http://127.0.0.1:65535/path")).toBe(true);
    expect(isAllowedWebviewUrl("http://[::1]:3000")).toBe(true);
  });

  it("blocks remote, privileged, and non-HTTP webview URLs", () => {
    expect(isAllowedWebviewUrl("https://localhost:3000")).toBe(false);
    expect(isAllowedWebviewUrl("http://example.com:3000")).toBe(false);
    expect(isAllowedWebviewUrl("http://localhost:80")).toBe(false);
    expect(isAllowedWebviewUrl("file:///C:/Users/me/page.html")).toBe(false);
    expect(isAllowedWebviewUrl("javascript:alert(1)")).toBe(false);
  });

  it("removes privileged webview capabilities before attachment", () => {
    const webPreferences = {
      preload: "C:\\tmp\\evil-preload.js",
      preloadURL: "file:///C:/tmp/evil-preload.js",
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    };

    hardenWebviewPreferences(webPreferences);

    expect(webPreferences).not.toHaveProperty("preload");
    expect(webPreferences).not.toHaveProperty("preloadURL");
    expect(webPreferences.nodeIntegration).toBe(false);
    expect(webPreferences.contextIsolation).toBe(true);
    expect(webPreferences.sandbox).toBe(true);
    expect(webPreferences.webSecurity).toBe(true);
    expect(webPreferences.allowRunningInsecureContent).toBe(false);
  });
});
