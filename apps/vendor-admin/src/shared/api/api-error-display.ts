import { ApiError } from "@pos-cloud-web/api-client";

/** Backend messages are already specific and human-readable (validation/domain errors alike) - no
 *  per-status-code special-casing needed here, see docs/conventions.md#errors. */
export function apiErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function apiErrorCorrelationId(error: unknown): string | undefined {
  return error instanceof ApiError ? error.correlationId : undefined;
}
