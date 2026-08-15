import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLicense } from "../api/licenses-api";
import { licenseKeys } from "../license-keys";

/** No retry - QueryClient's global mutation default already sets retry: false
 *  (app/providers/query-client.ts); a failed create is a real answer, not a transient failure. */
export function useCreateLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLicense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: licenseKeys.lists() });
    },
  });
}
