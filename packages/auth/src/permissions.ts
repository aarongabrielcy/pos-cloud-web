/** UX helpers only (WEB-01A#18) - the backend re-checks every permission-gated request server-side
 *  regardless of what these return; these exist purely to drive nav visibility / a friendly 403. */
export function hasPermission(permissions: readonly string[], code: string): boolean {
  return permissions.includes(code);
}

export function hasAnyPermission(
  permissions: readonly string[],
  codes: readonly string[],
): boolean {
  return codes.some((code) => permissions.includes(code));
}

export function hasAllPermissions(
  permissions: readonly string[],
  codes: readonly string[],
): boolean {
  return codes.every((code) => permissions.includes(code));
}
