import type { ListInstallationsParams } from "./api/installations-api";

export const installationKeys = {
  all: ["installations"] as const,
  lists: () => [...installationKeys.all, "list"] as const,
  list: (params: ListInstallationsParams) => [...installationKeys.lists(), params] as const,
  details: () => [...installationKeys.all, "detail"] as const,
  detail: (id: string) => [...installationKeys.details(), id] as const,
  health: (id: string) => [...installationKeys.all, "health", id] as const,
};
