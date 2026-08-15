import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export interface UseListQueryParamsOptions {
  /** Which filter keys this screen owns. Pass a module-level constant array - a fresh literal each
   *  render just means `filters` recomputes every render, not a correctness problem, but there's no
   *  reason to pay for it. */
  filterKeys: readonly string[];
  defaultPageSize?: number;
}

export interface UseListQueryParamsResult {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  /** Setting a filter always resets `page` back to 1 - a stale page number from a wider result set
   *  is worse than restarting at page 1 of the new, narrower one. */
  setFilter: (key: string, value: string) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
}

// Matches the uniform 1-100 bound every ListXQueryDto (customers/licenses/installations/audit-events)
// enforces server-side - clamping here keeps a hand-edited/stale URL from ever building a request the
// backend would reject.
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

function parsePageSize(raw: string | null, fallback: number): number {
  const parsed = parsePositiveInt(raw, fallback);
  return Math.min(parsed, MAX_PAGE_SIZE);
}

/**
 * List page state (page/pageSize/filters) lives in the URL, not component state - filtered/paged
 * views stay shareable and survive back/forward navigation (design report §I). Routing-coupled by
 * design (`useSearchParams`), which is exactly why this lives in the app, not @pos-cloud-web/ui.
 */
export function useListQueryParams({
  filterKeys,
  defaultPageSize = 25,
}: UseListQueryParamsOptions): UseListQueryParamsResult {
  const [searchParams, setSearchParams] = useSearchParams();
  // A plain identifier, not a call expression, so it's a valid useMemo/useCallback dependency on
  // its own - `filterKeys` itself is only ever a fresh array reference across renders.
  const filterKeysSignature = filterKeys.join(",");

  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePageSize(searchParams.get("pageSize"), defaultPageSize);

  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    for (const key of filterKeys) {
      const value = searchParams.get(key);
      if (value) {
        result[key] = value;
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filterKeysSignature]);

  const setFilter = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextPage <= 1) {
          next.delete("page");
        } else {
          next.set("page", String(nextPage));
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const key of filterKeys) {
        next.delete(key);
      }
      next.delete("page");
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSearchParams, filterKeysSignature]);

  return { page, pageSize, filters, setFilter, setPage, clearFilters };
}
