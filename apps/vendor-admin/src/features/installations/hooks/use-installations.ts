import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listInstallations, type ListInstallationsParams } from "../api/installations-api";
import { installationKeys } from "../installation-keys";

/** Keeps the previous page's rows on screen while the next page loads - same pattern as
 *  useCustomers/useLicenses. */
export function useInstallations(params: ListInstallationsParams) {
  return useQuery({
    queryKey: installationKeys.list(params),
    queryFn: () => listInstallations(params),
    placeholderData: keepPreviousData,
  });
}
