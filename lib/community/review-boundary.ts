export function isCommunityLoopback(value: string | null): boolean {
  return /^(localhost|127\.0\.0\.1)(:\d{1,5})?$/u.test(value ?? "");
}

export function canOpenCommunityReview(request: Headers): boolean {
  if (process.env.BTS_COMMUNITY_LOCAL_REVIEW !== "1" || process.env.VERCEL || process.env.VERCEL_ENV) return false;
  const site = process.env.SITE_URL;
  const host = request.get("host");
  if (!site || !/^http:\/\/(127\.0\.0\.1|localhost)(:\d{1,5})?\/?$/u.test(site)) return false;
  return isCommunityLoopback(host) && host === new URL(site).host
    && (!request.has("x-forwarded-for") || isCommunityLoopback(request.get("x-forwarded-for")));
}
