import { describe, expect, it } from "vitest";
import { normalizeClaw3dPort } from "../src/main/claw3d";

describe("Claw3D Office port defaults", () => {
  it("moves legacy and adapter-conflicting ports to the Office UI port", () => {
    expect(normalizeClaw3dPort(3000)).toBe(18643);
    expect(normalizeClaw3dPort(18642)).toBe(18643);
  });

  it("preserves explicit non-conflicting user ports", () => {
    expect(normalizeClaw3dPort(3010)).toBe(3010);
    expect(normalizeClaw3dPort(45678)).toBe(45678);
  });
});
