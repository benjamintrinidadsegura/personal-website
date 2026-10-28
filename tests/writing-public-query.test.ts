import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";

import * as domain from "../lib/writing/domain";
import * as hygiene from "../lib/public-content-hygiene";
import { withPublicWritingReadDeadline } from "../lib/writing/read-deadline";
import { locales } from "../lib/i18n/config";
import type * as Queries from "../lib/writing/queries";
import { loadSource } from "./helpers/load-source";
import { writingDiagnosticsHarness } from "./helpers/writing-diagnostics";

const bodyJson = { version: 1, blocks: [{ type: "paragraph", content: [{ type: "text", text: "A complete authored article, suitable for the public reading experience." }] }] };
const row = {
  id: "published-one", slug: "published-one", title: "Published source", deck: "An authored deck",
  excerpt: "An authored source teaser.", body: "A complete authored article, suitable for the public reading experience.",
  body_json: bodyJson, content_type: "essay", topics: ["Ideas"], status: "published",
  published_at: "2026-10-25T12:00:00Z", source_locale: "de", source_revision: 3,
};

type Response = { data: unknown; error: unknown; status?: number };
function publicQueries(response: Response | Error = { data: [], error: null }, configured = true, hang = false, client?: object, cacheResults = false, fetchImpl?: typeof globalThis.fetch, memoizeRequest = false) {
  const calls: Array<[string, ...unknown[]]> = [];
  const { diagnostics, records } = writingDiagnosticsHarness({ fetch: fetchImpl });
  const cacheArguments: unknown[][] = [];
  const cachePolicies: unknown[] = [];
  let signal: AbortSignal | undefined;
  const builder = {
    select: (...args: unknown[]) => { calls.push(["select", ...args]); return builder; },
    eq: (...args: unknown[]) => { calls.push(["eq", ...args]); return builder; },
    not: (...args: unknown[]) => { calls.push(["not", ...args]); return builder; },
    order: (...args: unknown[]) => { calls.push(["order", ...args]); return builder; },
    limit: (...args: unknown[]) => { calls.push(["limit", ...args]); return builder; },
    abortSignal: (value: AbortSignal) => { signal = value; return builder; },
    maybeSingle: () => builder,
    then: (resolve: (value: Response) => void, reject: (reason: Error) => void) => {
      if (hang) return;
      if (response instanceof Error) reject(response); else resolve(response);
    },
  };
  const queries = loadSource<typeof Queries>("lib/writing/queries.ts", {
    "react": { cache: (callback: (...args: unknown[]) => unknown) => {
      const request = new Map<string, unknown>();
      return (...args: unknown[]) => {
        if (!memoizeRequest) return callback(...args);
        const key = JSON.stringify(args);
        if (!request.has(key)) request.set(key, callback(...args));
        return request.get(key);
      };
    } },
    "next/cache": { unstable_cache: (callback: (...args: unknown[]) => unknown, keys: string[], options: object) => {
      cachePolicies.push({ keys, options });
      const values = new Map<string, unknown>();
      return (...args: unknown[]) => {
        cacheArguments.push(args);
        const key = JSON.stringify(args);
        if (!cacheResults) return callback(...args);
        if (!values.has(key)) values.set(key, callback(...args));
        return values.get(key);
      };
    } },
    "@/lib/writing/domain": domain,
    "@/lib/public-content-hygiene": hygiene,
    "@/lib/writing/read-deadline": { withPublicWritingReadDeadline: <T, F>(read: (signal: AbortSignal) => Promise<T>, fallback: F, _timeout?: number, onFailure?: Parameters<typeof withPublicWritingReadDeadline>[3]) => withPublicWritingReadDeadline(read, fallback, 10, onFailure) },
    "@/lib/writing/read-diagnostics": diagnostics,
    "@/lib/supabase/server": { getSupabaseServerClient: (options?: { fetch?: typeof globalThis.fetch }) => client ?? (fetchImpl
      ? createClient("https://fixture.invalid", "fixture-only", { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: options?.fetch } })
      : { from: (table: string) => { calls.push(["from", table]); return builder; } }) },
  }, { process: { env: configured ? { SUPABASE_URL: "https://fixture.invalid", SUPABASE_SECRET_KEY: "fixture-only" } : {} } });
  return { queries, calls, records, cacheArguments, cachePolicies, signal: () => signal };
}

