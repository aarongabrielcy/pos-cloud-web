import { createAuthApiClient } from "@pos-cloud-web/auth";

/**
 * One shared ApiClient instance for every business feature (see docs/conventions.md). Built on the
 * same factory AuthProvider uses internally for its own auth calls - safe to have a second instance
 * because the state that matters (the access-token store and the single-flight refresh lock) is
 * module-level inside @pos-cloud-web/auth, not tied to a particular ApiClient object, so this
 * instance shares both rather than racing its own refresh.
 */
export const apiClient = createAuthApiClient("");
