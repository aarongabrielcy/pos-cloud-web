import { createApiClient, type ApiClient } from "@pos-cloud-web/api-client";
import { getAccessToken } from "./token-store";
import { refreshSession } from "./refresh";

/**
 * `onUnauthorized` closes over `client` before its own `const` finishes initializing - safe here
 * because the closure only runs later, on an actual 401 response, never during construction.
 */
export function createAuthApiClient(baseUrl: string): ApiClient {
  const client: ApiClient = createApiClient({
    baseUrl,
    getAccessToken,
    onUnauthorized: () => refreshSession(client),
  });
  return client;
}
