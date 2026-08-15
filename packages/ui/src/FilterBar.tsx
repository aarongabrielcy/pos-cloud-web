import type { ReactNode } from "react";

export interface FilterBarProps {
  children: ReactNode;
}

/** Layout only - a responsive wrap of controlled filter fields (Input/Select) the feature module
 *  composes and wires to useListQueryParams (design report §I). Owns no filter state itself. */
export function FilterBar({ children }: FilterBarProps) {
  return <div className="flex flex-wrap items-end gap-3">{children}</div>;
}
