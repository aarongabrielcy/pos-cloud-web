import { PERMISSION_CODES } from "@pos-cloud-web/auth";

export interface NavItem {
  label: string;
  to: string;
  /** `null` means "authenticated is enough" (Dashboard) - every other entry requires a real
   *  permission code (WEB-01A#20). */
  requiredPermission: string | null;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", to: "/app/dashboard", requiredPermission: null },
  { label: "Customers", to: "/app/customers", requiredPermission: PERMISSION_CODES.CUSTOMERS_READ },
  { label: "Licenses", to: "/app/licenses", requiredPermission: PERMISSION_CODES.LICENSES_READ },
  {
    label: "Installations",
    to: "/app/installations",
    requiredPermission: PERMISSION_CODES.INSTALLATIONS_READ,
  },
  { label: "Audit", to: "/app/audit", requiredPermission: PERMISSION_CODES.AUDIT_READ },
];
