import { LayoutDashboard, KeyRound, ScrollText, Server, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PERMISSION_CODES } from "@pos-cloud-web/auth";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** `null` means "authenticated is enough" (Dashboard) - every other entry requires a real
   *  permission code (WEB-01A#20). */
  requiredPermission: string | null;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard, requiredPermission: null },
  {
    label: "Customers",
    to: "/app/customers",
    icon: Users,
    requiredPermission: PERMISSION_CODES.CUSTOMERS_READ,
  },
  {
    label: "Licenses",
    to: "/app/licenses",
    icon: KeyRound,
    requiredPermission: PERMISSION_CODES.LICENSES_READ,
  },
  {
    label: "Installations",
    to: "/app/installations",
    icon: Server,
    requiredPermission: PERMISSION_CODES.INSTALLATIONS_READ,
  },
  {
    label: "Audit",
    to: "/app/audit",
    icon: ScrollText,
    requiredPermission: PERMISSION_CODES.AUDIT_READ,
  },
];
