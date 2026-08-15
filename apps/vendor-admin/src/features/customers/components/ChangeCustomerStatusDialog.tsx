import { ConfirmDialog } from "@pos-cloud-web/ui";
import { useChangeCustomerStatus } from "../hooks/use-change-customer-status";
import type { CustomerStatusAction } from "../customer-status";

export interface ChangeCustomerStatusDialogProps {
  customerId: string;
  action: CustomerStatusAction | null;
  onOpenChange: (open: boolean) => void;
}

/** ConfirmDialog already owns submitting/error state and keeps itself open on a rejected onConfirm
 *  (WEB-01B) - a 409 invalid-transition response from the backend surfaces there without any extra
 *  handling here. */
export function ChangeCustomerStatusDialog({
  customerId,
  action,
  onOpenChange,
}: ChangeCustomerStatusDialogProps) {
  const changeStatus = useChangeCustomerStatus();

  if (!action) {
    return null;
  }

  return (
    <ConfirmDialog
      open={Boolean(action)}
      onOpenChange={onOpenChange}
      title={`${action.label} customer`}
      description={`Are you sure you want to ${action.label.toLowerCase()} this customer?`}
      confirmLabel={action.label}
      variant={action.variant}
      onConfirm={async () => {
        await changeStatus.mutateAsync({ id: customerId, status: action.targetStatus });
      }}
    />
  );
}
