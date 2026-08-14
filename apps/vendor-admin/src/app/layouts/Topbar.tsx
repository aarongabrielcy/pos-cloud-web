import { useAuth } from "@pos-cloud-web/auth";
import { Button } from "@pos-cloud-web/ui";

export function Topbar() {
  const { state, logout } = useAuth();
  if (state.status !== "authenticated") {
    return null;
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
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
