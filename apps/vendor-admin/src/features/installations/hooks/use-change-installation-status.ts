import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeInstallationStatus } from "../api/installations-api";
import { installationKeys } from "../installation-keys";
import type { InstallationStatus } from "../installation-status";

export interface ChangeInstallationStatusVariables {
  id: string;
  status: InstallationStatus;
}

export function useChangeInstallationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: ChangeInstallationStatusVariables) =>
      changeInstallationStatus(id, { status }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: installationKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: installationKeys.lists() });
    },
  });
}
