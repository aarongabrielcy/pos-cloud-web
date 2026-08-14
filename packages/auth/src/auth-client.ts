import type { ApiClient, components } from "@pos-cloud-web/api-client";

export type LoginResponseDto = components["schemas"]["LoginResponseDto"];
export type AdminMeResponseDto = components["schemas"]["AdminMeResponseDto"];

export interface Credentials {
  email: string;
  password: string;
}

/** login/refresh/logout all pass `skipAuthRetry` - a 401 from any of them is a real answer, never a
 *  cue to attempt another refresh (WEB-01A#17). */
export function login(client: ApiClient, credentials: Credentials): Promise<LoginResponseDto> {
  return client.request<LoginResponseDto>("/api/v1/auth/login", {
    method: "POST",
    body: credentials,
    skipAuthRetry: true,
  });
}

export function fetchCurrentAdmin(client: ApiClient): Promise<AdminMeResponseDto> {
  return client.request<AdminMeResponseDto>("/api/v1/auth/me");
}

export async function logout(client: ApiClient): Promise<void> {
  await client.request<void>("/api/v1/auth/logout", { method: "POST", skipAuthRetry: true });
}
