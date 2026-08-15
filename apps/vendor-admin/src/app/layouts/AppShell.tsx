import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { SidebarNav } from "./SidebarNav";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { Topbar } from "./Topbar";

export function AppShell() {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar />
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
  );
}
