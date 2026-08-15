import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AppProviders } from "../../../app/providers/AppProviders";
import { routes } from "../../../app/router/router";
import type { Customer, CustomerListResponse } from "../api/customers-api";

const ME_RESPONSE = {
  id: "admin-1",
  email: "admin@example.com",
  displayName: "Admin One",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: null,
  permissions: ["customers.read"],
};

/** Same pattern as apps/vendor-admin/src/__tests__/protected-routes.test.tsx. */
export function mockAuthenticated(permissions: string[] = ME_RESPONSE.permissions) {
  server.use(
    http.post("/api/v1/auth/refresh", () =>
      HttpResponse.json({ accessToken: "test-access-token", tokenType: "Bearer", expiresIn: 900 }),
    ),
    http.get("/api/v1/auth/me", () => HttpResponse.json({ ...ME_RESPONSE, permissions })),
  );
}

export function fakeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    code: "GST-MX",
    legalName: "GS Trackme S.A. de C.V.",
    tradeName: "GS Trackme",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

export function fakeCustomerList(
  overrides: Partial<CustomerListResponse> = {},
): CustomerListResponse {
  return {
    items: [fakeCustomer()],
    page: 1,
    pageSize: 25,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
}

/** Renders the real app router/providers at a given path - mirrors protected-routes.test.tsx so
 *  routing, RBAC gating, and breadcrumbs all run for real, not just the page component in isolation. */
export function renderAt(initialEntry: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  const view = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, ...view };
}
