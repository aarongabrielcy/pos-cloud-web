import type { components } from "@pos-cloud-web/api-client";
import type { StatusBadgeVariant } from "@pos-cloud-web/ui";

export type LicenseStatus = components["schemas"]["LicenseResponseDto"]["status"];
export type LicenseEdition = components["schemas"]["LicenseResponseDto"]["edition"];

const LICENSE_STATUSES: readonly LicenseStatus[] = ["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"];
const LICENSE_EDITIONS: readonly LicenseEdition[] = ["BASIC", "PREMIUM"];

/** Defensive framework-boundary cast for an untyped string (e.g. read from the URL) - an invalid
 *  `?status=` value is treated as "no filter" rather than forwarded to the backend, which would just
 *  reject it with a 400 (same pattern as isCustomerStatus). */
export function isLicenseStatus(value: string): value is LicenseStatus {
  return (LICENSE_STATUSES as readonly string[]).includes(value);
}

/** Same defensive framework-boundary cast, for `?edition=`. */
export function isLicenseEdition(value: string): value is LicenseEdition {
  return (LICENSE_EDITIONS as readonly string[]).includes(value);
}

export function licenseEditionLabel(edition: LicenseEdition): string {
  return edition === "BASIC" ? "Basic" : "Premium";
}

/** Feature-local presentation mapping - @pos-cloud-web/ui's StatusBadge knows only the generic
 *  variant names, never domain status strings (WEB-01B mandatory correction #3). EXPIRED and REVOKED
 *  are both terminal, but EXPIRED is an ordinary lifecycle outcome (neutral) while REVOKED is a
 *  punitive/administrative termination (danger). */
export function licenseStatusVariant(status: LicenseStatus): StatusBadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "warning";
    case "EXPIRED":
      return "neutral";
    case "REVOKED":
      return "danger";
  }
}

export interface LicenseStatusAction {
  targetStatus: LicenseStatus;
  label: string;
  variant: "default" | "danger";
}

/**
 * Backend-enforced transitions (pos-cloud libs/control-plane/licensing/src/domain/license-status.ts):
 *   ACTIVE    -> SUSPENDED, EXPIRED, REVOKED
 *   SUSPENDED -> ACTIVE, EXPIRED, REVOKED
 *   EXPIRED   -> [] (terminal - renewal/reactivation of an expired license is explicitly out of scope)
 *   REVOKED   -> [] (terminal)
 * The backend remains the real authority regardless of what this offers - this only decides which
 * actions are worth presenting as buttons for the license's *current* status.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<LicenseStatus, readonly LicenseStatus[]>> = {
  ACTIVE: ["SUSPENDED", "EXPIRED", "REVOKED"],
  SUSPENDED: ["ACTIVE", "EXPIRED", "REVOKED"],
  EXPIRED: [],
  REVOKED: [],
};

const ACTION_LABELS: Readonly<
  Record<LicenseStatus, { label: string; variant: "default" | "danger" }>
> = {
  ACTIVE: { label: "Reactivate", variant: "default" },
  SUSPENDED: { label: "Suspend", variant: "default" },
  EXPIRED: { label: "Mark Expired", variant: "default" },
  REVOKED: { label: "Revoke", variant: "danger" },
};

export function licenseStatusActions(current: LicenseStatus): LicenseStatusAction[] {
  return ALLOWED_TRANSITIONS[current].map((targetStatus) => ({
    targetStatus,
    ...ACTION_LABELS[targetStatus],
  }));
}
