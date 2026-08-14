import { useAuth } from "@pos-cloud-web/auth";
import { Card } from "@pos-cloud-web/ui";

export function DashboardPage() {
  const { state } = useAuth();
  const displayName = state.status === "authenticated" ? state.user.displayName : "";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">Dashboard</h1>
      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          Welcome, {displayName}. Business dashboards land in a later iteration - WEB-01A only ships
          the foundation and Auth (see README#backlog).
        </p>
      </Card>
    </div>
  );
}
