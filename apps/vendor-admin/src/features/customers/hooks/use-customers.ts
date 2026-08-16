import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listCustomers, type ListCustomersParams } from "../api/customers-api";
import { customerKeys } from "../customer-keys";

/** Keeps the previous page's rows on screen while the next page loads - no full-table
 *  loading-skeleton flash on every pagination click (design report §R). `enabled` (default true)
 *  lets a caller (e.g. CustomerPicker) skip firing the request entirely - e.g. below its own
 *  minimum-search-length threshold - without duplicating this hook's query definition. */
export function useCustomers(params: ListCustomersParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}
