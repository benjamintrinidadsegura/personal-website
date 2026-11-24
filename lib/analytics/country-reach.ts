/** Independent website measurement contract. Never accepts EchoWall or relationship rows. */
const isoCountries = new Set(`AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(" "));

export const reachProjectId = "prj_unkyAkItBZl4z15yQDutrM1j9RLw";
// Proposed public-display policy, NOT provider retention or a legal anonymity guarantee.
export const reachFreshnessMs = 24 * 60 * 60 * 1000;
export const minimumPublicCountryViews = 5;

export function isReachCountry(value: unknown): value is string {
  return typeof value === "string" && isoCountries.has(value);
}

export type CountryReachSnapshot = {
  version: 1;
  source: "vercel-web-analytics" | "btshq-first-party";
  metric: "pageviews";
  projectId: typeof reachProjectId;
  provenance: "owner-approved-aggregate";
  publicDisplayApproved: true;
  routeScope: "public-allowlist-v1";
  periodStart: string;
  periodEnd: string;
  retrievedAt: string;
  geography: "complete" | "partial";
  countries: readonly { countryCode: string; pageViews: number }[];
};

export type CountryReach =
  | { status: "unavailable"; reason: "inactive" | "missing" | "invalid" | "stale" | "suppressed" }
  | { status: "available"; snapshot: CountryReachSnapshot; omittedLowVolume: boolean };

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const utc = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) && new Date(value).toISOString() === value;

/** Reject extra fields, unknown geography and unreviewed provenance. Return only sanitized aggregates.
 * Provenance fields are an import contract, not authentication: no public upload endpoint exists.
 */
export function validateCountryReach(input: unknown, now: number = Date.now()): CountryReach {
  const invalid = { status: "unavailable", reason: "invalid" } as const;
  if (input === null || input === undefined) return { status: "unavailable", reason: "missing" };
  if (!record(input) || !exactKeys(input, ["version", "source", "metric", "projectId", "provenance", "publicDisplayApproved", "routeScope", "periodStart", "periodEnd", "retrievedAt", "geography", "countries"])) return invalid;
  if (input.version !== 1 || (input.source !== "vercel-web-analytics" && input.source !== "btshq-first-party") || input.metric !== "pageviews"
    || input.projectId !== reachProjectId || input.provenance !== "owner-approved-aggregate"
    || input.publicDisplayApproved !== true || input.routeScope !== "public-allowlist-v1"
    || !["complete", "partial"].includes(String(input.geography))) return invalid;
  try {
    if (!Number.isFinite(now) || !utc(input.periodStart) || !utc(input.periodEnd) || !utc(input.retrievedAt)) return invalid;
  } catch { return invalid; }
  const start = Date.parse(input.periodStart as string);
  const end = Date.parse(input.periodEnd as string);
  const retrieved = Date.parse(input.retrievedAt as string);
  if (start >= end || end > retrieved || retrieved > now) return invalid;
  if (now - retrieved > reachFreshnessMs) return { status: "unavailable", reason: "stale" };
  if (!Array.isArray(input.countries) || input.countries.length > 249) return invalid;
  const seen = new Set<string>();
  const countries: { countryCode: string; pageViews: number }[] = [];
  let omittedLowVolume = false;
  for (const row of input.countries) {
    if (!record(row) || !exactKeys(row, ["countryCode", "pageViews"]) || !isReachCountry(row.countryCode) || seen.has(row.countryCode)
      || !Number.isSafeInteger(row.pageViews) || (row.pageViews as number) < 0) return invalid;
    seen.add(row.countryCode);
    if ((row.pageViews as number) < minimumPublicCountryViews) { omittedLowVolume = true; continue; }
    countries.push({ countryCode: row.countryCode, pageViews: row.pageViews as number });
  }
  if (!countries.length) return { status: "unavailable", reason: "suppressed" };
  return {
    status: "available", omittedLowVolume,
    snapshot: { version: 1, source: input.source, metric: "pageviews", projectId: reachProjectId,
      provenance: "owner-approved-aggregate", publicDisplayApproved: true, routeScope: "public-allowlist-v1",
      periodStart: input.periodStart as string, periodEnd: input.periodEnd as string, retrievedAt: input.retrievedAt as string,
      geography: input.geography as "complete" | "partial", countries },
  };
}

/** No approved source is provisioned. No provider token, snapshot or invented data ships. */
export function getCountryReach(): CountryReach {
  return { status: "unavailable", reason: "inactive" };
}
