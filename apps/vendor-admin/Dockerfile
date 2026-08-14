# syntax=docker/dockerfile:1

# --- deps + build -----------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /repo

RUN corepack enable

# Copy the whole workspace - Turborepo/pnpm need the full workspace graph (root manifest,
# pnpm-workspace.yaml, every package.json) to resolve `workspace:*` deps, not just this one app.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/vendor-admin ./apps/vendor-admin
COPY tooling ./tooling

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pos-cloud-web/vendor-admin build

# --- runtime ------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY apps/vendor-admin/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/vendor-admin/dist /usr/share/nginx/html

# Same-origin proxy target (WEB-01A#35) - the container this image talks to, never a browser-facing
# URL. Override at `docker run`/compose time; this default matches the docker-compose network alias
# used by pos-cloud's own backend stack.
ENV API_UPSTREAM=http://pos-cloud-api:5100

EXPOSE 80
