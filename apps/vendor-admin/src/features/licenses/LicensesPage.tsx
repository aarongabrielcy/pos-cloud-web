import { Card, PageContainer, PageHeader } from "@pos-cloud-web/ui";

export function LicensesPage() {
  return (
    <PageContainer>
      <PageHeader title="Licenses" description="Manage customer licenses and entitlements." />
      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          License management is not implemented yet - WEB-01B ships navigation and UI foundation
          only (see README#backlog).
        </p>
      </Card>
    </PageContainer>
  );
}
