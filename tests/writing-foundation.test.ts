import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WritingDocument } from "../components/writing/writing-document";
import { createPublishedWritingDiscoveryItems, discoveryIndex } from "../data/discovery-index";
import { discoverItems } from "../lib/discovery";
import {
  isSafeWritingLink,
  legacyBodyToWritingDocument,
  validateWritingDocument,
  writingDocumentToPlainText,
} from "../lib/writing/document";
import { calculateReadingMinutes, mapAdminWritingArticle, mapPublicWritingArticle, mapPublicWritingSummary } from "../lib/writing/domain";
import { createWritingSlugBase, writingSlugCandidate } from "../lib/writing/slug";
import { parseWritingInput } from "../lib/writing/validation";
import type { WritingDocumentV1 } from "../types/writing";

const document: WritingDocumentV1 = {
  version: 1,
  blocks: [
    { type: "heading", level: 2, content: [{ type: "text", text: "A structured beginning", styles: { bold: true } }] },
    { type: "paragraph", content: [{ type: "text", text: "This is a sufficiently long structured article body." }] },
  ],
};

const publishedRow = {
  id: "11111111-1111-4111-8111-111111111111",
  author_id: "22222222-2222-4222-8222-222222222222",
  slug: "starten-bevor-man-bereit-ist",
  title: "Starten, bevor man bereit ist",
  deck: "Fortschritt beginnt vor dem perfekten Moment.",
  excerpt: "Ein ausreichend langer Teaser fÃ¼r einen Writing-Artikel.",
  body: writingDocumentToPlainText(document),
  body_json: document,
  content_type: "essay",
  topics: ["Building", "Life"],
  status: "published",
  created_at: "2026-08-13T10:00:00.000Z",
  updated_at: "2026-08-13T11:00:00.000Z",
  published_at: "2026-08-13T11:00:00.000Z",
};

function validFormData() {
  const formData = new FormData();
  formData.set("title", publishedRow.title);
  formData.set("deck", publishedRow.deck);
  formData.set("excerpt", publishedRow.excerpt);
  formData.set("bodyJson", JSON.stringify(document));
  formData.set("contentType", publishedRow.content_type);
  for (const topic of publishedRow.topics) formData.append("topics", topic);
  return formData;
}

test("Writing validation accepts structured publish input and permits incomplete drafts", () => {
  assert.equal(parseWritingInput(validFormData(), "publish").success, true);
  const draft = validFormData();
  draft.set("title", "");
  draft.set("excerpt", "");
  draft.set("bodyJson", JSON.stringify(legacyBodyToWritingDocument("")));
  assert.equal(parseWritingInput(draft, "draft").success, true);

  const invalid = validFormData();
  invalid.set("title", "x");
  invalid.set("bodyJson", JSON.stringify(legacyBodyToWritingDocument("short")));
  invalid.delete("topics");
  const result = parseWritingInput(invalid, "publish");
  assert.equal(result.success, false);
  if (!result.success) assert.deepEqual(Object.keys(result.fieldErrors).sort(), ["bodyJson", "title", "topics"]);
});

test("WritingDocumentV1 rejects malformed, unexpected, oversized, deeply nested, and overlong content", () => {
  assert.equal(validateWritingDocument(null).success, false);
  assert.equal(validateWritingDocument({ version: 2, blocks: [] }).success, false);
  assert.equal(validateWritingDocument({ ...document, extra: true }).success, false);
  assert.equal(validateWritingDocument({ version: 1, blocks: [{ type: "image", content: [] }] }).success, false);
  assert.equal(validateWritingDocument({ version: 1, blocks: [{ type: "paragraph", props: { textAlignment: "center" }, content: [] }] }).success, false);
  assert.equal(validateWritingDocument({ version: 1, blocks: [{ type: "heading", level: 1, content: [] }] }).success, false);
  assert.equal(validateWritingDocument({ version: 1, blocks: Array.from({ length: 501 }, () => ({ type: "paragraph", content: [] })) }).success, false);
  assert.equal(validateWritingDocument({ version: 1, blocks: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(24_001) }] }] }).success, false);
  const nested = (depth: number): unknown => ({ type: "paragraph", content: [], children: depth > 0 ? [nested(depth - 1)] : [] });
  assert.equal(validateWritingDocument({ version: 1, blocks: [nested(5)] }).success, false);
  const oversized = { version: 1, blocks: Array.from({ length: 100 }, (_, index) => ({ type: "paragraph", content: [{ type: "link", href: `https://example.com/${index}/${"x".repeat(1_450)}`, content: [] }] })) };
  assert.equal(validateWritingDocument(oversized).success, false);
});

