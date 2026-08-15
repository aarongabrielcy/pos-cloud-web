import type { ListLicensesParams } from "./api/licenses-api";

export const licenseKeys = {
  all: ["licenses"] as const,
  lists: () => [...licenseKeys.all, "list"] as const,
  list: (params: ListLicensesParams) => [...licenseKeys.lists(), params] as const,
  details: () => [...licenseKeys.all, "detail"] as const,
  detail: (id: string) => [...licenseKeys.details(), id] as const,
};
