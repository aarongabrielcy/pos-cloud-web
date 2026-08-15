import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export interface BackLinkProps {
  to: string;
  label: string;
}

/**
 * Explicit back navigation to a known, stable destination - never window.history.back()/navigate(-1),
 * since prior browser history may lead outside the current section. Visually secondary (muted, small),
 * placed above PageHeader, real semantic navigation (keyboard accessible by default as an <a>).
 *
 * Reusable by any future detail page (Licenses, Installations, ...) - kept app-local rather than in
 * @pos-cloud-web/ui because it depends on react-router-dom's Link, which is routing-coupled (the same
 * boundary WEB-01B established for useListQueryParams/useDebouncedValue: routing-coupled code lives in
 * the app, not the generic UI package).
 */
export function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
