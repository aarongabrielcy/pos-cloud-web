import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@pos-cloud-web/auth";
import { Spinner } from "@pos-cloud-web/ui";

/** Gate for every /app/* route: anonymous → /login, initializing → a full-page spinner (never a
 *  flash of the login screen), authenticated → render the nested route via <Outlet/>. */
export function ProtectedRoute() {
  const { state } = useAuth();

  if (state.status === "initializing") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" label="Loading session" />
      </div>
    );
  }

  if (state.status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
