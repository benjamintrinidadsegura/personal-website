import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildOpenAIWritingTranslationRequest,
  buildOpenAIWritingTranslationRepairRequest,
  DEFAULT_WRITING_TRANSLATION_MODEL,
  extractWritingTranslationUnits,
  OPENAI_RESPONSES_ENDPOINT,
  parseOpenAIWritingTranslationOutput,
  rehydrateWritingTranslationDocument,
  resolveOpenAIWritingTranslation,
  writingTranslationInstructions,
  writingTranslationResponseSchema,
  writingTranslationTargetLocales,
} from "../lib/writing/openai-translation-leaf-contract";
import { generateWritingTranslationsWithProvider } from "../lib/writing/translation-generation-core";
import type { WritingTranslationDatabase } from "../lib/writing/translation-generation-core";
import type { WritingTranslationProvider, WritingTranslationRequest } from "../types/writing";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function constSchemasMissingType(value: unknown, path = "$schema"): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const record = value as Record<string, unknown>;
  return [
    ...(Object.hasOwn(record, "const") && !Object.hasOwn(record, "type") ? [path] : []),
    ...Object.entries(record).flatMap(([key, child]) => constSchemasMissingType(child, `${path}.${key}`)),
  ];
}

const request: WritingTranslationRequest = {
  articleId: "a651ef2d-e4b0-4203-91ac-71afa145d36d",
  sourceLocale: "de",
  targetLocale: "en",
  sourceRevision: 2,
  protectedTerms: ["BTSHQ.ONLINE", "btshq.online"],
  content: {
    title: "Warum ich btshq.online gebaut habe",
    deck: "BTSHQ.ONLINE ist mein digitales Zuhause.",
    excerpt: "Ein vollständiger Teaser über btshq.online.",
    bodyJson: {
      version: 1,
      blocks: [{
        type: "paragraph",
        content: [
          { type: "text", text: "BTSHQ.ONLINE ist ein vollständiger Artikel mit einem Link zu " },
          { type: "link", href: "https://btshq.online/writing", content: [{ type: "text", text: "btshq.online", styles: { bold: true } }] },
          { type: "text", text: "." },
        ],
      }],
    },
  },
};

const validOutput = JSON.stringify({
  targetLocale: "en",
  title: "Why I built btshq.online",
  deck: "BTSHQ.ONLINE is my digital home.",
  teaser: "A complete teaser about btshq.online.",
  translations: [
    { id: "block:~|blocks[0].content[0]", text: "BTSHQ.ONLINE is a complete article with a link to" },
    { id: "block:~|blocks[0].content[1].content[0]", text: "btshq.online" },
    { id: "block:~|blocks[0].content[2]", text: "." },
  ],
});

test("OpenAI translation uses gpt-6-luna Responses Structured Outputs without tools", () => {
  const body = buildOpenAIWritingTranslationRequest(request);
  assert.equal(DEFAULT_WRITING_TRANSLATION_MODEL, "gpt-6-luna");
  assert.equal(OPENAI_RESPONSES_ENDPOINT, "https://api.openai.com/v1/responses");
  assert.equal(body.model, "gpt-6-luna");
  assert.deepEqual(body.reasoning, { effort: "none" });
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(body.text.format.strict, true);
  assert.deepEqual(constSchemasMissingType(writingTranslationResponseSchema), []);
  assert.equal(body.store, false);
  assert.equal("tools" in body, false);
  const input = JSON.parse(body.input[0].content[0].text) as Record<string, unknown>;
  assert.equal("document" in input, false);
  assert.ok(Array.isArray(input.units));
  assert.match(writingTranslationInstructions, /untrusted DATA/u);
  assert.match(writingTranslationInstructions, /Do not summarize, shorten, expand/u);
});

test("DE source generates exactly the six other supported locales", () => {
  assert.deepEqual(writingTranslationTargetLocales("de"), ["en", "es", "tr", "pl", "el", "ru"]);
});

