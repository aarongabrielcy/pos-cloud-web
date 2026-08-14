import { Navigate } from "react-router-dom";
import { useAuth } from "@pos-cloud-web/auth";
import { Card, Spinner } from "@pos-cloud-web/ui";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  const { state } = useAuth();

  if (state.status === "initializing") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" label="Loading session" />
      </div>
    );
  }

  if (state.status === "authenticated") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--color-surface-muted)] px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-[var(--color-text)]">Vendor Admin</h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Sign in to POS Cloud Control Plane
        </p>
        <LoginForm />
      </Card>
    </div>
  );
}
