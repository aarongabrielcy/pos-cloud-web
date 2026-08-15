import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AppProviders } from "../../../app/providers/AppProviders";
import { routes } from "../../../app/router/router";
import type { License, LicenseListResponse } from "../api/licenses-api";
import type { Customer, CustomerListResponse } from "../../customers/api/customers-api";

const ME_RESPONSE = {
  id: "admin-1",
  email: "admin@example.com",
  displayName: "Admin One",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: null,
  permissions: ["licenses.read"],
};

/** Same pattern as apps/vendor-admin/src/features/customers/__tests__/test-support.tsx. */
export function mockAuthenticated(permissions: string[] = ME_RESPONSE.permissions) {
  server.use(
    http.post("/api/v1/auth/refresh", () =>
      HttpResponse.json({ accessToken: "test-access-token", tokenType: "Bearer", expiresIn: 900 }),
    ),
    http.get("/api/v1/auth/me", () => HttpResponse.json({ ...ME_RESPONSE, permissions })),
  );
}

export function fakeLicense(overrides: Partial<License> = {}): License {
  return {
    id: "aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa",
    customerId: "11111111-1111-4111-8111-111111111111",
    licenseNumber: "LIC-GST-00001",
    edition: "BASIC",
    licenseModel: "PERPETUAL",
    status: "ACTIVE",
    validFrom: "2026-01-01T00:00:00.000Z",
    validUntil: null,
    maxInstallations: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    entitlements: [],
    ...overrides,
  };
}

export function fakeLicenseList(overrides: Partial<LicenseListResponse> = {}): LicenseListResponse {
  return {
    items: [fakeLicense()],
    page: 1,
    pageSize: 25,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
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

/** Renders the real app router/providers at a given path - mirrors the Customers feature's own
 *  test-support.tsx so routing, RBAC gating, and breadcrumbs all run for real. */
export function renderAt(initialEntry: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  const view = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, ...view };
}
