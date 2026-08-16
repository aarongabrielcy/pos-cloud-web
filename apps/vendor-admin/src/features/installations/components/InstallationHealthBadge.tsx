import { StatusBadge } from "@pos-cloud-web/ui";
import {
  installationHealthLabel,
  installationHealthVariant,
  type InstallationHealthStatus,
} from "../installation-health";

export interface InstallationHealthBadgeProps {
  status: InstallationHealthStatus;
}

export function InstallationHealthBadge({ status }: InstallationHealthBadgeProps) {
  return (
    <StatusBadge variant={installationHealthVariant(status)}>
      {installationHealthLabel(status)}
    </StatusBadge>
  );
}
