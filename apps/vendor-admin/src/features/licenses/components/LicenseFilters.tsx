import { FilterBar, Input, Select } from "@pos-cloud-web/ui";

export interface LicenseFiltersProps {
  status: string;
  edition: string;
  searchInput: string;
  onStatusChange: (status: string) => void;
  onEditionChange: (edition: string) => void;
  onSearchInputChange: (value: string) => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
] as const;

const EDITION_OPTIONS = [
  { value: "", label: "All editions" },
  { value: "BASIC", label: "Basic" },
  { value: "PREMIUM", label: "Premium" },
] as const;

export function LicenseFilters({
  status,
  edition,
  searchInput,
  onStatusChange,
  onEditionChange,
  onSearchInputChange,
}: LicenseFiltersProps) {
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
      <Select
        aria-label="Filter by edition"
        value={edition}
        onChange={(event) => onEditionChange(event.target.value)}
      >
        {EDITION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input
        aria-label="Search licenses"
        placeholder="Search by license number"
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
      />
    </FilterBar>
  );
}
