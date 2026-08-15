import { NavLink } from "react-router-dom";
import { useAuth } from "@pos-cloud-web/auth";
import { NAV_ITEMS } from "./nav-items";

export interface SidebarNavProps {
  /** Fired when a link is clicked - the mobile drawer uses this to close itself after navigation. */
  onNavigate?: () => void;
}

/**
 * The actual nav content, shared between the always-visible desktop Sidebar and the mobile
 * MobileNavDrawer - one permission-filtered list, two containers.
 *
 * NavLink's default matching (no `end` prop) is a prefix match, not exact - `/app/customers` stays
 * highlighted for any deeper path under it (e.g. a future `/app/customers/:id`), which is what
 * gives us nested-route active navigation for free, with no route-count-dependent logic here.
 */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { hasPermission } = useAuth();
  const visibleItems = NAV_ITEMS.filter(
    (item) => item.requiredPermission === null || hasPermission(item.requiredPermission),
  );

  return (
    <nav aria-label="Primary" className="flex flex-col gap-1 p-4">
      <div className="mb-4 px-2 text-lg font-semibold text-[var(--color-text)]">POS Cloud</div>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
