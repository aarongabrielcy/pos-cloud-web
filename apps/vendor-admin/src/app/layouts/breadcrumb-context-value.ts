import { createContext } from "react";

export interface BreadcrumbContextValue {
  dynamicCrumb: string | undefined;
  setDynamicCrumb: (value: string | undefined) => void;
}

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);
