import { ConfirmDialog } from "@pos-cloud-web/ui";
import { useRevokeInstallationCredential } from "../hooks/use-revoke-installation-credential";

export interface RevokeCredentialDialogProps {
  installationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** No secret to reveal here (204 No Content) - a plain danger ConfirmDialog is enough. Revoking
 *  immediately breaks the device's current credential (unlike issuing a recovery-enrollment code,
 *  which only takes effect once redeemed), so this is styled danger and requires re-enrollment
 *  afterward - reflected in the confirmation copy at the call site. */
export function RevokeCredentialDialog({
  installationId,
  open,
  onOpenChange,
}: RevokeCredentialDialogProps) {
  const revokeCredential = useRevokeInstallationCredential();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Revoke credential"
      description="This immediately invalidates the installation's active credential. The device will stop authenticating until it is re-enrolled with a new recovery code. This cannot be undone."
      confirmLabel="Revoke credential"
      variant="danger"
      onConfirm={async () => {
        await revokeCredential.mutateAsync(installationId);
      }}
    />
  );
}
