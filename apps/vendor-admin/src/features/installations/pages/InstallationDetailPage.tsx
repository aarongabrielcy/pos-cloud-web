import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@pos-cloud-web/api-client";
import { Alert, Button, Card, PageContainer, PageHeader, Skeleton } from "@pos-cloud-web/ui";
import { PERMISSION_CODES, useAuth } from "@pos-cloud-web/auth";
import { useDynamicCrumb } from "../../../app/layouts/use-breadcrumb";
import { apiErrorMessage } from "../../../shared/api/api-error-display";
import { customerDisplayLabel } from "../../../shared/display/customer-display";
import { licenseDisplayLabel } from "../../../shared/display/license-display";
import { BackLink } from "../../../shared/components/BackLink";
import { useInstallation } from "../hooks/use-installation";
import { useInstallationHealth } from "../hooks/use-installation-health";
import { useIssueInitialEnrollment } from "../hooks/use-issue-initial-enrollment";
import { useIssueRecoveryEnrollment } from "../hooks/use-issue-recovery-enrollment";
import { InstallationStatusBadge } from "../components/InstallationStatusBadge";
import { InstallationHealthBadge } from "../components/InstallationHealthBadge";
import { ChangeInstallationStatusDialog } from "../components/ChangeInstallationStatusDialog";
import { EnrollmentCodeDialog } from "../components/EnrollmentCodeDialog";
import { RevokeCredentialDialog } from "../components/RevokeCredentialDialog";
import {
  installationPlatformLabel,
  installationStatusActions,
  type InstallationStatusAction,
} from "../installation-status";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string): string {
  return DATE_TIME_FORMAT.format(new Date(value));
}

