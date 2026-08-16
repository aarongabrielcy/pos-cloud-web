import { useMutation } from "@tanstack/react-query";
import { revokeInstallationCredential } from "../api/installations-api";

/** No secret in the response (204 No Content) and never changes Installation.status, so no
 *  invalidation is needed. */
export function useRevokeInstallationCredential() {
  return useMutation({
    mutationFn: revokeInstallationCredential,
  });
}