test("Writing document validation messages retain valid German text", () => {
  assert.deepEqual(validateWritingDocument(null), { success: false, message: "Das Dokumentformat wird nicht unterstützt." });
  assert.deepEqual(validateWritingDocument({ version: 1, blocks: [] }), { success: false, message: "Das Dokument benötigt mindestens einen Block." });
  assert.equal(validateWritingDocument({ version: 1, blocks: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(24_001) }] }] }).success, false);
  const source = readFileSync(new URL("../lib/writing/document.ts", import.meta.url), "utf8");
  assert.equal(source.includes("Ã"), false);
});

test("Writing links allow site-relative, fragments, HTTP/S and reject unsafe or obfuscated schemes", () => {
  for (const href of ["/", "/writing", "#section", "https://example.com/path", "http://example.com"]) assert.equal(isSafeWritingLink(href), true, href);
  for (const href of ["javascript:alert(1)", "java\tscript:alert(1)", "data:text/html,x", "file:///tmp/a", "blob:https://example.com/id", "//evil.example", "java%73cript:alert(1)", "https://user:pass@example.com", "not a url"]) assert.equal(isSafeWritingLink(href), false, href);
});

test("legacy body conversion is in-memory, deterministic, and preserves readable text", () => {
  const legacy = "First paragraph.\n\nSecond paragraph.\nwith a line break.";
  const converted = legacyBodyToWritingDocument(legacy);
  assert.equal(converted.blocks.length, 2);
  assert.equal(writingDocumentToPlainText(converted), legacy);
  const mapped = mapAdminWritingArticle({ ...publishedRow, body: legacy, body_json: null });
  assert.ok(mapped);
  assert.equal(mapped.bodyJson, null);
  assert.equal(mapped.body, legacy);
});

test("controlled renderer emits semantic markup, escapes text, and protects external links", () => {
  const hostile: WritingDocumentV1 = { version: 1, blocks: [
    { type: "paragraph", content: [{ type: "text", text: "<script>alert(1)</script>", styles: { italic: true } }] },
    { type: "heading", level: 3, content: [{ type: "text", text: "Heading", styles: { bold: true } }] },
    { type: "bulletListItem", content: [{ type: "text", text: "Item" }] },
    { type: "quote", content: [{ type: "link", href: "https://example.com", content: [{ type: "text", text: "Safe link" }] }] },
    { type: "divider" },
  ] };
  const html = renderToStaticMarkup(createElement(WritingDocument, { document: hostile }));
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/u);
  assert.doesNotMatch(html, /<script>/u);
  assert.match(html, /<h3/u);
  assert.match(html, /<ul/u);
  assert.match(html, /<blockquote/u);
  assert.match(html, /<hr/u);
  assert.match(html, /target="_blank"/u);
  assert.match(html, /rel="noopener noreferrer"/u);
});

test("slug generation is stable, URL-safe, and collision candidates are deterministic", () => {
  assert.equal(createWritingSlugBase("  \u00dcber Arbeit & Gr\u00f6\u00dfe!  "), "uber-arbeit-grosse");
  assert.equal(createWritingSlugBase("***"), "writing");
  assert.equal(writingSlugCandidate("essay", 1), "essay");
  assert.equal(writingSlugCandidate("essay", 2), "essay-2");
  assert.equal(writingSlugCandidate("foo", 2), writingSlugCandidate("foo-2", 1));
});

