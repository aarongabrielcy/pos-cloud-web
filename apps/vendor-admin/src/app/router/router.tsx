import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { RequirePermission } from "./RequirePermission";
import { LoginPage } from "../../features/auth/LoginPage";
import { NotFoundPage } from "../../features/auth/NotFoundPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { CustomersPage } from "../../features/customers/CustomersPage";
import { LicensesPage } from "../../features/licenses/LicensesPage";
import { InstallationsPage } from "../../features/installations/InstallationsPage";
import { AuditPage } from "../../features/audit/AuditPage";
import { PERMISSION_CODES } from "@pos-cloud-web/auth";

/** Exported separately from the browser router so tests can build a createMemoryRouter from the
 *  exact same route tree with custom initialEntries, instead of re-declaring routes for tests. */
export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <Navigate to="/app" replace /> },
  {
    path: "/app",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          {
            path: "customers",
            element: <RequirePermission code={PERMISSION_CODES.CUSTOMERS_READ} />,
            children: [{ index: true, element: <CustomersPage /> }],
          },
          {
            path: "licenses",
            element: <RequirePermission code={PERMISSION_CODES.LICENSES_READ} />,
            children: [{ index: true, element: <LicensesPage /> }],
          },
          {
            path: "installations",
            element: <RequirePermission code={PERMISSION_CODES.INSTALLATIONS_READ} />,
            children: [{ index: true, element: <InstallationsPage /> }],
          },
          {
            path: "audit",
            element: <RequirePermission code={PERMISSION_CODES.AUDIT_READ} />,
            children: [{ index: true, element: <AuditPage /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
