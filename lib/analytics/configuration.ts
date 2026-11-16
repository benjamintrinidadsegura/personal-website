/** URL-only beforeSend cannot control collector referrer, attribution or flag fields.
 * Keep the deployment gate closed until a separately reviewed payload correction exists.
 */
export const analyticsActivationReadiness: "blocked" | "ready" = "blocked";

export type AnalyticsEnvironment = {
  BTS_PUBLIC_ANALYTICS_ENABLED?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
  SITE_URL?: string;
};

export function isPublicAnalyticsRequested(environment: AnalyticsEnvironment): boolean {
  return environment.BTS_PUBLIC_ANALYTICS_ENABLED === "true"
    && environment.VERCEL_ENV === "production"
    && environment.NODE_ENV === "production"
    && environment.SITE_URL === "https://btshq.online";
}

export function isPublicAnalyticsEnabled(environment: AnalyticsEnvironment = process.env): boolean {
  return isPublicAnalyticsRequested(environment) && analyticsActivationReadiness === "ready";
}
