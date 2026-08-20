export const localeRegistry = [
  { code: "de", languageName: "Deutsch", htmlLang: "de", openGraphLocale: "de_DE" },
  { code: "en", languageName: "English", htmlLang: "en-GB", openGraphLocale: "en_GB" },
  { code: "es", languageName: "Español", htmlLang: "es", openGraphLocale: "es_ES" },
  { code: "tr", languageName: "Türkçe", htmlLang: "tr", openGraphLocale: "tr_TR" },
  { code: "pl", languageName: "Polski", htmlLang: "pl", openGraphLocale: "pl_PL" },
  { code: "el", languageName: "Ελληνικά", htmlLang: "el", openGraphLocale: "el_GR" },
  { code: "ru", languageName: "Русский", htmlLang: "ru", openGraphLocale: "ru_RU" },
] as const;

export type Locale = (typeof localeRegistry)[number]["code"];

export const locales = localeRegistry.map(({ code }) => code) as readonly Locale[];
export const defaultLocale: Locale = "de";
export const localeHeaderName = "x-bts-locale";

export const localeDetails = Object.fromEntries(
  localeRegistry.map(({ code, ...details }) => [code, details]),
) as Record<Locale, {
  languageName: string;
  htmlLang: string;
  openGraphLocale: string;
}>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.some((locale) => locale === value);
}

export function assertLocale(value: unknown): Locale {
  if (!isLocale(value)) throw new Error("Unsupported locale");
  return value;
}
