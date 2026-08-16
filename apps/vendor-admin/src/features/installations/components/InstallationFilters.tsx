import { FilterBar, Input, Select } from "@pos-cloud-web/ui";
import { MIN_SEARCH_LENGTH } from "../../../shared/search-constants";

export interface InstallationFiltersProps {
  status: string;
  platform: string;
  searchInput: string;
  onStatusChange: (status: string) => void;
  onPlatformChange: (platform: string) => void;
  onSearchInputChange: (value: string) => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DECOMMISSIONED", label: "Decommissioned" },
] as const;

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  { value: "WINDOWS", label: "Windows" },
  { value: "ANDROID", label: "Android" },
  { value: "IOS", label: "iOS" },
] as const;

export function InstallationFilters({
  status,
  platform,
  searchInput,
  onStatusChange,
  onPlatformChange,
  onSearchInputChange,
}: InstallationFiltersProps) {
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
        aria-label="Filter by platform"
        className="lg:w-44"
        value={platform}
        onChange={(event) => onPlatformChange(event.target.value)}
      >
        {PLATFORM_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <div className="flex flex-col gap-1 lg:flex-1">
        <Input
          aria-label="Search installations"
          placeholder="Search by code or name"
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
