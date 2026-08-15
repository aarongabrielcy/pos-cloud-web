import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { RequirePermission } from "./RequirePermission";
import type { RouteHandle } from "./route-handle";
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
          {
            path: "dashboard",
            element: <DashboardPage />,
            handle: { crumb: "Dashboard" } satisfies RouteHandle,
          },
          {
            path: "customers",
            element: <RequirePermission code={PERMISSION_CODES.CUSTOMERS_READ} />,
            children: [
              {
                index: true,
                element: <CustomersPage />,
                handle: { crumb: "Customers" } satisfies RouteHandle,
              },
            ],
          },
          {
            path: "licenses",
            element: <RequirePermission code={PERMISSION_CODES.LICENSES_READ} />,
            children: [
              {
                index: true,
                element: <LicensesPage />,
                handle: { crumb: "Licenses" } satisfies RouteHandle,
              },
            ],
          },
          {
            path: "installations",
            element: <RequirePermission code={PERMISSION_CODES.INSTALLATIONS_READ} />,
            children: [
              {
                index: true,
                element: <InstallationsPage />,
                handle: { crumb: "Installations" } satisfies RouteHandle,
              },
            ],
          },
          {
            path: "audit",
            element: <RequirePermission code={PERMISSION_CODES.AUDIT_READ} />,
            children: [
              {
                index: true,
                element: <AuditPage />,
                handle: { crumb: "Audit" } satisfies RouteHandle,
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
