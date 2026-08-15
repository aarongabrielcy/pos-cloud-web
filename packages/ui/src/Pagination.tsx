import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const WINDOW_SIZE = 5;

function pageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= WINDOW_SIZE) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const half = Math.floor(WINDOW_SIZE / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + WINDOW_SIZE - 1);
  start = Math.max(1, end - WINDOW_SIZE + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Driven directly by the backend's own page/pageSize/total/totalPages shape - no translation layer
 *  (WEB-01B design report §L; every list endpoint returns exactly this). */
export function Pagination({ page, pageSize, total, totalPages, onPageChange }: PaginationProps) {
  if (total === 0) {
    return null;
  }

  // `page` can be stale (e.g. a URL page number left over from before a filter narrowed the result
  // set) and land beyond `totalPages` - clamp both ends to `total` so the range never reads as
  // "976-100 of 100" instead of just rendering something sane until the caller's own page value
  // catches up (Next stays disabled below via `page >= totalPages`, so this can't compound).
  const firstItem = Math.min((page - 1) * pageSize + 1, total);
  const lastItem = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm text-[var(--color-text-muted)]">
        Showing {firstItem}-{lastItem} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        {pageWindow(page, totalPages).map((p) => (
          <Button
            key={p}
            variant={p === page ? "primary" : "secondary"}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="secondary"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
