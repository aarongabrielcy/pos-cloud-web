import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AppProviders } from "../app/providers/AppProviders";
import { routes } from "../app/router/router";

const ME_RESPONSE = {
  id: "admin-1",
  email: "admin@example.com",
  displayName: "Admin One",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: null,
  permissions: ["customers.read"],
};

function mockAnonymous() {
  server.use(
    http.post("/api/v1/auth/refresh", () =>
      HttpResponse.json(
        {
          statusCode: 401,
          code: "INVALID_REFRESH_TOKEN",
          message: "no session",
          correlationId: "c1",
        },
        { status: 401 },
      ),
    ),
  );
}

function mockAuthenticated(permissions: string[] = ME_RESPONSE.permissions) {
  server.use(
    http.post("/api/v1/auth/refresh", () =>
      HttpResponse.json({ accessToken: "restored-token", tokenType: "Bearer", expiresIn: 900 }),
    ),
    http.get("/api/v1/auth/me", () => HttpResponse.json({ ...ME_RESPONSE, permissions })),
  );
}

function renderAt(initialEntry: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

describe("Protected routing", () => {
  it("redirects an anonymous visitor from a protected route to /login", async () => {
    mockAnonymous();
    renderAt("/app/dashboard");

    await waitFor(() => expect(screen.getByText("Vendor Admin")).toBeInTheDocument());
  });

  it("renders the requested content for an authenticated visitor", async () => {
    mockAuthenticated();
    renderAt("/app/dashboard");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument(),
    );
  });

  it("redirects an authenticated visitor away from /login to the dashboard", async () => {
    mockAuthenticated();
    renderAt("/login");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument(),
    );
  });

  it("renders NotAuthorized (not a redirect) for a direct URL the admin lacks permission for", async () => {
    mockAuthenticated([]); // no permissions granted at all
    renderAt("/app/audit");

    await waitFor(() =>
      expect(screen.getByText(/don't have permission to view this page/i)).toBeInTheDocument(),
    );
    // Still on /app/audit - this is an in-place 403, not a redirect.
    expect(screen.queryByRole("heading", { name: "Audit" })).not.toBeInTheDocument();
  });
});
