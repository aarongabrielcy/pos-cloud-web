import { Alert } from "@pos-cloud-web/ui";

export function NotAuthorizedPage() {
  return (
    <div className="p-6">
      <Alert variant="danger">
        You don&apos;t have permission to view this page. Contact an administrator if you believe
        this is a mistake.
      </Alert>
    </div>
  );
}
