import "server-only";
import { firstPartyReachRuntime } from "@/lib/analytics/first-party-config";
/** Separate scope. Existing Reach consent/flag cannot activate Insights. */
export function insightsCollectionEnabled(environment = process.env) {
  return environment.BTS_INSIGHTS_MODE === "collect" && firstPartyReachRuntime(environment);
}
/** Keep expiry working after collection is stopped, using the existing daily job. */
export function insightsMaintenanceEnabled(environment = process.env) {
  return ["collect", "maintain"].includes(environment.BTS_INSIGHTS_MODE ?? "") && firstPartyReachRuntime(environment);
}
