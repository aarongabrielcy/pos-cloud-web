import { useQuery } from "@tanstack/react-query";
import { getInstallation } from "../api/installations-api";
import { installationKeys } from "../installation-keys";

export function useInstallation(id: string) {
  return useQuery({
    queryKey: installationKeys.detail(id),
    queryFn: () => getInstallation(id),
  });
}
