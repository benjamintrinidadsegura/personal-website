import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { echoDictionaries } from "../data/i18n/echowall";
import { accountDictionaries, accountTitles } from "../data/i18n/account";
import { errorDictionaries } from "../data/i18n/errors";
import { globalDictionaries } from "../data/i18n/global";
import { newsletterDictionaries } from "../data/i18n/newsletter";
import { privacyDictionaries } from "../data/i18n/privacy";
import { writingDictionaries, writingTaxonomies } from "../data/i18n/writing";
import { getWritingLocalization, getWritingTranslationSlug } from "../data/writing-localization";
import { assertLocale, defaultLocale, isLocale, localeDetails, localeRegistry, locales } from "../lib/i18n/config";
import { createLocalizedMetadata, getLanguageAlternates } from "../lib/i18n/metadata";
import {
  getLanguageSwitchTarget,
  getLocalizedPathname,
  getRequestLocaleRouting,
  isLocaleAwarePublicPath,
  localizeHref,
} from "../lib/i18n/routing";

test("V1 locales are exact, typed and fail closed", () => {
  assert.deepEqual(locales, ["de", "en", "es", "tr", "pl", "el", "ru"]);
  assert.deepEqual(localeRegistry.map(({ code }) => code), locales);
  assert.equal(defaultLocale, "de");
  assert.equal(isLocale("de"), true);
  assert.equal(isLocale("en"), true);
  for (const locale of ["es", "tr", "pl", "el", "ru"] as const) assert.equal(isLocale(locale), true);
  assert.equal(isLocale("fr"), false);
  assert.throws(() => assertLocale("fr"), /Unsupported locale/u);
});

test("German keeps established paths while every other V1 locale is consistently prefixed", () => {
  assert.equal(getLocalizedPathname("/", "de"), "/");
  assert.equal(getLocalizedPathname("/", "en"), "/en");
  assert.equal(getLocalizedPathname("/about?from=hq#work", "en"), "/en/about?from=hq#work");
  assert.equal(getLocalizedPathname("/en/about", "de"), "/about");
  assert.equal(getLanguageSwitchTarget("/en/life-alignment/partner", "de"), "/life-alignment/partner");
  for (const locale of locales.filter((candidate) => candidate !== "de")) {
    assert.equal(getLocalizedPathname("/about?from=hq#work", locale), `/${locale}/about?from=hq#work`);
    assert.equal(getLanguageSwitchTarget("/ru/life-alignment/partner", locale), `/${locale}/life-alignment/partner`);
  }
  assert.equal(localizeHref("https://www.goatrec.com", "en"), "https://www.goatrec.com");
  assert.equal(localizeHref("mailto:hello@bts.online", "en"), "mailto:hello@bts.online");
});

test("language selection uses a document navigation so locale server state cannot remain stale", () => {
  const switcher = readFileSync(new URL("../components/i18n/language-switcher.tsx", import.meta.url), "utf8");
  assert.match(switcher, /<select/u);
  assert.match(switcher, /locales\.map/u);
  assert.equal(switcher.includes('import Link from "next/link"'), false);
  assert.match(switcher, /window\.location\.assign/u);
  assert.match(switcher, /window\.location\.search/u);
  assert.match(switcher, /window\.location\.hash/u);
  assert.match(switcher, /aria-label=\{copy\.languageNavigation\}/u);
  assert.match(switcher, /min-h-11 w-full/u);
  for (const locale of locales) assert.equal(switcher.includes("localeDetails[candidate].languageName"), true, locale);
});

test("locale request routing is deterministic and rejects unsafe switch targets", () => {
  assert.deepEqual(getRequestLocaleRouting("/about"), { locale: "de", internalPathname: "/about", canonicalRedirect: null });
  assert.deepEqual(getRequestLocaleRouting("/en/about"), { locale: "en", internalPathname: "/about", canonicalRedirect: null });
  for (const locale of ["es", "tr", "pl", "el", "ru"] as const) {
    assert.deepEqual(getRequestLocaleRouting(`/${locale}/about`), { locale, internalPathname: "/about", canonicalRedirect: null });
  }
  assert.deepEqual(getRequestLocaleRouting("/de/about"), { locale: "de", internalPathname: "/about", canonicalRedirect: "/about" });
  assert.equal(isLocaleAwarePublicPath("/about"), true);
  assert.equal(isLocaleAwarePublicPath("/admin"), false);
  assert.equal(isLocaleAwarePublicPath("/api/newsletter"), false);
  for (const locale of locales.filter((candidate) => candidate !== defaultLocale)) {
    const internal = getRequestLocaleRouting(`/${locale}/admin`);
    assert.equal(internal.internalPathname, "/admin");
    assert.equal(isLocaleAwarePublicPath(internal.internalPathname), false);
  }
  assert.throws(() => getLanguageSwitchTarget("//evil.example/path", "en"), /safe local paths/u);
  assert.throws(() => getLanguageSwitchTarget("/about\\evil", "en"), /safe local paths/u);
});

