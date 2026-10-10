import assert from "node:assert/strict";
import { test } from "node:test";
import { blockNoteToWritingDocument, captureWritingEditorState } from "../lib/writing/editor-state";
import { readWritingRecovery, removeWritingRecovery, writeWritingRecovery, WRITING_RECOVERY_PREFIX, WRITING_RECOVERY_TTL_MS, type WritingRecoveryEntry } from "../lib/writing/draft-recovery";

class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const paragraph = () => ({ id: "paragraph", type: "paragraph", props: { backgroundColor: "default", textColor: "default", textAlignment: "left" }, content: [{ type: "text", text: "Original\nÜber Menschen · Ελληνικά · Русский", styles: { bold: true, italic: false } }], children: [] });
const entry = (owner = "owner", capturedAt = 1_000): WritingRecoveryEntry => ({ version: 1, articleId: "article", owner, capturedAt, baseUpdatedAt: "2026-10-10T17:13:00Z", fields: { title: "Title", deck: "Deck", excerpt: "An authored excerpt", contentType: "essay", sourceLocale: "de", topics: [] }, raw: [paragraph()] });

test("capture is independent of parser success and preserves unknown nodes/properties/styles exactly", () => {
  for (const raw of [
    [{ ...paragraph(), type: "unknownNode", extension: { original: true } }],
    [{ ...paragraph(), props: { ...paragraph().props, textAlignment: "center" } }],
    [{ ...paragraph(), content: [{ type: "text", text: "Not plain text", styles: { textColor: "blue" } }] }],
  ]) {
    const original = structuredClone(raw);
    const captured = captureWritingEditorState(raw);
    assert.equal(captured.validation.success, false);
    assert.deepEqual(captured.raw, original);
    raw[0].id = "changed-after-capture";
    assert.deepEqual(captured.raw, original, "not a mutable reference to live editor state");
  }
});

test("errors identify block, nested node and property without echoing private authored text", () => {
  const raw = [paragraph(), { ...paragraph(), id: "parent", children: [{ ...paragraph(), id: "child", props: { ...paragraph().props, textColor: "blue" } }] }];
  const result = blockNoteToWritingDocument(raw);
  assert.equal(result.success, false);
  if (result.success) return;
  assert.match(result.message, /Block\[2\].*children\[1\].*props\.textColor/u);
  assert.doesNotMatch(result.message, /Original|Über Menschen/u);
  assert.match(result.message, /nothing has been removed/u);
});

test("default and matching ordered-list starts are supported; custom numbering/restarts are preserved and blocked", () => {
  const numbered = (id: string, start?: number) => ({ ...paragraph(), id, type: "numberedListItem", props: { ...paragraph().props, start } });
  for (const starts of [[undefined, undefined], [1, 2]]) assert.equal(blockNoteToWritingDocument([numbered("one", starts[0]), numbered("two", starts[1])]).success, true);
  for (const raw of [[numbered("one", 2)], [numbered("one", 1), numbered("two", 1)]]) {
    const captured = captureWritingEditorState(raw);
    assert.equal(captured.validation.success, false);
    if (!captured.validation.success) assert.match(captured.validation.message, /props\.start/u);
    assert.deepEqual(captured.raw, raw);
  }
});

test("local recovery retains raw invalid contents/metadata per article and per editor; reading never restores or mutates", () => {
  const storage = new MemoryStorage();
  const first = entry("one");
  first.raw = [{ ...paragraph(), props: { ...paragraph().props, textAlignment: "center" } }];
  const second = { ...entry("two", 2_000), fields: { ...entry().fields, title: "Another local version" } };
  assert.equal(writeWritingRecovery(storage, first).ok, true);
  assert.equal(writeWritingRecovery(storage, second).ok, true);
  assert.equal(writeWritingRecovery(storage, { ...entry("three"), articleId: "other-article" }).ok, true);
  const before = [...storage.values];
  const loaded = readWritingRecovery(storage, "article", 3_000);
  assert.equal(loaded.error, null);
  assert.equal(loaded.candidates.length, 2);
  assert.deepEqual(loaded.candidates[1].entry.raw, first.raw);
  assert.deepEqual([...storage.values], before, "only explicit user restoration can change the editor");
});

