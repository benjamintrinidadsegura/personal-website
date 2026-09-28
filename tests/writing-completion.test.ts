import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mapPublicWritingArticle, mapPublicWritingSummary } from "../lib/writing/domain";
import { parseWritingTranslationImport } from "../lib/writing/translations";
import { parseWritingInput } from "../lib/writing/validation";
import type { WritingDocumentV1 } from "../types/writing";

const document: WritingDocumentV1 = {
  version: 1,
  blocks: [{ type: "paragraph", content: [{ type: "text", text: "A complete and safe article paragraph for the Writing validation boundary." }] }],
};

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function writingFormData(excerpt: string): FormData {
  const data = new FormData();
  data.set("title", "Unicode typography");
  data.set("deck", "A normal deck");
  data.set("excerpt", excerpt);
  data.set("bodyJson", JSON.stringify(document));
  data.set("contentType", "essay");
  data.set("sourceLocale", "de");
  data.append("topics", "Ideas");
  return data;
}

const sourceRow = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "warum-ich-bts-online-gebaut-habe",
  title: "Warum ich bts.online gebaut habe",
  deck: "Quelle",
  excerpt: "Ein verständlicher deutscher Teaser.",
  body: "Ein vollständiger deutscher Artikeltext mit ausreichend vielen Zeichen.",
  body_json: document,
  content_type: "essay",
  topics: ["Building"],
  status: "published",
  published_at: "2026-09-27T17:53:48.199Z",
  source_locale: "de",
  source_revision: 3,
  translations: [
    {
      locale: "en",
      title: "Why I built bts.online",
      deck: "Source translated",
      excerpt: "A clear and complete English teaser.",
      body: "A complete English article body with enough characters for public rendering.",
      body_json: { version: 1, blocks: [{ type: "paragraph", content: [{ type: "text", text: "A complete English article body with enough characters for public rendering." }] }] },
      status: "translated",
      source_revision: 3,
      generated_at: "2026-09-27T18:00:00.000Z",
    },
    {
      locale: "es",
      title: "Por qué construí bts.online",
      deck: "Antigua",
      excerpt: "Una traducción que ya está desactualizada.",
      body: "Una traducción antigua que no debe presentarse como si estuviera actualizada.",
      body_json: { version: 1, blocks: [{ type: "paragraph", content: [{ type: "text", text: "Una traducción antigua que no debe presentarse como si estuviera actualizada." }] }] },
      status: "stale",
      source_revision: 2,
      generated_at: "2026-09-26T18:00:00.000Z",
    },
  ],
};

test("teaser validation accepts ordinary Unicode typography and rejects controls", () => {
  for (const excerpt of [
    "Ein normaler Teaser — mit Gedankenstrich.",
    "Ein normaler Teaser – mit Halbgeviertstrich.",
    "„Curly quotes“ and ‘apostrophes’ are valid.",
    "Änderung, déjà vu, español, Türkçe, Ελληνικά und русский.",
  ]) assert.equal(parseWritingInput(writingFormData(excerpt), "publish").success, true, excerpt);

  assert.equal(parseWritingInput(writingFormData("Unsafe\u0007control input"), "publish").success, false);
  assert.equal(parseWritingInput(writingFormData("Unsafe \u202E direction override"), "publish").success, false);
});

test("one canonical article identity selects current translations and falls back from stale variants", () => {
  const english = mapPublicWritingArticle(sourceRow, "en");
  assert.ok(english);
  assert.equal(english.id, sourceRow.id);
  assert.equal(english.slug, sourceRow.slug);
  assert.equal(english.language, "en");
  assert.equal(english.translationStatus, "translated");
  assert.equal(english.title, "Why I built bts.online");
  assert.deepEqual(english.availableLanguages, ["de", "en"]);

  const spanish = mapPublicWritingArticle(sourceRow, "es");
  assert.ok(spanish);
  assert.equal(spanish.id, sourceRow.id);
  assert.equal(spanish.language, "de");
  assert.equal(spanish.translationStatus, "fallback");
  assert.equal(spanish.title, sourceRow.title);
  assert.equal(spanish.availableLanguages.includes("es"), false);
});

test("translation import accepts only bounded structured Writing content", () => {
  const accepted = parseWritingTranslationImport(JSON.stringify({ title: "Why I built bts.online", deck: "A translated deck", excerpt: "A complete translated teaser.", bodyJson: document }));
  assert.equal(accepted.success, true);
  const htmlShape = parseWritingTranslationImport(JSON.stringify({ title: "Why I built bts.online", deck: "A translated deck", excerpt: "A complete translated teaser.", bodyJson: { version: 1, blocks: [{ type: "html", content: "<p>raw</p>" }] } }));
  assert.equal(htmlShape.success, false);
  const extraField = parseWritingTranslationImport(JSON.stringify({ title: "Why", deck: "", excerpt: "A complete translated teaser.", bodyJson: document, providerSecret: "no" }));
  assert.equal(extraField.success, false);
});

