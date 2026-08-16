import type { components } from "@pos-cloud-web/api-client";
import type { StatusBadgeVariant } from "@pos-cloud-web/ui";

export type InstallationHealthStatus =
  components["schemas"]["InstallationHealthResponseDto"]["healthStatus"];

/**
 * Feature-local presentation mapping only - the classification itself (NEVER_SEEN/ONLINE/STALE/
 * OFFLINE) is always computed server-side from lastSeenAt (pos-cloud libs/control-plane/
 * installations/src/domain/compute-installation-health.ts) and returned as-is by both the list and
 * detail/health endpoints. This module never recomputes or reclassifies health from a timestamp -
 * doing so client-side would silently drift from the backend's actual thresholds (WEB-01E brief §6).
 */
export function installationHealthVariant(status: InstallationHealthStatus): StatusBadgeVariant {
  switch (status) {
    case "NEVER_SEEN":
      return "neutral";
    case "ONLINE":
      return "success";
    case "STALE":
      return "warning";
    case "OFFLINE":
      return "danger";
  }
}

export function installationHealthLabel(status: InstallationHealthStatus): string {
  switch (status) {
    case "NEVER_SEEN":
      return "Never seen";
    case "ONLINE":
      return "Online";
    case "STALE":
      return "Stale";
    case "OFFLINE":
      return "Offline";
  }
}