test("recovery expiry and size/count/total limits retain existing non-expired copies", () => {
  const storage = new MemoryStorage();
  writeWritingRecovery(storage, entry("expired", 1_000));
  writeWritingRecovery(storage, entry("recent", 1_001));
  const read = readWritingRecovery(storage, "article", 1_000 + WRITING_RECOVERY_TTL_MS);
  assert.deepEqual(read.candidates.map((item) => item.entry.owner), ["recent"]);
  for (let index = 0; index < 7; index++) assert.equal(writeWritingRecovery(storage, entry(`slot-${index}`)).ok, true);
  const before = [...storage.values];
  assert.equal(writeWritingRecovery(storage, entry("overflow")).ok, false);
  assert.deepEqual([...storage.values], before);
  const oversized = { ...entry("recent"), raw: ["x".repeat(512 * 1024)] };
  assert.equal(writeWritingRecovery(storage, oversized).ok, false);
  assert.deepEqual([...storage.values], before, "oversized updates cannot erase prior raw backups");
  const total = new MemoryStorage();
  for (let index = 0; index < 4; index++) assert.equal(writeWritingRecovery(total, { ...entry(`large-${index}`), raw: ["x".repeat(450 * 1024)] }).ok, true);
  assert.equal(writeWritingRecovery(total, { ...entry("too-large-total"), raw: ["x".repeat(450 * 1024)] }).ok, false);
  assert.equal(total.length, 4);
});

test("storage errors and corrupt records are reported, never destroy the raw copy", () => {
  const storage = new MemoryStorage();
  const key = `${WRITING_RECOVERY_PREFIX}article.corrupt`;
  storage.setItem(key, "{raw-corrupt");
  assert.match(readWritingRecovery(storage, "article", 3_000).error ?? "", /could not be read/u);
  assert.equal(storage.getItem(key), "{raw-corrupt");
  const blocked = { length: 0, key: () => null, getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); }, removeItem: () => undefined };
  assert.equal(writeWritingRecovery(blocked, entry()).ok, false);
  const denied = { ...blocked, get length(): number { throw new Error("SecurityError"); } };
  assert.match(readWritingRecovery(denied, "article").error ?? "", /unavailable/u);
});

test("explicit cleanup cannot delete a recovery copy updated by another active editor", () => {
  const storage = new MemoryStorage();
  writeWritingRecovery(storage, entry());
  const candidate = readWritingRecovery(storage, "article", 2_000).candidates[0];
  writeWritingRecovery(storage, { ...entry(), fields: { ...entry().fields, title: "Newer contents" } });
  assert.equal(removeWritingRecovery(storage, candidate).ok, false);
  assert.equal(storage.length, 1);
  const fresh = readWritingRecovery(storage, "article", 2_000).candidates[0];
  assert.equal(removeWritingRecovery(storage, fresh).ok, true);
  assert.equal(storage.length, 0);
});

test("recovery rejects extra metadata/snapshot fields rather than letting them overwrite the restored document", () => {
  for (const malformed of [
    { ...entry(), fields: { ...entry().fields, document: { version: 1, blocks: [] } } },
    { ...entry(), snapshot: { document: { version: 1, blocks: [] } } },
  ]) {
    const storage = new MemoryStorage();
    const key = `${WRITING_RECOVERY_PREFIX}article.owner`;
    const token = JSON.stringify(malformed);
    storage.setItem(key, token);
    const read = readWritingRecovery(storage, "article", 2_000);
    assert.equal(read.candidates.length, 0);
    assert.match(read.error ?? "", /could not be read/u);
    assert.equal(storage.getItem(key), token, "raw backup stays intact for manual inspection/download");
  }
});
