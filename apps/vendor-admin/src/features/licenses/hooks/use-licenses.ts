import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listLicenses, type ListLicensesParams } from "../api/licenses-api";
import { licenseKeys } from "../license-keys";

/** Keeps the previous page's rows on screen while the next page loads - no full-table
 *  loading-skeleton flash on every pagination click (same pattern as useCustomers). `enabled`
 *  (default true) lets a caller (e.g. LicensePicker) skip firing the request entirely - e.g. below
 *  its own minimum-search-length threshold - without duplicating this hook's query definition. */
export function useLicenses(params: ListLicensesParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: licenseKeys.list(params),
    queryFn: () => listLicenses(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}
