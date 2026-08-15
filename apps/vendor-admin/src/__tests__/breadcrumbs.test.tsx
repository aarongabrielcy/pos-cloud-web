import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AppProviders } from "../app/providers/AppProviders";
import { routes } from "../app/router/router";

function mockAuthenticated(permissions: string[]) {
  server.use(
    http.post("/api/v1/auth/refresh", () =>
      HttpResponse.json({ accessToken: "token", tokenType: "Bearer", expiresIn: 900 }),
    ),
    http.get("/api/v1/auth/me", () =>
      HttpResponse.json({
        id: "admin-1",
        email: "admin@example.com",
        displayName: "Admin One",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00.000Z",
        lastLoginAt: null,
        permissions,
      }),
    ),
  );
}

/** CustomersPage fires a real GET on mount since WEB-01C - this suite only cares about breadcrumb
 *  text/placement, not list content, so a minimal empty response is enough to avoid MSW's
 *  onUnhandledRequest: "error" flagging it as a missing handler (packages/testing/src/setup.ts). */
function mockEmptyCustomersList() {
  server.use(
    http.get("/api/v1/control-plane/customers", () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 25, total: 0, totalPages: 0 }),
    ),
  );
}

function renderAt(initialEntry: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe("Breadcrumbs", () => {
  it("shows the current page's crumb inside the Topbar breadcrumb nav", async () => {
    mockAuthenticated(["customers.read"]);
    mockEmptyCustomersList();
    renderAt("/app/customers");

    const breadcrumbNav = await screen.findByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumbNav).getByText("Customers")).toBeInTheDocument();
  });

  it("updates the crumb when navigating to a different section", async () => {
    mockAuthenticated(["audit.read"]);
    renderAt("/app/audit");

    const breadcrumbNav = await screen.findByRole("navigation", { name: "Breadcrumb" });
    await waitFor(() => expect(within(breadcrumbNav).getByText("Audit")).toBeInTheDocument());
  });

  it("renders the breadcrumb nav as a sibling in Topbar, not inside the page content", async () => {
    mockAuthenticated(["customers.read"]);
    mockEmptyCustomersList();
    renderAt("/app/customers");

    const breadcrumbNav = await screen.findByRole("navigation", { name: "Breadcrumb" });
    const heading = screen.getByRole("heading", { name: "Customers" });
    // Breadcrumb nav and the PageHeader heading must not be nested inside one another.
    expect(breadcrumbNav.contains(heading)).toBe(false);
    expect(heading.contains(breadcrumbNav)).toBe(false);
  });
});
