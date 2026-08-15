import { Menu } from "lucide-react";
import { useAuth } from "@pos-cloud-web/auth";
import { Button } from "@pos-cloud-web/ui";
import { Breadcrumbs } from "./Breadcrumbs";

export interface TopbarProps {
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const { state, logout } = useAuth();
  if (state.status !== "authenticated") {
    return null;
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="rounded-[var(--radius-md)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Breadcrumbs />
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium text-[var(--color-text)]">
            {state.user.displayName}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">{state.user.email}</div>
        </div>
        <Button variant="secondary" onClick={() => void logout()}>
          Log out
        </Button>
      </div>
    </header>
  );
}
