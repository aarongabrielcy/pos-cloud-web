import { Outlet } from "react-router-dom";
import { useAuth } from "@pos-cloud-web/auth";
import { NotAuthorizedPage } from "../../features/auth/NotAuthorizedPage";

export interface RequirePermissionProps {
  code: string;
}

/** A direct URL to a feature the admin lacks permission for renders NotAuthorized in place - it does
 *  not redirect (WEB-01A#20). The backend remains the real authority; this is UX only. */
export function RequirePermission({ code }: RequirePermissionProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(code)) {
    return <NotAuthorizedPage />;
  }

  return <Outlet />;
}
