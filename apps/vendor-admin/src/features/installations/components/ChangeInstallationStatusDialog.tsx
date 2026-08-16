import { ConfirmDialog } from "@pos-cloud-web/ui";
import { useChangeInstallationStatus } from "../hooks/use-change-installation-status";
import type { InstallationStatusAction } from "../installation-status";

export interface ChangeInstallationStatusDialogProps {
  installationId: string;
  action: InstallationStatusAction | null;
  onOpenChange: (open: boolean) => void;
}

/** ConfirmDialog already owns submitting/error state and keeps itself open on a rejected onConfirm
 *  - same pattern as ChangeCustomerStatusDialog/ChangeLicenseStatusDialog. */
export function ChangeInstallationStatusDialog({
  installationId,
  action,
  onOpenChange,
}: ChangeInstallationStatusDialogProps) {
  const changeStatus = useChangeInstallationStatus();

  if (!action) {
    return null;
  }

  return (
    <ConfirmDialog
      open={Boolean(action)}
      onOpenChange={onOpenChange}
      title={`${action.label} installation`}
      description={`Are you sure you want to ${action.label.toLowerCase()} this installation?`}
      confirmLabel={action.label}
      variant={action.variant}
      onConfirm={async () => {
        await changeStatus.mutateAsync({ id: installationId, status: action.targetStatus });
      }}
    />
  );
}