test("public row mapping rejects drafts, validates JSON, and never exposes author_id", () => {
  const draft = { ...publishedRow, status: "draft", slug: null, published_at: null };
  assert.equal(mapPublicWritingSummary(draft), null);
  assert.equal(mapPublicWritingArticle(draft), null);
  assert.equal(mapPublicWritingArticle({ ...publishedRow, body_json: { version: 1, blocks: [{ type: "image" }] } }), null);
  const article = mapPublicWritingArticle(publishedRow);
  assert.ok(article);
  assert.equal("author_id" in article, false);
  assert.deepEqual(article.bodyJson, document);
  assert.equal(article.slug, publishedRow.slug);
});

test("reading time uses the derived safe plain-text body", () => {
  assert.equal(calculateReadingMinutes("one two"), 1);
  assert.equal(calculateReadingMinutes(Array.from({ length: 221 }, () => "word").join(" ")), 2);
});

test("published Writing becomes searchable Discovery content with a stable public href", () => {
  const summary = mapPublicWritingSummary({ ...publishedRow, title: "Writing Test" });
  assert.ok(summary);
  const staticItems = discoveryIndex.filter((item) => !item.id.match(/^writing-\d+$/u));
  const composedItems = [...staticItems, ...createPublishedWritingDiscoveryItems([summary])];
  assert.equal(composedItems.some(({ id }) => id === "page-writing"), true);
  for (const id of ["writing-1", "writing-2", "writing-3"]) assert.equal(composedItems.some((item) => item.id === id), false);
  const [match] = discoverItems(composedItems, "Writing Test");
  assert.equal(match?.item.id, `writing-${publishedRow.id}`);
  assert.equal(match?.item.href, `/writing/${publishedRow.slug}`);
});

test("updated published metadata replaces Discovery content while preserving slug", () => {
  const original = mapPublicWritingSummary({ ...publishedRow, title: "Writing Test" });
  const updated = mapPublicWritingSummary({ ...publishedRow, title: "Writing Test Update" });
  assert.ok(original && updated);
  const [originalItem] = createPublishedWritingDiscoveryItems([original]);
  const [updatedItem] = createPublishedWritingDiscoveryItems([updated]);
  assert.equal(updatedItem.id, originalItem.id);
  assert.equal(updatedItem.href, originalItem.href);
  assert.equal(discoverItems([updatedItem], "Writing Test Update")[0]?.item.title, "Writing Test Update");
});

test("public queries remain published-only and BlockNote stays out of public routes", () => {
  const queries = readFileSync(new URL("../lib/writing/queries.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/writing/[slug]/page.tsx", import.meta.url), "utf8");
  const renderer = readFileSync(new URL("../components/writing/writing-document.tsx", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  assert.match(queries, /\.eq\("status", "published"\)/u);
  assert.equal(queries.includes("author_id"), false);
  assert.equal(queries.includes("body_json"), true);
  assert.equal(route.includes("if (!article) notFound()"), true);
  assert.equal(route.includes("if (!article) return {}"), true);
  assert.equal(route.includes("@blocknote"), false);
  assert.equal(renderer.includes("@blocknote"), false);
  assert.equal(renderer.includes("dangerouslySetInnerHTML"), false);
  assert.equal(sitemap.includes("getPublishedWriting"), true);
});

test("Ticket 1A migration retains AAL2, least privilege, concurrency, and slug permanence", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260813000000_writing_foundation.sql", import.meta.url), "utf8").toLowerCase();
  assert.equal(sql.includes("enable row level security"), true);
  assert.equal(sql.includes("revoke all on table public.writing_articles from public, anon, authenticated, service_role"), true);
  assert.equal(sql.includes("grant select on table public.writing_articles to service_role"), true);
  assert.equal(/grant\s+(insert|update|delete|truncate|references|trigger|all)\b[^;]*writing_articles/iu.test(sql), false);
  assert.equal(sql.includes("assert_bts_admin(true)"), true);
  assert.equal(sql.includes("pg_advisory_xact_lock(pg_catalog.hashtext('writing-slug-allocation'))"), true);
  assert.equal(sql.includes("v_slug := v_existing_slug"), true);
  assert.equal(sql.includes("published_at = coalesce(wa.published_at"), true);
});

test("Ticket 1B migration is additive, shallow-validates JSON, and keeps v1 RPCs", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260813010000_writing_visual_editor.sql", import.meta.url), "utf8").toLowerCase();
  assert.equal(sql.includes("add column body_json jsonb"), true);
  assert.equal(sql.includes("body_json is null"), true);
  assert.equal(sql.includes("pg_column_size(body_json) <= 131072"), true);
  assert.equal(sql.includes("create function public.save_writing_draft_v2"), true);
  assert.equal(sql.includes("create function public.publish_writing_article_v2"), true);
  assert.equal(sql.includes("drop function"), false);
  assert.equal(sql.includes("and wa.status = 'draft'"), true);
  assert.equal(sql.includes("wa.updated_at = p_expected_updated_at"), true);
  assert.equal(sql.includes("v_slug := v_existing_slug"), true);
  assert.equal(sql.includes("published_at = coalesce(wa.published_at"), true);
  assert.equal(sql.includes("grant execute on function public.save_writing_draft_v2"), true);
  assert.equal(/grant\s+execute\b[^;]*to\s+service_role/iu.test(sql), false);
  assert.equal(sql.includes("notify pgrst, 'reload schema';"), true);
});

