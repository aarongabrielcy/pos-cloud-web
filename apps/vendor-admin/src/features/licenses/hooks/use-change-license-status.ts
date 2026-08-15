import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeLicenseStatus } from "../api/licenses-api";
import { licenseKeys } from "../license-keys";
import type { LicenseStatus } from "../license-status";

export interface ChangeLicenseStatusVariables {
  id: string;
  status: LicenseStatus;
}

export function useChangeLicenseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: ChangeLicenseStatusVariables) =>
      changeLicenseStatus(id, { status }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: licenseKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: licenseKeys.lists() });
    },
  });
}
