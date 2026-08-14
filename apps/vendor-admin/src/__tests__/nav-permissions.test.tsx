import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AppProviders } from "../app/providers/AppProviders";
import { routes } from "../app/router/router";

function mockAuthenticated(permissions: string[]) {
  server.use(
    http.post("/api/v1/auth/refresh", () =>
      HttpResponse.json({ accessToken: "restored-token", tokenType: "Bearer", expiresIn: 900 }),
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

describe("Sidebar navigation permission filtering", () => {
  it("only shows nav entries the admin has the matching permission for", async () => {
    mockAuthenticated(["customers.read", "audit.read"]);
    const router = createMemoryRouter(routes, { initialEntries: ["/app/dashboard"] });
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument(),
    );
    const nav = screen.getByRole("navigation", { name: "Primary" });

    expect(within(nav).getByText("Dashboard")).toBeInTheDocument();
    expect(within(nav).getByText("Customers")).toBeInTheDocument();
    expect(within(nav).getByText("Audit")).toBeInTheDocument();
    expect(within(nav).queryByText("Licenses")).not.toBeInTheDocument();
    expect(within(nav).queryByText("Installations")).not.toBeInTheDocument();
  });
});
