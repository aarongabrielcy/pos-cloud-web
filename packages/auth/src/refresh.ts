import type { ApiClient, components } from "@pos-cloud-web/api-client";
import { setAccessToken, clearAccessToken } from "./token-store";

type RefreshResponseDto = components["schemas"]["RefreshResponseDto"];

let refreshPromise: Promise<string | null> | null = null;

/**
 * Single-flight refresh (WEB-01A#17): however many requests hit a 401 at once, only the first call
 * here starts a real `/auth/refresh` request - every concurrent caller (and every caller until it
 * settles) awaits that same promise instead of firing its own. `refreshPromise` is intentionally
 * module-level (not per-client) - this package only ever wires up one real ApiClient per running app.
 */
export function refreshSession(client: ApiClient): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh(client).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function performRefresh(client: ApiClient): Promise<string | null> {
  try {
    const result = await client.request<RefreshResponseDto>("/api/v1/auth/refresh", {
      method: "POST",
      skipAuthRetry: true,
    });
    setAccessToken(result.accessToken);
    return result.accessToken;
  } catch {
    clearAccessToken();
    return null;
  }
}
