import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

import { getShareFileDictionary } from "../data/i18n/share-file";
import { writingShareDictionaries } from "../data/i18n/writing-share";
import { isWritingSnapshotDirty, writingNavigationLeavesDocument, writingSnapshotFingerprint, type WritingSnapshotContent } from "../lib/writing/dirty-state";
import { shareCardFallbackOrder, shareCardFile, shareCardPixelSize, supportsNativeFileShare } from "../lib/sharing/native-card-share";
import { parseWritingInput } from "../lib/writing/validation";
import { writingShareFormats, type WritingActionState } from "../types/writing";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const original: WritingSnapshotContent = {
  title: "An authored story",
  deck: "The full human context",
  excerpt: "A brief public invitation",
  contentType: "essay",
  topics: ["Life"],
  document: { version: 1, blocks: [{ id: "author-id", type: "keyThought", content: [{ type: "text", text: "A thought." }] }] },
};

function draftSaveHarness() {
  // Execute the production callbacks with deferred persistence and observable
  // React state setters, rather than duplicating their reconciliation logic.
  const form = ts.createSourceFile("writing-form.tsx", source("../components/admin/writing-form.tsx"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const callbacks = new Map<string, string>();
  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === "toFormData") callbacks.set("toFormData", node.getText(form));
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && ["markChanged", "runDraftSave"].includes(node.name.text)) {
      assert.ok(node.initializer && ts.isCallExpression(node.initializer));
      const callback = node.initializer.arguments[0];
      assert.ok(ts.isArrowFunction(callback));
      callbacks.set(node.name.text, `const ${node.name.text} = ${callback.getText(form)};`);
    }
    ts.forEachChild(node, visit);
  };
  visit(form);
  assert.equal(callbacks.size, 3);
  const compiled = ts.transpileModule(`${[...callbacks.values()].join("\n")}\n({ markChanged, runDraftSave });`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const initial: WritingSnapshotContent = { ...original, sourceLocale: "de", topics: [] };
  const state = { editor: initial, persisted: writingSnapshotFingerprint(original), phase: "waiting", reconciliations: 0 };
  const refs = {
    snapshotRef: { current: state.editor },
    currentFingerprintRef: { current: writingSnapshotFingerprint(state.editor) },
    persistedFingerprintRef: { current: state.persisted },
    expectedUpdatedAtRef: { current: "2026-10-05T10:00:00.000Z" },
    sourceRevisionRef: { current: 1 },
    generationRef: { current: 1 },
    savedGenerationRef: { current: 0 },
    savePromiseRef: { current: null as Promise<WritingActionState> | null },
    publishingRef: { current: false },
    editorErrorRef: { current: null as string | null },
    editorStateRef: { current: { raw: [] } },
    recoveryPausedRef: { current: false },
  };
  let finish!: (result: WritingActionState) => void;
  const pending = new Promise<WritingActionState>((resolve) => { finish = resolve; });
  const requests: FormData[] = [];
  const production = runInNewContext(compiled, {
    ...refs, FormData, parseWritingInput, writingSnapshotFingerprint, isWritingSnapshotDirty,
    article: { id: "fixture", status: "draft" }, editorError: null,
    currentEditorIsValid: () => !refs.editorErrorRef.current,
    cacheCurrentDraft: () => undefined, finishRecoverySave: () => undefined,
    saveWritingAction: (_state: WritingActionState, data: FormData) => { requests.push(data); return pending; },
    setSnapshot: (next: WritingSnapshotContent) => { state.editor = next; state.reconciliations += 1; },
    setPersistedFingerprint: (next: string) => { state.persisted = next; },
    setPhase: (next: string | ((current: string) => string)) => { state.phase = typeof next === "function" ? next(state.phase) : next; },
    setLastAction: () => undefined, setFeedback: () => undefined,
    setServerUpdatedAt: () => undefined,
  }) as { runDraftSave: () => Promise<WritingActionState>; markChanged: (update: (current: WritingSnapshotContent) => WritingSnapshotContent) => void };
  return { ...refs, state, requests, finish, save: production.runDraftSave, edit: production.markChanged };
}

const successfulDraftSave: WritingActionState = { ok: true, message: "Draft saved.", updatedAt: "2026-10-05T10:00:01.000Z", sourceRevision: 2 };

