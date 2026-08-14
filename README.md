# pos-cloud-web

Vendor Admin frontend for POS Cloud's control plane. A pnpm + Turborepo monorepo built against the
`pos-cloud` backend's OpenAPI contract (requires BACKEND-HARDENING-01 - see
[Backend dependency](#backend-dependency--backlog-policy) below).

## Workspace structure

```
apps/
  vendor-admin/          Vite + React 19 app - the only deployable unit today
packages/
  api-client/             Generic fetch transport (ApiError, 204/JSON handling, 401 retry hook) +
                           OpenAPI-generated types (packages/api-client/src/generated/schema.d.ts)
  auth/                   Token store, AuthProvider/useAuth, refresh single-flight, permission helpers
  ui/                     Button, Input, FormField, Alert, Spinner, Card - accessible primitives
  design-tokens/          Tailwind v4 @theme tokens (packages/design-tokens/src/tokens.css)
  config/                 Zod-validated public (VITE_*) env loading
  i18n/                   Locale contract boundary - single-locale (en) today, no framework yet
  testing/                Shared Vitest setup + MSW server (packages/testing/src/setup.ts)
tooling/
  eslint-config/          One shared flat ESLint config every package imports
```

### Dependency direction

```
vendor-admin ─▶ api-client, auth, ui, config, design-tokens, i18n
auth         ─▶ api-client
ui           ─▶ design-tokens
```

No package imports from `apps/`, and there are no circular workspace dependencies (verified by
`turbo run build --graph`, see the WEB-01A final report).

### Package naming

Every workspace package uses the `@pos-cloud-web/*` scope (`@pos-cloud-web/api-client`,
`@pos-cloud-web/auth`, `@pos-cloud-web/ui`, `@pos-cloud-web/design-tokens`,
`@pos-cloud-web/config`, `@pos-cloud-web/testing`, `@pos-cloud-web/i18n`,
`@pos-cloud-web/vendor-admin`).

Shared third-party dependency versions are pinned once via a pnpm **catalog**
(`pnpm-workspace.yaml`'s `catalog:` block) - every package references `"catalog:"` instead of
duplicating a version string, so there is one place to bump React/TypeScript/Vitest/etc.

Library packages are consumed as raw TypeScript source directly by Vite/Vitest (no dist build step,
no npm publish) - so each package's own `build` script is just `tsc --noEmit`, identical to its
`typecheck` script. `apps/vendor-admin` is the only package with a real build artifact
(`vite build`).

## Dev commands

```
pnpm install
pnpm dev              # vendor-admin dev server (turbo filter)
pnpm build             # turbo run build (topological)
pnpm lint
pnpm typecheck
pnpm test
pnpm format / format:check
pnpm api:generate      # regenerate packages/api-client/src/generated/schema.d.ts
```

## Same-origin topology

The browser only ever calls **relative** `/api/v1/...` paths - it never learns the backend's real
address:

- **Development**: `apps/vendor-admin/vite.config.ts` proxies `/api` → `http://localhost:5100`
  (`changeOrigin: true`, no path rewrite).
- **Production**: `apps/vendor-admin/nginx/default.conf.template` reverse-proxies `/api/` →
  `${API_UPSTREAM}` (defaults to `http://pos-cloud-api:5100`, the docker-compose network alias).

This is why the backend needs **no CORS configuration at all** - confirmed and closed on the backend
side as `CORS: CLOSED — NOT REQUIRED FOR CURRENT SAME-ORIGIN TOPOLOGY` (pos-cloud's own README). It
also means the refresh cookie's `SameSite=Lax` policy works unmodified - a cross-origin API base URL
would break it.

`VITE_API_BASE_URL` (see `apps/vendor-admin/.env.example`) exists only as an escape hatch and
defaults to `""` (same-origin). Never set it to an absolute cross-origin URL for a real deployment.

## OpenAPI generation

```
pnpm api:generate
```

Runs `openapi-typescript` against a **live** `pos-cloud` backend's `http://localhost:5100/openapi.json`
and overwrites `packages/api-client/src/generated/schema.d.ts`. This file is:

- tracked in git (so the repo type-checks without a running backend);
- marked `linguist-generated` in `.gitattributes`;
- never hand-edited - regenerate instead.

It does **not** run automatically as part of `build` (it requires a live backend, which CI/most
local builds won't have). Standard flow:

1. Start the `pos-cloud` backend (`docker compose up` in that repo).
2. `pnpm api:generate` here.
3. `pnpm build`.

## Auth model

- **Access token**: held **only** in memory (a module-level variable in
  `packages/auth/src/token-store.ts`) - never localStorage, sessionStorage, or IndexedDB. Gone on
  tab close/refresh by design; 15-minute backend-issued TTL.
- **Refresh token**: a backend-owned **HttpOnly** cookie (`pos_cloud_admin_refresh`,
  `SameSite=Lax`, `secure` in production, scoped to `/api/v1/auth`) - this frontend never reads or
  writes it directly; the browser sends it automatically on same-origin requests.
- **Refresh single-flight** (`packages/auth/src/refresh.ts`): a shared module-level
  `refreshPromise` so any number of concurrent 401s trigger exactly one `/auth/refresh` call: every
  caller awaits the same promise, then retries its original request exactly once. `/auth/login`,
  `/auth/refresh`, `/auth/logout` themselves are never auto-retried (`skipAuthRetry`), which is what
  prevents recursive refresh loops.
- **Effective permissions**: `GET /auth/me` returns `permissions: string[]` (backend-computed via
  its `PermissionResolverPort` - the exact authority the real authorization guard already queries per
  request). The frontend treats this as the authoritative-enough-for-UX capability list; it never
  decodes JWT claims, never hardcodes role names, never infers permissions from a role name. The
  backend remains the sole real security authority - every permission-gated request is still
  rechecked server-side regardless of what this array says.
- **Backend remains authoritative**: this frontend's permission checks (`hasPermission` /
  `hasAnyPermission` / `hasAllPermissions`, nav filtering, the `NotAuthorized` page) are UX
  conveniences only.

## Docker

```
apps/vendor-admin/Dockerfile          # Node 24 build → nginx:1.27-alpine runtime, multi-stage
apps/vendor-admin/nginx/default.conf.template
```

SPA fallback (`try_files $uri /index.html`) + `/api/` reverse proxy to `${API_UPSTREAM}`. No CORS
headers are added or stripped - same-origin means none are needed either way.

## Backend dependency & backlog policy

This app targets the `pos-cloud` backend's OpenAPI contract as of **BACKEND-HARDENING-01**
(explicit response DTOs on every operation + `AdminMeResponseDto.permissions`). WEB-01A's own gate
(section 1 of its brief) refuses to proceed past monorepo/Auth implementation until that hardening is
confirmed present on the backend's `develop` branch, both via source inspection and a live
`GET /openapi.json` check.

When backend work resumes, `pos-cloud`'s own README backlog (customer/license/installation/audit
hardening items - concurrent-create races, heartbeat rate limiting, audit retention, etc.) is
resolved **before** new backend feature domains, not from this frontend.

This frontend's own backlog: business CRUD (customers/licenses/installations/audit UI, dashboard
analytics) is deliberately out of scope for WEB-01A - only navigation placeholders + permission-aware
visibility exist today.
