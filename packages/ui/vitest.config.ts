/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    // No component tests required yet for these primitives (WEB-01A scope) - passWithNoTests keeps
    // `turbo run test` green instead of failing on an empty suite.
    passWithNoTests: true,
  },
});
