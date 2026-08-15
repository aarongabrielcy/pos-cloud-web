import { cloneElement } from "react";
import { NavLink } from "react-router-dom";
import { Tooltip } from "@pos-cloud-web/ui";
import { useAuth } from "@pos-cloud-web/auth";
import { NAV_ITEMS } from "./nav-items";

export interface SidebarNavProps {
  /** Fired when a link is clicked - the mobile drawer uses this to close itself after navigation. */
  onNavigate?: () => void;
  /** Icon-only rendering with tooltips - desktop-only, never passed by MobileNavDrawer's own
   *  instance, which always renders expanded/labeled regardless of the desktop preference. */
  collapsed?: boolean;
}

/**
 * The actual nav content, shared between the desktop Sidebar (expanded or collapsed) and the mobile
 * MobileNavDrawer (always expanded) - one permission-filtered list, rendered differently per caller.
 *
 * NavLink's default matching (no `end` prop) is a prefix match, not exact - `/app/customers` stays
 * highlighted for any deeper path under it (e.g. `/app/customers/:id`), which is what gives us
 * nested-route active navigation for free, with no route-count-dependent logic here.
 */
export function SidebarNav({ onNavigate, collapsed = false }: SidebarNavProps) {
  const { hasPermission } = useAuth();
  const visibleItems = NAV_ITEMS.filter(
    (item) => item.requiredPermission === null || hasPermission(item.requiredPermission),
  );

  return (
    <nav aria-label="Primary" className="flex flex-col gap-1 p-4">
      <div
        className={`mb-4 text-lg font-semibold text-[var(--color-text)] ${
          collapsed ? "text-center" : "px-2"
        }`}
      >
        {collapsed ? "P" : "POS Cloud"}
      </div>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const navLink = (
          <NavLink
            to={item.to}
            onClick={onNavigate}
            aria-label={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[var(--radius-md)] py-2 text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-2" : "px-3"
              } ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {collapsed ? null : item.label}
          </NavLink>
        );

        return collapsed ? (
          <Tooltip key={item.to} label={item.label}>
            {navLink}
          </Tooltip>
        ) : (
          cloneElement(navLink, { key: item.to })
        );
      })}
    </nav>
  );
}
