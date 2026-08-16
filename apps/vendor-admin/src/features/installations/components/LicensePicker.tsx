import { useState } from "react";
import { Combobox, type ComboboxOption } from "@pos-cloud-web/ui";
import { useLicenses } from "../../licenses/hooks/use-licenses";
import type { License } from "../../licenses/api/licenses-api";
import { licenseEditionLabel } from "../../licenses/license-status";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { apiErrorMessage } from "../../../shared/api/api-error-display";
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "../../../shared/search-constants";

export interface LicensePickerProps {
  customerId: string;
  value: string;
  onChange: (licenseId: string) => void;
  error?: string;
}

const PAGE_SIZE = 20;

/**
 * Constrained to the selected Customer's own licenses only (WEB-01E brief §17/§23) - reuses the real
 * Licenses feature's own useLicenses hook (no second GET /licenses implementation), searching by
 * `search` (licenseNumber) + `customerId` + `status=ACTIVE`, all real backend-supported filters -
 * never fetch-everything-then-filter-client-side. Disabled entirely until a customer is chosen.
 *
 * Pre-filtered to `status=ACTIVE` server-side, then further narrowed client-side to licenses whose
 * validity window actually covers "now" - the exact same "usable" formula the backend enforces
 * (License.isUsable(): status===ACTIVE AND now within [validFrom, validUntil], null validUntil =
 * perpetual - pos-cloud libs/control-plane/licensing/src/domain/license.ts). This is a courtesy
 * narrowing of an already-bounded, already-fetched result set, not a re-implementation of backend
 * authority - the backend still rejects a stale selection with 409 LICENSE_NOT_USABLE regardless.
 */
function isUsableNow(license: License): boolean {
  if (license.status !== "ACTIVE") return false;
  const now = Date.now();
  if (new Date(license.validFrom).getTime() > now) return false;
  if (license.validUntil && new Date(license.validUntil).getTime() < now) return false;
  return true;
}

export function LicensePicker({ customerId, onChange, error }: LicensePickerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const searchReady = debouncedSearch.length >= MIN_SEARCH_LENGTH;

  // Guaranteed reset (WEB-01E brief §19): whenever the Customer selection changes (including being
  // cleared), any previously-selected License - and any in-progress search - is stale and must not
  // survive, regardless of what the parent form does with its own `value`. Adjusted during render
  // (not an Effect) - same "previous prop" comparison pattern CreateLicenseDialog/
  // CreateInstallationDialog already use for their own open/reset handling.
  const [prevCustomerId, setPrevCustomerId] = useState(customerId);
  if (customerId !== prevCustomerId) {
    setPrevCustomerId(customerId);
    setSelectedLicense(null);
    setSearchInput("");
  }

  const query = useLicenses(
    {
      page: 1,
      pageSize: PAGE_SIZE,
      customerId: customerId || undefined,
      status: "ACTIVE",
      search: debouncedSearch,
    },
    { enabled: Boolean(customerId) && searchReady },
  );

  const results = (query.data?.items ?? []).filter(isUsableNow);
  const options: ComboboxOption[] = results.map((license) => ({
    id: license.id,
    label: `${license.licenseNumber} (${licenseEditionLabel(license.edition)})`,
  }));

  function handleSelect(option: ComboboxOption | null) {
    if (!option) {
      setSelectedLicense(null);
      setSearchInput("");
      onChange("");
      return;
    }
    const license = results.find((candidate) => candidate.id === option.id) ?? null;
    setSelectedLicense(license);
    onChange(option.id);
  }

  return (
    <Combobox
      label="License"
      placeholder={customerId ? "Search license by number…" : "Select a customer first"}
      disabled={!customerId}
      searchValue={searchInput}
      onSearchValueChange={setSearchInput}
      options={options}
      selected={
        selectedLicense
          ? {
              id: selectedLicense.id,
              label: `${selectedLicense.licenseNumber} (${licenseEditionLabel(selectedLicense.edition)})`,
            }
          : null
      }
      onSelect={handleSelect}
      isLoading={searchReady && query.isLoading}
      error={error}
      queryError={query.isError ? apiErrorMessage(query.error) : undefined}
      helperText={!searchReady ? `Type at least ${MIN_SEARCH_LENGTH} characters` : undefined}
      emptyMessage="No eligible (active, in-validity) licenses found"
    />
  );
}
