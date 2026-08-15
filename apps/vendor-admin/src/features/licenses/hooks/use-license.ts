import { useQuery } from "@tanstack/react-query";
import { getLicense } from "../api/licenses-api";
import { licenseKeys } from "../license-keys";

export function useLicense(id: string) {
  return useQuery({
    queryKey: licenseKeys.detail(id),
    queryFn: () => getLicense(id),
  });
}