test("one render shares a pending collection read across consumers without sharing consumer diagnostics", async () => {
  const fixture = publicQueries({ data: null, error: { code: "PGRST303" }, status: 401 }, true, false, undefined, false, undefined, true);
  const results = await Promise.all([
    fixture.queries.getPublishedWritingResult("de", { consumer: "home" }),
    fixture.queries.getPublishedWritingResult("de", { consumer: "writing_index" }),
  ]);
  assert.deepEqual(results, [{ status: "unavailable", data: [] }, { status: "unavailable", data: [] }]);
  assert.equal(fixture.calls.filter(([name]) => name === "from").length, 1);
  const deliveries = fixture.records.filter(({ operation }) => operation === "collection_result");
  assert.deepEqual(deliveries.map(({ consumer }) => consumer), ["home", "writing_index"]);
  assert.equal(deliveries[0].origin_read_id, deliveries[1].origin_read_id);
  assert.notEqual(deliveries[0].correlation_id, deliveries[1].correlation_id);
  await fixture.queries.getPublishedWritingResult("en");
  assert.equal(fixture.calls.filter(([name]) => name === "from").length, 2, "locales have separate request identities");
  await Promise.all([
    fixture.queries.getPublishedWritingBySlug("published-one", "de"),
    fixture.queries.getPublishedWritingBySlug("published-one", "de"),
  ]);
  assert.equal(fixture.calls.filter(([name]) => name === "from").length, 3, "article metadata and page share a read");
  const nextRequest = publicQueries({ data: [], error: null }, true, false, undefined, false, undefined, true);
  assert.deepEqual(await nextRequest.queries.getPublishedWritingResult("de"), { status: "data", data: [] });
  assert.equal(nextRequest.calls.filter(([name]) => name === "from").length, 1, "request memoization does not cross render boundaries");
});

test("HTTP 200 headers do not complete a collection read whose body stalls; deadline cancels without retries", async () => {
  let attempts = 0;
  let aborted = false;
  const fetch: typeof globalThis.fetch = async (_input, init) => {
    attempts++;
    const body = new ReadableStream<Uint8Array>({ start(controller) {
      init?.signal?.addEventListener("abort", () => {
        aborted = true;
        controller.error(new DOMException("fixture body cancelled", "AbortError"));
      }, { once: true });
    } });
    return new globalThis.Response(body, { status: 200, headers: { "content-type": "application/json", "sb-request-id": "01a1848c-1f79-7cd9-a9b0-78ba65215aa0" } });
  };
  const fixture = publicQueries(undefined, true, false, undefined, false, fetch);
  assert.deepEqual(await fixture.queries.getPublishedWritingResult("tr"), { status: "unavailable", data: [] });
  assert.equal(aborted, true);
  assert.equal(attempts, 1);
  assert.equal(fixture.records[0].http_status, 200);
  assert.equal(fixture.records[0].state, "timeout");
  assert.equal(fixture.records[0].error_class, "deadline");
  assert.equal(fixture.records[0].received_count, undefined, "validation was not reached");
  const settledRecords = JSON.stringify(fixture.records);
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(JSON.stringify(fixture.records), settledRecords, "late SDK rejection cannot rewrite the result or diagnostics");
});

test("a fully received HTTP 200 body must still pass document/publication validation", async () => {
  let attempts = 0;
  const fetch: typeof globalThis.fetch = async () => {
    attempts++;
    return new globalThis.Response(JSON.stringify([row, { ...row, status: "draft" }, { ...row, body_json: { version: 1, blocks: [{ type: "html" }] } }]), { headers: { "content-type": "application/json" } });
  };
  const fixture = publicQueries(undefined, true, false, undefined, false, fetch);
  const result = await fixture.queries.getPublishedWritingResult("de");
  assert.equal(result.status, "data");
  assert.deepEqual(result.data.map(({ id }) => id), [row.id]);
  assert.equal(attempts, 1);
  assert.equal(fixture.records[0].received_count, 3);
  assert.equal(fixture.records[0].accepted_count, 1);
});