test("FOLLOW-UP 3 successful draft normalization reconciles the editor and identity from the persisted saved snapshot", async () => {
  const harness = draftSaveHarness();
  const saving = harness.save();
  assert.deepEqual(harness.state.editor.topics, [], "in-flight normalization is not persistence");
  const persisted = parseWritingInput(harness.requests[0], "draft");
  assert.ok(persisted.success);
  assert.deepEqual(persisted.data.topics, ["Ideas"]);
  harness.finish(successfulDraftSave);
  await saving;
  assert.deepEqual(harness.state.editor.topics, persisted.data.topics);
  assert.equal(harness.snapshotRef.current, harness.state.editor, "the editor receives the reconciled state");
  assert.equal(harness.state.persisted, writingSnapshotFingerprint({ ...original, topics: persisted.data.topics }));
  assert.equal(harness.currentFingerprintRef.current, harness.state.persisted);
  assert.equal(harness.state.phase, "saved");
  assert.equal(harness.state.reconciliations, 1);
});

test("FOLLOW-UP 3 successful normalization preserves newer content edited during autosave", async () => {
  const harness = draftSaveHarness();
  const saving = harness.save();
  harness.edit((current) => ({ ...current, title: "Newer title", document: { version: 1, blocks: [{ id: "newer-id", type: "paragraph", content: [{ type: "text", text: "Newer authored text." }] }] } }));
  const newerDocument = harness.state.editor.document;
  harness.finish(successfulDraftSave);
  await saving;
  assert.equal(harness.state.editor.title, "Newer title");
  assert.equal(harness.state.editor.document, newerDocument);
  assert.deepEqual(harness.state.editor.topics, ["Ideas"]);
  assert.equal(harness.state.persisted, writingSnapshotFingerprint({ ...original, topics: ["Ideas"] }));
  assert.equal(isWritingSnapshotDirty(harness.currentFingerprintRef.current, harness.state.persisted), true);
  assert.equal(harness.state.phase, "waiting");
});

test("FOLLOW-UP 3 successful normalization preserves a newer topic selection during autosave", async () => {
  const harness = draftSaveHarness();
  const saving = harness.save();
  harness.edit((current) => ({ ...current, topics: ["Work"] }));
  const newerEditor = harness.state.editor;
  harness.finish(successfulDraftSave);
  await saving;
  assert.equal(harness.state.editor, newerEditor, "save completion does not replace newer editor state");
  assert.deepEqual(harness.state.editor.topics, ["Work"]);
  assert.equal(harness.state.persisted, writingSnapshotFingerprint({ ...original, topics: ["Ideas"] }));
  assert.equal(isWritingSnapshotDirty(harness.currentFingerprintRef.current, harness.state.persisted), true);
  assert.equal(harness.state.phase, "waiting");
});

test("FOLLOW-UP 3 failed saves never reconcile normalized topics or acknowledge a persisted revision", async () => {
  for (const code of ["error", "validation", "conflict"] as const) {
    const harness = draftSaveHarness();
    const saving = harness.save();
    harness.edit((current) => ({ ...current, title: "Still unsaved" }));
    const newerEditor = harness.state.editor;
    const reconciliations = harness.state.reconciliations;
    harness.finish({ ok: false, code, message: "Save rejected." });
    await saving;
    assert.equal(harness.state.editor, newerEditor);
    assert.deepEqual(harness.state.editor.topics, []);
    assert.equal(harness.state.reconciliations, reconciliations);
    assert.equal(harness.state.persisted, writingSnapshotFingerprint(original));
    assert.equal(harness.persistedFingerprintRef.current, harness.state.persisted);
    assert.equal(harness.expectedUpdatedAtRef.current, "2026-10-05T10:00:00.000Z");
    assert.equal(harness.savedGenerationRef.current, 0);
    assert.equal(isWritingSnapshotDirty(harness.currentFingerprintRef.current, harness.state.persisted), true);
    assert.equal(harness.state.phase, code === "conflict" ? "conflict" : "failed");
  }
});

test("FOLLOW-UP 3 semantic draft identity ignores regenerated block IDs but detects authored edits", () => {
  const persisted = writingSnapshotFingerprint(original);
  assert.equal(isWritingSnapshotDirty(writingSnapshotFingerprint(original), persisted), false);
  assert.equal(isWritingSnapshotDirty(writingSnapshotFingerprint({ ...original, document: { version: 1, blocks: [{ ...original.document.blocks[0], id: "remounted-id" }] } }), persisted), false);
  const edit = { ...original, title: "An edited story" };
  assert.equal(isWritingSnapshotDirty(writingSnapshotFingerprint(edit), persisted), true);
  assert.equal(isWritingSnapshotDirty(writingSnapshotFingerprint(original), persisted), false, "undo to the saved content is clean");
});