test("server actions validate structured input and isolate draft/public invalidation", () => {
  const actions = readFileSync(new URL("../app/admin/writing/actions.ts", import.meta.url), "utf8");
  assert.equal(actions.includes("verifyAdminAuthorization(true)"), true);
  assert.equal(actions.includes("isAllowedRequestOrigin"), true);
  assert.equal(actions.includes("p_body_json: input.bodyJson"), true);
  assert.equal(actions.includes('rpc("save_writing_draft_v2"'), true);
  assert.equal(actions.includes('rpc("publish_writing_article_v2"'), true);
  assert.equal(actions.includes('mode === "save" && result.status !== "draft"'), true);
  assert.equal(actions.includes('mode === "publish" && result.status !== "published"'), true);
  const studioStart = actions.indexOf("function invalidateWritingStudio");
  const publicStart = actions.indexOf("function invalidatePublishedWriting");
  const publicHelper = actions.slice(publicStart, actions.indexOf("export async function createWritingDraftAction"));
  assert.equal(actions.slice(studioStart, publicStart).includes("updateTag"), false);
  assert.equal(publicHelper.includes('updateTag("published-writing")'), true);
  assert.equal(publicHelper.includes('revalidatePath("/", "layout")'), true);
  assert.equal(publicHelper.includes('revalidatePath(`/writing/${slug}`)'), true);
  assert.equal(publicHelper.indexOf('updateTag("published-writing")') < publicHelper.indexOf("refresh()"), true);
});

test("Studio implements debounced serialized draft autosave and explicit published updates", () => {
  const form = readFileSync(new URL("../components/admin/writing-form.tsx", import.meta.url), "utf8");
  assert.equal(form.includes("const AUTOSAVE_DELAY_MS = 1_200"), true);
  assert.equal(form.includes("if (savePromiseRef.current)"), true);
  assert.equal(form.includes("await savePromiseRef.current"), true);
  assert.equal(form.includes("generationRef.current"), true);
  assert.equal(form.includes("savedGenerationRef.current"), true);
  assert.equal(form.includes('article.status !== "draft"'), true);
  assert.equal(form.includes("runDraftSave"), true);
  assert.equal(form.includes("publishWritingAction(null, toFormData"), true);
  assert.equal(form.includes("Update Published"), true);
  assert.equal(form.includes("Unpublished changes"), true);
  assert.equal(form.includes("beforeunload"), true);
  assert.equal(form.includes("Retry save"), true);
  assert.equal(form.includes('result?.code === "conflict"'), true);
});

test("Studio guards every local-change phase across links, reload, Back, and Forward", () => {
  const form = readFileSync(new URL("../components/admin/writing-form.tsx", import.meta.url), "utf8");
  for (const phase of ["dirty", "waiting", "saving", "failed", "conflict"]) assert.equal(form.includes(`"${phase}"`), true, phase);
  assert.equal(form.includes('const hasUnsavedChanges = phase !== "saved"'), true);
  assert.equal(form.includes("if (!hasUnsavedChanges) return"), true);
  assert.equal(form.includes('addEventListener("beforeunload"'), true);
  assert.equal(form.includes('addEventListener("navigate", guardNavigation)'), true);
  assert.equal(form.includes('addEventListener("popstate", guardHistory, true)'), true);
  assert.equal(form.includes("event.stopImmediatePropagation()"), true);
  assert.equal(form.includes('window.history.pushState(guardedState, "", guardedUrl)'), true);
  assert.equal(form.includes("allowConfirmedNavigation()"), true);
  assert.equal(form.includes("confirmedNavigationRef.current"), true);
});

