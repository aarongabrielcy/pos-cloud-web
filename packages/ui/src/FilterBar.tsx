import type { ReactNode } from "react";

export interface FilterBarProps {
  children: ReactNode;
}

/**
 * Layout only - the feature module composes controlled filter fields (Input/Select) and wires them
 * to useListQueryParams (design report §I). Owns no filter state itself, and no domain knowledge -
 * width/growth for a particular child (e.g. a search Input taking the remaining row width) is the
 * caller's responsibility via that child's own `className`, never something this component decides.
 *
 * Responsive contract (WEB-01E UX correction brief §29): stacked (one control per row) below the
 * `lg` breakpoint (1024px), a single non-wrapping horizontal row at `lg` and above.
 */
export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-end">{children}</div>
  );
}
