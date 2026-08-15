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
import { LicenseFilters } from "../components/LicenseFilters";
import { LicenseStatusBadge } from "../components/LicenseStatusBadge";
import { CreateLicenseDialog } from "../components/CreateLicenseDialog";
import { useLicenses } from "../hooks/use-licenses";
import type { License } from "../api/licenses-api";
import { isLicenseEdition, isLicenseStatus, licenseEditionLabel } from "../license-status";

const FILTER_KEYS = ["status", "edition", "search", "customerId"] as const;
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function formatDate(value: string): string {
  return DATE_FORMAT.format(new Date(value));
}

const COLUMNS: DataTableColumn<License>[] = [
  {
    key: "licenseNumber",
    header: "License number",
    render: (license) => (
      <Link
        to={`/app/licenses/${license.id}`}
        className="font-medium text-brand-700 hover:underline"
      >
        {license.licenseNumber}
      </Link>
    ),
  },
  {
    key: "customerId",
    header: "Customer",
    // The list response only includes customerId, never a denormalized customer name/code (see
    // final report §M) - linking straight to the customer's own detail page lets an admin resolve
    // identity in one click without an N+1 fetch per row.
    render: (license) => (
      <Link
        to={`/app/customers/${license.customerId}`}
        className="font-mono text-xs text-brand-700 hover:underline"
      >
        {license.customerId}
      </Link>
    ),
  },
  { key: "edition", header: "Edition", render: (license) => licenseEditionLabel(license.edition) },
  {
    key: "status",
    header: "Status",
    render: (license) => <LicenseStatusBadge status={license.status} />,
  },
  {
    key: "validUntil",
    header: "Valid until",
    render: (license) => (license.validUntil ? formatDate(license.validUntil) : "—"),
  },
  {
    key: "maxInstallations",
    header: "Max installations",
    align: "right",
    render: (license) => String(license.maxInstallations),
  },
  { key: "createdAt", header: "Created", render: (license) => formatDate(license.createdAt) },
];

export function LicensesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSION_CODES.LICENSES_CREATE);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const { page, pageSize, filters, setFilter, setPage, clearFilters } = useListQueryParams({
    filterKeys: FILTER_KEYS,
  });
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    // Guard against firing on mount (and after the URL catches up to a prior debounce) - same
    // pattern CustomersPage established, avoids silently bouncing a deep link like `?page=3` to 1.
    if (debouncedSearch === (filters.search ?? "")) return;
    setFilter("search", debouncedSearch);
  }, [debouncedSearch, filters.search, setFilter]);

  const statusFilter =
    filters.status && isLicenseStatus(filters.status) ? filters.status : undefined;
  const editionFilter =
    filters.edition && isLicenseEdition(filters.edition) ? filters.edition : undefined;
  const query = useLicenses({
    page,
    pageSize,
    status: statusFilter,
    edition: editionFilter,
    search: filters.search || undefined,
    customerId: filters.customerId || undefined,
  });

  const hasActiveFilters = Boolean(
    filters.status || filters.edition || filters.search || filters.customerId,
  );

  // clearFilters() alone only clears the URL - searchInput is local component state, so without
  // resetting it too, the debounce-sync effect above would see a stale non-empty searchInput on the
  // next tick and immediately write `search` right back into the URL, defeating "Clear filters".
  function handleClearFilters() {
    setSearchInput("");
    clearFilters();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Licenses"
        description="Manage customer licenses and their status."
        actions={
          canCreate ? <Button onClick={() => setCreateOpen(true)}>New License</Button> : null
        }
      />

      <LicenseFilters
        status={filters.status ?? ""}
        edition={filters.edition ?? ""}
        searchInput={searchInput}
        onStatusChange={(value) => setFilter("status", value)}
        onEditionChange={(value) => setFilter("edition", value)}
        onSearchInputChange={setSearchInput}
      />

      {query.isError ? (
        <Alert variant="danger">{apiErrorMessage(query.error)}</Alert>
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            rows={query.data?.items ?? []}
            rowKey={(license) => license.id}
            isLoading={query.isLoading}
            emptyState={
              hasActiveFilters ? (
                <EmptyState
                  title="No licenses match your filters"
                  description="Try a different search term, status, or edition."
                  action={
                    <Button variant="secondary" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  title="No licenses yet"
                  description="Licenses you create will appear here."
                  action={
                    canCreate ? (
                      <Button onClick={() => setCreateOpen(true)}>Create license</Button>
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

      <CreateLicenseDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </PageContainer>
  );
}
