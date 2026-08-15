import { SidebarNav } from "./SidebarNav";

/** Desktop-only static sidebar (>= lg). Below lg, MobileNavDrawer renders the same SidebarNav
 *  content as an off-canvas drawer instead - see AppShell. */
export function Sidebar() {
  return (
    <div className="hidden w-[var(--spacing-sidebar)] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
      <SidebarNav />
    </div>
  );
}