test("public Writing requests publication gates and newest-first ordering, then removes invalid and synthetic records", async () => {
  const { queries, calls } = publicQueries({ data: [
    { ...row, id: "synthetic", title: "QA" },
    { ...row, id: "draft", status: "draft" },
    { ...row, id: "undated", published_at: null },
    row,
    { ...row, id: "older", slug: "older", published_at: "2026-10-24T12:00:00Z", content_type: "note" },
  ], error: null });
  const result = await queries.getPublishedWritingResult("de");
  assert.equal(result.status, "data");
  assert.deepEqual(result.data.map(({ id }) => id), ["published-one", "older"]);
  assert.deepEqual(calls.filter(([name]) => name !== "select"), [
    ["from", "writing_articles"], ["eq", "status", "published"],
    ["not", "slug", "is", null], ["not", "published_at", "is", null],
    ["order", "published_at", { ascending: false }], ["limit", 100],
  ]);
});

test("public Writing distinguishes a successful empty collection from errors, malformed responses, missing configuration and timeout", async () => {
  assert.deepEqual(await publicQueries().queries.getPublishedWritingResult(), { status: "data", data: [] });
  for (const response of [{ data: null, error: null }, { data: [], error: { message: "fixture failure" } }, new Error("fixture rejected read")]) {
    assert.deepEqual(await publicQueries(response).queries.getPublishedWritingResult(), { status: "unavailable", data: [] });
  }
  const missing = publicQueries(undefined, false);
  assert.deepEqual(await missing.queries.getPublishedWritingResult(), { status: "unavailable", data: [] });
  assert.deepEqual(missing.calls, []);
  const timeout = publicQueries(undefined, true, true);
  assert.deepEqual(await timeout.queries.getPublishedWritingResult(), { status: "unavailable", data: [] });
  assert.equal(timeout.signal()?.aborted, true);
  assert.equal(timeout.records.filter(({ operation }) => operation === "collection_origin").length, 1);
  assert.equal(timeout.records[0].state, "timeout");
  assert.equal(timeout.records[0].error_class, "deadline");
  assert.equal(timeout.records[1].origin_state, "timeout");
});

test("collection auth failures are sanitized and correlated for all seven locales", async () => {
  for (const locale of locales) {
    const fixture = publicQueries({ data: null, error: { code: "PGRST303", message: "JWT issued at future", details: "PRIVATE_TOKEN_AND_SESSION" }, status: 401 });
    assert.deepEqual(await fixture.queries.getPublishedWritingResult(locale, { consumer: "writing_index" }), { status: "unavailable", data: [] });
    const [origin, delivery] = fixture.records;
    assert.equal(origin.state, "unavailable");
    assert.equal(origin.error_class, "auth_claims");
    assert.equal(origin.claim_reason, "issued_in_future");
    assert.equal(origin.http_status, 401);
    assert.equal(origin.locale, locale);
    assert.equal(delivery.origin_read_id, origin.correlation_id);
    assert.equal(delivery.consumer, "writing_index");
    assert.doesNotMatch(JSON.stringify(fixture.records), /PRIVATE_TOKEN|JWT issued|SESSION/u);
  }
});

test("unavailable cache deliveries share an origin ID without adding consumer context to cache identity", async () => {
  const fixture = publicQueries({ data: null, error: { code: "PGRST303", message: "unknown private error" }, status: 401 }, true, false, undefined, true);
  await fixture.queries.getPublishedWritingResult("de", { consumer: "home" });
  await fixture.queries.getPublishedWritingResult("de", { consumer: "sitemap" });
  assert.equal(fixture.calls.filter(([name]) => name === "from").length, 1);
  assert.deepEqual(fixture.cacheArguments, [["de"], ["de"]]);
  assert.deepEqual(fixture.cachePolicies[0], { keys: ["published-writing"], options: { revalidate: 300, tags: ["published-writing"] } });
  const [origin, first, second] = fixture.records;
  assert.equal(first.origin_read_id, origin.correlation_id);
  assert.equal(second.origin_read_id, origin.correlation_id);
  assert.notEqual(first.correlation_id, second.correlation_id);
  assert.equal(origin.claim_reason, "unclassified");
});

