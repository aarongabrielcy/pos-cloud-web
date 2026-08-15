import type { components } from "@pos-cloud-web/api-client";
import type { StatusBadgeVariant } from "@pos-cloud-web/ui";

export type CustomerStatus = components["schemas"]["CustomerResponseDto"]["status"];

const CUSTOMER_STATUSES: readonly CustomerStatus[] = ["ACTIVE", "SUSPENDED", "INACTIVE"];

/** Narrows an untyped string (e.g. read from the URL) to a real CustomerStatus - a defensive,
 *  framework-boundary cast, not a blind `as`. An invalid `?status=` value is treated as "no filter"
 *  rather than forwarded to the backend, which would just reject it with a 400. */
export function isCustomerStatus(value: string): value is CustomerStatus {
  return (CUSTOMER_STATUSES as readonly string[]).includes(value);
}

/** Feature-local presentation mapping - @pos-cloud-web/ui's StatusBadge knows only the generic
 *  variant names, never domain status strings (WEB-01B mandatory correction #3). */
export function customerStatusVariant(status: CustomerStatus): StatusBadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "warning";
    case "INACTIVE":
      return "neutral";
  }
}

export interface CustomerStatusAction {
  targetStatus: CustomerStatus;
  label: string;
  variant: "default" | "danger";
}

/**
 * Backend-enforced transitions (pos-cloud libs/control-plane/customer-management/src/domain/
 * customer-status.ts): ACTIVE <-> SUSPENDED, both -> INACTIVE (terminal, no actions from there). The
 * backend remains the real authority regardless of what this offers - this only decides which
 * actions are worth presenting as buttons for the customer's *current* status.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<CustomerStatus, readonly CustomerStatus[]>> = {
  ACTIVE: ["SUSPENDED", "INACTIVE"],
  SUSPENDED: ["ACTIVE", "INACTIVE"],
  INACTIVE: [],
};

const ACTION_LABELS: Readonly<
  Record<CustomerStatus, { label: string; variant: "default" | "danger" }>
> = {
  ACTIVE: { label: "Reactivate", variant: "default" },
  SUSPENDED: { label: "Suspend", variant: "default" },
  INACTIVE: { label: "Deactivate", variant: "danger" },
};

export function customerStatusActions(current: CustomerStatus): CustomerStatusAction[] {
  return ALLOWED_TRANSITIONS[current].map((targetStatus) => ({
    targetStatus,
    ...ACTION_LABELS[targetStatus],
  }));
}
