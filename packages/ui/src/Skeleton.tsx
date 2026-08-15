import type { HTMLAttributes } from "react";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** A pulsing placeholder block - DataTable uses one per loading row instead of a full-page spinner
 *  (avoids the layout jump a spinner-then-table swap causes). */
export function Skeleton({ className = "", ...rest }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-pulse rounded-[var(--radius-md)] bg-[var(--color-gray-200)] ${className}`}
      {...rest}
    />
  );
}
