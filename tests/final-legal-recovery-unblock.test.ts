import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { globalDictionaries } from "../data/i18n/global";
import { imprintCopy } from "../data/i18n/impressum";
import { privacyReleaseCopy } from "../data/i18n/privacy-release";
import { legalOperator, privacySupervisoryAuthority, supabaseProjectFacts } from "../data/legal";
import { locales } from "../lib/i18n/config";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("A-G: Impressum renders only the supplied operator and editorial facts", () => {
  const page = source("app/impressum/page.tsx");
  const facts = source("data/legal.ts");

  assert.match(page, /imprintCopy/u);
  assert.equal(legalOperator.name, "Benjamin Trinidad Segura");
  assert.equal(legalOperator.address.street, "Anne-Frank-Straße 7");
  assert.equal(`${legalOperator.address.postalCode} ${legalOperator.address.city}`, "60433 Frankfurt am Main");
  assert.equal(legalOperator.email, "goatrecrutainer@gmail.com");
  assert.match(page, /editorialBody/u);
  assert.match(imprintCopy.de.editorialBody, /§ 18 Abs\. 2 MStV/u);
  assert.equal(imprintCopy.de.languageNoticeTitle, "Sprachhinweis");
  assert.equal(imprintCopy.de.germanReference, "Die deutsche Fassung ist die maßgebliche Version. Übersetzungen dienen der besseren Verständlichkeit.");
  const publicImprintCopy = Object.values(imprintCopy).map((copy) => Object.values(copy).join(" ")).join(" ");
  assert.doesNotMatch(publicImprintCopy, /\bV1\b|technische (?:V1-)?(?:Fassung|Implementierung)|anwaltlich|lawyer|abogado|avukat|prawnik|δικηγόρ|юрист|Garantie rechtlicher Vollständigkeit|legal completeness/iu);
  assert.doesNotMatch(publicImprintCopy, /Inhaltliche Verantwortung|Responsibility for content|Responsabilidad de los contenidos|İçerik sorumluluğu|Odpowiedzialność za treść|Ευθύνη περιεχομένου|Ответственность за содержание/iu);
  assert.doesNotMatch(page, /phone|telephone|Telefon|tel:/iu);
  assert.doesNotMatch(facts, /company|trade name|legal form|register|\bVAT\b|Umsatzsteuer|Wirtschafts-ID/iu);
});

test("H-I: Privacy publishes controller, Hessen authority and supported Supabase facts", () => {
  const page = source("app/privacy/page.tsx");
  const de = Object.values(privacyReleaseCopy.de.sections).flatMap(({ body }) => body).join(" ");

  assert.match(page, /legalOperator\.name/u);
  assert.match(page, /legalOperator\.address\.street/u);
  assert.match(page, /legalOperator\.email/u);
  assert.equal(supabaseProjectFacts.plan, "Free");
  assert.equal(supabaseProjectFacts.region, "eu-central-1");
  assert.match(de, /AWS eu-central-1 \(Frankfurt, EU\)/u);
  assert.match(de, /weder automatische Datenbankbackups noch Point-in-Time-Recovery/u);
  assert.match(de, new RegExp(privacySupervisoryAuthority.name.replace(/[()]/gu, "\\$&"), "u"));
  assert.match(de, /Wilhelmstraße 7/u);
});

test("J-L: legal navigation, indexable localized routes and cookie decision stay coherent", () => {
  const footer = source("components/layout/footer.tsx");
  const sitemap = source("app/sitemap.ts");
  const imprintPage = source("app/impressum/page.tsx");
  const privacyPage = source("app/privacy/page.tsx");

  assert.match(footer, /href\("\/privacy"\)/u);
  assert.match(footer, /href\("\/impressum"\)/u);
  assert.match(sitemap, /"\/impressum"/u);
  assert.match(imprintPage, /createLocalizedMetadata\(\{ locale, pathname: "\/impressum"/u);
  assert.match(privacyPage, /createLocalizedMetadata\(\{ locale, pathname: "\/privacy"/u);
  assert.deepEqual(Object.keys(imprintCopy), locales);
  for (const locale of locales) {
    assert.ok(globalDictionaries[locale].footer.imprint.length > 2, `${locale}: footer imprint`);
    assert.ok(imprintCopy[locale].germanReference.length > 20, `${locale}: German-source boundary`);
  }
  assert.doesNotMatch(`${footer}\n${imprintPage}\n${privacyPage}`, /CookieBanner|cookie-consent|consent banner/iu);
});

test("M-P: recovery detail stays internal and fails closed for Production", () => {
  const publicLegal = [
    source("app/impressum/page.tsx"),
    source("app/privacy/page.tsx"),
    source("data/i18n/impressum.ts"),
    source("data/i18n/privacy-release.ts"),
  ].join("\n");
  const recovery = source("docs/v1-backup-recovery.md");
  const ignore = source(".gitignore");

  assert.doesNotMatch(publicLegal, /\.bts-backups|BTS_BACKUP_DB_URL|psql --single-transaction|Restore Owner/u);
  assert.match(recovery, /Restore Owner: \*\*Benjamin Trinidad Segura\*\*/u);
  assert.match(recovery, /\.bts-backups\//u);
  assert.match(ignore, /\/\.bts-backups\//u);
  assert.match(recovery, /never under `public\/`/u);
  assert.match(recovery, /must never be pasted into a command log, committed, or printed/u);
  assert.match(recovery, /Production restore is prohibited without explicit[\s\S]*operator action/u);
  assert.match(recovery, /No live restore was[\s\S]*executed/u);
  assert.match(recovery, /Free plan includes neither automatic database backups nor point-in-time/u);
});

test("all seven localized legal packs remain substantive and fact-invariant", () => {
  for (const locale of locales) {
    const imprint = imprintCopy[locale];
    const privacy = privacyReleaseCopy[locale];
    assert.ok(imprint.title.length > 8, `${locale}: imprint title`);
    assert.ok(imprint.operatorStatus.length > 8, `${locale}: operator status`);
    assert.ok(privacy.statusBody.length > 90, `${locale}: controller boundary`);
    assert.match(privacy.sections.account.body.join(" "), /eu-central-1/u);
    assert.match(privacy.sections.rights.body.join(" "), /Wilhelmstraße 7/u);
  }
});
