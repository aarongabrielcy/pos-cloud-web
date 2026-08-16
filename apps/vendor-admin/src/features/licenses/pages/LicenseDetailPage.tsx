import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@pos-cloud-web/api-client";
import { Alert, Button, Card, PageContainer, PageHeader, StatusBadge } from "@pos-cloud-web/ui";
import { PERMISSION_CODES, useAuth } from "@pos-cloud-web/auth";
import { useDynamicCrumb } from "../../../app/layouts/use-breadcrumb";
import { apiErrorMessage } from "../../../shared/api/api-error-display";
import { customerDisplayLabel } from "../../../shared/display/customer-display";
import { BackLink } from "../../../shared/components/BackLink";
import { useLicense } from "../hooks/use-license";
import { LicenseStatusBadge } from "../components/LicenseStatusBadge";
import { ChangeLicenseStatusDialog } from "../components/ChangeLicenseStatusDialog";
import {
  licenseStatusActions,
  licenseEditionLabel,
  type LicenseStatusAction,
} from "../license-status";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function formatDateTime(value: string): string {
  return DATE_TIME_FORMAT.format(new Date(value));
}

function formatDate(value: string): string {
  return DATE_FORMAT.format(new Date(value));
}

export function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canChangeStatus = hasPermission(PERMISSION_CODES.LICENSES_STATUS_CHANGE);
  const [pendingAction, setPendingAction] = useState<LicenseStatusAction | null>(null);

  const query = useLicense(id ?? "");
  useDynamicCrumb(query.data?.licenseNumber);

  if (query.isLoading) {
    return (
      <PageContainer>
        <BackLink to="/app/licenses" label="Back to Licenses" />
        <PageHeader title="License" />
        <Card>
          <p className="text-sm text-[var(--color-text-muted)]">Loading license…</p>
        </Card>
      </PageContainer>
    );
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.statusCode === 404) {
      return (
        <PageContainer>
          <BackLink to="/app/licenses" label="Back to Licenses" />
          <PageHeader title="License not found" />
          <Card>
            <p className="text-sm text-[var(--color-text-muted)]">
              This license doesn&apos;t exist or may have been removed.
            </p>
          </Card>
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <BackLink to="/app/licenses" label="Back to Licenses" />
        <PageHeader title="License" />
        <Alert variant="danger">{apiErrorMessage(query.error)}</Alert>
      </PageContainer>
    );
  }

  const license = query.data;
  if (!license) {
    return null;
  }
  const actions = licenseStatusActions(license.status);
  const entitlements = license.entitlements ?? [];

  return (
    <PageContainer>
      <BackLink to="/app/licenses" label="Back to Licenses" />
      <PageHeader
        title={license.licenseNumber}
        description={licenseEditionLabel(license.edition)}
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
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">License number</dt>
            <dd className="text-sm text-[var(--color-text)]">{license.licenseNumber}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Status</dt>
            <dd>
              <LicenseStatusBadge status={license.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Customer</dt>
            <dd className="text-sm text-[var(--color-text)]">
              <Link
                to={`/app/customers/${license.customerId}`}
                className="text-brand-700 hover:underline"
              >
                {customerDisplayLabel(license.customer)}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Edition</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {licenseEditionLabel(license.edition)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">License model</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {license.licenseModel === "PERPETUAL" ? "Perpetual" : "Subscription"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">
              Max installations
            </dt>
            <dd className="text-sm text-[var(--color-text)]">{license.maxInstallations}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Valid from</dt>
            <dd className="text-sm text-[var(--color-text)]">{formatDate(license.validFrom)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Valid until</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {license.validUntil ? formatDate(license.validUntil) : "Perpetual — no expiry"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Created</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {formatDateTime(license.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Updated</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {formatDateTime(license.updatedAt)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-text)]">Entitlements</h2>
        {entitlements.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No entitlements configured.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entitlements.map((entitlement) => (
              <li key={entitlement.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[var(--color-text)]">{entitlement.code}</span>
                <StatusBadge variant={entitlement.enabled ? "success" : "neutral"}>
                  {entitlement.enabled ? "Enabled" : "Disabled"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ChangeLicenseStatusDialog
        licenseId={license.id}
        action={pendingAction}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      />
    </PageContainer>
  );
}
