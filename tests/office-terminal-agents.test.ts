import { describe, expect, it } from "vitest";
import { shouldDispatchTerminalActivityUpdate } from "../src/main/office-terminal-agents";

describe("office terminal agent activity dispatch", () => {
  it("dispatches on newline boundaries", () => {
    expect(shouldDispatchTerminalActivityUpdate("npm run build\n")).toBe(true);
    expect(shouldDispatchTerminalActivityUpdate("ls -la\r")).toBe(true);
    expect(shouldDispatchTerminalActivityUpdate("echo one\r\n")).toBe(true);
  });

  it("does not dispatch on partial keystrokes", () => {
    expect(shouldDispatchTerminalActivityUpdate("git status")).toBe(false);
    expect(shouldDispatchTerminalActivityUpdate("\u001b[A")).toBe(false);
    expect(shouldDispatchTerminalActivityUpdate("")).toBe(false);
  });
});
