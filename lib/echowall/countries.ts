import type { Locale } from "@/lib/i18n/config";
import type { PublicEcho } from "@/types/echowall";

const countryCodes = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI
BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN
CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK
FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM
HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN
KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK
ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP
NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF
TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI
VN VU WF WS YE YT ZA ZM ZW`.split(/\s+/u);
const supportedCountries = new Set(countryCodes);
const minimumCommunityEchoes = 3;

export function isEchoCountry(value: unknown): value is string {
  return typeof value === "string" && supportedCountries.has(value);
}

export function echoCountryName(code: string, locale: Locale) {
  return new Intl.DisplayNames([locale], { type: "region", fallback: "none" }).of(code) ?? code;
}

export function echoCountryOptions(locale: Locale) {
  const labels = new Intl.DisplayNames([locale], { type: "region", fallback: "none" });
  const collator = new Intl.Collator(locale);
  return countryCodes.map((code) => ({ code, label: labels.of(code) ?? code }))
    .sort((left, right) => collator.compare(left.label, right.label));
}

export type EchoCommunityCountry = { countryCode: string; contributions: number };

export function summarizeEchoCountries(echoes: readonly PublicEcho[]): EchoCommunityCountry[] {
  const counts = new Map<string, number>();
  for (const echo of echoes) {
    if (echo.includeInCommunityMap && isEchoCountry(echo.countryCode)) {
      counts.set(echo.countryCode, (counts.get(echo.countryCode) ?? 0) + 1);
    }
  }
  return Array.from(counts, ([countryCode, contributions]) => ({ countryCode, contributions }))
    .filter(({ contributions }) => contributions >= minimumCommunityEchoes);
}
