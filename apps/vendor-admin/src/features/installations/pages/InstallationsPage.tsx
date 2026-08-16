import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  DataTable,
  EmptyState,
  PageContainer,
  PageHeader,
  Pagination,
  type DataTableColumn,
} from "@pos-cloud-web/ui";
import { PERMISSION_CODES, useAuth } from "@pos-cloud-web/auth";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { useListQueryParams } from "../../../shared/hooks/useListQueryParams";
import { apiErrorMessage } from "../../../shared/api/api-error-display";
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "../../../shared/search-constants";
import { customerDisplayLabel } from "../../../shared/display/customer-display";
import { licenseDisplayLabel } from "../../../shared/display/license-display";
import { InstallationFilters } from "../components/InstallationFilters";
import { InstallationStatusBadge } from "../components/InstallationStatusBadge";
import { InstallationHealthBadge } from "../components/InstallationHealthBadge";
import { CreateInstallationDialog } from "../components/CreateInstallationDialog";
import { useInstallations } from "../hooks/use-installations";
import type { InstallationListItem } from "../api/installations-api";
import {
  installationPlatformLabel,
  isInstallationPlatform,
  isInstallationStatus,
} from "../installation-status";

const FILTER_KEYS = ["status", "platform", "search", "customerId", "licenseId"] as const;
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string): string {
  return DATE_FORMAT.format(new Date(value));
}

const COLUMNS: DataTableColumn<InstallationListItem>[] = [
  {
    key: "installationCode",
    header: "Installation code",
    render: (installation) => (
      <Link
        to={`/app/installations/${installation.id}`}
        className="font-medium text-brand-700 hover:underline"
      >
        {installation.installationCode}
      </Link>
    ),
  },
  { key: "name", header: "Name", render: (installation) => installation.name },
  {
    key: "customerId",
    header: "Customer",
    // The list response now includes a batched, N+1-safe customer summary alongside customerId
    // (pos-cloud relation-summary hardening) - render the human identity, never the raw UUID
    // (WEB-01E brief §4), while still linking to the customer's own detail page by id.
    render: (installation) => (
      <Link
        to={`/app/customers/${installation.customerId}`}
        className="text-brand-700 hover:underline"
      >
        {customerDisplayLabel(installation.customer)}
      </Link>
    ),
  },
  {
    key: "licenseId",
    header: "License",
    render: (installation) => (
      <Link
        to={`/app/licenses/${installation.licenseId}`}
        className="text-brand-700 hover:underline"
      >
        {licenseDisplayLabel(installation.license)}
      </Link>
    ),
  },
  {
    key: "platform",
    header: "Platform",
    render: (installation) => installationPlatformLabel(installation.platform),
  },
  {
    key: "status",
    header: "Status",
    render: (installation) => <InstallationStatusBadge status={installation.status} />,
  },
  {
    key: "health",
    header: "Health",
    // The list response already includes healthStatus/lastSeenAt directly per item - no per-row
    // health fetch (WEB-01E brief §21, no N+1).
    render: (installation) => <InstallationHealthBadge status={installation.healthStatus} />,
  },
  {
    key: "lastSeenAt",
    header: "Last seen",
    render: (installation) =>
      installation.lastSeenAt ? DATE_TIME_FORMAT.format(new Date(installation.lastSeenAt)) : "—",
  },
  {
    key: "registeredAt",
    header: "Registered",
    // Sourced strictly from registeredAt (WEB-01E brief §9) - never inferred from status,
    // healthStatus, or lastSeenAt, all of which can be present/absent independently of enrollment.
    render: (installation) =>
      installation.registeredAt
        ? DATE_TIME_FORMAT.format(new Date(installation.registeredAt))
        : "Not yet registered",
  },
  {
    key: "createdAt",
    header: "Created",
    render: (installation) => formatDate(installation.createdAt),
  },
];

export function InstallationsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSION_CODES.INSTALLATIONS_CREATE);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const { page, pageSize, filters, setFilter, setPage, clearFilters } = useListQueryParams({
    filterKeys: FILTER_KEYS,
  });
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  // Below the minimum, treat the debounced value as empty - same rule CustomersPage established.
  const effectiveSearch = debouncedSearch.length >= MIN_SEARCH_LENGTH ? debouncedSearch : "";

  useEffect(() => {
    if (effectiveSearch === (filters.search ?? "")) return;
    setFilter("search", effectiveSearch);
  }, [effectiveSearch, filters.search, setFilter]);

  const statusFilter =
    filters.status && isInstallationStatus(filters.status) ? filters.status : undefined;
  const platformFilter =
    filters.platform && isInstallationPlatform(filters.platform) ? filters.platform : undefined;
  const query = useInstallations({
    page,
    pageSize,
    status: statusFilter,
    platform: platformFilter,
    search: filters.search || undefined,
    customerId: filters.customerId || undefined,
    licenseId: filters.licenseId || undefined,
  });

  const hasActiveFilters = Boolean(
    filters.status || filters.platform || filters.search || filters.customerId || filters.licenseId,
  );

  function handleClearFilters() {
    setSearchInput("");
    clearFilters();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Installations"
        description="Manage deployed POS installations, their credentials, and health."
        actions={
          canCreate ? <Button onClick={() => setCreateOpen(true)}>New Installation</Button> : null
        }
      />

      <InstallationFilters
        status={filters.status ?? ""}
        platform={filters.platform ?? ""}
        searchInput={searchInput}
        onStatusChange={(value) => setFilter("status", value)}
        onPlatformChange={(value) => setFilter("platform", value)}
        onSearchInputChange={setSearchInput}
      />

      {query.isError ? (
        <Alert variant="danger">{apiErrorMessage(query.error)}</Alert>
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            rows={query.data?.items ?? []}
            rowKey={(installation) => installation.id}
            isLoading={query.isLoading}
            emptyState={
              hasActiveFilters ? (
                <EmptyState
                  title="No installations match your filters"
                  description="Try a different search term, status, or platform."
                  action={
                    <Button variant="secondary" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  title="No installations yet"
                  description="Installations you create will appear here."
                  action={
                    canCreate ? (
                      <Button onClick={() => setCreateOpen(true)}>Create installation</Button>
                    ) : undefined
                  }
                />
              )
            }
          />
          {query.data ? (
            <Pagination
              page={query.data.page}
              pageSize={query.data.pageSize}
              total={query.data.total}
              totalPages={query.data.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <CreateInstallationDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </PageContainer>
  );
}
