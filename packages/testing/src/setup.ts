import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw";

// `onUnhandledRequest: "error"` - a request MSW doesn't recognize is a test bug (wrong path, missing
// handler), not something to silently pass through, since there is no real backend in test runs.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// RTL's own auto-cleanup only self-registers when it finds a *global* `afterEach` - this workspace
// runs Vitest with `globals: false` everywhere (explicit imports, no implicit globals), so it never
// fires on its own. Without this, every render() in a test file leaks into the next test's DOM.
afterEach(() => cleanup());
