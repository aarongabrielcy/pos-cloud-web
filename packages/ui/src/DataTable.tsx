import type { ReactNode } from "react";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  /** Loading skeleton row count - defaults to 5, tune per screen if rows are unusually tall/short. */
  skeletonRows?: number;
  emptyState?: ReactNode;
}

/**
 * No built-in client-side sort/filter - every list endpoint WEB-01B targets is server-paginated,
 * so sort/filter are server round-trips, not local table state (see design report §H). Sorting is
 * out of scope entirely until a backend list endpoint actually exposes a `sortBy` query param.
 * Horizontal overflow (many columns on narrow viewports) scrolls the table body, not the page.
 *
 * No row-level onClick: a bare `<tr onClick>` is mouse-only (no keyboard equivalent) and adding
 * role="button"/"link" to a <tr> to paper over that breaks table semantics for screen readers.
 * Row-level interactivity belongs to an explicit, focusable element inside a cell instead - e.g. a
 * `<Link>` wrapping the primary column's render() - which WEB-01C's real tables can add per-column
 * as needed without reintroducing this prop.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  skeletonRows = 5,
  emptyState,
}: DataTableProps<T>) {
  const alignClass = (align: DataTableColumn<T>["align"]) =>
    align === "right" ? "text-right" : "text-left";

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 font-medium text-[var(--color-text-muted)] ${alignClass(column.align)}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: skeletonRows }, (_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-[var(--color-border)] last:border-0">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-[var(--color-text)] ${alignClass(column.align)}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!isLoading && rows.length === 0 ? (
        <div className="border-t border-[var(--color-border)]">
          {emptyState ?? <EmptyState title="No results" />}
        </div>
      ) : null}
    </div>
  );
}
