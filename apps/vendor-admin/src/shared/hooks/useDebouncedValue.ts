import { useEffect, useState } from "react";

/** Delays reflecting `value` until it has stopped changing for `delayMs`. Used to keep free-text
 *  filter inputs (search boxes) from refetching/updating the URL on every keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
