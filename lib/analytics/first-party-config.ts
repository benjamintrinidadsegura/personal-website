import "server-only";

export function firstPartyReachEnabled(environment = process.env) {
  return environment.BTS_REACH_ENABLED === "true"
    && environment.VERCEL === "1"
    && environment.VERCEL_ENV === "production"
    && environment.NODE_ENV === "production"
    && environment.SITE_URL === "https://btshq.online";
}
