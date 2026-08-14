import { setupServer } from "msw/node";

/**
 * One shared MSW server instance for the whole test run. Individual test files add/override
 * handlers via `server.use(...)` (auto-reset after each test by setup.ts) instead of every
 * package/app wiring its own server lifecycle.
 */
export const server = setupServer();

export { http, HttpResponse } from "msw";
