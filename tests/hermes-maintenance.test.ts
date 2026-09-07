import { describe, expect, it } from "vitest";
import {
  classifyHermesInstallHealth,
  type HermesRepoSnapshot,
} from "../src/main/installer";
import { getHermesPrimaryAction } from "../src/renderer/src/screens/Settings/Settings";

function makeSnapshot(
  overrides: Partial<HermesRepoSnapshot> = {},
): HermesRepoSnapshot {
  return {
    isRepo: true,
    remotes: { origin: "https://github.com/NousResearch/hermes-agent.git" },
    currentBranch: "main",
    workingTree: { isDirty: false, hasUntrackedFiles: false, raw: "" },
    officialRemote: "origin",
    forkRemote: null,
    aheadOfOfficial: 0,
    behindOfficial: 0,
    aheadOfFork: null,
    behindOfFork: null,
    ...overrides,
  };
}

describe("Hermes maintenance classification", () => {
  it("detects an up-to-date official install", () => {
    const health = classifyHermesInstallHealth(makeSnapshot(), "Hermes v1");
    expect(health.mode).toBe("up_to_date");
    expect(health.affectsMercury).toBe(false);
  });

  it("detects an available official update", () => {
    const health = classifyHermesInstallHealth(
      makeSnapshot({ behindOfficial: 3 }),
      "Hermes v1",
    );
    expect(health.mode).toBe("update_available");
    expect(health.affectsMercury).toBe(false);
  });

  it("detects customized installs when ahead of official", () => {
    const health = classifyHermesInstallHealth(
      makeSnapshot({ aheadOfOfficial: 1 }),
      "Hermes v1",
    );
    expect(health.mode).toBe("customized");
    expect(health.affectsMercury).toBe(false);
  });

  it("detects customized installs when dirty", () => {
    const health = classifyHermesInstallHealth(
      makeSnapshot({
        workingTree: { isDirty: true, hasUntrackedFiles: true, raw: "?? foo" },
      }),
      "Hermes v1",
    );
    expect(health.mode).toBe("customized");
    expect(health.affectsMercury).toBe(false);
  });

  it("detects repair-needed installs when the official remote is missing", () => {
    const health = classifyHermesInstallHealth(
      makeSnapshot({ officialRemote: null }),
      "Hermes v1",
    );
    expect(health.mode).toBe("repair_needed");
    expect(health.affectsMercury).toBe(false);
  });

  it("detects missing installs", () => {
    const health = classifyHermesInstallHealth(
      makeSnapshot({ isRepo: false }),
      null,
      false,
    );
    expect(health.mode).toBe("not_installed");
    expect(health.affectsMercury).toBe(false);
  });
});

describe("Hermes maintenance CTA mapping", () => {
  it("maps maintenance states to user-facing button labels", () => {
    expect(getHermesPrimaryAction(null).label).toBe("Checking Hermes…");
    expect(
      getHermesPrimaryAction(
        classifyHermesInstallHealth(makeSnapshot(), "Hermes v1"),
      ).label,
    ).toBe("Up to date");
    expect(
      getHermesPrimaryAction(
        classifyHermesInstallHealth(
          makeSnapshot({ behindOfficial: 1 }),
          "Hermes v1",
        ),
      ).label,
    ).toBe("Update Hermes");
    expect(
      getHermesPrimaryAction(
        classifyHermesInstallHealth(
          makeSnapshot({ aheadOfOfficial: 1 }),
          "Hermes v1",
        ),
      ).label,
    ).toBe("Reset to official Hermes");
    expect(
      getHermesPrimaryAction(
        classifyHermesInstallHealth(
          makeSnapshot({
            officialRemote: null,
          }),
          "Hermes v1",
        ),
      ).label,
    ).toBe("Repair Hermes");
  });
});
