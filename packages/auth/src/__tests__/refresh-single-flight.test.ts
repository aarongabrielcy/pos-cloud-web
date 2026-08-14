import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse, server } from "@pos-cloud-web/testing";
import { createApiClient } from "@pos-cloud-web/api-client";
import { refreshSession } from "../refresh";
import { clearAccessToken, getAccessToken } from "../token-store";

describe("refreshSession single-flight", () => {
  afterEach(() => {
    clearAccessToken();
  });

  it("collapses 3+ concurrent callers into exactly one /auth/refresh request", async () => {
    let refreshCallCount = 0;
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        refreshCallCount += 1;
        return HttpResponse.json({
          accessToken: "fresh-token",
          tokenType: "Bearer",
          expiresIn: 900,
        });
      }),
    );

    const client = createApiClient({ baseUrl: "", getAccessToken: () => null });

    const results = await Promise.all([
      refreshSession(client),
      refreshSession(client),
      refreshSession(client),
      refreshSession(client),
    ]);

    expect(refreshCallCount).toBe(1);
    expect(results).toEqual(["fresh-token", "fresh-token", "fresh-token", "fresh-token"]);
    expect(getAccessToken()).toBe("fresh-token");
  });

  it("resolves to null and clears the token when refresh fails", async () => {
    server.use(
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json(
          {
            statusCode: 401,
            code: "INVALID_REFRESH_TOKEN",
            message: "expired",
            correlationId: "c1",
          },
          { status: 401 },
        ),
      ),
    );

    const client = createApiClient({ baseUrl: "", getAccessToken: () => null });
    const result = await refreshSession(client);

    expect(result).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("allows a new refresh attempt after the previous one has settled", async () => {
    let refreshCallCount = 0;
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        refreshCallCount += 1;
        return HttpResponse.json({
          accessToken: `token-${refreshCallCount}`,
          tokenType: "Bearer",
          expiresIn: 900,
        });
      }),
    );

    const client = createApiClient({ baseUrl: "", getAccessToken: () => null });
    await refreshSession(client);
    await refreshSession(client);

    expect(refreshCallCount).toBe(2);
  });
});