export function InstallationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const installationId = id ?? "";
  const { hasPermission } = useAuth();
  const canChangeStatus = hasPermission(PERMISSION_CODES.INSTALLATIONS_STATUS_CHANGE);
  const canManageEnrollment = hasPermission(PERMISSION_CODES.INSTALLATIONS_ENROLLMENT_MANAGE);
  const canManageCredentials = hasPermission(PERMISSION_CODES.INSTALLATIONS_CREDENTIALS_MANAGE);

  const [pendingAction, setPendingAction] = useState<InstallationStatusAction | null>(null);
  const [isEnrollOpen, setEnrollOpen] = useState(false);
  const [isRekeyOpen, setRekeyOpen] = useState(false);
  const [isRevokeOpen, setRevokeOpen] = useState(false);

  const issueInitialEnrollment = useIssueInitialEnrollment();
  const issueRecoveryEnrollment = useIssueRecoveryEnrollment();

  const query = useInstallation(installationId);
  const health = useInstallationHealth(installationId);
  useDynamicCrumb(query.data?.installationCode);

  if (query.isLoading) {
    return (
      <PageContainer>
        <BackLink to="/app/installations" label="Back to Installations" />
        <PageHeader title="Installation" />
        <Card>
          <p className="text-sm text-[var(--color-text-muted)]">Loading installation…</p>
        </Card>
      </PageContainer>
    );
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.statusCode === 404) {
      return (
        <PageContainer>
          <BackLink to="/app/installations" label="Back to Installations" />
          <PageHeader title="Installation not found" />
          <Card>
            <p className="text-sm text-[var(--color-text-muted)]">
              This installation doesn&apos;t exist or may have been removed.
            </p>
          </Card>
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <BackLink to="/app/installations" label="Back to Installations" />
        <PageHeader title="Installation" />
        <Alert variant="danger">{apiErrorMessage(query.error)}</Alert>
      </PageContainer>
    );
  }

  const installation = query.data;
  if (!installation) {
    return null;
  }
  const actions = installationStatusActions(installation.status);
  const canIssueInitialEnrollment = canManageEnrollment && installation.status === "PENDING";
  const canManageCredentialActions =
    canManageCredentials &&
    (installation.status === "ACTIVE" || installation.status === "SUSPENDED");

  return (
    <PageContainer>
      <BackLink to="/app/installations" label="Back to Installations" />
      <PageHeader
        title={installation.installationCode}
        description={installation.name}
        actions={
          canChangeStatus && actions.length > 0 ? (
            <div className="flex gap-2">
              {actions.map((action) => (
                <Button
                  key={action.targetStatus}
                  variant={action.variant === "danger" ? "danger" : "secondary"}
                  onClick={() => setPendingAction(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null
        }
      />

      <Card>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">
              Installation code
            </dt>
            <dd className="text-sm text-[var(--color-text)]">{installation.installationCode}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Status</dt>
            <dd>
              <InstallationStatusBadge status={installation.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Name</dt>
            <dd className="text-sm text-[var(--color-text)]">{installation.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Platform</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {installationPlatformLabel(installation.platform)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Customer</dt>
            <dd className="text-sm text-[var(--color-text)]">
              <Link
                to={`/app/customers/${installation.customerId}`}
                className="text-brand-700 hover:underline"
              >
                {customerDisplayLabel(installation.customer)}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">License</dt>
            <dd className="text-sm text-[var(--color-text)]">
              <Link
                to={`/app/licenses/${installation.licenseId}`}
                className="text-brand-700 hover:underline"
              >
                {licenseDisplayLabel(installation.license)}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Registered</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {installation.registeredAt
                ? formatDateTime(installation.registeredAt)
                : "Not yet registered"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Created</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {formatDateTime(installation.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Updated</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {formatDateTime(installation.updatedAt)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-text)]">Health</h2>
        {health.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : health.isError ? (
          <Alert variant="danger">{apiErrorMessage(health.error)}</Alert>
        ) : health.data ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-[var(--color-text-muted)]">Health status</dt>
              <dd>
                <InstallationHealthBadge status={health.data.healthStatus} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[var(--color-text-muted)]">Last seen</dt>
              <dd className="text-sm text-[var(--color-text)]">
                {health.data.lastSeenAt ? formatDateTime(health.data.lastSeenAt) : "Never"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[var(--color-text-muted)]">First seen</dt>
              <dd className="text-sm text-[var(--color-text)]">
                {health.data.firstSeenAt ? formatDateTime(health.data.firstSeenAt) : "Never"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[var(--color-text-muted)]">App version</dt>
              <dd className="text-sm text-[var(--color-text)]">{health.data.appVersion ?? "—"}</dd>
            </div>
          </dl>
        ) : null}
      </Card>

      {canManageEnrollment || canManageCredentials ? (
        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--color-text)]">
            Credential &amp; enrollment
          </h2>
          <div className="flex flex-wrap gap-2">
            {canIssueInitialEnrollment ? (
              <Button variant="secondary" onClick={() => setEnrollOpen(true)}>
                Issue enrollment code
              </Button>
            ) : null}
            {canManageCredentialActions ? (
              <Button variant="secondary" onClick={() => setRekeyOpen(true)}>
                Issue recovery code (rekey)
              </Button>
            ) : null}
            {canManageCredentialActions ? (
              <Button variant="danger" onClick={() => setRevokeOpen(true)}>
                Revoke credential
              </Button>
            ) : null}
            {!canIssueInitialEnrollment && !canManageCredentialActions ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No credential actions are available for this installation&apos;s current status.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      <ChangeInstallationStatusDialog
        installationId={installation.id}
        action={pendingAction}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      />

      <EnrollmentCodeDialog
        open={isEnrollOpen}
        onOpenChange={setEnrollOpen}
        installationId={installation.id}
        title="Issue enrollment code"
        warning="This issues a one-time enrollment code the POS device uses to complete its initial setup and become ACTIVE. Any previously issued, still-open enrollment code for this installation is revoked first."
        confirmLabel="Issue code"
        mutation={issueInitialEnrollment}
      />

      <EnrollmentCodeDialog
        open={isRekeyOpen}
        onOpenChange={setRekeyOpen}
        installationId={installation.id}
        title="Issue recovery code (rekey)"
        warning="This issues a one-time recovery code for a device that lost, compromised, or needs to replace its credential. The installation's current credential keeps working until this code is actually redeemed by the device - it is not revoked immediately. The device will need to re-enroll using this new code."
        confirmLabel="Issue recovery code"
        variant="danger"
        mutation={issueRecoveryEnrollment}
      />

      <RevokeCredentialDialog
        installationId={installation.id}
        open={isRevokeOpen}
        onOpenChange={setRevokeOpen}
      />
    </PageContainer>
  );
}
