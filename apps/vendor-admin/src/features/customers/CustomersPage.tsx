import { Card } from "@pos-cloud-web/ui";

export function CustomersPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">Customers</h1>
      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          Customer management is not implemented yet - WEB-01A ships foundation and Auth only.
        </p>
      </Card>
    </div>
  );
}