test("locale failures are isolated, active claims skip duplicates, and siblings persist independently", async () => {
  const calls: string[] = [];
  const database: WritingTranslationDatabase = {
    async rpc(name, parameters) {
      const locale = String(parameters.p_locale ?? "");
      calls.push(`${name}:${locale}`);
      if (name === "claim_writing_translation_generation") {
        if (locale === "tr") return { data: [], error: null };
        return {
          data: [{
            claim_id: locale === "en" ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222",
            article_id: request.articleId,
            source_locale: "de",
            target_locale: locale,
            source_revision: request.sourceRevision,
            title: request.content.title,
            deck: request.content.deck,
            excerpt: request.content.excerpt,
            body_json: request.content.bodyJson,
          }],
          error: null,
        };
      }
      if (name === "complete_writing_translation_generation") return { data: true, error: null };
      if (name === "fail_writing_translation_generation") return { data: true, error: null };
      return { data: null, error: { message: "unexpected" } };
    },
  };
  const provider: WritingTranslationProvider = {
    id: "deterministic-test-provider",
    async translate(translationRequest) {
      if (translationRequest.targetLocale === "es") throw { code: "rate_limit" };
      return translationRequest.content;
    },
  };
  const results = await generateWritingTranslationsWithProvider({
    articleId: request.articleId,
    database,
    provider,
    sourceLocale: "de",
    sourceRevision: request.sourceRevision,
    targetLocales: ["en", "es", "tr"],
  });
  assert.deepEqual(results, [
    { locale: "en", status: "translated" },
    { locale: "es", status: "failed", failureCode: "rate_limit" },
    { locale: "tr", status: "skipped" },
  ]);
  assert.equal(calls.filter((call) => call.startsWith("complete_writing_translation_generation")).length, 1);
  assert.equal(calls.filter((call) => call.startsWith("fail_writing_translation_generation")).length, 1);
});

test("missing configuration performs no database work and returns bounded truthful failures", async () => {
  let databaseCalls = 0;
  const results = await generateWritingTranslationsWithProvider({
    articleId: request.articleId,
    database: { async rpc() { databaseCalls += 1; return { data: null, error: null }; } },
    provider: null,
    sourceLocale: "de",
    sourceRevision: request.sourceRevision,
  });
  assert.equal(databaseCalls, 0);
  assert.equal(results.length, 6);
  assert.ok(results.every((result) => result.status === "failed" && result.failureCode === "configuration_missing"));
});

test("structured output preserves document shape, URLs and protected BTS terms", () => {
  const translated = parseOpenAIWritingTranslationOutput(validOutput, request);
  assert.ok(translated);
  assert.equal(translated.title, "Why I built btshq.online");
  const link = translated.bodyJson.blocks[0].type === "divider" ? null : translated.bodyJson.blocks[0].content[1];
  assert.ok(link && link.type === "link");
  assert.equal(link.href, "https://btshq.online/writing");
  assert.equal(link.content[0].text, "btshq.online");
});

test("aligned text nodes reject empty redistribution while preserving intentional source empties", () => {
  const nonEmpty = JSON.parse(validOutput);
  assert.ok(parseOpenAIWritingTranslationOutput(JSON.stringify(nonEmpty), request));

  nonEmpty.translations[2].text = "";
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(nonEmpty), request), null);

  nonEmpty.translations[2].text = " \t ";
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(nonEmpty), request), null);

  const emptySource = structuredClone(request);
  const emptySourceBlock = emptySource.content.bodyJson.blocks[0];
  assert.notEqual(emptySourceBlock.type, "divider");
  if (emptySourceBlock.type === "divider") return;
  const emptySourceText = emptySourceBlock.content[2];
  assert.equal(emptySourceText.type, "text");
  if (emptySourceText.type !== "text") return;
  emptySourceText.text = "";
  const emptyTarget = JSON.parse(validOutput);
  emptyTarget.translations[2].text = "";
  assert.ok(parseOpenAIWritingTranslationOutput(JSON.stringify(emptyTarget), emptySource));
});

test("linked text nodes enforce the same source-aware non-empty invariant", () => {
  const linkedSource = structuredClone(request);
  const sourceBlock = linkedSource.content.bodyJson.blocks[0];
  assert.notEqual(sourceBlock.type, "divider");
  if (sourceBlock.type === "divider") return;
  const sourceLink = sourceBlock.content[1];
  assert.equal(sourceLink.type, "link");
  if (sourceLink.type !== "link") return;
  sourceLink.content[0].text = "Artikel";

  const linkedTarget = JSON.parse(validOutput);
  linkedTarget.translations[1].text = "Article";
  const linkedTranslation = parseOpenAIWritingTranslationOutput(JSON.stringify(linkedTarget), linkedSource);
  assert.ok(linkedTranslation);
  const linkedBlock = linkedTranslation.bodyJson.blocks[0];
  assert.notEqual(linkedBlock.type, "divider");
  if (linkedBlock.type !== "divider") {
    const translatedLink = linkedBlock.content[1];
    assert.equal(translatedLink.type, "link");
    if (translatedLink.type === "link") {
      assert.equal(translatedLink.href, "https://btshq.online/writing");
      assert.deepEqual(translatedLink.content[0].styles, { bold: true });
      assert.equal(translatedLink.content[0].text, "Article");
    }
  }

  linkedTarget.translations[1].text = "";
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(linkedTarget), linkedSource), null);

  linkedTarget.translations[1].text = "   ";
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(linkedTarget), linkedSource), null);
});

