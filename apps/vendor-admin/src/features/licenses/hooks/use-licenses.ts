import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listLicenses, type ListLicensesParams } from "../api/licenses-api";
import { licenseKeys } from "../license-keys";

/** Keeps the previous page's rows on screen while the next page loads - no full-table
 *  loading-skeleton flash on every pagination click (same pattern as useCustomers). */
export function useLicenses(params: ListLicensesParams) {
  return useQuery({
    queryKey: licenseKeys.list(params),
    queryFn: () => listLicenses(params),
    placeholderData: keepPreviousData,
  });
}
