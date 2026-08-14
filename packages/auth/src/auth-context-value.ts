import { createContext } from "react";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  status: string;
}

export type AuthState =
  | { status: "initializing" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: AuthUser; permissions: string[] };

export interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: readonly string[]) => boolean;
  hasAllPermissions: (codes: readonly string[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
