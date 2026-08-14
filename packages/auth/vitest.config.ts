/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["@pos-cloud-web/testing/setup"],
    globals: false,
  },
});
