import { useContext, useEffect } from "react";
import { BreadcrumbContext } from "./breadcrumb-context-value";

/**
 * Lets the current leaf page override the *last* breadcrumb segment's label once real data has
 * loaded - e.g. a customer detail route's static "Customer" route-handle fallback becomes the
 * customer's code once `useCustomer(id)` resolves. Domain-agnostic (knows nothing about customers/
 * licenses/etc.) and reusable by any future detail page. Resets on unmount/label change so a stale
 * label never survives navigating to a sibling route.
 */
export function useDynamicCrumb(label: string | undefined): void {
  const ctx = useContext(BreadcrumbContext);
  const setDynamicCrumb = ctx?.setDynamicCrumb;
  useEffect(() => {
    setDynamicCrumb?.(label);
    return () => setDynamicCrumb?.(undefined);
  }, [setDynamicCrumb, label]);
}

export function useBreadcrumbOverride(): string | undefined {
  return useContext(BreadcrumbContext)?.dynamicCrumb;
}
