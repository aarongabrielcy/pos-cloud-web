import type { components, operations } from "@pos-cloud-web/api-client";
import { apiClient } from "../../../shared/api/api-client";

export type Customer = components["schemas"]["CustomerResponseDto"];
export type CustomerListResponse = components["schemas"]["CustomerListResponseDto"];
export type CreateCustomerRequest = components["schemas"]["CreateCustomerRequestDto"];
export type ChangeCustomerStatusRequest = components["schemas"]["ChangeCustomerStatusRequestDto"];
export type ListCustomersParams = NonNullable<
  operations["CustomerController_list"]["parameters"]["query"]
>;

function buildListQuery(params: ListCustomersParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.pageSize !== undefined) search.set("pageSize", String(params.pageSize));
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listCustomers(params: ListCustomersParams): Promise<CustomerListResponse> {
  return apiClient.request<CustomerListResponse>(
    `/api/v1/control-plane/customers${buildListQuery(params)}`,
  );
}

export function getCustomer(id: string): Promise<Customer> {
  return apiClient.request<Customer>(`/api/v1/control-plane/customers/${id}`);
}

export function createCustomer(body: CreateCustomerRequest): Promise<Customer> {
  return apiClient.request<Customer>("/api/v1/control-plane/customers", {
    method: "POST",
    body,
  });
}

export function changeCustomerStatus(
  id: string,
  body: ChangeCustomerStatusRequest,
): Promise<Customer> {
  return apiClient.request<Customer>(`/api/v1/control-plane/customers/${id}/status`, {
    method: "PATCH",
    body,
  });
}
