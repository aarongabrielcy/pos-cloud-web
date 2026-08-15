import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AuthProvider } from "@pos-cloud-web/auth";
import { SidebarNav } from "../app/layouts/SidebarNav";

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

describe("SidebarNav nested-route active navigation", () => {
  it("keeps the parent nav item active/highlighted for a path nested under it", async () => {
    mockAuthenticated(["customers.read"]);

    // No such literal route exists yet (no business detail pages in WEB-01B) - NavLink's own
    // active-matching only compares the current pathname against `to`, independent of whether any
    // <Route> actually resolves it, so this is still a faithful test of the underlying mechanism a
    // real `/app/customers/:id` route will rely on in WEB-01C.
    render(
      <MemoryRouter initialEntries={["/app/customers/some-nested-id"]}>
        <AuthProvider>
          <SidebarNav />
        </AuthProvider>
      </MemoryRouter>,
    );

    const customersLink = await screen.findByRole("link", { name: "Customers" });
    await waitFor(() => expect(customersLink).toHaveAttribute("aria-current", "page"));
  });

  it("does not mark an unrelated nav item active for that nested path", async () => {
    mockAuthenticated(["customers.read", "audit.read"]);

    render(
      <MemoryRouter initialEntries={["/app/customers/some-nested-id"]}>
        <AuthProvider>
          <SidebarNav />
        </AuthProvider>
      </MemoryRouter>,
    );

    const auditLink = await screen.findByRole("link", { name: "Audit" });
    expect(auditLink).not.toHaveAttribute("aria-current");
  });
});
