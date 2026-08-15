import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AppProviders } from "../app/providers/AppProviders";
import { routes } from "../app/router/router";

function mockAuthenticated(permissions: string[] = ["customers.read"]) {
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

function renderAt(initialEntry: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe("Mobile navigation drawer", () => {
  it("is closed by default", async () => {
    mockAuthenticated();
    renderAt("/app/dashboard");

    await screen.findByRole("heading", { name: "Dashboard" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens when the hamburger menu button is clicked", async () => {
    mockAuthenticated();
    renderAt("/app/dashboard");
    await screen.findByRole("heading", { name: "Dashboard" });

    await userEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));

    const drawer = await screen.findByRole("dialog");
    expect(within(drawer).getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    mockAuthenticated();
    renderAt("/app/dashboard");
    await screen.findByRole("heading", { name: "Dashboard" });

    await userEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes after clicking a nav link inside it (and navigates)", async () => {
    mockAuthenticated(["customers.read", "audit.read"]);
    renderAt("/app/dashboard");
    await screen.findByRole("heading", { name: "Dashboard" });

    await userEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    const drawer = await screen.findByRole("dialog");

    await userEvent.click(within(drawer).getByRole("link", { name: "Audit" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByRole("heading", { name: "Audit" })).toBeInTheDocument();
  });
});
