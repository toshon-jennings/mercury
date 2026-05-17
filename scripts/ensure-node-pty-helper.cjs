#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { accessSync, chmodSync, existsSync, readdirSync } = require("fs");
const { dirname, join } = require("path");

if (process.platform === "win32") {
  process.exit(0);
}

try {
  const nodePtyPackage = require.resolve("node-pty/package.json");
  const prebuildsDir = join(dirname(nodePtyPackage), "prebuilds");

  for (const platformDir of readdirSync(prebuildsDir)) {
    const helperPath = join(prebuildsDir, platformDir, "spawn-helper");
    if (!existsSync(helperPath)) continue;

    try {
      accessSync(helperPath, 1);
    } catch {
      chmodSync(helperPath, 0o755);
      console.log(`Made node-pty spawn-helper executable: ${helperPath}`);
    }
  }
} catch (error) {
  console.warn("Unable to verify node-pty spawn-helper mode:", error);
}
