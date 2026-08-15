import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listCustomers, type ListCustomersParams } from "../api/customers-api";
import { customerKeys } from "../customer-keys";

/** Keeps the previous page's rows on screen while the next page loads - no full-table
 *  loading-skeleton flash on every pagination click (design report §R). */
export function useCustomers(params: ListCustomersParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: keepPreviousData,
  });
}
