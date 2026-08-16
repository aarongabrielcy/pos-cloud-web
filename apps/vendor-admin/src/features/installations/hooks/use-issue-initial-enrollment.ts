import { useMutation } from "@tanstack/react-query";
import { issueInitialEnrollment } from "../api/installations-api";

/**
 * Deliberately NOT a useQuery - the response contains a one-time enrollmentCode that must never
 * become long-lived TanStack Query cache data (WEB-01E brief §10/§17). A mutation's result lives only
 * in this hook's own transient `data`, cleared by `.reset()` when the dialog closes.
 *
 * No cache invalidation: issuing an enrollment code never changes any field on InstallationResponseDto
 * or InstallationHealthResponseDto (status stays PENDING until the device actually consumes the code
 * via POST /installation-auth/enroll, which this admin app never calls) - there is nothing for the
 * detail/list queries to refresh.
 */
export function useIssueInitialEnrollment() {
  return useMutation({
    mutationFn: issueInitialEnrollment,
  });
}
