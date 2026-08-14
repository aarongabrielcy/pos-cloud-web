import { Card } from "@pos-cloud-web/ui";

export function LicensesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">Licenses</h1>
      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          License management is not implemented yet - WEB-01A ships foundation and Auth only.
        </p>
      </Card>
    </div>
  );
}
