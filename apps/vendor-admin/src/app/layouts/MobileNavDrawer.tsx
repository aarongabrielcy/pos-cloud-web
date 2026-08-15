import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Off-canvas nav drawer for < lg viewports, built directly on @radix-ui/react-dialog's primitives
 * (not the styled @pos-cloud-web/ui Dialog, which is centered/modal-shaped) - same accessibility
 * guarantees (focus trap, Escape-to-close, backdrop-click-to-close, aria-modal) repositioned to
 * slide in from the left instead of centering.
 */
export function MobileNavDrawer({ open, onOpenChange, children }: MobileNavDrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <RadixDialog.Content className="fixed inset-y-0 left-0 z-50 w-[var(--spacing-sidebar)] bg-[var(--color-surface)] shadow-lg focus:outline-none lg:hidden">
          <RadixDialog.Title className="sr-only">Navigation</RadixDialog.Title>
          <RadixDialog.Description className="sr-only">
            Primary navigation for Vendor Admin
          </RadixDialog.Description>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