test("unit extraction is deterministic and includes block identity plus exact nested paths", () => {
  const nested = structuredClone(request.content.bodyJson);
  nested.blocks[0].id = "intro";
  nested.blocks[0].children = [{
    id: "child",
    type: "paragraph",
    content: [{ type: "text", text: "Verschachtelt" }],
  }];
  const first = extractWritingTranslationUnits(nested);
  const second = extractWritingTranslationUnits(nested);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((unit) => unit.id), [
    "block:intro|blocks[0].content[0]",
    "block:intro|blocks[0].content[1].content[0]",
    "block:intro|blocks[0].content[2]",
    "block:child|blocks[0].children[0].content[0]",
  ]);
});

test("source-owned rehydration preserves block, inline, style, link, href, order and whitespace", () => {
  const whitespaceSource = structuredClone(request.content.bodyJson);
  const block = whitespaceSource.blocks[0];
  assert.notEqual(block.type, "divider");
  if (block.type === "divider") return;
  const finalText = block.content[2];
  assert.equal(finalText.type, "text");
  if (finalText.type !== "text") return;
  finalText.text = "  Ende\n";
  const before = structuredClone(whitespaceSource);
  const units = extractWritingTranslationUnits(whitespaceSource);
  const translated = rehydrateWritingTranslationDocument(
    whitespaceSource,
    new Map(units.map((unit) => [unit.id, unit.id.endsWith("content[2]") ? "End" : unit.sourceText])),
  );
  assert.ok(translated);
  assert.deepEqual(whitespaceSource, before);
  const translatedBlock = translated.blocks[0];
  assert.notEqual(translatedBlock.type, "divider");
  if (translatedBlock.type === "divider") return;
  assert.deepEqual(translatedBlock.content[1], block.content[1]);
  const translatedFinal = translatedBlock.content[2];
  assert.equal(translatedFinal.type, "text");
  if (translatedFinal.type !== "text") return;
  assert.equal(translatedFinal.text, "  End\n");
});

test("missing, duplicate and unknown ids are rejected and cross-node redistribution is impossible", () => {
  const missing = JSON.parse(validOutput);
  missing.translations.pop();
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(missing), request), null);

  const duplicate = JSON.parse(validOutput);
  duplicate.translations[2] = { ...duplicate.translations[1] };
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(duplicate), request), null);

  const unknown = JSON.parse(validOutput);
  unknown.translations[2].id = "block:unknown|blocks[99].content[0]";
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(unknown), request), null);

  const redistributedSource = structuredClone(request);
  redistributedSource.content.bodyJson.blocks = [{
    id: "intent",
    type: "heading",
    level: 2,
    content: [
      { type: "text", text: "Was ich mit " },
      { type: "text", text: "btshq.online", styles: { bold: true } },
      { type: "text", text: " eigentlich bauen wollte" },
    ],
  }];
  const redistributedOutput = JSON.stringify({
    targetLocale: "en",
    title: "Why I built btshq.online",
    deck: "BTSHQ.ONLINE is my digital home.",
    teaser: "A complete teaser about btshq.online.",
    translations: [
      { id: "block:intent|blocks[0].content[0]", text: "What I actually wanted to build with" },
      { id: "block:intent|blocks[0].content[1]", text: "btshq.online" },
      { id: "block:intent|blocks[0].content[2]", text: "" },
    ],
  });
  assert.equal(parseOpenAIWritingTranslationOutput(redistributedOutput, redistributedSource), null);
});

test("invalid locale, protected text changes, punctuation-only omissions and summarization are rejected", () => {
  const wrongLocale = JSON.parse(validOutput);
  wrongLocale.targetLocale = "es";
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(wrongLocale), request), null);

  const changedProtectedTerm = JSON.parse(validOutput);
  changedProtectedTerm.translations[1].text = "BTS online";
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(changedProtectedTerm), request), null);

  const punctuationOnly = JSON.parse(validOutput);
  punctuationOnly.translations[0].text = ".";
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(punctuationOnly), request), null);

  const summarized = JSON.parse(validOutput);
  summarized.teaser = "Tiny";
  assert.equal(parseOpenAIWritingTranslationOutput(JSON.stringify(summarized), request), null);
});

