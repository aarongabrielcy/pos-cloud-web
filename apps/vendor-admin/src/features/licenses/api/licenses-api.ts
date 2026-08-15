import type { components, operations } from "@pos-cloud-web/api-client";
import { apiClient } from "../../../shared/api/api-client";

export type License = components["schemas"]["LicenseResponseDto"];
export type LicenseListResponse = components["schemas"]["LicenseListResponseDto"];
export type CreateLicenseRequest = components["schemas"]["CreateLicenseRequestDto"];
export type ChangeLicenseStatusRequest = components["schemas"]["ChangeLicenseStatusRequestDto"];
export type ListLicensesParams = NonNullable<
  operations["LicenseController_list"]["parameters"]["query"]
>;

function buildListQuery(params: ListLicensesParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.pageSize !== undefined) search.set("pageSize", String(params.pageSize));
  if (params.customerId) search.set("customerId", params.customerId);
  if (params.status) search.set("status", params.status);
  if (params.edition) search.set("edition", params.edition);
  if (params.search) search.set("search", params.search);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listLicenses(params: ListLicensesParams): Promise<LicenseListResponse> {
  return apiClient.request<LicenseListResponse>(
    `/api/v1/control-plane/licenses${buildListQuery(params)}`,
  );
}

export function getLicense(id: string): Promise<License> {
  return apiClient.request<License>(`/api/v1/control-plane/licenses/${id}`);
}

export function createLicense(body: CreateLicenseRequest): Promise<License> {
  return apiClient.request<License>("/api/v1/control-plane/licenses", {
    method: "POST",
    body,
  });
}

export function changeLicenseStatus(
  id: string,
  body: ChangeLicenseStatusRequest,
): Promise<License> {
  return apiClient.request<License>(`/api/v1/control-plane/licenses/${id}/status`, {
    method: "PATCH",
    body,
  });
}
