import type { HTMLAttributes } from "react";

export type PageContainerProps = HTMLAttributes<HTMLDivElement>;

/** The one padding/width wrapper every screen starts with (WEB-01B design report §G) - so pages are
 *  assembly, not ad-hoc `<div className="...">` invention. */
export function PageContainer({ className = "", ...rest }: PageContainerProps) {
  return (
    <div
      className={`flex flex-col gap-6 px-[var(--spacing-page-x)] py-[var(--spacing-page-y)] ${className}`}
      {...rest}
    />
  );
}