test("FOLLOW-UP 3 save identity keeps newer edits dirty through in-flight, stale, failed, and publish outcomes", () => {
  const saved = writingSnapshotFingerprint(original);
  const editA = writingSnapshotFingerprint({ ...original, title: "Version A" });
  const editB = writingSnapshotFingerprint({ ...original, title: "Version B" });
  assert.equal(isWritingSnapshotDirty(editA, saved), true, "edit after opening saved draft");
  assert.equal(isWritingSnapshotDirty(editA, saved), true, "in-flight save is not persistence");
  assert.equal(isWritingSnapshotDirty(editB, editA), true, "stale A save cannot clear newer B");
  assert.equal(isWritingSnapshotDirty(editB, saved), true, "failed save retains the original persisted identity");
  assert.equal(isWritingSnapshotDirty(editA, editA), false, "successful save is clean");
  assert.equal(isWritingSnapshotDirty(editB, editA), true, "edit after save becomes dirty");
  assert.equal(isWritingSnapshotDirty(editB, editB), false, "successful publish is clean");
  assert.equal(isWritingSnapshotDirty(editA, editA), false, "validation failure does not turn an already-saved draft dirty");
});

test("FOLLOW-UP 3 clean same-document navigation does not count as leaving", () => {
  const here = "https://btshq.online/admin/writing/id?tab=editor";
  assert.equal(writingNavigationLeavesDocument(here, "#document"), false);
  assert.equal(writingNavigationLeavesDocument(here, here), false);
  assert.equal(writingNavigationLeavesDocument(here, "/admin/writing/id?tab=preview"), true);
  assert.equal(writingNavigationLeavesDocument(here, "/writing/story"), true);
  assert.equal(writingNavigationLeavesDocument(here, "https://other.example/"), true);
});

