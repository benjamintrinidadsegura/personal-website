import "server-only";
import { firstPartyReachRuntime } from "./first-party-config";
/** Missing preserves the approved legacy deployment. Unknown values fail closed. */
export function publicViewSource(environment = process.env): "legacy" | "server-document" | "off" {
  const value = environment.BTS_PUBLIC_VIEW_SOURCE;
  return value === undefined || value === "legacy" ? "legacy" : value === "server-document" ? value : "off";
}
export function serverDocumentsEnabled(environment = process.env) {
  return publicViewSource(environment) === "server-document" && firstPartyReachRuntime(environment)
    && environment.BTS_REACH_ENABLED === "true" && environment.BTS_INSIGHTS_MODE === "collect";
}
