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
import { CustomerFilters } from "../components/CustomerFilters";
import { CustomerStatusBadge } from "../components/CustomerStatusBadge";
import { CreateCustomerDialog } from "../components/CreateCustomerDialog";
import { useCustomers } from "../hooks/use-customers";
import type { Customer } from "../api/customers-api";
import { isCustomerStatus } from "../customer-status";

const FILTER_KEYS = ["status", "search"] as const;
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function formatDate(value: string): string {
  return DATE_FORMAT.format(new Date(value));
}

const COLUMNS: DataTableColumn<Customer>[] = [
  {
    key: "code",
    header: "Code",
    render: (customer) => (
      <Link
        to={`/app/customers/${customer.id}`}
        className="font-medium text-brand-700 hover:underline"
      >
        {customer.code}
      </Link>
    ),
  },
  { key: "legalName", header: "Legal name", render: (customer) => customer.legalName },
  { key: "tradeName", header: "Trade name", render: (customer) => customer.tradeName ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (customer) => <CustomerStatusBadge status={customer.status} />,
  },
  { key: "createdAt", header: "Created", render: (customer) => formatDate(customer.createdAt) },
];

export function CustomersPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSION_CODES.CUSTOMERS_CREATE);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const { page, pageSize, filters, setFilter, setPage, clearFilters } = useListQueryParams({
    filterKeys: FILTER_KEYS,
  });
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    // Guard against firing on mount (and after the URL catches up to a prior debounce) - without
    // this, an unconditional setFilter call would delete `page` on every mount (setFilter's
    // contract always resets page to 1), silently bouncing a deep link like `?page=3` back to 1.
    if (debouncedSearch === (filters.search ?? "")) return;
    setFilter("search", debouncedSearch);
  }, [debouncedSearch, filters.search, setFilter]);

  const statusFilter =
    filters.status && isCustomerStatus(filters.status) ? filters.status : undefined;
  const query = useCustomers({
    page,
    pageSize,
    status: statusFilter,
    search: filters.search || undefined,
  });

  const hasActiveFilters = Boolean(filters.status || filters.search);

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
        title="Customers"
        description="Manage vendor customer accounts, their status, and lifecycle."
        actions={
          canCreate ? <Button onClick={() => setCreateOpen(true)}>New Customer</Button> : null
        }
      />

      <CustomerFilters
        status={filters.status ?? ""}
        searchInput={searchInput}
        onStatusChange={(value) => setFilter("status", value)}
        onSearchInputChange={setSearchInput}
      />

      {query.isError ? (
        <Alert variant="danger">{apiErrorMessage(query.error)}</Alert>
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            rows={query.data?.items ?? []}
            rowKey={(customer) => customer.id}
            isLoading={query.isLoading}
            emptyState={
              hasActiveFilters ? (
                <EmptyState
                  title="No customers match your filters"
                  description="Try a different search term or status."
                  action={
                    <Button variant="secondary" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  title="No customers yet"
                  description="Customers you create will appear here."
                  action={
                    canCreate ? (
                      <Button onClick={() => setCreateOpen(true)}>Create customer</Button>
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

      <CreateCustomerDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </PageContainer>
  );
}
