import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AppProviders } from "../../../app/providers/AppProviders";
import { routes } from "../../../app/router/router";
import type {
  Installation,
  InstallationHealth,
  InstallationListItem,
  InstallationListResponse,
} from "../api/installations-api";
import type { Customer, CustomerListResponse } from "../../customers/api/customers-api";
import type { License, LicenseListResponse } from "../../licenses/api/licenses-api";

const ME_RESPONSE = {
  id: "admin-1",
  email: "admin@example.com",
  displayName: "Admin One",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: null,
  permissions: ["installations.read"],
};

/** Same pattern as apps/vendor-admin/src/features/{customers,licenses}/__tests__/test-support.tsx. */
export function mockAuthenticated(permissions: string[] = ME_RESPONSE.permissions) {
  server.use(
    http.post("/api/v1/auth/refresh", () =>
      HttpResponse.json({ accessToken: "test-access-token", tokenType: "Bearer", expiresIn: 900 }),
    ),
    http.get("/api/v1/auth/me", () => HttpResponse.json({ ...ME_RESPONSE, permissions })),
  );
}

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const LICENSE_ID = "aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa";
const INSTALLATION_ID = "bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb";

/** Matches fakeCustomer()/fakeLicense() below - the batched relation summaries the backend now
 *  enriches List/Get responses with (pos-cloud relation-summary hardening). */
const CUSTOMER_SUMMARY = {
  id: CUSTOMER_ID,
  code: "GST-MX",
  legalName: "GS Trackme S.A. de C.V.",
  tradeName: "GS Trackme",
};
const LICENSE_SUMMARY = {
  id: LICENSE_ID,
  licenseNumber: "LIC-GST-00001",
  edition: "BASIC",
  status: "ACTIVE",
};

export function fakeInstallation(overrides: Partial<Installation> = {}): Installation {
  return {
    id: INSTALLATION_ID,
    customerId: CUSTOMER_ID,
    customer: CUSTOMER_SUMMARY,
    licenseId: LICENSE_ID,
    license: LICENSE_SUMMARY,
    installationCode: "POS-GST-00001",
    name: "Sucursal Principal",
    platform: "WINDOWS",
    status: "ACTIVE",
    registeredAt: "2026-01-03T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
    ...overrides,
  };
}

export function fakeInstallationListItem(
  overrides: Partial<InstallationListItem> = {},
): InstallationListItem {
  return {
    id: INSTALLATION_ID,
    customerId: CUSTOMER_ID,
    customer: CUSTOMER_SUMMARY,
    licenseId: LICENSE_ID,
    license: LICENSE_SUMMARY,
    installationCode: "POS-GST-00001",
    name: "Sucursal Principal",
    platform: "WINDOWS",
    status: "ACTIVE",
    registeredAt: "2026-01-03T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
    healthStatus: "ONLINE",
    lastSeenAt: "2026-01-05T12:00:00.000Z",
    ...overrides,
  };
}

export function fakeInstallationList(
  overrides: Partial<InstallationListResponse> = {},
): InstallationListResponse {
  return {
    items: [fakeInstallationListItem()],
    page: 1,
    pageSize: 25,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
}

export function fakeInstallationHealth(
  overrides: Partial<InstallationHealth> = {},
): InstallationHealth {
  return {
    installationId: INSTALLATION_ID,
    lifecycleStatus: "ACTIVE",
    healthStatus: "ONLINE",
    lastSeenAt: "2026-01-05T12:00:00.000Z",
    firstSeenAt: "2026-01-03T00:05:00.000Z",
    appVersion: "1.4.2",
    clientReportedAt: "2026-01-05T12:00:00.000Z",
    ...overrides,
  };
}

export function fakeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: CUSTOMER_ID,
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

export function fakeLicense(overrides: Partial<License> = {}): License {
  return {
    id: LICENSE_ID,
    customerId: CUSTOMER_ID,
    customer: CUSTOMER_SUMMARY,
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

/** Renders the real app router/providers at a given path - mirrors the Customers/Licenses features'
 *  own test-support.tsx so routing, RBAC gating, and breadcrumbs all run for real. */
export function renderAt(initialEntry: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  const view = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, ...view };
}
