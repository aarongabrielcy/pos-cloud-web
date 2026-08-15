import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Native <select> styled to match Input - no headless/custom listbox needed for the handful of
 *  enum filters WEB-01B's FilterBar drives (status, edition, platform, actor type). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    />
  );
});
