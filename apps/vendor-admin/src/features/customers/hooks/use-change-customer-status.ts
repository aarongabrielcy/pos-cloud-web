import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeCustomerStatus } from "../api/customers-api";
import { customerKeys } from "../customer-keys";
import type { CustomerStatus } from "../customer-status";

export interface ChangeCustomerStatusVariables {
  id: string;
  status: CustomerStatus;
}

export function useChangeCustomerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: ChangeCustomerStatusVariables) =>
      changeCustomerStatus(id, { status }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
