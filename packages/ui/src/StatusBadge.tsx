import type { ReactNode } from "react";

/**
 * Purely presentational (WEB-01B mandatory correction #3) - this component knows nothing about
 * domain status names. `ACTIVE -> success` / `SUSPENDED -> warning` style mappings belong to the
 * consuming feature module (e.g. a small `customerStatusVariant(status)` helper next to the
 * Customers table), never here.
 */
export type StatusBadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";

export interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<StatusBadgeVariant, string> = {
  success:
    "bg-[var(--color-success-surface)] text-[var(--color-success-text)] border-[var(--color-success-border)]",
  warning:
    "bg-[var(--color-warning-surface)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]",
  danger:
    "bg-[var(--color-danger-surface)] text-[var(--color-danger-text)] border-[var(--color-danger-border)]",
  neutral:
    "bg-[var(--color-neutral-surface)] text-[var(--color-neutral-text)] border-[var(--color-neutral-border)]",
  info: "bg-[var(--color-info-surface)] text-[var(--color-info-text)] border-[var(--color-info-border)]",
};

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
