/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Same-origin topology (see README#same-origin-topology): the browser only ever calls
      // relative /api/... paths. Vite forwards them to the real backend in dev, so no backend CORS
      // configuration is needed - production reaches the same effect via nginx (see
      // nginx/default.conf.template). No path rewrite: `/api/v1/...` reaches the backend as
      // `/api/v1/...` unchanged, matching its real route prefix exactly (apps/api's controllers are
      // already mounted under `api/v1/...`).
      "/api": {
        target: "http://localhost:5100",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["@pos-cloud-web/testing/setup"],
    globals: false,
    css: true,
  },
});
