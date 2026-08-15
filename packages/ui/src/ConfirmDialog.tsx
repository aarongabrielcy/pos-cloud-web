import { useState } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Alert } from "./Alert";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  /** Rejecting shows its message via Alert and keeps the dialog open - same idle/submitting/error
   *  shape LoginForm established in WEB-01A, generalized here for any confirm action. */
  onConfirm: () => Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the stale error when re-opening, adjusted during render rather than in an Effect (React's
  // own recommended pattern for "reset state when a prop changes" - see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  // Calling setState directly in the render body here is safe: it's gated behind a value-change
  // check, so it runs at most once per real transition and bails out of re-rendering children twice.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setError(null);
    }
  }

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next);
      }}
      title={title}
      description={description}
    >
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          isLoading={isSubmitting}
          onClick={() => void handleConfirm()}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
