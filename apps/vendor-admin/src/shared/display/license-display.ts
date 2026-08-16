import type { components } from "@pos-cloud-web/api-client";

export type LicenseSummary = components["schemas"]["LicenseSummaryResponseDto"];

/** The primary human-facing rendering of a License relation - just licenseNumber (WEB-01E UX
 *  correction brief §8). Defensive against a missing summary - see customerDisplayLabel's own
 *  comment for the same reasoning. */
export function licenseDisplayLabel(license: LicenseSummary | null | undefined): string {
  if (!license) {
    return "Unavailable";
  }
  return license.licenseNumber;
}
