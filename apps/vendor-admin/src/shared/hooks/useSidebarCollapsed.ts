import { useState } from "react";

const STORAGE_KEY = "pos-cloud-web:sidebar-collapsed";

/** Missing key, malformed value, or localStorage being unavailable (e.g. private browsing) all fall
 *  back to expanded (false) - never surprises an existing user by auto-collapsing, and never throws
 *  during AppShell's render. */
function readStoredPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Desktop-only sidebar expand/collapse preference, persisted to localStorage - a non-sensitive UI
 * preference, not the access-token pattern @pos-cloud-web/auth deliberately avoids localStorage for.
 * The mobile drawer never reads this - it always renders expanded/labeled regardless (see Sidebar/
 * MobileNavDrawer/AppShell).
 */
export function useSidebarCollapsed(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsedState] = useState(readStoredPreference);

  function setCollapsed(next: boolean) {
    setCollapsedState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Best-effort persistence only - a storage failure must not block toggling in-memory.
    }
  }

  return [collapsed, setCollapsed];
}
