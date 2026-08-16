import type { components, operations } from "@pos-cloud-web/api-client";
import { apiClient } from "../../../shared/api/api-client";

export type Installation = components["schemas"]["InstallationResponseDto"];
export type InstallationListItem = components["schemas"]["InstallationListItemResponseDto"];
export type InstallationListResponse = components["schemas"]["InstallationListResponseDto"];
export type InstallationHealth = components["schemas"]["InstallationHealthResponseDto"];
export type CreateInstallationRequest = components["schemas"]["CreateInstallationRequestDto"];
export type ChangeInstallationStatusRequest =
  components["schemas"]["ChangeInstallationStatusRequestDto"];
export type IssueInstallationEnrollmentResponse =
  components["schemas"]["IssueInstallationEnrollmentResponseDto"];
export type ListInstallationsParams = NonNullable<
  operations["InstallationController_list"]["parameters"]["query"]
>;

function buildListQuery(params: ListInstallationsParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.pageSize !== undefined) search.set("pageSize", String(params.pageSize));
  if (params.customerId) search.set("customerId", params.customerId);
  if (params.licenseId) search.set("licenseId", params.licenseId);
  if (params.platform) search.set("platform", params.platform);
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listInstallations(
  params: ListInstallationsParams,
): Promise<InstallationListResponse> {
  return apiClient.request<InstallationListResponse>(
    `/api/v1/control-plane/installations${buildListQuery(params)}`,
  );
}

export function getInstallation(id: string): Promise<Installation> {
  return apiClient.request<Installation>(`/api/v1/control-plane/installations/${id}`);
}

export function getInstallationHealth(id: string): Promise<InstallationHealth> {
  return apiClient.request<InstallationHealth>(`/api/v1/control-plane/installations/${id}/health`);
}

export function createInstallation(body: CreateInstallationRequest): Promise<Installation> {
  return apiClient.request<Installation>("/api/v1/control-plane/installations", {
    method: "POST",
    body,
  });
}

export function changeInstallationStatus(
  id: string,
  body: ChangeInstallationStatusRequest,
): Promise<Installation> {
  return apiClient.request<Installation>(`/api/v1/control-plane/installations/${id}/status`, {
    method: "PATCH",
    body,
  });
}

/** Only eligible from PENDING - see installation-status.ts. The returned enrollmentCode is shown
 *  once by the backend itself; never persisted here beyond the issuing mutation's own transient
 *  result (see hooks/use-issue-initial-enrollment.ts). */
export function issueInitialEnrollment(id: string): Promise<IssueInstallationEnrollmentResponse> {
  return apiClient.request<IssueInstallationEnrollmentResponse>(
    `/api/v1/control-plane/installations/${id}/enrollment`,
    { method: "POST" },
  );
}

/** Only eligible from ACTIVE or SUSPENDED - a manual credential rekey, distinct from initial
 *  enrollment. Confirmed against backend source: this does NOT immediately revoke the installation's
 *  current credential - the old one keeps working until the new code is actually redeemed by the
 *  device. */
export function issueRecoveryEnrollment(id: string): Promise<IssueInstallationEnrollmentResponse> {
  return apiClient.request<IssueInstallationEnrollmentResponse>(
    `/api/v1/control-plane/installations/${id}/credentials/recovery-enrollment`,
    { method: "POST" },
  );
}

/** Idempotent (204 even with no active credential); never changes Installation.status. */
export function revokeInstallationCredential(id: string): Promise<void> {
  return apiClient.request<void>(`/api/v1/control-plane/installations/${id}/credentials/revoke`, {
    method: "POST",
  });
}
