import type { components } from "@pos-cloud-web/api-client";
import type { StatusBadgeVariant } from "@pos-cloud-web/ui";

export type InstallationStatus = components["schemas"]["InstallationResponseDto"]["status"];
export type InstallationPlatform = components["schemas"]["InstallationResponseDto"]["platform"];

const INSTALLATION_STATUSES: readonly InstallationStatus[] = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "DECOMMISSIONED",
];
const INSTALLATION_PLATFORMS: readonly InstallationPlatform[] = ["WINDOWS", "ANDROID", "IOS"];

/** Defensive framework-boundary cast for an untyped string (e.g. read from the URL) - same pattern
 *  as isCustomerStatus/isLicenseStatus. */
export function isInstallationStatus(value: string): value is InstallationStatus {
  return (INSTALLATION_STATUSES as readonly string[]).includes(value);
}

export function isInstallationPlatform(value: string): value is InstallationPlatform {
  return (INSTALLATION_PLATFORMS as readonly string[]).includes(value);
}

export function installationPlatformLabel(platform: InstallationPlatform): string {
  switch (platform) {
    case "WINDOWS":
      return "Windows";
    case "ANDROID":
      return "Android";
    case "IOS":
      return "iOS";
  }
}

/** Feature-local presentation mapping - @pos-cloud-web/ui's StatusBadge knows only the generic
 *  variant names, never domain status strings (WEB-01B mandatory correction #3). */
export function installationStatusVariant(status: InstallationStatus): StatusBadgeVariant {
  switch (status) {
    case "PENDING":
      return "info";
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "warning";
    case "DECOMMISSIONED":
      return "danger";
  }
}

export interface InstallationStatusAction {
  targetStatus: InstallationStatus;
  label: string;
  variant: "default" | "danger";
}

/**
 * Backend-enforced ADMIN transitions only (pos-cloud libs/control-plane/installations/src/domain/
 * installation-status.ts, ALLOWED_ADMIN_TRANSITIONS):
 *   PENDING        -> DECOMMISSIONED only (PENDING -> ACTIVE is NOT available through this endpoint -
 *                      real activation only happens via a successful machine enrollment)
 *   ACTIVE         -> SUSPENDED, DECOMMISSIONED
 *   SUSPENDED      -> ACTIVE, DECOMMISSIONED
 *   DECOMMISSIONED -> [] (terminal)
 * The backend remains the real authority regardless of what this offers - this only decides which
 * actions are worth presenting as buttons for the installation's *current* status.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<InstallationStatus, readonly InstallationStatus[]>> = {
  PENDING: ["DECOMMISSIONED"],
  ACTIVE: ["SUSPENDED", "DECOMMISSIONED"],
  SUSPENDED: ["ACTIVE", "DECOMMISSIONED"],
  DECOMMISSIONED: [],
};

const ACTION_LABELS: Readonly<
  Record<InstallationStatus, { label: string; variant: "default" | "danger" }>
> = {
  PENDING: { label: "Reactivate", variant: "default" },
  ACTIVE: { label: "Reactivate", variant: "default" },
  SUSPENDED: { label: "Suspend", variant: "default" },
  DECOMMISSIONED: { label: "Decommission", variant: "danger" },
};

export function installationStatusActions(current: InstallationStatus): InstallationStatusAction[] {
  return ALLOWED_TRANSITIONS[current].map((targetStatus) => ({
    targetStatus,
    ...ACTION_LABELS[targetStatus],
  }));
}
