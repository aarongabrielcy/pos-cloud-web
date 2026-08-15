import { Card, PageContainer, PageHeader } from "@pos-cloud-web/ui";

export function CustomersPage() {
  return (
    <PageContainer>
      <PageHeader title="Customers" description="Manage vendor customer accounts." />
      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          Customer management is not implemented yet - WEB-01B ships navigation and UI foundation
          only (see README#backlog).
        </p>
      </Card>
    </PageContainer>
  );
}
