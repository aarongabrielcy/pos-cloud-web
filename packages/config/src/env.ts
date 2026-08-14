import { z } from "zod";

/**
 * `VITE_API_BASE_URL` defaults to `""` (same-origin) - the browser only ever calls relative
 * `/api/v1/...` paths, proxied by Vite in dev (see apps/vendor-admin/vite.config.ts) and by nginx in
 * production (see apps/vendor-admin/nginx/default.conf.template). This keeps the HttpOnly refresh
 * cookie's `SameSite=Lax` policy working unmodified - a cross-origin base URL would require backend
 * CORS changes, which WEB-01A deliberately avoids (see README#same-origin-topology).
 *
 * Every `VITE_*` variable is bundled into the public JS build and is not secret by construction
 * (Vite's own documented behavior) - never put a credential behind one.
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default(""),
});

export interface PublicEnv {
  readonly apiBaseUrl: string;
}

export function loadPublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid frontend environment configuration: ${parsed.error.message}`);
  }
  return { apiBaseUrl: parsed.data.VITE_API_BASE_URL };
}
