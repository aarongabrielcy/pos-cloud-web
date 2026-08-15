import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "../api/customers-api";
import { customerKeys } from "../customer-keys";

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomer(id),
  });
}
