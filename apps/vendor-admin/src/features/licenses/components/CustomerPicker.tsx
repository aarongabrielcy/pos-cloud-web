import { useState } from "react";
import { FormField, Input, Select } from "@pos-cloud-web/ui";
import { useCustomers } from "../../customers/hooks/use-customers";
import type { Customer } from "../../customers/api/customers-api";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { apiErrorMessage } from "../../../shared/api/api-error-display";

export interface CustomerPickerProps {
  value: string;
  onChange: (customerId: string) => void;
  error?: string;
}

const PAGE_SIZE = 20;

/**
 * Reuses the real Customers feature's own list API/hook (never a second GET /customers
 * implementation - WEB-01D design brief §14) via a debounced search box driving a native <select>.
 * Bounded pageSize keeps this a real, scalable server-search picker rather than an N+1 per-row fetch
 * or a "load everything" dump. Only ACTIVE customers are offered: the backend rejects license
 * creation for a non-ACTIVE customer with 409 CUSTOMER_NOT_ELIGIBLE_FOR_LICENSE, so surfacing only
 * eligible customers here is applying a confirmed backend rule, not inventing new behavior.
 *
 * A native <select> keeps this fully keyboard-accessible without a bespoke combobox widget (no UI
 * framework exists for that yet, and building one is out of scope here). The currently selected
 * customer is always kept in the options list even if a later search narrows it out of the visible
 * results, so the select's value never goes stale/invalid mid-selection.
 */
export function CustomerPicker({ value, onChange, error }: CustomerPickerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const query = useCustomers({
    page: 1,
    pageSize: PAGE_SIZE,
    status: "ACTIVE",
    search: debouncedSearch || undefined,
  });

  const results = query.data?.items ?? [];
  const options =
    selected && !results.some((customer) => customer.id === selected.id)
      ? [selected, ...results]
      : results;

  function handleSelectChange(nextId: string) {
    const customer = options.find((option) => option.id === nextId) ?? null;
    setSelected(customer);
    onChange(nextId);
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField
        label="Search customer"
        hint="Only active customers are eligible for a new license."
      >
        <Input
          placeholder="Search by code or name"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </FormField>
      <FormField label="Customer" error={error}>
        <Select value={value} onChange={(event) => handleSelectChange(event.target.value)}>
          <option value="">{query.isLoading ? "Loading customers…" : "Choose a customer"}</option>
          {options.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.code} — {customer.legalName}
            </option>
          ))}
        </Select>
      </FormField>
      {query.isError ? (
        <p className="text-xs text-[var(--color-danger)]">{apiErrorMessage(query.error)}</p>
      ) : null}
    </div>
  );
}
