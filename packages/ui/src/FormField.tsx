import { useId } from "react";
import type { ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement } from "react";

export interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
}

/** Wires label/error/hint to its single input child via generated ids - no per-form boilerplate. */
export function FormField({ label, error, hint, children }: FormFieldProps): ReactNode {
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  const field = isValidElement(children)
    ? cloneElement(children, {
        id: inputId,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": Boolean(error) || undefined,
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
        {label}
      </label>
      {field}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
