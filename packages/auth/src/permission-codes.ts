/**
 * `/auth/me`'s `permissions` array is dynamic `string[]` by design (see AdminMeResponseDto) - the
 * frontend must never hardcode the full backend catalog or infer codes from role names (WEB-01A#19).
 * This is only the small subset the web app's own navigation actually branches on today; add to it
 * only when a real screen needs another code, never speculatively. The backend currently defines 13
 * total (pos-cloud libs/control-plane/access-management/src/domain/permission.ts) - this is not that
 * list.
 */
export const PERMISSION_CODES = {
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_STATUS_CHANGE: "customers.status.change",
  LICENSES_READ: "licenses.read",
  INSTALLATIONS_READ: "installations.read",
  AUDIT_READ: "audit.read",
} as const;

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];
