import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer } from "../api/customers-api";
import { customerKeys } from "../customer-keys";

/** No retry - QueryClient's global mutation default already sets retry: false
 *  (app/providers/query-client.ts); a failed create is a real answer, not a transient failure. */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
