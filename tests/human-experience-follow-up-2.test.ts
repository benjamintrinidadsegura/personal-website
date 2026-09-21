import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { bindWorldMapWheelZoom } from "../lib/world-map";
import { withPublicWritingReadDeadline } from "../lib/writing/read-deadline";
import { deriveWritingTeaser } from "../lib/writing/teaser";
import { parseWritingInput } from "../lib/writing/validation";
import type { WritingDocumentV1 } from "../types/writing";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const document: WritingDocumentV1 = {
  version: 1,
  blocks: [
    { id: "paragraph_1", type: "paragraph", content: [{ type: "text", text: "Wir testen hier gerade einen echten redaktionellen Gedanken." }] },
    { id: "thought_2", type: "keyThought", content: [{ type: "text", text: "Author-curated thoughts become the strongest social cards." }] },
  ],
};

function writingFormData(overrides: { excerpt?: string; topics?: string[] } = {}): FormData {
  const data = new FormData();
  data.set("title", "A legitimate Writing story");
  data.set("deck", "A clear editorial deck for the complete story.");
  data.set("excerpt", overrides.excerpt ?? "");
  data.set("contentType", "essay");
  data.set("bodyJson", JSON.stringify(document));
  for (const topic of overrides.topics ?? []) data.append("topics", topic);
  return data;
}

test("FOLLOW-UP 2 Home public Writing reads have a finite aborting deadline and a truthful unavailable state", async () => {
  let aborted = false;
  const result = await withPublicWritingReadDeadline(async (signal) => new Promise<string>((resolve) => {
    signal.addEventListener("abort", () => {
      aborted = true;
      resolve("late");
    }, { once: true });
  }), "unavailable", 5);
  assert.equal(result, "unavailable");
  assert.equal(aborted, true);

  const queries = source("../lib/writing/queries.ts");
  const home = source("../app/page.tsx");
  const writing = source("../components/sections/writing.tsx");
  assert.match(queries, /\.abortSignal\(signal\)/u);
  assert.match(queries, /status: "unavailable"/u);
  assert.match(home, /getPublishedWritingResult/u);
  assert.match(home, /publishedWritingStatus=\{publishedWritingResult\.status\}/u);
  assert.match(writing, /data-writing-home-unavailable/u);
  assert.match(writing, /errorCopy\.viewTitle/u);
  assert.doesNotMatch(writing, /publishedWritingStatus === "unavailable"[\s\S]*placeholdersByLocale\[locale\]/u);
});

test("FOLLOW-UP 2 Studio distinguishes draft readiness from publish readiness and derives only authored teaser suggestions", () => {
  const draft = parseWritingInput(writingFormData(), "draft");
  assert.equal(draft.success, true);
  const blockedPublish = parseWritingInput(writingFormData(), "publish");
  assert.equal(blockedPublish.success, false);
  if (blockedPublish.success) assert.fail("Publish should require teaser and topic");
  assert.deepEqual(Object.keys(blockedPublish.fieldErrors).sort(), ["excerpt", "topics"]);
  assert.equal(deriveWritingTeaser("Short", document), "Wir testen hier gerade einen echten redaktionellen Gedanken.");

  const publishable = parseWritingInput(writingFormData({ excerpt: deriveWritingTeaser("", document) ?? "", topics: ["Work"] }), "publish");
  assert.equal(publishable.success, true);

  const form = source("../components/admin/writing-form.tsx");
  assert.match(form, /data-draft-readiness/u);
  assert.match(form, /data-publication-readiness/u);
  assert.match(form, /required before publishing/u);
  assert.match(form, /Suggested from your article/u);
  assert.match(form, /Use this teaser/u);
  assert.match(form, /settingsRef\.current\?\.setAttribute\("open", ""\)/u);
  assert.match(form, /querySelector<HTMLElement>\(selectorByField\[firstField\]\)\?\.focus\(\)/u);
  assert.match(form, /Publish blocked/u);
  assert.match(form, /localValidation = parseWritingInput\(formData, "publish"\)/u);
  assert.ok(form.indexOf("localValidation = parseWritingInput") < form.indexOf("publishWritingAction(null, formData)"));
});

test("FOLLOW-UP 2 Writing has distinct article and author-curated thought share levels on the accepted card foundation", () => {
  const article = source("../app/writing/[slug]/page.tsx");
  const card = source("../components/writing/share/share-card.tsx");
  const documentRenderer = source("../components/writing/writing-document.tsx");
  const editor = source("../components/admin/writing-editor.tsx");
  const dictionaries = source("../data/i18n/writing-share.ts");
  assert.match(article, /kind: "article"/u);
  assert.match(article, /text: article\.excerpt/u);
  assert.match(article, /ShareArticleTrigger[\s\S]*articleTrigger/u);
  assert.match(card, /data-content=\{source\.kind/u);
  assert.match(card, /writing-share-card-article-title/u);
  assert.match(card, /writing-share-card-article-teaser/u);
  assert.match(documentRenderer, /kind: "thought"/u);
  assert.match(editor, /Share-ready via \/ · Key Thought · Pull Quote · Shareable/u);
  assert.equal((dictionaries.match(/articleTrigger:/gu) ?? []).length, 8);
  assert.equal((dictionaries.match(/selectedArticle:/gu) ?? []).length, 8);
});

test("FOLLOW-UP 2 desktop wheel input remains map-owned at zoom bounds while mobile and outside-page contracts stay separate", () => {
  let listener: ((event: WheelEvent) => void) | undefined;
  const target = {
    addEventListener: (_type: string, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) => {
      assert.deepEqual(options, { passive: false });
      listener = callback as (event: WheelEvent) => void;
    },
    removeEventListener: () => undefined,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 400 }),
  } as unknown as HTMLElement;
  bindWorldMapWheelZoom(target, () => true);
  let prevented = false;
  listener?.({ deltaX: 0, deltaY: 120, clientX: 400, clientY: 200, preventDefault: () => { prevented = true; } } as WheelEvent);
  assert.equal(prevented, true);

  const component = source("../components/world-map/world-map-experience.tsx");
  assert.match(component, /if \(nextZoom !== zoom\) setMapZoom/u);
  assert.match(component, /return true;/u);
  assert.match(component, /matchMedia\("\(pointer: coarse\)"\)\.matches\) return false/u);
  assert.match(component, /touch-pan-y/u);
  assert.doesNotMatch(component, /window\.addEventListener\(["']wheel/u);
});

test("FOLLOW-UP 2 country and relevant place labels live inside the transformed geography while pins remain interactive", () => {
  const geometry = source("../lib/world-map-geometry.ts");
  const component = source("../components/world-map/world-map-experience.tsx");
  const css = source("../app/globals.css");
  assert.match(geometry, /path\.centroid/u);
  assert.match(component, /data-map-transform/u);
  assert.match(component, /data-map-country-labels/u);
  assert.match(component, /data-map-country-label=\{country\.id\}/u);
  assert.match(component, /data-map-place-labels/u);
  assert.match(component, /zoom >= 1\.6/u);
  assert.match(component, /!location\.cityId && !location\.regionId/u);
  assert.match(component, /world-map-pin world-map-pin-cluster/u);
  assert.match(component, /world-map-detail/u);
  assert.match(css, /\.world-map-country-label/u);
  assert.match(css, /\.world-map-place-label/u);
  assert.match(css, /pointer-events:\s*none/u);
});