test("FOLLOW-UP 3 Studio guards actual unsaved identity, acks only submitted revisions, and skips same-route events", () => {
  const form = source("../components/admin/writing-form.tsx");
  assert.match(form, /const hasUnsavedChanges = isDirty/u);
  assert.doesNotMatch(form, /if \(!hasUnsavedChanges\) return/u, "live raw-state guards must already be installed while the editor is clean");
  assert.match(form, /const stillDirty = \(\) => !!editorErrorRef\.current \|\| isWritingSnapshotDirty\(currentFingerprintRef\.current, persistedFingerprintRef\.current\)/u);
  assert.match(form, /if \(confirmedNavigationRef\.current \|\| !stillDirty\(\)\) return/u);
  assert.match(form, /event\.preventDefault\(\);\s*event\.returnValue = ""/u);
  assert.match(form, /const savingFingerprint = writingSnapshotFingerprint\(savedSnapshot\)/u);
  assert.match(form, /persistedFingerprintRef\.current = savingFingerprint/u);
  assert.match(form, /isWritingSnapshotDirty\(currentFingerprintRef\.current, savingFingerprint\)/u);
  assert.match(form, /const publishingFingerprint = writingSnapshotFingerprint\(publishedSnapshot\)/u);
  assert.match(form, /persistedFingerprintRef\.current = publishingFingerprint/u);
  assert.match(form, /if \(!localValidation\.success\) \{/u);
  assert.match(form, /writingNavigationLeavesDocument\(window\.location\.href, navigationEvent\.destination\.url\)/u);
  assert.doesNotMatch(form, /phase !== "saved"/u);
});

test("FOLLOW-UP 3 Article and short curated Thought triggers share both formats and canonical public route", () => {
  const article = source("../app/writing/[slug]/page.tsx");
  const document = source("../components/writing/writing-document.tsx");
  const composer = source("../components/writing/share/share-composer.tsx");
  const carouselActions = source("../components/writing/share/carousel-file-actions.tsx");
  const card = source("../components/writing/share/share-card.tsx");
  assert.match(article, /ShareArticleTrigger/u);
  assert.match(article, /kind: "article"/u);
  assert.match(document, /kind: "thought"/u);
  assert.match(document, /block\.type === "keyThought"/u);
  assert.match(document, /block\.type === "pullQuote"/u);
  assert.match(document, /block\.type === "shareable"/u);
  assert.match(composer, /writingShareFormats\.map/u);
  assert.match(card, /data-content=\{source\.kind/u);
  assert.match(composer, /source=\{source\}/u);
  assert.match(carouselActions, /url: source\.canonicalUrl/u);
  assert.match(composer, /Screenshot-Modus|screenshotMode/u);
  assert.doesNotMatch(composer, /history\.back\(/u);
});

test("FOLLOW-UP 3 real PNG sizes, native capability, cancel, and fallback order remain explicit", () => {
  assert.deepEqual(writingShareFormats.map((format) => shareCardPixelSize[format]), [{ width: 1080, height: 1920 }, { width: 1080, height: 1350 }, { width: 1080, height: 1080 }]);
  const file = new File(["png"], "card.png", { type: "image/png" });
  assert.equal(supportsNativeFileShare({}, file), false);
  assert.equal(supportsNativeFileShare({ canShare: () => false, share: async () => undefined }, file), false);
  assert.equal(supportsNativeFileShare({ canShare: () => true, share: async () => undefined }, file), true);
  assert.equal(supportsNativeFileShare({ canShare: () => { throw Error("blocked"); }, share: async () => undefined }, file), false);
  assert.deepEqual(shareCardFallbackOrder(true), ["download", "copy-image", "screenshot"]);
  assert.deepEqual(shareCardFallbackOrder(false), ["download", "screenshot"]);
  const fileActions = source("../components/sharing/share-file-actions.tsx");
  const primitive = source("../lib/sharing/native-card-share.ts");
  assert.match(fileActions, /error\.name === "AbortError"/u);
  assert.match(fileActions, /setFeedback\("actionFailed"\)/u);
  assert.match(primitive, /navigator\.share\(\{ files: \[file\]/u);
  assert.match(primitive, /new File\(\[blob\]/u);
  assert.match(primitive, /document\.body\.appendChild\(link\)/u);
  assert.match(primitive, /URL\.revokeObjectURL\(url\)/u);
});

test("FOLLOW-UP 3 native file share sends canonical source and propagates rejection or cancellation", async () => {
  const file = new File(["png"], "writing.png", { type: "image/png" });
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let payload: ShareData | undefined;
  try {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      canShare: (candidate: ShareData) => candidate.files?.[0] === file,
      share: async (candidate: ShareData) => { payload = candidate; },
    } });
    await shareCardFile(file, { title: "Story", text: "Authored thought", url: "https://btshq.online/writing/story" });
    assert.equal(payload?.files?.[0], file);
    assert.equal(payload?.text, "Authored thought\nhttps://btshq.online/writing/story");
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      canShare: () => true,
      share: async () => { throw new DOMException("Canceled", "AbortError"); },
    } });
    await assert.rejects(shareCardFile(file, { title: "Story", text: "Thought" }), { name: "AbortError" });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { canShare: () => false, share: async () => undefined } });
    await assert.rejects(shareCardFile(file, { title: "Story", text: "Thought" }), /unavailable/u);
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});

test("FOLLOW-UP 3 copy image, copy text/link, screenshot, renderer timeout, and no false share success", () => {
  const composer = source("../components/writing/share/share-composer.tsx");
  const fileActions = source("../components/sharing/share-file-actions.tsx");
  const primitive = source("../lib/sharing/native-card-share.ts");
  assert.match(fileActions, /copyShareCardFile\(file\)/u);
  assert.match(composer, /navigator\.clipboard\.writeText\(value\)/u);
  assert.match(composer, /copy\.copyText/u);
  assert.match(composer, /copy\.copyLink/u);
  assert.match(composer, /clipboardFallback/u);
  assert.match(composer, /writing-share-dialog-screenshot/u);
  assert.match(primitive, /document\.fonts\.ready/u);
  assert.match(primitive, /8_000/u);
  assert.doesNotMatch(fileActions, /setFeedback\("shared"\)/u);
  assert.doesNotMatch(composer, /dangerouslySetInnerHTML/u);
  assert.doesNotMatch(composer, /fetch\(/u);
  assert.equal(getShareFileDictionary("de").actionFailed.length > 0, true);
  assert.equal(writingShareDictionaries.de.copyText.length > 0, true);
});
