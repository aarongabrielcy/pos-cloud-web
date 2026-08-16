import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { Alert, Button, Dialog } from "@pos-cloud-web/ui";
import { apiErrorMessage } from "../../../shared/api/api-error-display";
import type { IssueInstallationEnrollmentResponse } from "../api/installations-api";

export interface EnrollmentCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: string;
  title: string;
  warning: string;
  confirmLabel: string;
  variant?: "default" | "danger";
  mutation: UseMutationResult<IssueInstallationEnrollmentResponse, unknown, string>;
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Shared secret-reveal plumbing for BOTH initial enrollment and recovery/rekey enrollment - the two
 * response shapes and security handling are identical, only the confirm-step copy and which mutation
 * hook is passed in differ, so each call site (InitialEnrollmentAction / RekeyCredentialAction) stays
 * a visually and functionally distinct action with its own title/warning/mutation (WEB-01E brief §9,
 * "do not merge both concepts into one generic action").
 *
 * One-time secret security (brief §10):
 * - the code only ever lives in `mutation.data` (a TanStack Query MUTATION result, never a query -
 *   never written to the QueryClient cache, never localStorage/sessionStorage);
 * - closing the dialog (Cancel, X, Escape, backdrop, or "Done") always calls `mutation.reset()`,
 *   clearing it from the hook's own transient state - reopening starts a fresh confirm step, and the
 *   old code is only shown again if a NEW mutation succeeds;
 * - never logged to console, never put in a URL/query param;
 * - closing is blocked while the mutation is in flight (same pattern as ConfirmDialog).
 */
export function EnrollmentCodeDialog({
  open,
  onOpenChange,
  installationId,
  title,
  warning,
  confirmLabel,
  variant = "default",
  mutation,
}: EnrollmentCodeDialogProps) {
  const [copied, setCopied] = useState(false);

  function handleOpenChange(next: boolean) {
    if (mutation.isPending) return;
    if (!next) {
      mutation.reset();
      setCopied(false);
    }
    onOpenChange(next);
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard API unavailable/denied - the code stays visible on screen for manual copy either
      // way, so a copy failure never loses the secret.
    }
  }

  if (mutation.isSuccess && mutation.data) {
    const { enrollmentCode, expiresAt } = mutation.data;
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} title={`${title} - ready`}>
        <div className="flex flex-col gap-4">
          <Alert variant="info">
            This code is shown only once and will not be shown again. Copy it now.
          </Alert>
          <div className="flex flex-col gap-1.5">
            <span
              className="text-xs font-medium text-[var(--color-text-muted)]"
              id="enrollment-code-label"
            >
              Enrollment code
            </span>
            <code
              aria-labelledby="enrollment-code-label"
              className="break-all rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)]"
            >
              {enrollmentCode}
            </code>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Expires {DATE_TIME_FORMAT.format(new Date(expiresAt))}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => handleCopy(enrollmentCode)}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} title={title}>
      <div className="flex flex-col gap-4">
        {mutation.isError ? (
          <Alert variant="danger">{apiErrorMessage(mutation.error)}</Alert>
        ) : null}
        <p className="text-sm text-[var(--color-text)]">{warning}</p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate(installationId)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
