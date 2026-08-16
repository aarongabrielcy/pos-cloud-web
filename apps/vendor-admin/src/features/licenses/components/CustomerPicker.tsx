import { useState } from "react";
import { Combobox, type ComboboxOption } from "@pos-cloud-web/ui";
import { useCustomers } from "../../customers/hooks/use-customers";
import type { Customer } from "../../customers/api/customers-api";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { apiErrorMessage } from "../../../shared/api/api-error-display";
import { customerDisplayLabel } from "../../../shared/display/customer-display";
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "../../../shared/search-constants";

export interface CustomerPickerProps {
  value: string;
  onChange: (customerId: string) => void;
  error?: string;
}

const PAGE_SIZE = 20;

/**
 * A real remote-searchable combobox (WEB-01E UX correction brief §11/§12) - replaces the previous
 * "search input + separate native select" pattern, which took two distinct interactions to pick a
 * customer even though the backend search itself always worked correctly. Reuses the real Customers
 * feature's own list API/hook (never a second GET /customers implementation). Only ACTIVE customers
 * are offered - the backend rejects license/installation creation for a non-ACTIVE customer, so this
 * reflects a confirmed backend rule, not invented behavior.
 *
 * There is exactly ONE CustomerPicker implementation, reused as-is by both CreateLicenseDialog and
 * CreateInstallationDialog (§13) - the search/minimum-length/debounce logic lives here once.
 *
 * `selectedCustomer` (this component's own local state, not derivable from `value` alone - `value`
 * is just the plain customerId the parent form tracks) is what lets the combobox render a real human
 * label for the current selection. Radix Dialog unmounts its children on close (established
 * WEB-01C/WEB-01D precedent), so this local state - and `value` upstream via the parent's own
 * `reset()` - both naturally start fresh every time a Create dialog reopens; there is currently no
 * flow in this app that hands CustomerPicker a pre-filled `value` without having just set it itself.
 */
// `value` (the plain customerId) intentionally isn't read here - see the class doc comment above for
// why this component's own `selectedCustomer` state is the real source of the rendered label.
export function CustomerPicker({ onChange, error }: CustomerPickerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const searchReady = debouncedSearch.length >= MIN_SEARCH_LENGTH;

  const query = useCustomers(
    { page: 1, pageSize: PAGE_SIZE, status: "ACTIVE", search: debouncedSearch },
    { enabled: searchReady },
  );

  const results = query.data?.items ?? [];
  const options: ComboboxOption[] = results.map((customer) => ({
    id: customer.id,
    label: customerDisplayLabel(customer),
  }));

  function handleSelect(option: ComboboxOption | null) {
    if (!option) {
      setSelectedCustomer(null);
      setSearchInput("");
      onChange("");
      return;
    }
    const customer = results.find((candidate) => candidate.id === option.id) ?? null;
    setSelectedCustomer(customer);
    onChange(option.id);
  }

  return (
    <Combobox
      label="Customer"
      placeholder="Search customer by code or name…"
      searchValue={searchInput}
      onSearchValueChange={setSearchInput}
      options={options}
      selected={
        // Deliberately never falls back to rendering the raw `value` (a UUID) as a label - §4/§37
        // forbid a raw id as the visible label under any circumstance, including this one.
        selectedCustomer
          ? { id: selectedCustomer.id, label: customerDisplayLabel(selectedCustomer) }
          : null
      }
      onSelect={handleSelect}
      isLoading={searchReady && query.isLoading}
      error={error}
      queryError={query.isError ? apiErrorMessage(query.error) : undefined}
      helperText={!searchReady ? `Type at least ${MIN_SEARCH_LENGTH} characters` : undefined}
      emptyMessage="No matching customers"
    />
  );
}
