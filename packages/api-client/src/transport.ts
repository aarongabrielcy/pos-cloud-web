import { ApiError, type BackendErrorBody } from "./api-error";

export interface ApiClientConfig {
  /** `""` for same-origin relative calls (the default/expected topology - see README#same-origin). */
  baseUrl: string;
  /** Returns the current in-memory access token, or `null` when anonymous. */
  getAccessToken: () => string | null;
  /**
   * Called at most once per request on a 401 response (unless `skipAuthRetry` was set). Should
   * attempt to obtain a fresh access token (typically via a single-flight `/auth/refresh`) and
   * return it, or `null` if the session cannot be restored. The transport retries the original
   * request exactly once with the new token if one is returned; a 401 on that retry is never
   * retried again, regardless of what `onUnauthorized` returns.
   */
  onUnauthorized?: () => Promise<string | null>;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Set by callers (the auth package) for /auth/login, /auth/refresh, /auth/logout - a 401 there is
   *  a real answer (bad credentials / expired session), never a signal to attempt another refresh. */
  skipAuthRetry?: boolean;
  signal?: AbortSignal;
}

export interface ApiClient {
  request<T>(path: string, options?: ApiRequestOptions): Promise<T>;
}

function isBackendErrorBody(value: unknown): value is BackendErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).statusCode === "number" &&
    typeof (value as Record<string, unknown>).code === "string" &&
    typeof (value as Record<string, unknown>).message === "string" &&
    typeof (value as Record<string, unknown>).correlationId === "string"
  );
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    throw ApiError.parse(response.status, cause);
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = await parseJsonBody(response).catch((error: unknown) => {
    if (error instanceof ApiError) {
      return undefined;
    }
    throw error;
  });
  if (isBackendErrorBody(body)) {
    return ApiError.fromBackendBody(response.status, body);
  }
  return new ApiError({
    kind: "http",
    statusCode: response.status,
    message: response.statusText || `Request failed with status ${response.status}`,
  });
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  async function doFetch(path: string, options: ApiRequestOptions, token: string | null) {
    const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${config.baseUrl}${path}`, {
        method: options.method ?? "GET",
        credentials: "include",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });
    } catch (cause) {
      throw ApiError.network(cause);
    }
    return response;
  }

  async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const response = await doFetch(path, options, config.getAccessToken());

    if (response.status === 401 && !options.skipAuthRetry && config.onUnauthorized) {
      const newToken = await config.onUnauthorized();
      if (newToken) {
        const retryResponse = await doFetch(path, options, newToken);
        return handleResponse<T>(retryResponse);
      }
    }

    return handleResponse<T>(response);
  }

  async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await toApiError(response);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await parseJsonBody(response)) as T;
  }

  return { request };
}
