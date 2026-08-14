import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { AuthProvider } from "../auth-context";
import { useAuth } from "../use-auth";

import { clearAccessToken, getAccessToken } from "../token-store";

const ME_RESPONSE = {
  id: "admin-1",
  email: "admin@example.com",
  displayName: "Admin One",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: null,
  permissions: ["audit.read", "customers.read"],
};

function mockAnonymousStartup() {
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

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="status">{auth.state.status}</div>
      {auth.state.status === "authenticated" ? (
        <>
          <div data-testid="email">{auth.state.user.email}</div>
          <div data-testid="permissions">{auth.state.permissions.join(",")}</div>
        </>
      ) : null}
      <button
        onClick={() => {
          void auth.login("admin@example.com", "correct horse battery staple");
        }}
      >
        login
      </button>
      <button onClick={() => void auth.logout()}>logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  afterEach(() => {
    clearAccessToken();
  });

  it("restores an authenticated session on mount when refresh + me succeed", async () => {
    server.use(
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json({ accessToken: "restored-token", tokenType: "Bearer", expiresIn: 900 }),
      ),
      http.get("/api/v1/auth/me", () => HttpResponse.json(ME_RESPONSE)),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status").textContent).toBe("initializing");
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("authenticated"));
    expect(screen.getByTestId("email").textContent).toBe("admin@example.com");
    expect(screen.getByTestId("permissions").textContent).toBe("audit.read,customers.read");
  });

  it("goes anonymous (no error UI) when refresh returns 401 on startup", async () => {
    mockAnonymousStartup();

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("anonymous"));
  });

  it("logs in successfully and exposes the authoritative permissions from /auth/me", async () => {
    mockAnonymousStartup();
    server.use(
      http.post("/api/v1/auth/login", () =>
        HttpResponse.json({
          accessToken: "login-token",
          tokenType: "Bearer",
          expiresIn: 900,
          user: {
            id: "admin-1",
            email: "admin@example.com",
            displayName: "Admin One",
            status: "ACTIVE",
          },
        }),
      ),
      http.get("/api/v1/auth/me", () => HttpResponse.json(ME_RESPONSE)),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("anonymous"));

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("authenticated"));
    expect(getAccessToken()).toBe("login-token");
    expect(screen.getByTestId("permissions").textContent).toBe("audit.read,customers.read");
  });

  it("surfaces INVALID_CREDENTIALS without changing state to authenticated", async () => {
    mockAnonymousStartup();
    server.use(
      http.post("/api/v1/auth/login", () =>
        HttpResponse.json(
          {
            statusCode: 401,
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
            correlationId: "c2",
          },
          { status: 401 },
        ),
      ),
    );

    function LoginProbe() {
      const auth = useAuth();
      const [error, setError] = useState<string | null>(null);
      return (
        <div>
          <div data-testid="status">{auth.state.status}</div>
          {error ? <div data-testid="error">{error}</div> : null}
          <button
            onClick={() => {
              auth.login("admin@example.com", "wrong-password").catch((e: { code?: string }) => {
                setError(e.code ?? "unknown");
              });
            }}
          >
            login
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("anonymous"));

    await userEvent.click(screen.getByText("login"));

    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toBe("INVALID_CREDENTIALS"),
    );
    expect(screen.getByTestId("status").textContent).toBe("anonymous");
  });

  it("logout clears the access token and returns to anonymous", async () => {
    server.use(
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json({ accessToken: "restored-token", tokenType: "Bearer", expiresIn: 900 }),
      ),
      http.get("/api/v1/auth/me", () => HttpResponse.json(ME_RESPONSE)),
      http.post("/api/v1/auth/logout", () => new Response(null, { status: 204 })),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("authenticated"));

    await userEvent.click(screen.getByText("logout"));

    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("anonymous"));
    expect(getAccessToken()).toBeNull();
  });
});
