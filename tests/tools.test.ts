import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const { TEST_HOME } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("os");
  return {
    TEST_HOME: path.join(os.tmpdir(), `mercury-tools-test-${Date.now()}`),
  };
});

vi.mock("../src/main/installer", () => ({
  HERMES_HOME: TEST_HOME,
}));

import { getToolsets, setToolsetEnabled } from "../src/main/tools";

const CONFIG_PATH = join(TEST_HOME, "config.yaml");

beforeEach(() => {
  mkdirSync(TEST_HOME, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_HOME)) {
    rmSync(TEST_HOME, { recursive: true, force: true });
  }
});

describe("toolset config", () => {
  it("reads normal two-space YAML lists from api_server first", () => {
    writeFileSync(
      CONFIG_PATH,
      [
        "platform_toolsets:",
        "  cli:",
        "  - web",
        "  - terminal",
        "  api_server:",
        "  - file",
        "  - skills",
        "",
      ].join("\n"),
    );

    const toolsets = getToolsets();
    expect(toolsets.find((toolset) => toolset.key === "file")?.enabled).toBe(
      true,
    );
    expect(toolsets.find((toolset) => toolset.key === "skills")?.enabled).toBe(
      true,
    );
    expect(toolsets.find((toolset) => toolset.key === "web")?.enabled).toBe(
      false,
    );
  });

  it("writes toggles to both cli and api_server for desktop chat", () => {
    writeFileSync(
      CONFIG_PATH,
      [
        "model:",
        '  default: "test-model"',
        "platform_toolsets:",
        "  cli:",
        "  - web",
        "  - terminal",
        "",
      ].join("\n"),
    );

    expect(setToolsetEnabled("web", false)).toBe(true);

    const updated = readFileSync(CONFIG_PATH, "utf-8");
    expect(updated).toContain("  cli:\n  - terminal");
    expect(updated).toContain("  api_server:\n  - terminal");
    expect(updated).not.toContain("  - web");
  });
});
