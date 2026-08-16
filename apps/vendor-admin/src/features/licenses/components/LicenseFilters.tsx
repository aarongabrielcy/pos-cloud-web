import { FilterBar, Input, Select } from "@pos-cloud-web/ui";
import { MIN_SEARCH_LENGTH } from "../../../shared/search-constants";

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
  const showHelper = searchInput.length > 0 && searchInput.length < MIN_SEARCH_LENGTH;

  return (
    <FilterBar>
      <Select
        aria-label="Filter by status"
        className="lg:w-44"
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
        className="lg:w-44"
        value={edition}
        onChange={(event) => onEditionChange(event.target.value)}
      >
        {EDITION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <div className="flex flex-col gap-1 lg:flex-1">
        <Input
          aria-label="Search licenses"
          placeholder="Search by license number"
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
        />
        {showHelper ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            Type at least {MIN_SEARCH_LENGTH} characters to search
          </p>
        ) : null}
      </div>
    </FilterBar>
  );
}