test("successful collection diagnostics retain publication validation without exposing content or cache metadata", async () => {
  const fixture = publicQueries({ data: [row, { ...row, status: "draft" }, { ...row, title: "QA" }], error: null, status: 200 });
  const result = await fixture.queries.getPublishedWritingResult("en", { consumer: "home" });
  assert.deepEqual(Object.keys(result).sort(), ["data", "status"]);
  assert.equal(result.data.length, 1);
  assert.equal(fixture.records.length, 1);
  assert.equal(fixture.records[0].received_count, 3);
  assert.equal(fixture.records[0].accepted_count, 1);
  assert.equal(fixture.records[0].state, "success");
  assert.doesNotMatch(JSON.stringify(fixture.records), /Published source|published-one|complete authored|body_json|authored deck/iu);
});

test("publication and translation rules preserve one identity in every locale and reject stale or incomplete variants", async () => {
  for (const locale of locales) {
    const translation = { locale, title: `Translated ${locale}`, deck: "Translated deck", excerpt: "A current translated teaser.", body: row.body, body_json: bodyJson, status: "translated", source_revision: 3 };
    const source = { ...row, translations: [translation] };
    const current = (await publicQueries({ data: [source], error: null }).queries.getPublishedWritingResult(locale)).data[0];
    assert.ok(current);
    assert.equal(current.id, row.id);
    assert.equal(current.slug, row.slug);
    assert.equal(current.publishedAt, row.published_at);
    assert.equal(current.language, locale);
    assert.equal(current.translationStatus, locale === "de" ? "source" : "translated");
    assert.equal(current.title, locale === "de" ? row.title : translation.title);
    assert.deepEqual(current.availableLanguages, locales.filter((candidate) => candidate === "de" || candidate === locale));

    for (const invalid of [
      { status: "pending" }, { status: "stale" }, { status: "failed" }, { source_revision: 2 },
      { body_json: null }, { body_json: { version: 1, blocks: [{ type: "html" }] } },
    ]) {
      const fallback = domain.mapPublicWritingSummary({ ...row, translations: [{ ...translation, ...invalid }] }, locale);
      assert.ok(fallback);
      assert.equal(fallback.title, row.title);
      assert.equal(fallback.language, "de");
      assert.equal(fallback.translationStatus, locale === "de" ? "source" : "fallback");
      assert.deepEqual(fallback.availableLanguages, ["de"]);
    }
  }
});

test("public article reads reject unsafe slugs without querying and never expose drafts or synthetic content", async () => {
  const invalid = publicQueries({ data: row, error: null });
  for (const slug of ["../admin", "UPPERCASE", "two--hyphens", "", "a".repeat(97)]) assert.equal(await invalid.queries.getPublishedWritingBySlug(slug), null);
  assert.deepEqual(invalid.calls, []);
  for (const data of [{ ...row, status: "draft" }, { ...row, title: "QA" }, null]) {
    assert.equal(await publicQueries({ data, error: null }).queries.getPublishedWritingBySlug(row.slug), null);
  }
  const valid = publicQueries({ data: row, error: null });
  assert.equal((await valid.queries.getPublishedWritingBySlug(row.slug))?.slug, row.slug);
  assert.ok(valid.calls.some(([name, column, value]) => name === "eq" && column === "status" && value === "published"));
  assert.ok(valid.calls.some(([name, column, value]) => name === "eq" && column === "slug" && value === row.slug));
});