test("Writing completion migration keeps deletion AAL2-authorized and translation variants revision-bound", () => {
  const sql = source("../supabase/migrations/20260927000000_writing_completion.sql");
  assert.match(sql, /create table public\.writing_article_translations/u);
  assert.match(sql, /primary key \(article_id, locale\)/u);
  assert.match(sql, /status in \('pending', 'translated', 'stale', 'failed'\)/u);
  assert.match(sql, /source_revision/u);
  assert.match(sql, /translation\.status = 'translated' then 'stale'/u);
  assert.match(sql, /WRITING_SOURCE_LOCALE_IMMUTABLE/u);
  assert.match(sql, /create function public\.apply_writing_translation/u);
  assert.match(sql, /create function public\.delete_writing_article/u);
  assert.match(sql, /perform public\.assert_bts_admin\(true\)/u);
  assert.match(sql, /p_expected_updated_at/u);
  assert.match(sql, /p_expected_title/u);
  for (const relation of ["writing_comment_moderation_events", "writing_discussion_state_events", "writing_comments", "writing_discussions", "writing_article_translations", "writing_articles"]) {
    assert.match(sql, new RegExp(`delete from public\\.${relation}`, "u"), relation);
  }
  assert.doesNotMatch(sql, /raise\s+(?:notice|log)|body\s*\|\||body_json\s*\|\|/iu);
  assert.match(sql, /grant execute on function public\.delete_writing_article[^;]+to authenticated/u);
  assert.doesNotMatch(sql, /grant execute on function public\.delete_writing_article[^;]+to (?:anon|service_role)/u);
});

test("Studio requires explicit titled deletion confirmation and uses the server-confirmed publish slug", () => {
  const actions = source("../app/admin/writing/actions.ts");
  const form = source("../components/admin/writing-form.tsx");
  const deletion = source("../components/admin/writing-delete-control.tsx");
  assert.match(actions, /validUuid\(articleId\)/u);
  assert.match(actions, /rpc\("delete_writing_article"/u);
  assert.match(deletion, /window\.confirm\(`Permanently delete “\$\{displayTitle\}”/u);
  assert.match(deletion, /expectedTitle/u);
  assert.match(form, /result\.slug/u);
  assert.match(form, /const pathname = getLocalizedPathname/u);
  assert.match(form, /window\.location\.assign\(`\$\{pathname\}/u);
  assert.ok(form.indexOf("const result = await publishWritingAction") < form.indexOf("window.location.assign"));
});

test("public locale metadata and sitemap expose only current localized variants", () => {
  const page = source("../app/writing/[slug]/page.tsx");
  const sitemap = source("../app/sitemap.ts");
  const queries = source("../lib/writing/queries.ts");
  assert.match(page, /article\.availableLanguages/u);
  assert.match(page, /article\.translationStatus === "fallback"/u);
  assert.match(sitemap, /article\.availableLanguages\.map/u);
  assert.match(sitemap, /article\.sourceLanguage/u);
  assert.match(queries, /writing_article_translations/u);
  assert.match(queries, /mapPublicWritingArticle\(data as UnknownRow, locale\)/u);
});

test("provider and privacy gates remain server-only with no browser credential path", () => {
  const provider = source("../lib/writing/openai-translation-provider.ts");
  const panel = source("../components/admin/writing-translations-panel.tsx");
  const env = source("../.env.example");
  assert.match(provider, /import "server-only"/u);
  assert.match(provider, /OPENAI_API_KEY/u);
  assert.match(provider, /getWritingTranslationProvider/u);
  assert.match(panel, /OpenAI translation is safely disabled/u);
  assert.match(env, /^OPENAI_API_KEY=$/mu);
  assert.match(env, /^WRITING_TRANSLATION_MODEL=gpt-6-luna$/mu);
  assert.doesNotMatch(panel, /API_KEY|process\.env|fetch\(/u);
  assert.doesNotMatch(env, /NEXT_PUBLIC_OPENAI/u);
});

test("public mapper never turns a stale translation into Discovery content", () => {
  const summary = mapPublicWritingSummary(sourceRow, "es");
  assert.ok(summary);
  assert.equal(summary.translationStatus, "fallback");
  assert.equal(summary.title, sourceRow.title);
});