test("targeted repair sends only invalid units and retains all valid first-pass work", async () => {
  const initial = JSON.parse(validOutput);
  initial.translations[2].text = "";
  const requests: Array<Record<string, unknown>> = [];
  const translated = await resolveOpenAIWritingTranslation(request, async (body) => {
    const input = JSON.parse(body.input[0].content[0].text) as Record<string, unknown>;
    requests.push(input);
    if (requests.length === 1) return JSON.stringify(initial);
    return JSON.stringify({
      targetLocale: "en",
      translations: [{ id: "block:~|blocks[0].content[2]", text: "." }],
    });
  });
  assert.ok(translated);
  assert.equal(requests.length, 2);
  assert.equal("title" in requests[1], false);
  const repairedUnits = requests[1].units;
  assert.ok(Array.isArray(repairedUnits));
  assert.equal(repairedUnits.length, 1);
  assert.equal((repairedUnits[0] as { id: string }).id, "block:~|blocks[0].content[2]");
  const firstBlock = translated.bodyJson.blocks[0];
  assert.notEqual(firstBlock.type, "divider");
  if (firstBlock.type !== "divider") {
    const firstText = firstBlock.content[0];
    assert.equal(firstText.type, "text");
    if (firstText.type === "text") assert.equal(firstText.text, "BTSHQ.ONLINE is a complete article with a link to ");
  }
});

test("bounded repair never returns or persists a partial locale", async () => {
  const invalid = JSON.parse(validOutput);
  invalid.translations[2].text = "";
  let providerCalls = 0;
  const translated = await resolveOpenAIWritingTranslation(request, async (body) => {
    providerCalls += 1;
    if (providerCalls === 1) return JSON.stringify(invalid);
    const input = JSON.parse(body.input[0].content[0].text) as { units: Array<{ id: string }> };
    return JSON.stringify({
      targetLocale: "en",
      translations: input.units.map((unit) => ({ id: unit.id, text: "" })),
    });
  });
  assert.equal(translated, null);
  assert.equal(providerCalls, 3);
  const repair = buildOpenAIWritingTranslationRepairRequest(request, extractWritingTranslationUnits(request.content.bodyJson).slice(0, 1));
  assert.equal(repair.text.format.name, "bts_writing_translation_repair");
});

test("generation never calls completion when the complete leaf contract cannot be produced", async () => {
  const calls: string[] = [];
  const database: WritingTranslationDatabase = {
    async rpc(name) {
      calls.push(name);
      if (name === "claim_writing_translation_generation") {
        return {
          data: [{
            claim_id: "11111111-1111-4111-8111-111111111111",
            article_id: request.articleId,
            source_locale: request.sourceLocale,
            target_locale: request.targetLocale,
            source_revision: request.sourceRevision,
            title: request.content.title,
            deck: request.content.deck,
            excerpt: request.content.excerpt,
            body_json: request.content.bodyJson,
          }],
          error: null,
        };
      }
      return { data: true, error: null };
    },
  };
  const provider: WritingTranslationProvider = {
    id: "incomplete-leaf-provider",
    async translate() {
      throw { code: "invalid_structured_response" };
    },
  };
  const result = await generateWritingTranslationsWithProvider({
    articleId: request.articleId,
    database,
    provider,
    sourceLocale: request.sourceLocale,
    sourceRevision: request.sourceRevision,
    targetLocales: [request.targetLocale],
  });
  assert.deepEqual(result, [{ locale: "en", status: "failed", failureCode: "invalid_structured_response" }]);
  assert.equal(calls.includes("complete_writing_translation_generation"), false);
  assert.equal(calls.filter((name) => name === "fail_writing_translation_generation").length, 1);
});

test("provider and orchestration are server-only, bounded, isolated and content-silent", () => {
  const provider = source("../lib/writing/openai-translation-provider.ts");
  const generation = source("../lib/writing/translation-generation-core.ts");
  assert.match(provider, /import "server-only"/u);
  assert.match(source("../lib/writing/translation-generation.ts"), /import "server-only"/u);
  assert.match(provider, /REQUEST_TIMEOUT_MS = 90_000/u);
  assert.match(provider, /MAX_ATTEMPTS = 2/u);
  assert.match(generation, /WRITING_TRANSLATION_GENERATION_CONCURRENCY = 3/u);
  assert.match(generation, /Promise\.all/u);
  assert.match(generation, /fail_writing_translation_generation/u);
  assert.doesNotMatch(`${provider}\n${generation}`, /console\.|logger/u);
});

