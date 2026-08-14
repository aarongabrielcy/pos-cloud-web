/** Mirrors AllExceptionsFilter's one real error contract (pos-cloud apps/api/src/common/all-exceptions.filter.ts). */
export interface BackendErrorBody {
  statusCode: number;
  code: string;
  message: string;
  correlationId: string;
  details?: unknown;
}

export type ApiErrorKind = "http" | "network" | "parse";

/**
 * Thrown for every non-2xx response and every transport failure. `kind` distinguishes a real
 * backend error response (`"http"`, has `code`/`correlationId`) from a network failure (`"network"`,
 * fetch itself rejected - offline, DNS, connection reset) from an unparseable response body
 * (`"parse"`, a 2xx or error response that wasn't valid JSON when JSON was expected).
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly statusCode: number;
  readonly code?: string;
  readonly correlationId?: string;
  readonly details?: unknown;

  constructor(params: {
    kind: ApiErrorKind;
    statusCode: number;
    message: string;
    code?: string;
    correlationId?: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.kind = params.kind;
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.correlationId = params.correlationId;
    this.details = params.details;
  }

  static fromBackendBody(statusCode: number, body: BackendErrorBody): ApiError {
    return new ApiError({
      kind: "http",
      statusCode,
      message: body.message,
      code: body.code,
      correlationId: body.correlationId,
      details: body.details,
    });
  }

  static network(cause: unknown): ApiError {
    const message = cause instanceof Error ? cause.message : "Network request failed";
    return new ApiError({ kind: "network", statusCode: 0, message });
  }

  static parse(statusCode: number, cause: unknown): ApiError {
    const message = cause instanceof Error ? cause.message : "Failed to parse response body";
    return new ApiError({ kind: "parse", statusCode, message });
  }
}
