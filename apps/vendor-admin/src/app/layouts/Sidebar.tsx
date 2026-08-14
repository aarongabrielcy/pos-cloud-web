import { NavLink } from "react-router-dom";
import { useAuth } from "@pos-cloud-web/auth";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const { hasPermission } = useAuth();
  const visibleItems = NAV_ITEMS.filter(
    (item) => item.requiredPermission === null || hasPermission(item.requiredPermission),
  );

  return (
    <nav
      aria-label="Primary"
      className="flex w-[var(--spacing-sidebar)] shrink-0 flex-col gap-1 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <div className="mb-4 px-2 text-lg font-semibold text-[var(--color-text)]">POS Cloud</div>
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
