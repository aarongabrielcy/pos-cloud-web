import type { components } from "@pos-cloud-web/api-client";

export type CustomerSummary = components["schemas"]["CustomerSummaryResponseDto"];

/**
 * The one primary human-facing rendering of a Customer relation across every screen that embeds one
 * (License list/detail, Installation list/detail) - "CODE — Legal Name" (WEB-01E UX correction brief
 * §4/§7). `tradeName` is deliberately not part of the primary label; a consumer may still show it
 * selectively as secondary metadata if useful.
 *
 * Defensive against a missing summary (should never happen given the backend's referential
 * guarantees, but §37 requires the UI itself to stay resilient either way) - never falls back to a
 * raw id as the visible label.
 */
export function customerDisplayLabel(customer: CustomerSummary | null | undefined): string {
  if (!customer) {
    return "Unavailable";
  }
  return `${customer.code} — ${customer.legalName}`;
}
