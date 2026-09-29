import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canonicalNewsletterSiteOrigin,
  prepareWritingNewsletterDraft,
  writingNewsletterStatusQuery,
} from "../lib/newsletter/preparation";
import { writingNewsletterCopy } from "../data/i18n/writing-newsletter";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("newsletter preparation defaults off and never calls the RPC without explicit opt-in", async () => {
  let calls = 0;
  const result = await prepareWritingNewsletterDraft(false, async () => {
    calls += 1;
    return { data: null, error: null };
  });
  assert.equal(result, undefined);
  assert.equal(calls, 0);
  const form = source("../components/admin/writing-form.tsx");
  assert.match(form, /useState\(false\)/u);
  assert.match(form, /type="checkbox" checked=\{prepareNewsletter\}/u);
  assert.match(form, /if \(prepareNewsletter\) formData\.set\("prepareNewsletter", "on"\)/u);
});

test("successful, reused and historical edition outcomes remain truthful and linkable", async () => {
  const articleSlug = "published-writing";
  const editionId = "6f594b34-22eb-47bd-bee6-e35e7b77671a";
  for (const [editionState, outcome] of [
    ["draft", "created"],
    ["draft", "reused_draft"],
    ["sending", "existing_sending"],
    ["sent", "existing_sent"],
    ["failed", "existing_failed"],
  ] as const) {
    const result = await prepareWritingNewsletterDraft(true, async () => ({
      data: [{ edition_id: editionId, edition_state: editionState, outcome, article_slug: articleSlug }],
      error: null,
    }));
    assert.deepEqual(result, { status: outcome, editionId, editionState, articleSlug });
    assert.match(writingNewsletterStatusQuery(result), new RegExp(`newsletter=${outcome}`, "u"));
    assert.match(writingNewsletterStatusQuery(result), /newsletterEdition=6f594b34-22eb-47bd-bee6-e35e7b77671a/u);
  }
});

test("newsletter failure is isolated from successful publication and remains retryable", async () => {
  const rejected = await prepareWritingNewsletterDraft(true, async () => ({ data: null, error: { message: "unavailable" } }));
  const thrown = await prepareWritingNewsletterDraft(true, async () => { throw new Error("unavailable"); });
  assert.deepEqual(rejected, { status: "failed" });
  assert.deepEqual(thrown, { status: "failed" });

  const actions = source("../app/admin/writing/actions.ts");
  const failedPublishBoundary = actions.indexOf("if (error || !result");
  const preparation = actions.indexOf("const newsletterPreparation = result.status");
  assert.ok(failedPublishBoundary > 0 && failedPublishBoundary < preparation);
  assert.match(actions, /newsletterPreparation,/u);
  assert.match(actions, /retryWritingNewsletterPreparationAction/u);
  const retry = actions.slice(actions.indexOf("export async function retryWritingNewsletterPreparationAction"));
  assert.doesNotMatch(retry, /publish_writing_article_v3/u);
});

test("database preparation is AAL2 guarded, idempotent and cannot send", () => {
  const sql = source("../supabase/migrations/20260927020000_writing_newsletter_preparation.sql");
  const normalized = sql.toLowerCase();
  assert.match(sql, /create function public\.prepare_writing_newsletter_edition/u);
  assert.match(sql, /public\.assert_bts_admin\(true\)/u);
  assert.match(sql, /pg_advisory_xact_lock/u);
  assert.match(sql, /article\.status = 'published'/u);
  assert.match(sql, /edition\.state = 'draft'/u);
  assert.match(sql, /'reused_draft'::text/u);
  assert.match(sql, /edition\.state <> 'draft'/u);
  assert.match(sql, /'existing_sent'/u);
  assert.ok(sql.indexOf("'reused_draft'::text") < sql.indexOf("insert into public.newsletter_editions"));
  assert.ok(sql.indexOf("edition.state <> 'draft'") < sql.indexOf("insert into public.newsletter_editions"));
  assert.match(sql, /grant execute on function public\.prepare_writing_newsletter_edition[^;]+to authenticated/u);
  assert.doesNotMatch(sql, /grant execute on function public\.prepare_writing_newsletter_edition[^;]+to (?:anon|service_role)/u);
  assert.equal(normalized.includes("newsletter_deliveries"), false);
  assert.equal(normalized.includes("newsletter_subscribers"), false);
  assert.doesNotMatch(normalized, /begin_newsletter_send|claim_newsletter_delivery|send_newsletter|provider/u);
});

test("Writing Studio keeps the public redirect and places the localized opt-in at the final control", () => {
  const form = source("../components/admin/writing-form.tsx");
  assert.ok(form.indexOf("const result = await publishWritingAction") < form.indexOf("window.location.assign"));
  assert.match(form, /writingNewsletterStatusQuery\(result\.newsletterPreparation\)/u);
  assert.ok(form.indexOf("writing-article-settings") < form.indexOf("data-final-publish-control"));
  assert.ok(form.indexOf("data-final-publish-control") < form.indexOf("data-newsletter-preparation"));
  assert.match(form, /Nothing is sent|newsletterCopy\.prepareHint/u);

  assert.deepEqual(Object.keys(writingNewsletterCopy).sort(), ["de", "el", "en", "es", "pl", "ru", "tr"]);
  assert.equal(writingNewsletterCopy.de.prepare, "Newsletter vorbereiten");
  for (const copy of Object.values(writingNewsletterCopy)) {
    assert.ok(copy.prepare.length > 0);
    assert.ok(copy.prepared.length > 0);
    assert.ok(copy.preparationFailed.length > 0);
  }
});

test("status and retry remain admin-only and expose no subscriber data", () => {
  const page = source("../app/writing/[slug]/page.tsx");
  const status = source("../components/admin/writing-newsletter-status.tsx");
  const actions = source("../app/admin/writing/actions.ts");
  assert.match(page, /newsletterStatus \? verifyAdminAuthorization\(true\) : null/u);
  assert.match(page, /newsletterAdmin && newsletterStatus/u);
  assert.match(status, /retryWritingNewsletterPreparationAction/u);
  assert.match(status, /\/admin\/newsletter\/\$\{editionId\}/u);
  assert.match(actions, /authorizeWritingMutation\(\)/u);
  assert.match(actions, /formData\.get\("prepareNewsletter"\) === "on"/u);
  for (const value of [page, status, actions, source("../components/admin/writing-form.tsx")]) {
    assert.doesNotMatch(value, /subscriber(?:s|_id| email)?/iu);
  }
});

test("site-origin validation matches the existing secure draft architecture", () => {
  assert.equal(canonicalNewsletterSiteOrigin("https://btshq.online/path"), null);
  assert.equal(canonicalNewsletterSiteOrigin("http://localhost:3000"), "http://localhost:3000");
  assert.equal(canonicalNewsletterSiteOrigin("http://localhost:3000/path"), null);
  assert.equal(canonicalNewsletterSiteOrigin("http://btshq.online"), null);
  assert.equal(canonicalNewsletterSiteOrigin("ftp://localhost"), null);
});
