import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { SidebarNav } from "./SidebarNav";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { Topbar } from "./Topbar";
import { BreadcrumbProvider } from "./breadcrumb-context";
import { useSidebarCollapsed } from "../../shared/hooks/useSidebarCollapsed";

export function AppShell() {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useSidebarCollapsed();

  return (
    <BreadcrumbProvider>
      <div className="flex h-screen">
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(!isSidebarCollapsed)}
        />
        {/* MobileNavDrawer's own SidebarNav instance never receives `collapsed` - the mobile drawer
            always renders expanded/labeled regardless of the desktop preference above (WEB-01C UX
            improvements #18). */}
        <MobileNavDrawer open={isMobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </MobileNavDrawer>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
