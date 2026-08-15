import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarNav } from "./SidebarNav";

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Desktop-only sidebar (>= lg), user-toggleable between expanded and icon-only collapsed. Below lg,
 *  MobileNavDrawer renders the same SidebarNav content as an off-canvas drawer instead, always
 *  expanded/labeled regardless of this desktop preference - see AppShell/useSidebarCollapsed. */
export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <div
      className={`hidden shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 lg:flex ${
        collapsed ? "w-[var(--spacing-sidebar-collapsed)]" : "w-[var(--spacing-sidebar)]"
      }`}
    >
      <div className="flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>
      <div className="border-t border-[var(--color-border)] p-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center rounded-[var(--radius-md)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
