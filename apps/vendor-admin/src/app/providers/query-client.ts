import { QueryClient } from "@tanstack/react-query";

function shouldRetry(failureCount: number, error: unknown): boolean {
  const statusCode = (error as { statusCode?: number } | undefined)?.statusCode;
  // 401/403 are answers, not transient failures - retrying just repeats the same rejection while the
  // real fix (refresh/permission) has already run its course by the time react-query sees the error.
  if (statusCode === 401 || statusCode === 403) {
    return false;
  }
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
