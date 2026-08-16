import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInstallation } from "../api/installations-api";
import { installationKeys } from "../installation-keys";

/** No retry - QueryClient's global mutation default already sets retry: false
 *  (app/providers/query-client.ts); a failed create is a real answer, not a transient failure. */
export function useCreateInstallation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInstallation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: installationKeys.lists() });
    },
  });
}
