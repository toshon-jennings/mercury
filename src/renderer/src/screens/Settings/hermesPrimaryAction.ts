import type { HermesInstallHealth } from "../../../../main/installer";

export function getHermesPrimaryAction(health: HermesInstallHealth | null): {
  label: string;
  disabled: boolean;
  kind: "install" | "update" | "normalize" | "repair" | "none";
} {
  if (!health) {
    return { label: "Checking Hermes…", disabled: true, kind: "none" };
  }

  switch (health.mode) {
    case "up_to_date":
      return { label: "Up to date", disabled: true, kind: "none" };
    case "update_available":
      return { label: "Update Hermes", disabled: false, kind: "update" };
    case "customized":
      return {
        label: "Reset to official Hermes",
        disabled: false,
        kind: "normalize",
      };
    case "repair_needed":
      return { label: "Repair Hermes", disabled: false, kind: "repair" };
    case "not_installed":
      return { label: "Install Hermes", disabled: false, kind: "install" };
  }
}
