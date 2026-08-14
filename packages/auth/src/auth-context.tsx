import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createAuthApiClient } from "./client";
import { login as loginRequest, logout as logoutRequest, fetchCurrentAdmin } from "./auth-client";
import { refreshSession } from "./refresh";
import { clearAccessToken, setAccessToken } from "./token-store";
import { hasAllPermissions, hasAnyPermission, hasPermission } from "./permissions";
import {
  AuthContext,
  type AuthContextValue,
  type AuthState,
  type AuthUser,
} from "./auth-context-value";

export interface AuthProviderProps {
  /** Same-origin (`""`) by default - see README#same-origin-topology. Only override in tests. */
  apiBaseUrl?: string;
  children: ReactNode;
}

function toAuthUser(me: {
  id: string;
  email: string;
  displayName: string;
  status: string;
}): AuthUser {
  return { id: me.id, email: me.email, displayName: me.displayName, status: me.status };
}

export function AuthProvider({ apiBaseUrl = "", children }: AuthProviderProps) {
  // Lazy useState initializer (not a ref) - runs exactly once, on the first render, and is the
  // React-compiler-safe way to construct a "create only once" value (reading/writing a ref during
  // render, even behind a null-check, is no longer allowed - see eslint-plugin-react-hooks's `refs`
  // rule).
  const [client] = useState(() => createAuthApiClient(apiBaseUrl));

  const [state, setState] = useState<AuthState>({ status: "initializing" });

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = await refreshSession(client);
      if (!token) {
        if (!cancelled) setState({ status: "anonymous" });
        return;
      }
      try {
        const me = await fetchCurrentAdmin(client);
        if (!cancelled) {
          setState({ status: "authenticated", user: toAuthUser(me), permissions: me.permissions });
        }
      } catch {
        clearAccessToken();
        if (!cancelled) setState({ status: "anonymous" });
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
    // Runs once on mount - `client` is a stable value for the lifetime of this provider instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginRequest(client, { email, password });
      setAccessToken(result.accessToken);
      const me = await fetchCurrentAdmin(client);
      setState({ status: "authenticated", user: toAuthUser(me), permissions: me.permissions });
    },
    [client],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest(client);
    } catch {
      // Logout is idempotent server-side; a network/transport failure must not block clearing local
      // state - the user is leaving either way.
    }
    clearAccessToken();
    setState({ status: "anonymous" });
  }, [client]);

  const value = useMemo<AuthContextValue>(() => {
    const permissions = state.status === "authenticated" ? state.permissions : [];
    return {
      state,
      login,
      logout,
      hasPermission: (code) => hasPermission(permissions, code),
      hasAnyPermission: (codes) => hasAnyPermission(permissions, codes),
      hasAllPermissions: (codes) => hasAllPermissions(permissions, codes),
    };
  }, [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
