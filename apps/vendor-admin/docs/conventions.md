# Vendor Admin conventions (WEB-01B)

Established here so WEB-01C+ business features are assembly against these patterns, not new
invention each time. See the WEB-01B design report for the reasoning behind each decision; this
file is the quick-reference for actually building a screen.

## Page layout

Every screen under `/app/*` follows the same skeleton:

```tsx
<PageContainer>
  <PageHeader
    title="Customers"
    description="Manage vendor customer accounts."
    actions={<Button>New Customer</Button>}
  />
  {/* FilterBar, DataTable, Pagination, etc. */}
</PageContainer>
```

- `PageContainer` (`@pos-cloud-web/ui`) owns the page's padding - never hand-roll `px-6 py-6` on a
  page root.
- `PageHeader` owns the title/description/primary-action row.
- **Breadcrumbs render only in `Topbar`** (via `useMatches()` reading each route's `handle.crumb` -
  see `app/router/route-handle.ts`) - never inside `PageContainer`/`PageHeader`. Add a crumb to a
  new route by giving it `handle: { crumb: "..." } satisfies RouteHandle` in `router.tsx`.

## List screens (table + filters + pagination)

```tsx
const FILTER_KEYS = ["status", "search"] as const; // module-level constant - see useListQueryParams

function CustomersListPage() {
  const { page, pageSize, filters, setFilter, setPage } = useListQueryParams({
    filterKeys: FILTER_KEYS,
  });
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  useEffect(() => setFilter("search", debouncedSearch), [debouncedSearch]);

  const query = useQuery({
    queryKey: ["customers", page, pageSize, filters],
    queryFn: () => apiClient.request(`/api/v1/control-plane/customers?...`),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        actions={<Button onClick={openCreateDialog}>New Customer</Button>}
      />
      <FilterBar>
        <Select value={filters.status ?? ""} onChange={(e) => setFilter("status", e.target.value)}>
          ...
        </Select>
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search"
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={query.isLoading}
        emptyState={
          <EmptyState
            title="No customers yet"
            action={<Button onClick={openCreateDialog}>Create one</Button>}
          />
        }
      />
      {query.data ? <Pagination {...query.data} onPageChange={setPage} /> : null}
    </PageContainer>
  );
}
```

Rules:

- **List state (page/pageSize/filters) lives in the URL** via `useListQueryParams`
  (`apps/vendor-admin/src/shared/hooks`) - never local `useState` for these. Setting any filter
  resets `page` to 1 automatically.
- Free-text filters debounce (`useDebouncedValue`, 300ms) before hitting `setFilter` - enum
  `<Select>` filters update immediately, no debounce.
- `DataTable` has no built-in sort - every list endpoint today is server-paginated with no
  `sortBy` param, so there is nothing to wire a sort control to yet.
- Status columns render via a **feature-local** `xStatusVariant(status)` helper mapping the
  domain enum to a `StatusBadgeVariant` (`"success" | "warning" | "danger" | "neutral" | "info"`) -
  `@pos-cloud-web/ui`'s `StatusBadge` itself knows nothing about `ACTIVE`/`SUSPENDED`/etc. Keep this
  helper next to the table/columns definition, not in a shared location, until a second feature
  module actually needs the same mapping.

## Forms and confirmations

- Create/edit forms: `Dialog` (`@pos-cloud-web/ui`, built on `@radix-ui/react-dialog`) +
  `react-hook-form` + `zodResolver` - the exact pattern `LoginForm` established in WEB-01A. States:
  `idle → submitting → error`, submit button `isLoading`, failure renders `Alert variant="danger"`
  inside the dialog (never a toast - no toast library in this workspace).
- Destructive/state-changing single actions (status changes, deletes): `ConfirmDialog`
  (`@pos-cloud-web/ui`) - it owns its own submitting/error state via `onConfirm: () => Promise<void>`;
  a rejected promise shows its message via `Alert` and keeps the dialog open, a resolved one closes
  it. Never build a bespoke confirm modal.

## Errors

- Every `ApiError` (`@pos-cloud-web/api-client`) surfaces as `Alert variant="danger"` with
  `error.message` - list/detail fetch failures render it in place of the table/content, form/dialog
  failures render it inside the dialog. No separate error-boundary UI is introduced for this.
- TanStack Query defaults (`app/providers/query-client.ts`) already skip retrying 401/403 - a
  permission error is a real answer, not a transient failure worth retrying.

## Loading / empty states

- `DataTable`'s `isLoading` renders `Skeleton` rows in place (no full-page spinner swap - avoids
  layout jump).
- Zero results renders `DataTable`'s `emptyState` prop (an `EmptyState`), not a bare "No data" table
  row.

## Non-goals for WEB-01B

No business API calls, no real tables/mutations, no fake data - the patterns above are illustrative
of _how_ WEB-01C will assemble a screen, not a working Customers page yet.
