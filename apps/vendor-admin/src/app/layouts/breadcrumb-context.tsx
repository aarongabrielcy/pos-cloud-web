import { useState } from "react";
import type { ReactNode } from "react";
import { BreadcrumbContext } from "./breadcrumb-context-value";

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [dynamicCrumb, setDynamicCrumb] = useState<string | undefined>(undefined);
  return (
    <BreadcrumbContext.Provider value={{ dynamicCrumb, setDynamicCrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}
