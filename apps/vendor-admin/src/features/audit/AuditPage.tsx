import { Card, PageContainer, PageHeader } from "@pos-cloud-web/ui";

export function AuditPage() {
  return (
    <PageContainer>
      <PageHeader title="Audit" description="Review administrative and system audit events." />
      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          Audit log viewing is not implemented yet - WEB-01B ships navigation and UI foundation only
          (see README#backlog).
        </p>
      </Card>
    </PageContainer>
  );
}
