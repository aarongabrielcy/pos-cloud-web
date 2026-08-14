/**
 * Module-level, memory-only access token store. Deliberately NOT localStorage/sessionStorage/
 * IndexedDB - any JS-readable persistent storage is exfiltratable via XSS; a 15-minute access token
 * living only in a JS variable (gone on refresh/close-tab) is the intended tradeoff. The refresh
 * token is never handled here at all - it's a backend-owned HttpOnly cookie the browser sends
 * automatically to /api/v1/auth/* and this code never reads or writes.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
