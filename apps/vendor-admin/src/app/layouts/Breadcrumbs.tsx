import { Link, useMatches } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { RouteHandle } from "../router/route-handle";
import { useBreadcrumbOverride } from "./use-breadcrumb";

interface Crumb {
  pathname: string;
  label: string;
}

/**
 * Route-driven, not authored per page (WEB-01B design report §F) - reads each matched route's
 * `handle.crumb` via useMatches(), so a future detail route (e.g. `/app/customers/:id`) only needs
 * to add its own `handle`, not touch this component. Renders in Topbar only, per WEB-01B's
 * mandatory correction #1 - never inside PageContainer/PageHeader.
 *
 * The last crumb's label may be overridden at runtime via useDynamicCrumb (breadcrumb-context.tsx) -
 * e.g. a detail route's static "Customer" handle fallback becomes the loaded customer's code. This
 * component stays domain-agnostic either way: it never imports feature code, only the generic
 * override slot.
 */
export function Breadcrumbs() {
  const matches = useMatches();
  const override = useBreadcrumbOverride();

  const crumbs: Crumb[] = matches
    .filter((match) => Boolean((match.handle as RouteHandle | undefined)?.crumb))
    .map((match) => ({
      pathname: match.pathname,
      label: (match.handle as RouteHandle).crumb as string,
    }));

  if (crumbs.length === 0) {
    return null;
  }

  const resolvedCrumbs = crumbs.map((crumb, index) =>
    index === crumbs.length - 1 && override ? { ...crumb, label: override } : crumb,
  );

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
      {resolvedCrumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.pathname} className="flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
            ) : null}
            {isLast ? (
              <span aria-current="page" className="truncate font-medium text-[var(--color-text)]">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.pathname}
                className="truncate text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
