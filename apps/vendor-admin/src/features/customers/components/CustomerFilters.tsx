import { FilterBar, Input, Select } from "@pos-cloud-web/ui";

export interface CustomerFiltersProps {
  status: string;
  searchInput: string;
  onStatusChange: (status: string) => void;
  onSearchInputChange: (value: string) => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "INACTIVE", label: "Inactive" },
] as const;

export function CustomerFilters({
  status,
  searchInput,
  onStatusChange,
  onSearchInputChange,
}: CustomerFiltersProps) {
  return (
    <FilterBar>
      <Select
        aria-label="Filter by status"
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input
        aria-label="Search customers"
        placeholder="Search by code or name"
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
      />
    </FilterBar>
  );
}
