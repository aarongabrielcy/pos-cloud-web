import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../transport";
import { ApiError } from "../api-error";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

describe("createApiClient transport", () => {
  it("returns undefined for a 204 response without attempting to parse a body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient({ baseUrl: "", getAccessToken: () => null });
    const result = await client.request<void>("/api/v1/whatever", { method: "DELETE" });

    expect(result).toBeUndefined();
    vi.unstubAllGlobals();
  });

  it("parses the backend's error contract into a typed ApiError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(400, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "email must be an email",
        correlationId: "corr-123",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient({ baseUrl: "", getAccessToken: () => null });

    await expect(client.request("/api/v1/auth/login", { method: "POST" })).rejects.toMatchObject({
      name: "ApiError",
      kind: "http",
      statusCode: 400,
      code: "VALIDATION_ERROR",
      correlationId: "corr-123",
    });
    vi.unstubAllGlobals();
  });

  it("maps a network failure (fetch rejecting) to a kind: network ApiError", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient({ baseUrl: "", getAccessToken: () => null });

    const error = await client.request("/api/v1/anything").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe("network");
    vi.unstubAllGlobals();
  });

  it("on a 401, calls onUnauthorized once and retries the original request exactly once", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(emptyResponse(401))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const onUnauthorized = vi.fn().mockResolvedValue("new-token");
    const client = createApiClient({ baseUrl: "", getAccessToken: () => null, onUnauthorized });

    const result = await client.request<{ ok: boolean }>("/api/v1/protected");

    expect(result).toEqual({ ok: true });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retryHeaders = fetchMock.mock.calls[1][1].headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe("Bearer new-token");
    vi.unstubAllGlobals();
  });

  it("does not retry a second time if the retried request is also 401 (no infinite loop)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(401));
    vi.stubGlobal("fetch", fetchMock);

    const onUnauthorized = vi.fn().mockResolvedValue("new-token");
    const client = createApiClient({ baseUrl: "", getAccessToken: () => null, onUnauthorized });

    await expect(client.request("/api/v1/protected")).rejects.toMatchObject({ statusCode: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it("never calls onUnauthorized when skipAuthRetry is set (login/refresh/logout)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(401, {
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
        correlationId: "corr-1",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const onUnauthorized = vi.fn();
    const client = createApiClient({ baseUrl: "", getAccessToken: () => null, onUnauthorized });

    await expect(
      client.request("/api/v1/auth/login", { method: "POST", skipAuthRetry: true }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(onUnauthorized).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("sends credentials: include and a Bearer header when a token is available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient({ baseUrl: "", getAccessToken: () => "abc123" });
    await client.request("/api/v1/anything");

    const [, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    expect(init.credentials).toBe("include");
    expect(init.headers.Authorization).toBe("Bearer abc123");
    vi.unstubAllGlobals();
  });
});
