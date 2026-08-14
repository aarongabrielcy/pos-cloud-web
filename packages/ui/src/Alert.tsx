import type { ReactNode } from "react";

export interface AlertProps {
  variant?: "info" | "danger";
  children: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<AlertProps["variant"]>, string> = {
  info: "bg-[var(--color-surface-muted)] text-[var(--color-text)] border-[var(--color-border)]",
  danger: "bg-[var(--color-danger-surface)] text-[var(--color-danger)] border-red-200",
};

export function Alert({ variant = "info", children }: AlertProps) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={`rounded-[var(--radius-md)] border px-4 py-3 text-sm ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </div>
  );
}
