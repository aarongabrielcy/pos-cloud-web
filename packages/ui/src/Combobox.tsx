import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { Button } from "./Button";
import { Input } from "./Input";

export interface ComboboxOption {
  readonly id: string;
  readonly label: string;
}

export interface ComboboxProps {
  label: string;
  placeholder?: string;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  options: readonly ComboboxOption[];
  selected: ComboboxOption | null;
  onSelect: (option: ComboboxOption | null) => void;
  isLoading?: boolean;
  /** Field-level validation error (e.g. "Select a customer") - rendered below the control, same
   *  style as FormField's own error text. Distinct from a search/fetch failure - see `queryError`. */
  error?: string;
  /** A search/fetch failure, rendered inside the dropdown instead of the option list. */
  queryError?: string;
  /** Shown inside the dropdown instead of the option list - e.g. "Type at least 3 characters". Not
   *  styled as an error (WEB-01E UX brief §23: "Do not use danger/error styling for the helper"). */
  helperText?: string;
  emptyMessage?: string;
  disabled?: boolean;
  changeLabel?: string;
}

/**
 * Domain-agnostic accessible combobox: a real `role="combobox"` input, a Radix Popover for
 * positioning/portal/outside-dismiss (no dedicated Radix Combobox primitive exists - this is the
 * standard accessible-combobox-on-Popover pattern), and a `role="listbox"`/`role="option"` dropdown
 * with full keyboard support (ArrowDown/ArrowUp/Enter/Escape) alongside mouse selection. Knows
 * nothing about Customer/License/any domain - callers supply already-fetched `options` and own the
 * debounce/minimum-length/fetch logic themselves (see e.g. the app-local CustomerPicker).
 *
 * Does NOT use @pos-cloud-web/ui's own FormField: FormField clones its single child to attach
 * id/aria-describedby, which only works for a single plain form element - this component's DOM shape
 * (Popover.Root wrapping an input + a conditional "Change" button) doesn't fit that contract, so it
 * renders its own label/error text directly, mirroring FormField's exact styling.
 *
 * Selection is separate from the search text: once `selected` is set, the input becomes a read-only
 * display of the selected label (never cleared just by losing focus) and a "Change" button appears
 * to explicitly clear it - WEB-01E UX brief §15.
 */
export function Combobox({
  label,
  placeholder = "Search…",
  searchValue,
  onSearchValueChange,
  options,
  selected,
  onSelect,
  isLoading = false,
  error,
  queryError,
  helperText,
  emptyMessage = "No results",
  disabled = false,
  changeLabel = "Change",
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();
  const listboxId = useId();

  const isSelected = selected !== null;
  const dropdownOpen = open && !isSelected;

  function getOptionId(index: number): string {
    return `${listboxId}-option-${index}`;
  }

  function openIfPossible(): void {
    if (!disabled && !isSelected) setOpen(true);
  }

  function handleSelect(option: ComboboxOption): void {
    onSelect(option);
    setOpen(false);
    setHighlightedIndex(-1);
  }

  function handleChange(): void {
    onSelect(null);
    setOpen(false);
    setHighlightedIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (isSelected) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openIfPossible();
      setHighlightedIndex((prev) => (options.length === 0 ? -1 : (prev + 1) % options.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openIfPossible();
      setHighlightedIndex((prev) =>
        options.length === 0 ? -1 : (prev - 1 + options.length) % options.length,
      );
    } else if (event.key === "Enter") {
      if (dropdownOpen && highlightedIndex >= 0) {
        const option = options[highlightedIndex];
        if (option) {
          event.preventDefault();
          handleSelect(option);
        }
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
      }
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
        {label}
      </label>
      <RadixPopover.Root open={dropdownOpen} onOpenChange={setOpen}>
        <RadixPopover.Anchor asChild>
          <div className="flex items-center gap-2">
            <Input
              id={inputId}
              ref={inputRef}
              role="combobox"
              aria-expanded={dropdownOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                dropdownOpen && highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined
              }
              aria-describedby={error ? errorId : undefined}
              aria-invalid={Boolean(error) || undefined}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={isSelected}
              value={isSelected ? selected.label : searchValue}
              onFocus={openIfPossible}
              onChange={(event) => {
                onSearchValueChange(event.target.value);
                setHighlightedIndex(-1);
                openIfPossible();
              }}
              onKeyDown={handleKeyDown}
            />
            {isSelected ? (
              <Button type="button" variant="secondary" onClick={handleChange}>
                {changeLabel}
              </Button>
            ) : null}
          </div>
        </RadixPopover.Anchor>
        <RadixPopover.Portal>
          <RadixPopover.Content
            role="listbox"
            id={listboxId}
            sideOffset={4}
            align="start"
            onOpenAutoFocus={(event) => event.preventDefault()}
            className="z-50 max-h-64 w-[var(--radix-popover-trigger-width)] overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
          >
            {helperText ? (
              <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">{helperText}</p>
            ) : isLoading ? (
              <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">Loading…</p>
            ) : queryError ? (
              <p className="px-3 py-2 text-sm text-[var(--color-danger)]">{queryError}</p>
            ) : options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
            ) : (
              options.map((option, index) => (
                <div
                  key={option.id}
                  id={getOptionId(index)}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={`cursor-pointer px-3 py-2 text-sm text-[var(--color-text)] ${
                    index === highlightedIndex ? "bg-brand-50 text-brand-700" : ""
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(option);
                  }}
                >
                  {option.label}
                </div>
              ))
            )}
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
