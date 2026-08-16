import { StatusBadge } from "@pos-cloud-web/ui";
import { installationStatusVariant, type InstallationStatus } from "../installation-status";

export interface InstallationStatusBadgeProps {
  status: InstallationStatus;
}

export function InstallationStatusBadge({ status }: InstallationStatusBadgeProps) {
  return <StatusBadge variant={installationStatusVariant(status)}>{status}</StatusBadge>;
}