test("proxy locale handling overwrites spoofable state and never rewrites prefixed internal paths", () => {
  const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /requestHeaders\.set\(localeHeaderName, routing\.locale\)/u);
  assert.match(proxy, /isLocaleAwarePublicPath\(routing\.internalPathname\)/u);
  assert.match(proxy, /routing\.locale !== defaultLocale/u);
  assert.match(proxy, /destination = request\.nextUrl\.clone\(\)/u);
  assert.match(proxy, /destination\.pathname = localeRouting\.canonicalRedirect/u);
});

test("localized metadata has coherent canonicals and hreflang alternates", () => {
  const english = createLocalizedMetadata({ locale: "en", pathname: "/about", title: "About", description: "About Benjamin" });
  assert.equal(english.alternates?.canonical, "/en/about");
  assert.deepEqual(english.alternates?.languages, { de: "/about", en: "/en/about", es: "/es/about", tr: "/tr/about", pl: "/pl/about", el: "/el/about", ru: "/ru/about", "x-default": "/about" });
  assert.equal(english.openGraph && "locale" in english.openGraph ? english.openGraph.locale : null, "en_GB");
  assert.deepEqual(getLanguageAlternates("/privacy", ["de"]), { de: "/privacy", "x-default": "/privacy" });
  assert.deepEqual(english.openGraph && "alternateLocale" in english.openGraph ? english.openGraph.alternateLocale : [], ["de_DE", "es_ES", "tr_TR", "pl_PL", "el_GR", "ru_RU"]);
});

function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return value.trim() ? [prefix] : [];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => leafPaths(nested, prefix ? `${prefix}.${key}` : key));
}

test("critical interface dictionaries are complete in all seven V1 locales", () => {
  for (const dictionary of [accountDictionaries, errorDictionaries, globalDictionaries, writingDictionaries, newsletterDictionaries, echoDictionaries, privacyDictionaries]) {
    const germanKeys = leafPaths(dictionary.de).sort();
    for (const locale of locales) assert.deepEqual(leafPaths(dictionary[locale]).sort(), germanKeys, `${locale} dictionary shape`);
    assert.ok(germanKeys.length > 0);
  }
  for (const locale of locales) {
    assert.ok(globalDictionaries[locale].skipLink.length > 0);
    assert.ok(globalDictionaries[locale].accountMenuOpen.length > 0);
    assert.ok(accountTitles[locale].length > 0);
    assert.deepEqual(Object.keys(writingTaxonomies[locale].contentTypes).sort(), ["essay", "note"]);
    assert.deepEqual(Object.keys(writingTaxonomies[locale].topics).sort(), ["Building", "Ideas", "Life", "People", "Work"]);
  }
  assert.ok(newsletterDictionaries.de.form.errors.INVALID_INPUT.length > 0);
  assert.ok(echoDictionaries.en.form.errors.INVALID_FORM_TOKEN.length > 0);
  assert.match(globalDictionaries.tr.siteDescription, /[ğışçöü]/iu);
  assert.match(globalDictionaries.pl.siteDescription, /[ąęłńóśźż]/iu);
  assert.match(globalDictionaries.el.siteDescription, /[Α-ω]/u);
  assert.match(globalDictionaries.ru.siteDescription, /[А-яЁё]/u);
  assert.equal(localeDetails.en.htmlLang, "en-GB");
});

test("large form and discussion dictionaries stay server-scoped instead of shipping seven packs", () => {
  for (const path of [
    "../components/echowall/echo-form.tsx",
    "../components/newsletter/newsletter-form.tsx",
    "../components/newsletter/newsletter-confirm-form.tsx",
    "../components/newsletter/newsletter-unsubscribe-form.tsx",
    "../components/writing/comments/comment-form.tsx",
    "../components/writing/comments/account-comment-form.tsx",
    "../components/writing/comments/display-name-setup.tsx",
    "../components/writing/comments/owned-comment-controls.tsx",
  ]) {
    const client = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.equal(client.includes("getEchoDictionary"), false, path);
    assert.equal(client.includes("getNewsletterDictionary"), false, path);
    assert.equal(client.includes("getWritingDictionary"), false, path);
  }
});

test("Writing never infers or fabricates a translation", () => {
  const legacy = getWritingLocalization("unregistered-legacy-article");
  assert.equal(legacy.language, "de");
  assert.equal(getWritingTranslationSlug("unregistered-legacy-article", "en"), null);
  for (const locale of ["es", "tr", "pl", "el", "ru"] as const) assert.equal(getWritingTranslationSlug("unregistered-legacy-article", locale), null);
  assert.equal(getWritingTranslationSlug("unregistered-legacy-article", "de"), "unregistered-legacy-article");
});
