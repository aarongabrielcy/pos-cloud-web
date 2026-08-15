import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

export interface TooltipProps {
  label: string;
  children: ReactNode;
}

/**
 * Thin styling shell over @radix-ui/react-tooltip - shown on hover AND keyboard focus (Radix's own
 * guarantee, not reimplemented here), never hover-only. `children` must be a single element that
 * accepts a ref (Trigger uses `asChild` to merge Radix's props onto it directly, no extra wrapper
 * node). Domain-agnostic: no knowledge of any specific feature/module.
 */
export function Tooltip({ label, children }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side="right"
            sideOffset={8}
            className="z-50 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text)] shadow-lg"
          >
            {label}
            <RadixTooltip.Arrow className="fill-[var(--color-surface)]" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
