import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AppProviders } from "../app/providers/AppProviders";
import { routes } from "../app/router/router";

const STORAGE_KEY = "pos-cloud-web:sidebar-collapsed";

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

/** The desktop sidebar's own nav (aria-label="Primary") - disambiguates from the mobile drawer's
 *  own instance of the same landmark, which jsdom keeps in the DOM regardless of CSS breakpoints. */
async function findDesktopNav() {
  const navs = await screen.findAllByRole("navigation", { name: "Primary" });
  // The desktop sidebar's toggle button lives in the same container as its nav - use that to
  // identify which of the (possibly two, if the mobile drawer is also present) "Primary" navs is
  // the desktop one.
  for (const nav of navs) {
    const container = nav.closest("div")?.parentElement;
    if (container?.querySelector('button[aria-label$="sidebar"]')) {
      return nav;
    }
  }
  return navs[0];
}

describe("Desktop sidebar collapse", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to expanded when no preference is stored", async () => {
    mockAuthenticated(["customers.read"]);
    renderAt("/app/dashboard");

    expect(await screen.findByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    const desktopNav = await findDesktopNav();
    expect(within(desktopNav).getByText("POS Cloud")).toBeInTheDocument();
    expect(within(desktopNav).getByText("Dashboard")).toBeInTheDocument();
  });

  it("collapses on toggle click, hiding labels but keeping accessible nav links and icons", async () => {
    mockAuthenticated(["customers.read"]);
    renderAt("/app/dashboard");

    const toggle = await screen.findByRole("button", { name: "Collapse sidebar" });
    await userEvent.click(toggle);

    expect(await screen.findByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    const desktopNav = await findDesktopNav();
    // Label text is gone from the DOM (not just visually hidden)...
    expect(within(desktopNav).queryByText("Dashboard")).not.toBeInTheDocument();
    // ...but the link is still reachable and named via aria-label, and its icon is still rendered.
    const dashboardLink = within(desktopNav).getByRole("link", { name: "Dashboard" });
    expect(dashboardLink.querySelector("svg")).not.toBeNull();
  });

  it("expands again on a second toggle click", async () => {
    mockAuthenticated(["customers.read"]);
    renderAt("/app/dashboard");

    const toggle = await screen.findByRole("button", { name: "Collapse sidebar" });
    await userEvent.click(toggle);
    await screen.findByRole("button", { name: "Expand sidebar" });

    await userEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));

    expect(await screen.findByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    const desktopNav = await findDesktopNav();
    expect(within(desktopNav).getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows a tooltip with the item's label when a collapsed nav icon is focused", async () => {
    mockAuthenticated(["customers.read"]);
    renderAt("/app/dashboard");

    await userEvent.click(await screen.findByRole("button", { name: "Collapse sidebar" }));
    const desktopNav = await findDesktopNav();
    const dashboardLink = within(desktopNav).getByRole("link", { name: "Dashboard" });

    dashboardLink.focus();

    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Dashboard"));
  });

  it("shows a tooltip with the Licenses label when collapsed", async () => {
    mockAuthenticated(["customers.read", "licenses.read"]);
    renderAt("/app/dashboard");

    await userEvent.click(await screen.findByRole("button", { name: "Collapse sidebar" }));
    const desktopNav = await findDesktopNav();
    const licensesLink = within(desktopNav).getByRole("link", { name: "Licenses" });

    licensesLink.focus();

    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Licenses"));
  });

  it("keeps the Licenses item active on a nested detail path while collapsed", async () => {
    mockAuthenticated(["customers.read", "licenses.read"]);
    server.use(
      http.get("/api/v1/control-plane/licenses/aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa", () =>
        HttpResponse.json(
          {
            statusCode: 404,
            code: "LICENSE_NOT_FOUND",
            message: "License not found",
            correlationId: "c1",
          },
          { status: 404 },
        ),
      ),
    );
    renderAt("/app/licenses/aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa");

    await userEvent.click(await screen.findByRole("button", { name: "Collapse sidebar" }));
    const desktopNav = await findDesktopNav();
    const licensesLink = within(desktopNav).getByRole("link", { name: "Licenses" });

    await waitFor(() => expect(licensesLink).toHaveAttribute("aria-current", "page"));
  });

  it("shows a tooltip with the Installations label when collapsed", async () => {
    mockAuthenticated(["customers.read", "installations.read"]);
    renderAt("/app/dashboard");

    await userEvent.click(await screen.findByRole("button", { name: "Collapse sidebar" }));
    const desktopNav = await findDesktopNav();
    const installationsLink = within(desktopNav).getByRole("link", { name: "Installations" });

    installationsLink.focus();

    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Installations"));
  });

  it("keeps the Installations item active on a nested detail path while collapsed", async () => {
    mockAuthenticated(["customers.read", "installations.read"]);
    server.use(
      http.get("/api/v1/control-plane/installations/bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb", () =>
        HttpResponse.json(
          {
            statusCode: 404,
            code: "INSTALLATION_NOT_FOUND",
            message: "Installation not found",
            correlationId: "c1",
          },
          { status: 404 },
        ),
      ),
    );
    renderAt("/app/installations/bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb");

    await userEvent.click(await screen.findByRole("button", { name: "Collapse sidebar" }));
    const desktopNav = await findDesktopNav();
    const installationsLink = within(desktopNav).getByRole("link", { name: "Installations" });

    await waitFor(() => expect(installationsLink).toHaveAttribute("aria-current", "page"));
  });

  it("keeps the Customers item active on a nested detail path while collapsed", async () => {
    mockAuthenticated(["customers.read"]);
    mockEmptyCustomersList();
    server.use(
      http.get("/api/v1/control-plane/customers/11111111-1111-4111-8111-111111111111", () =>
        HttpResponse.json(
          {
            statusCode: 404,
            code: "CUSTOMER_NOT_FOUND",
            message: "Customer not found",
            correlationId: "c1",
          },
          { status: 404 },
        ),
      ),
    );
    renderAt("/app/customers/11111111-1111-4111-8111-111111111111");

    await userEvent.click(await screen.findByRole("button", { name: "Collapse sidebar" }));
    const desktopNav = await findDesktopNav();
    const customersLink = within(desktopNav).getByRole("link", { name: "Customers" });

    await waitFor(() => expect(customersLink).toHaveAttribute("aria-current", "page"));
  });

  it("persists the collapsed preference to localStorage", async () => {
    mockAuthenticated(["customers.read"]);
    renderAt("/app/dashboard");

    await userEvent.click(await screen.findByRole("button", { name: "Collapse sidebar" }));

    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("restores a saved collapsed preference on mount", async () => {
    localStorage.setItem(STORAGE_KEY, "true");
    mockAuthenticated(["customers.read"]);
    renderAt("/app/dashboard");

    expect(await screen.findByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    const desktopNav = await findDesktopNav();
    expect(within(desktopNav).queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("restores a saved expanded preference on mount", async () => {
    localStorage.setItem(STORAGE_KEY, "false");
    mockAuthenticated(["customers.read"]);
    renderAt("/app/dashboard");

    expect(await screen.findByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    const desktopNav = await findDesktopNav();
    expect(within(desktopNav).getByText("Dashboard")).toBeInTheDocument();
  });

  it("falls back to expanded for a malformed stored preference", async () => {
    localStorage.setItem(STORAGE_KEY, "not-a-boolean");
    mockAuthenticated(["customers.read"]);
    renderAt("/app/dashboard");

    expect(await screen.findByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
  });
});
