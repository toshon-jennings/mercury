import { join, dirname } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { HERMES_HOME } from "./installer";

/**
 * Strip ANSI escape codes from terminal output.
 * Used by hermes.ts, claw3d.ts, and installer.ts when processing
 * child process output for display in the renderer.
 */
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B\[[0-9;]*[a-zA-Z]|\x1B\][^\x07]*\x07|\x1B\(B|\r/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, "");
}

/**
 * Validate that a profile name contains only alphanumeric characters,
 * underscores, or dashes. Prevents path traversal via the profile parameter.
 */
export function isValidProfileName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

/**
 * Resolve the home directory for a given profile.
 * 'default' or undefined maps to ~/.hermes; named profiles
 * live under ~/.hermes/profiles/<name>.
 */
export function profileHome(profile?: string): string {
  if (profile && profile !== "default" && isValidProfileName(profile)) {
    return join(HERMES_HOME, "profiles", profile);
  }
  return HERMES_HOME;
}

/**
 * Resolve the standard per-profile file locations (.env, config.yaml) under
 * the profile's home directory.
 */
export function profilePaths(profile?: string): {
  envFile: string;
  configFile: string;
  home: string;
} {
  const home = profileHome(profile);
  return {
    home,
    envFile: join(home, ".env"),
    configFile: join(home, "config.yaml"),
  };
}

/**
 * Escape special regex characters in a string so it can be
 * safely interpolated into a RegExp constructor.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Write a file, creating parent directories if they don't exist.
 * Prevents ENOENT crashes when ~/.hermes has been deleted or doesn't exist yet.
 */
export function safeWriteFile(filePath: string, content: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, "utf-8");
}
