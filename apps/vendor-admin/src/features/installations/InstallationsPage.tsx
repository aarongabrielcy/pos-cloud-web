import { Card, PageContainer, PageHeader } from "@pos-cloud-web/ui";

export function InstallationsPage() {
  return (
    <PageContainer>
      <PageHeader title="Installations" description="Manage deployed POS installations." />
      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          Installation management is not implemented yet - WEB-01B ships navigation and UI
          foundation only (see README#backlog).
        </p>
      </Card>
    </PageContainer>
  );
}
