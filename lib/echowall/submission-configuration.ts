import "server-only";

export function echoSubmissionsConfigured(): boolean {
  return process.env.ECHOWALL_SUBMISSIONS_ENABLED === "true"
    && Boolean(process.env.ECHOWALL_IP_HASH_SECRET && process.env.ECHOWALL_FORM_TOKEN_SECRET && process.env.SITE_URL);
}