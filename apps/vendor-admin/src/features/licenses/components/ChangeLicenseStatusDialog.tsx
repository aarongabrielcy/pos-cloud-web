import { ConfirmDialog } from "@pos-cloud-web/ui";
import { useChangeLicenseStatus } from "../hooks/use-change-license-status";
import type { LicenseStatusAction } from "../license-status";

export interface ChangeLicenseStatusDialogProps {
  licenseId: string;
  action: LicenseStatusAction | null;
  onOpenChange: (open: boolean) => void;
}

/** ConfirmDialog already owns submitting/error state and keeps itself open on a rejected onConfirm
 *  (WEB-01B) - a rejected transition (400 INVALID_LICENSE_STATUS_TRANSITION) surfaces there without
 *  any extra handling here. */
export function ChangeLicenseStatusDialog({
  licenseId,
  action,
  onOpenChange,
}: ChangeLicenseStatusDialogProps) {
  const changeStatus = useChangeLicenseStatus();

  if (!action) {
    return null;
  }

  return (
    <ConfirmDialog
      open={Boolean(action)}
      onOpenChange={onOpenChange}
      title={`${action.label} license`}
      description={`Are you sure you want to ${action.label.toLowerCase()} this license?`}
      confirmLabel={action.label}
      variant={action.variant}
      onConfirm={async () => {
        await changeStatus.mutateAsync({ id: licenseId, status: action.targetStatus });
      }}
    />
  );
}
