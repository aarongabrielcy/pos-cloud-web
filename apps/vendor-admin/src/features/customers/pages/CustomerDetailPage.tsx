import { useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError } from "@pos-cloud-web/api-client";
import { Alert, Button, Card, PageContainer, PageHeader } from "@pos-cloud-web/ui";
import { PERMISSION_CODES, useAuth } from "@pos-cloud-web/auth";
import { useDynamicCrumb } from "../../../app/layouts/use-breadcrumb";
import { apiErrorMessage } from "../../../shared/api/api-error-display";
import { BackLink } from "../../../shared/components/BackLink";
import { useCustomer } from "../hooks/use-customer";
import { CustomerStatusBadge } from "../components/CustomerStatusBadge";
import { ChangeCustomerStatusDialog } from "../components/ChangeCustomerStatusDialog";
import { customerStatusActions, type CustomerStatusAction } from "../customer-status";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string): string {
  return DATE_TIME_FORMAT.format(new Date(value));
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canChangeStatus = hasPermission(PERMISSION_CODES.CUSTOMERS_STATUS_CHANGE);
  const [pendingAction, setPendingAction] = useState<CustomerStatusAction | null>(null);

  const query = useCustomer(id ?? "");
  useDynamicCrumb(query.data?.code);

  if (query.isLoading) {
    return (
      <PageContainer>
        <BackLink to="/app/customers" label="Back to Customers" />
        <PageHeader title="Customer" />
        <Card>
          <p className="text-sm text-[var(--color-text-muted)]">Loading customer…</p>
        </Card>
      </PageContainer>
    );
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.statusCode === 404) {
      return (
        <PageContainer>
          <BackLink to="/app/customers" label="Back to Customers" />
          <PageHeader title="Customer not found" />
          <Card>
            <p className="text-sm text-[var(--color-text-muted)]">
              This customer doesn&apos;t exist or may have been removed.
            </p>
          </Card>
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <BackLink to="/app/customers" label="Back to Customers" />
        <PageHeader title="Customer" />
        <Alert variant="danger">{apiErrorMessage(query.error)}</Alert>
      </PageContainer>
    );
  }

  const customer = query.data;
  if (!customer) {
    return null;
  }
  const actions = customerStatusActions(customer.status);

  return (
    <PageContainer>
      <BackLink to="/app/customers" label="Back to Customers" />
      <PageHeader
        title={customer.legalName}
        description={customer.code}
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
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Code</dt>
            <dd className="text-sm text-[var(--color-text)]">{customer.code}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Status</dt>
            <dd>
              <CustomerStatusBadge status={customer.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Legal name</dt>
            <dd className="text-sm text-[var(--color-text)]">{customer.legalName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Trade name</dt>
            <dd className="text-sm text-[var(--color-text)]">{customer.tradeName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Created</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {formatDateTime(customer.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">Updated</dt>
            <dd className="text-sm text-[var(--color-text)]">
              {formatDateTime(customer.updatedAt)}
            </dd>
          </div>
        </dl>
      </Card>

      <ChangeCustomerStatusDialog
        customerId={customer.id}
        action={pendingAction}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      />
    </PageContainer>
  );
}