test("Studio synchronizes the latest editor snapshot before save or publish", () => {
  const form = readFileSync(new URL("../components/admin/writing-form.tsx", import.meta.url), "utf8");
  const markChanged = form.slice(form.indexOf("const markChanged"), form.indexOf("const runDraftSave"));
  assert.equal(markChanged.includes("const next = update(snapshotRef.current)"), true);
  assert.equal(markChanged.includes("snapshotRef.current = next"), true);
  assert.equal(markChanged.indexOf("snapshotRef.current = next") < markChanged.indexOf("setSnapshot(next)"), true);
  assert.equal(form.includes("useEffect(() => { snapshotRef.current = snapshot; }, [snapshot])"), false);
  assert.equal(form.includes("toFormData(article.id, expectedUpdatedAtRef.current, snapshotRef.current)"), true);
});

test("Edit and Preview remount the editor from the current lossless local snapshot", () => {
  const form = readFileSync(new URL("../components/admin/writing-form.tsx", import.meta.url), "utf8");
  assert.equal(form.includes("document: initialDocument"), true);
  assert.equal(form.includes("<WritingEditor initialDocument={snapshot.document}"), true);
  assert.equal(form.includes("<WritingEditor initialDocument={initialDocument}"), false);
  assert.equal(form.includes("<WritingDocument document={snapshot.document}"), true);
  assert.equal(form.includes("key={snapshot.document}"), false);

  const structuredDocument: WritingDocumentV1 = { version: 1, blocks: [
    { type: "heading", level: 2, content: [{ type: "text", text: "Current heading", styles: { italic: true } }] },
    { type: "bulletListItem", content: [{ type: "text", text: "Current list item" }] },
    { type: "quote", content: [{ type: "link", href: "https://example.com", content: [{ type: "text", text: "Current safe link" }] }] },
    { type: "divider" },
  ] };
  const localSnapshot = {
    title: "Current title",
    deck: "Current deck",
    excerpt: "Current excerpt",
    contentType: "essay" as const,
    topics: ["Building", "Life"],
    document: structuredDocument,
  };
  const remount = (current: typeof localSnapshot) => current;
  const afterRepeatedCycles = remount(remount(remount(localSnapshot)));
  assert.deepEqual(afterRepeatedCycles, localSnapshot);
  assert.deepEqual(afterRepeatedCycles.document, structuredDocument);
  assert.deepEqual(afterRepeatedCycles.document.blocks.map((block) => block.type), ["heading", "bulletListItem", "quote", "divider"]);
});

test("mode switching is local-only and publishing reads the latest snapshot ref", () => {
  const form = readFileSync(new URL("../components/admin/writing-form.tsx", import.meta.url), "utf8");
  const modeControls = form.slice(form.indexOf('(["edit", "preview"] as const)'), form.indexOf("{article.status === \"draft\""));
  assert.equal(modeControls.includes("setMode(view)"), true);
  assert.equal(modeControls.includes("publishWritingAction"), false);
  assert.equal(modeControls.includes("saveWritingAction"), false);
  assert.equal(modeControls.includes("runDraftSave"), false);
  assert.equal(form.includes("publishWritingAction(null, toFormData(article.id, expectedUpdatedAtRef.current, snapshotRef.current))"), true);
  assert.equal(form.includes('if (article.status !== "draft" || phase !== "waiting" || editorError) return'), true);
});

test("Writing editor dependency versions stay on the approved security patch", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
  assert.equal(packageJson.dependencies.next, "16.2.11");
  assert.equal(packageJson.devDependencies["eslint-config-next"], "16.2.11");
  assert.equal(lock.packages["node_modules/next"].version, "16.2.11");
  assert.equal(lock.packages["node_modules/eslint-config-next"].version, "16.2.11");
  for (const name of ["@blocknote/core", "@blocknote/react", "@blocknote/ariakit"]) {
    assert.equal(packageJson.dependencies[name], "0.52.1", name);
    assert.equal(lock.packages[`node_modules/${name}`].version, "0.52.1", name);
  }
});