test("publish schedules translations only after confirmed publication and keeps newsletter independent", () => {
  const actions = source("../app/admin/writing/actions.ts");
  const resultBoundary = actions.indexOf("if (error || !result");
  const newsletter = actions.indexOf("const newsletterPreparation = result.status");
  const automatic = actions.indexOf("scheduleAutomaticWritingTranslations({", newsletter);
  assert.ok(resultBoundary > 0 && resultBoundary < newsletter && newsletter < automatic);
  assert.match(actions, /after\(async \(\) =>/u);
  assert.match(actions, /authorizeWritingMutation\(\)/u);
  assert.doesNotMatch(actions.slice(actions.indexOf("scheduleAutomaticWritingTranslations"), actions.indexOf("type WritingMutationResult")), /sendNewsletter|begin_newsletter_send|provider campaign/iu);
});

test("generation migration provides AAL2 claims, idempotency and sanitized failures", () => {
  const sql = source("../supabase/migrations/20260927030000_writing_translation_generation.sql");
  const repair = source("../supabase/migrations/20260927040000_writing_translation_generation_claim_repair.sql");
  assert.match(source("../supabase/migrations/20260927000000_writing_completion.sql"), /primary key \(article_id, locale\)/u);
  assert.match(sql, /claim_writing_translation_generation/u);
  assert.match(sql, /perform public\.assert_bts_admin\(true\)/u);
  assert.match(sql, /for update/u);
  assert.match(sql, /generation_claim_id/u);
  assert.match(sql, /interval '10 minutes'/u);
  assert.match(sql, /complete_writing_translation_generation/u);
  assert.match(sql, /fail_writing_translation_generation/u);
  assert.match(sql, /grant execute[^;]+to authenticated/iu);
  assert.doesNotMatch(sql, /grant execute[^;]+to (?:anon|service_role)/iu);
  assert.doesNotMatch(sql, /raise\s+(?:notice|log)|title\s*\|\||body_json\s*\|\|/iu);
  assert.match(repair, /create or replace function public\.claim_writing_translation_generation/u);
  assert.match(repair, /on conflict on constraint writing_article_translations_pkey do nothing/u);
  assert.match(repair, /perform public\.assert_bts_admin\(true\)/u);
  assert.match(repair, /grant execute[^;]+to authenticated/iu);
  assert.doesNotMatch(repair, /grant execute[^;]+to (?:anon|service_role)/iu);
});

test("public fallback, metadata, sitemap and carousel consume the resolved locale", () => {
  const domain = source("../lib/writing/domain.ts");
  const page = source("../app/writing/[slug]/page.tsx");
  const sitemap = source("../app/sitemap.ts");
  assert.match(domain, /row\.status !== "translated"/u);
  assert.match(domain, /row\.source_revision !== sourceRevision/u);
  assert.match(page, /description: article\.excerpt/u);
  assert.match(page, /inLanguage: article\.language/u);
  assert.match(page, /writingDocumentToShareBlocks\(article\.bodyJson\)/u);
  assert.match(sitemap, /article\.availableLanguages\.map/u);
});

test("Privacy discloses only the server-side Writing-to-OpenAI data flow", () => {
  const privacy = source("../data/i18n/privacy.ts");
  const page = source("../app/privacy/page.tsx");
  assert.equal((privacy.match(/title: "(?:Automatische Writing-Übersetzungen|Automatic Writing translations|Traducciones automáticas de Writing|Otomatik Writing çevirileri|Automatyczne tłumaczenia Writing|Αυτόματες μεταφράσεις Writing|Автоматические переводы Writing)"/gu) ?? []).length, 7);
  assert.match(privacy, /OpenAI server-side/u);
  assert.match(privacy, /newsletter-subscriber/u);
  assert.match(page, /writingTranslationPrivacyCopy/u);
});

test("the OpenAI key never enters a client or public runtime boundary", () => {
  const provider = source("../lib/writing/openai-translation-provider.ts");
  const panel = source("../components/admin/writing-translations-panel.tsx");
  const env = source("../.env.example");
  assert.match(provider, /process\.env/u);
  assert.doesNotMatch(panel, /OPENAI_API_KEY|process\.env|fetch\(/u);
  assert.match(env, /^OPENAI_API_KEY=$/mu);
  assert.doesNotMatch(env, /NEXT_PUBLIC_OPENAI/u);
});

test("newsletter preparation remains opt-in and translation code cannot send", () => {
  const form = source("../components/admin/writing-form.tsx");
  const generation = source("../lib/writing/translation-generation-core.ts");
  const migration = source("../supabase/migrations/20260927030000_writing_translation_generation.sql");
  assert.match(form, /useState\(false\)/u);
  assert.doesNotMatch(`${generation}\n${migration}`, /newsletter_deliveries|newsletter_subscribers|begin_newsletter_send|sendNewsletter/u);
});
