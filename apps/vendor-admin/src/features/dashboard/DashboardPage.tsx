import { Link } from "react-router-dom";
import { useAuth } from "@pos-cloud-web/auth";
import { Card, PageContainer, PageHeader } from "@pos-cloud-web/ui";
import { NAV_ITEMS } from "../../app/layouts/nav-items";

/** No fake metrics/counts here (WEB-01B out-of-scope list) - just a welcome state and
 *  permission-aware shortcuts into the sections this admin can actually open. */
export function DashboardPage() {
  const { state, hasPermission } = useAuth();
  const displayName = state.status === "authenticated" ? state.user.displayName : "";

  const shortcuts = NAV_ITEMS.filter(
    (item) =>
      item.to !== "/app/dashboard" &&
      (item.requiredPermission === null || hasPermission(item.requiredPermission)),
  );

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description={`Welcome back, ${displayName}.`} />

      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          Business dashboards and metrics land in a later iteration - WEB-01B ships navigation and
          UI foundation only (see README#backlog).
        </p>
      </Card>

      {shortcuts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to}>
                <Card className="flex items-center gap-3 transition-colors hover:border-brand-300">
                  <Icon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  <span className="font-medium text-[var(--color-text)]">{item.label}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : null}
    </PageContainer>
  );
}