test("editor exposure and preview are restricted to the approved structured surface", () => {
  const editor = readFileSync(new URL("../components/admin/writing-editor.tsx", import.meta.url), "utf8");
  const adapter = readFileSync(new URL("../lib/writing/blocknote-adapter.ts", import.meta.url), "utf8");
  const form = readFileSync(new URL("../components/admin/writing-form.tsx", import.meta.url), "utf8");
  assert.equal(editor.includes("@blocknote/ariakit/style.css"), true);
  assert.equal(editor.includes('basicTextStyle="bold"'), true);
  assert.equal(editor.includes('basicTextStyle="italic"'), true);
  assert.equal(editor.includes("CreateLinkButton"), true);
  assert.equal(editor.includes('setAttribute("aria-label", "Article document")'), true);
  assert.equal(editor.includes('aria-label="Undo last document change"'), true);
  assert.equal(editor.includes('aria-label="Redo document change"'), true);
  assert.equal(editor.includes("allowedSlashKeys"), true);
  for (const unsupported of ["image:", "video:", "audio:", "file:", "table:", "codeBlock:"]) assert.equal(adapter.includes(unsupported), false);
  assert.equal(adapter.includes("levels: [2, 3]"), true);
  assert.equal(form.includes('ssr: false'), true);
  assert.equal(form.includes("<WritingDocument document={snapshot.document}"), true);
});

test("Writing Studio polish keeps writing primary and secondary settings compact", () => {
  const editor = readFileSync(new URL("../components/admin/writing-editor.tsx", import.meta.url), "utf8");
  const form = readFileSync(new URL("../components/admin/writing-form.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/admin/writing/[id]/page.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.equal(editor.includes('role="toolbar" aria-label="Document history"'), true);
  assert.equal(editor.includes('aria-label="Undo last document change"'), true);
  assert.equal(editor.includes('aria-label="Redo document change"'), true);
  assert.equal(editor.includes('focus-visible:ring-2'), true);
  assert.equal(editor.includes('>Undo</button>'), false);
  assert.equal(editor.includes('>Redo</button>'), false);

  assert.equal(form.includes('placeholder="Article title"'), true);
  assert.equal(form.includes('placeholder="Deck or subtitle"'), true);
  assert.equal(form.includes('aria-label={article.status === "published" ? "Update published article" : "Publish article"}'), true);
  assert.equal(form.includes('const settingsSummary ='), true);
  assert.match(form, /<details className="[^"]*group[^"]*">/u);
  assert.equal(form.includes('<details className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7" open>'), false);
  assert.equal(form.includes("initialDocument={snapshot.document}"), true);
  assert.equal(form.includes("initialDocument={initialDocument}"), false);

  assert.equal(page.includes("px-4 py-8 sm:px-8 sm:py-10"), true);
  assert.equal(css.includes("max-width: min(calc(100vw - 2rem), 34rem)"), true);
  assert.equal(css.includes("overflow-wrap: anywhere"), true);
  assert.equal(css.includes("max-width: 72ch"), true);
});

test("root layout still composes published Writing and suppresses only placeholders", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.equal(layout.includes("publishedWriting.length > 0"), true);
  assert.equal(layout.includes("!item.id.match(/^writing-\\d+$/u)"), true);
  assert.equal(layout.includes("createPublishedWritingDiscoveryItems(publishedWriting)"), true);
  assert.equal(layout.includes("<DiscoveryProvider items={discoveryItems}>"), true);
});

test("server action payload remains bounded and no raw HTML rendering is introduced", () => {
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  const files = ["../components/writing/article-body.tsx", "../components/writing/writing-document.tsx", "../components/admin/writing-form.tsx", "../components/admin/writing-editor.tsx"];
  assert.equal(config.includes('bodySizeLimit: "192kb"'), true);
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(source.includes("dangerouslySetInnerHTML"), false, file);
    assert.equal(source.includes("innerHTML"), false, file);
  }
});
