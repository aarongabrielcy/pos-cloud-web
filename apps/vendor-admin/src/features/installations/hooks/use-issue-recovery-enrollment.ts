import { useMutation } from "@tanstack/react-query";
import { issueRecoveryEnrollment } from "../api/installations-api";

/** Same one-time-secret handling as useIssueInitialEnrollment - a mutation, never a query, never
 *  invalidates anything (this never changes Installation.status or any other field either). This is
 *  a deliberately SEPARATE hook/action from initial enrollment, even though both call the same
 *  underlying use case server-side - see CredentialRekeyDialog vs InitialEnrollmentDialog. */
export function useIssueRecoveryEnrollment() {
  return useMutation({
    mutationFn: issueRecoveryEnrollment,
  });
}
