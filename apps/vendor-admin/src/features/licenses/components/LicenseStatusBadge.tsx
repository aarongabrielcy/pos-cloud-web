import { StatusBadge } from "@pos-cloud-web/ui";
import { licenseStatusVariant, type LicenseStatus } from "../license-status";

export interface LicenseStatusBadgeProps {
  status: LicenseStatus;
}

export function LicenseStatusBadge({ status }: LicenseStatusBadgeProps) {
  return <StatusBadge variant={licenseStatusVariant(status)}>{status}</StatusBadge>;
}
