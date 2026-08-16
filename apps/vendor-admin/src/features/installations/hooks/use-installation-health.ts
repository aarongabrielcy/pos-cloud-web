import { useQuery } from "@tanstack/react-query";
import { getInstallationHealth } from "../api/installations-api";
import { installationKeys } from "../installation-keys";

/**
 * Independent from useInstallation on purpose (own query key, own loading/error state) - a health
 * read failure must not take down the rest of the detail page (WEB-01E brief §29).
 *
 * Refresh strategy: a modest 30s refetchInterval, enabled only on the detail page (never the list).
 * Backend health config (pos-cloud libs/config/src/installation-health-env.schema.ts) defaults to a
 * 60s nominal heartbeat interval, a 120s stale threshold, and a 300s offline threshold - polling
 * every 30s means an admin watching this page sees a threshold crossing within at most half a
 * heartbeat interval, without approaching "every second" polling. TanStack Query's own defaults
 * (refetchIntervalInBackground: false, refetchOnWindowFocus: true) mean this only runs while the tab
 * is actually focused/visible.
 */
export function useInstallationHealth(id: string) {
  return useQuery({
    queryKey: installationKeys.health(id),
    queryFn: () => getInstallationHealth(id),
    refetchInterval: 30_000,
  });
}
