import { StatusBadge } from "@pos-cloud-web/ui";
import { customerStatusVariant, type CustomerStatus } from "../customer-status";

export interface CustomerStatusBadgeProps {
  status: CustomerStatus;
}

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  return <StatusBadge variant={customerStatusVariant(status)}>{status}</StatusBadge>;
}