test("installed SDK preserves the deployed projection, source fallback and publication gates", async () => {
  const requests: URL[] = [];
  const client = createClient("https://fixture.invalid", "fixture-only", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      requests.push(new URL(input instanceof Request ? input.url : String(input)));
      return new globalThis.Response(JSON.stringify([{ ...row, translations: [] }]), { headers: { "Content-Type": "application/json" } });
    } },
  });
  const { queries } = publicQueries(undefined, true, false, client);
  for (const locale of locales) {
    const result = await queries.getPublishedWritingResult(locale);
    assert.equal(result.status, "data");
    assert.equal(result.data[0]?.id, row.id, "source articles must remain visible without translations");
    assert.equal(result.data[0]?.language, "de");
    assert.equal(result.data[0]?.translationStatus, locale === "de" ? "source" : "fallback");
    assert.deepEqual(result.data[0]?.availableLanguages, ["de"]);
    const request = requests.at(-1)!;
    assert.equal(request.pathname, "/rest/v1/writing_articles");
    assert.equal(request.searchParams.get("status"), "eq.published");
    assert.equal(request.searchParams.has("translations.status"), false);
    assert.equal(request.searchParams.get("order"), "published_at.desc");
    assert.equal(request.searchParams.get("limit"), "100");
    const fields = request.searchParams.get("select")!;
    assert.match(fields, /body,body_json/u);
    assert.match(fields, /translations:writing_article_translations\(locale,title,deck,excerpt,body,body_json,status,source_revision,generated_at\)/u);
    assert.doesNotMatch(fields, /!inner/u);
  }
  const article = await queries.getPublishedWritingBySlug(row.slug, "en");
  assert.equal(article?.id, row.id);
  assert.equal(article?.body, row.body);
  assert.equal(requests.at(-1)!.searchParams.get("slug"), `eq.${row.slug}`);
  assert.equal(requests.at(-1)!.searchParams.has("translations.status"), false, "individual article retrieval keeps its existing selection behavior");
});

test("the deployed full payload preserves revision validation and available languages in seven locales", async () => {
  const translatedBody = "Published translated writing. ".repeat(300);
  const translatedDocument = { version: 1, blocks: [{ type: "paragraph", content: [{ type: "text", text: translatedBody }] }] };
  const statuses = ["translated", "translated", "stale", "failed", "pending", "translated"];
  const translations = locales.filter((locale) => locale !== "de").map((locale, index) => ({
    locale, title: `Authored translation ${locale}`, deck: "Translated deck", excerpt: "A complete authored translated introduction.",
    body: translatedBody, body_json: index === 5 ? { version: 1, blocks: [{ type: "html" }] } : translatedDocument,
    status: statuses[index], source_revision: index === 1 ? 2 : 3, generated_at: "2026-10-25T12:00:00Z",
  }));
  const original = { ...row, translations };
  for (const locale of locales) {
    const expected = domain.mapPublicWritingSummary(original, locale);
    const actual = (await publicQueries({ data: [original], error: null }).queries.getPublishedWritingResult(locale)).data[0];
    assert.deepEqual(actual, expected, locale);
    assert.deepEqual(actual.availableLanguages, ["de", "en"], "stale revisions and invalid translated documents remain excluded");
    assert.equal(actual.translationStatus, locale === "de" ? "source" : locale === "en" ? "translated" : "fallback");
    assert.equal(actual.readingMinutes, domain.calculateReadingMinutes(locale === "en" ? translatedBody : row.body));
    assert.equal(actual.slug, row.slug);
    assert.equal(actual.publishedAt, row.published_at);
  }
});

test("the unchanged deployed publication rules reject invalid documents, withdrawn rows and synthetic variants", async () => {
  for (const invalid of [
    { ...row, status: "draft" }, { ...row, title: "Synthetic content" },
    { ...row, body: "Too short" }, { ...row, body_json: { version: 1, blocks: [{ type: "html" }] } },
  ]) {
    assert.deepEqual((await publicQueries({ data: [invalid], error: null }).queries.getPublishedWritingResult("en")).data, []);
  }
  const syntheticTranslation = { locale: "en", title: "Synthetic content", deck: row.deck, excerpt: row.excerpt, body: row.body, body_json: bodyJson, status: "translated", source_revision: 3 };
  assert.deepEqual((await publicQueries({ data: [{ ...row, translations: [syntheticTranslation] }], error: null }).queries.getPublishedWritingResult("en")).data, []);
});
