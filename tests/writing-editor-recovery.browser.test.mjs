import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, beforeEach, test } from "node:test";
import { build } from "esbuild";
import { parseWritingInput } from "../lib/writing/validation.ts";
import { blockNoteToWritingDocument } from "../lib/writing/editor-state.ts";

// Run with tsx --test. Use installed Playwright, or the desktop's bundled
// runtime through BTS_WRITING_BROWSER_PACKAGE_DIR; no package/lockfile changes.
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); }
catch {
  assert.ok(process.env.BTS_WRITING_BROWSER_PACKAGE_DIR, "Provide Playwright or BTS_WRITING_BROWSER_PACKAGE_DIR; browser regressions must not silently skip.");
  playwright = await import(pathToFileURL(path.join(process.env.BTS_WRITING_BROWSER_PACKAGE_DIR, "playwright/index.mjs")).href);
}

const initial = () => ({
  id: "studio-fixture", title: "Ein vollständiger Writing-Testentwurf", deck: "A complete authored draft", excerpt: "A meaningful invitation to read.",
  contentType: "essay", sourceLocale: "de", topics: ["Ideas"], body: "Persisted original content.",
  bodyJson: { version: 1, blocks: [{ id: "original", type: "paragraph", content: [{ type: "text", text: "Persisted original content." }] }] },
  slug: null, status: "draft", sourceRevision: 1, createdAt: "2026-10-10T16:00:00.000Z", updatedAt: "2026-10-10T16:00:00.000Z", publishedAt: null,
});
let browser, context, page, server, origin, article, requests, pending, hold, failure, bundle, allowReload, allowRestore;
const faults = [];

before(async () => {
  const reactPath = require.resolve("@blocknote/react").replace(/blocknote-react\.cjs$/u, "blocknote-react.js").replaceAll("\\", "/");
  bundle = await build({
    entryPoints: ["tests/fixtures/writing-studio-browser.tsx"], outfile: "fixture.js", bundle: true, write: false,
    platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
    plugins: [{ name: "writing-local-boundary", setup(builder) {
      builder.onResolve({ filter: /^@\/app\/admin\/writing\/actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
      builder.onLoad({ filter: /./, namespace: "fixture" }, () => ({ loader: "js", contents: `
        async function send(mode, data) {
          const response = await fetch('/__fixture/save', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({mode,entries:[...data.entries()]})});
          if(!response.ok) throw new Error('Fixture network failure');
          return response.json();
        }
        export const saveWritingAction = (_state,data) => send('draft',data);
        export const publishWritingAction = (_state,data) => send('publish',data);` }));
      builder.onResolve({ filter: /^@blocknote\/react$/ }, () => ({ path: "observe-editor", namespace: "observe" }));
      builder.onLoad({ filter: /./, namespace: "observe" }, () => ({ loader: "js", resolveDir: process.cwd(), contents: `
        export * from ${JSON.stringify(reactPath)};
        import {useCreateBlockNote as actual} from ${JSON.stringify(reactPath)};
        export function useCreateBlockNote(options,deps) {
          const editor=actual(options,deps);
          window.__writingEditor=editor;
          (window.__writingEditors ??= new Set()).add(editor);
          return editor;
        }` }));
    } }],
  });
  server = createServer(async (req, res) => {
    const send = (value, code = 200) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(value)); };
    if (req.url === "/__fixture/article") return send(article);
    if (req.url === "/__fixture/save") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const request = JSON.parse(body);
      requests.push(request);
      const finish = () => {
        if (failure === "network") return send({}, 503);
        if (failure) return send({ ok: false, code: failure, message: "Fixture save rejected." });
        const data = new FormData();
        request.entries.forEach(([key, value]) => data.append(key, value));
        const validation = parseWritingInput(data, request.mode);
        if (!validation.success) return send({ ok: false, code: "validation", fieldErrors: validation.fieldErrors, message: "Invalid fixture draft." });
        if (data.get("expectedUpdatedAt") !== article.updatedAt) return send({ ok: false, code: "conflict", message: "Fixture revision conflict." });
        article = { ...article, ...validation.data, updatedAt: new Date(Date.parse(article.updatedAt) + 1_000).toISOString(), sourceRevision: article.sourceRevision + 1,
          ...(request.mode === "publish" ? { status: "published", slug: "fixture-published" } : {}) };
        send({ ok: true, message: request.mode === "publish" ? "Article published." : "Draft saved.", updatedAt: article.updatedAt, sourceRevision: article.sourceRevision,
          ...(request.mode === "publish" ? { slug: article.slug } : {}) });
      };
      if (hold) pending.push(finish); else finish();
      return;
    }
    const file = bundle.outputFiles.find((item) => req.url === `/${path.basename(item.path)}`);
    if (file) { res.writeHead(200, { "Content-Type": req.url.endsWith(".css") ? "text/css" : "text/javascript" }); return res.end(file.contents); }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end('<!doctype html><meta charset="utf-8"><title>Writing P0 local regression</title><link rel="stylesheet" href="/fixture.css"><style>body{background:#061521;color:#fff;font:16px sans-serif;padding:24px}button,input,textarea,select{margin:5px;padding:8px}[hidden]{display:none!important}svg{width:20px;height:20px}button:disabled{opacity:.4}</style><div id="root"></div><script src="/fixture.js"></script>');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await playwright.chromium.launch({ channel: "msedge", headless: true });
});

beforeEach(async () => {
  if (context) await context.close();
  article = initial(); requests = []; pending = []; hold = true; failure = null; allowReload = false; allowRestore = false; faults.length = 0;
  context = await browser.newContext();
  await context.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  page = await context.newPage();
  page.setDefaultTimeout(10_000);
  page.on("pageerror", (error) => faults.push(error.message));
  page.on("dialog", (dialog) => (allowReload && dialog.type() === "beforeunload") || (allowRestore && dialog.type() === "confirm") ? dialog.accept() : dialog.dismiss());
  await page.goto(origin);
  try {
    await page.getByRole("button", { name: "Save Draft", exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector("[data-draft-readiness]")?.textContent === "Draft-save ready");
  } catch (error) {
    throw new Error(`Fixture mount failed: ${faults.join("; ")} | ${(await page.locator("body").innerText()).slice(0, 800)}`, { cause: error });
  }
});
after(async () => {
  if (context) await context.close();
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function raw() { return page.evaluate(() => structuredClone(window.__writingEditor.document)); }
async function update(props, text = "All authored text remains here, including\nline breaks and formatting.") {
  await page.evaluate(({ props, text }) => {
    const editor = window.__writingEditor;
    editor.updateBlock(editor.document[0], { props, content: [{ type: "text", text, styles: { bold: true, italic: true } }] });
  }, { props, text });
}
async function cycle() {
  await page.getByRole("button", { name: /^preview$/i }).click();
  await page.getByRole("button", { name: /^edit$/i }).click();
}
async function reload() {
  allowReload = true;
  try { await page.reload(); } finally { allowReload = false; }
}
async function waitRequest(count = 1) {
  const deadline = Date.now() + 10_000;
  while (requests.length < count && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(requests.length, count);
}
async function backups() {
  return page.evaluate(() => navigator.locks.request("btshq.writing.recovery.v1.", () => Object.keys(localStorage).filter((key) => key.startsWith("btshq.writing.recovery.v1.")).map((key) => JSON.parse(localStorage.getItem(key)))));
}

test("real editor keeps invalid formatted raw content and undo/redo through repeated Preview cycles", async () => {
  const original = await raw();
  await update({ textAlignment: "center" });
  const invalid = await raw();
  assert.ok(await page.getByRole("button", { name: "Save Draft", exact: true }).isDisabled());
  assert.match(await page.locator("body").innerText(), /Block\[1\].*props\.textAlignment/u);
  assert.equal(await page.locator("[data-draft-readiness]").innerText(), "Draft needs attention");
  await page.getByRole("button", { name: /^preview$/i }).click();
  assert.match(await page.getByRole("region", { name: "Private article preview" }).innerText(), /Preview unavailable/u);
  assert.equal(await page.getByRole("region", { name: "Private article preview" }).getByText("Persisted original content.", { exact: true }).count(), 0);
  await page.getByRole("button", { name: /^edit$/i }).click();
  await cycle(); await cycle();
  assert.deepEqual(await raw(), invalid);
  assert.equal(await page.evaluate(() => window.__writingEditors.size), 1, "one actual BlockNote instance across cycles");
  await page.getByRole("button", { name: "Undo last document change" }).click();
  assert.deepEqual(await raw(), original);
  await page.getByRole("button", { name: "Redo document change" }).click();
  assert.deepEqual(await raw(), invalid);
  assert.deepEqual((await backups()).at(-1).raw, invalid);
  const prevented = await page.evaluate(() => !window.dispatchEvent(new Event("beforeunload", { cancelable: true })));
  assert.equal(prevented, true, "invalid raw content is guarded on reload/leave");
  await page.getByRole("link", { name: "Leave Studio fixture" }).click();
  assert.equal(page.url(), `${origin}/`, "canceling the leave confirmation preserves this editor");
  await new Promise((resolve) => setTimeout(resolve, 1_400));
  assert.equal(requests.length, 0, "no stale canonical document is saved");
  assert.deepEqual(faults, []);
});

test("all supported structures, styles, links and translations survive Edit/Preview and persist", async () => {
  await page.evaluate(() => {
    const editor = window.__writingEditor;
    const text = (text) => [{ type: "text", text, styles: { bold: true, italic: true } }];
    editor.replaceBlocks(editor.document, [
      { id: "heading", type: "heading", props: { level: 3 }, content: text("Über Menschen · άνθρωποι · люди") },
      { id: "thought", type: "keyThought", content: text("An authored Key Thought.") },
      { id: "quote", type: "pullQuote", content: text("An authored Pull Quote.") },
      { id: "share", type: "shareable", content: text("An authored Shareable.") },
      { id: "list", type: "numberedListItem", props: { start: 1 }, content: text("First"), children: [{ id: "nested", type: "bulletListItem", content: text("Nested\nsecond line") }] },
      { id: "list2", type: "numberedListItem", content: text("Second") },
      { id: "divider", type: "divider" },
      { id: "link", type: "quote", content: [{ type: "link", href: "https://example.com", content: text("A safe linked line") }] },
    ]);
  });
  const authored = await raw();
  await cycle(); assert.deepEqual(await raw(), authored);
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await waitRequest(); pending.shift()();
  await page.waitForFunction(() => document.body.innerText.includes("Saved") && !document.body.innerText.includes("Saving..."));
  const types = article.bodyJson.blocks.map((block) => block.type);
  assert.ok(["heading", "keyThought", "pullQuote", "shareable", "numberedListItem", "divider", "quote"].every((type) => types.includes(type)));
  assert.deepEqual(article.bodyJson.blocks[4].children[0].content[0].styles, { bold: true, italic: true });
  assert.equal(article.bodyJson.blocks[4].children[0].content[0].text, "Nested\nsecond line");
  assert.equal((await backups()).length, 0);
  await reload();
  await page.waitForFunction(() => document.querySelector("[data-draft-readiness]")?.textContent === "Draft-save ready");
  assert.deepEqual(blockNoteToWritingDocument(await raw()), blockNoteToWritingDocument(authored), "saved content/formatting reload identically; redundant list start 1 equals the implicit default");
  assert.deepEqual(faults, []);
});

test("reload offers explicit invalid-raw recovery, never autosaves it, and preserves the newer server version", async () => {
  await update({ textAlignment: "center" }, "The unsaved complete original draft.\nWith authored formatting.");
  const unsaved = await raw();
  const newer = { ...initial(), updatedAt: "2026-10-10T17:30:00.000Z", sourceRevision: 3, bodyJson: { version: 1, blocks: [{ id: "newer", type: "paragraph", content: [{ type: "text", text: "A newer server article stays safe." }] }] } };
  article = newer;
  await reload();
  await page.getByRole("button", { name: "Restore this copy locally" }).waitFor();
  await page.waitForFunction(() => !!window.__writingEditor);
  assert.match(JSON.stringify(await raw()), /newer server article/u);
  assert.ok(await page.getByRole("button", { name: "Save Draft", exact: true }).isDisabled());
  await new Promise((resolve) => setTimeout(resolve, 1_400));
  assert.equal(requests.length, 0);
  await page.getByRole("button", { name: "Restore this copy locally" }).click();
  await page.waitForFunction((expected) => JSON.stringify(window.__writingEditor.document) === JSON.stringify(expected), unsaved);
  assert.deepEqual(await raw(), unsaved);
  assert.match(await page.locator("body").innerText(), /Unsaved content — document blocked/u);
  await new Promise((resolve) => setTimeout(resolve, 1_400));
  assert.equal(requests.length, 0);
  assert.deepEqual(article, newer, "no production-like write without explicit save");
  await page.getByRole("button", { name: "Undo last document change" }).click();
  assert.match(JSON.stringify(await raw()), /newer server article/u);
  assert.deepEqual(faults, []);
});

test("successful in-flight save never clears newer invalid raw content or labels it Saved", async () => {
  await update({ textAlignment: "left" }, "A valid submitted article body.");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click(); await waitRequest();
  await update({ textAlignment: "center" }, "Newer invalid content must not be overwritten.");
  const newer = await raw(); pending.shift()();
  await page.waitForFunction(() => document.body.innerText.includes("Unsaved content — document blocked"));
  await new Promise((resolve) => setTimeout(resolve, 1_400));
  assert.deepEqual(await raw(), newer);
  assert.equal(requests.length, 1);
  assert.deepEqual((await backups()).at(-1).raw, newer);
  assert.equal(article.bodyJson.blocks[0].content[0].text, "A valid submitted article body.");
  assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event("beforeunload", { cancelable: true }))), true);
  assert.deepEqual(faults, []);
});

test("newer valid edits trigger a serialized second save with the updated revision", async () => {
  await update({ textAlignment: "left" }, "First submitted content.");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click(); await waitRequest();
  await update({ textAlignment: "left" }, "Second newer content, unchanged by the first response.");
  pending.shift()();
  await waitRequest(2);
  const revision = new Map(requests[1].entries).get("expectedUpdatedAt");
  assert.equal(revision, article.updatedAt);
  assert.match(JSON.stringify(await raw()), /Second newer content/u);
  pending.shift()();
  await page.waitForFunction(() => !document.body.innerText.includes("Saving...") && document.body.innerText.includes("Saved"));
  assert.equal(article.bodyJson.blocks[0].content[0].text, "Second newer content, unchanged by the first response.");
  assert.equal((await backups()).length, 0);
  assert.deepEqual(faults, []);
});

test("network/conflict failures retain edits and recovery, clear Saving, and retry safely", async () => {
  await page.locator("#writing-title").fill("  New title with normalization  ");
  await update({ textAlignment: "left" }, "Draft content retained after rejected saves.");
  failure = "network";
  await page.getByRole("button", { name: "Save Draft", exact: true }).click(); await waitRequest(); pending.shift()();
  await page.getByRole("button", { name: "Retry save" }).waitFor();
  assert.equal(await page.locator("#writing-title").inputValue(), "  New title with normalization  ");
  assert.ok((await backups()).length > 0);
  failure = "conflict";
  await page.getByRole("button", { name: "Retry save" }).click(); await waitRequest(2); pending.shift()();
  await page.waitForFunction(() => document.body.innerText.includes("Conflict"));
  assert.equal(await page.locator("#writing-title").inputValue(), "  New title with normalization  ");
  failure = null;
  await page.getByRole("button", { name: "Save Draft", exact: true }).click(); await waitRequest(3); pending.shift()();
  await page.waitForFunction(() => document.getElementById("writing-title").value === "New title with normalization");
  assert.equal((await backups()).length, 0);
  assert.deepEqual(faults, []);
});

test("publish queued behind autosave revalidates current raw content and does not publish stale state", async () => {
  await update({ textAlignment: "left" }, "Valid body ready to be published, with enough content.");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click(); await waitRequest();
  await page.getByRole("button", { name: "Publish article", exact: true }).first().click();
  await update({ textAlignment: "center" }, "Invalid newer raw content while publish is waiting.");
  pending.shift()();
  await page.waitForFunction(() => !document.body.innerText.includes("Publishing..."));
  assert.equal(requests.length, 1);
  assert.match(JSON.stringify(await raw()), /Invalid newer raw content/u);
  assert.ok(await page.getByRole("button", { name: "Publish article", exact: true }).first().isDisabled());
  assert.deepEqual(faults, []);
});

async function seedRecovery(raw, owner = "previous") {
  await page.evaluate(({ raw, owner, article }) => {
    const { title, deck, excerpt, contentType, sourceLocale, topics } = article;
    localStorage.setItem(`btshq.writing.recovery.v1.${article.id}.${owner}`, JSON.stringify({ version: 1, articleId: article.id, owner, capturedAt: Date.now(), baseUpdatedAt: article.updatedAt, fields: { title, deck, excerpt, contentType, sourceLocale, topics }, raw }));
  }, { raw, owner, article });
}

test("restoring over dirty local content preserves a separate full copy and requires an explicit server save", async () => {
  const candidate = await raw();
  candidate[0].content = [{ type: "text", text: "An earlier recovery version, explicitly selected.", styles: { italic: true } }];
  await seedRecovery(candidate); await reload();
  await page.getByRole("button", { name: "Continue with current version; keep recovery copies" }).click();
  await update({ textAlignment: "center" }, "Newer local changes must remain recoverable.");
  await page.locator("#writing-title").fill("Newer local title");
  const newer = await raw();
  allowRestore = true;
  await page.getByRole("button", { name: "Restore this copy locally" }).click();
  await page.waitForFunction((expected) => JSON.stringify(window.__writingEditor.document) === JSON.stringify(expected), candidate);
  allowRestore = false;
  assert.deepEqual(await raw(), candidate);
  const localCopies = await backups();
  assert.ok(localCopies.some((copy) => JSON.stringify(copy.raw) === JSON.stringify(newer) && copy.fields.title === "Newer local title"), "replaced local contents/metadata remain in a separate slot");
  await new Promise((resolve) => setTimeout(resolve, 1_400));
  assert.equal(requests.length, 0, "restoration never autosaves an older version");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click(); await waitRequest(); pending.shift()();
  await page.waitForFunction(() => document.body.innerText.includes("Saved") && !document.body.innerText.includes("Saving..."));
  assert.equal(article.bodyJson.blocks[0].content[0].text, candidate[0].content[0].text);
  assert.ok((await backups()).some((copy) => JSON.stringify(copy.raw) === JSON.stringify(newer)), "explicitly saving recovery never erases the displaced version");
  assert.deepEqual(faults, []);
});

test("incompatible recovered nodes cannot mutate the current editor and stay available for download", async () => {
  const original = await raw();
  const candidate = [{ ...original[0], type: "unsupportedFutureNode", props: { originalProperty: "retained" } }];
  await seedRecovery(candidate); await reload();
  await page.getByRole("button", { name: "Restore this copy locally" }).click();
  await page.getByText(/incompatible with the current editor/u).waitFor();
  assert.deepEqual(await raw(), original);
  assert.match(await page.locator("body").innerText(), /incompatible with the current editor/u);
  assert.deepEqual((await backups())[0].raw, candidate);
  assert.ok(await page.getByRole("button", { name: "Save Draft", exact: true }).isDisabled());
  assert.deepEqual(faults, []);
});

test("a raw backup with missing block properties is refused rather than silently reconstructed with defaults", async () => {
  const original = await raw();
  const candidate = structuredClone(original);
  delete candidate[0].props.textAlignment;
  await seedRecovery(candidate); await reload();
  await page.getByRole("button", { name: "Restore this copy locally" }).click();
  assert.deepEqual(await raw(), original);
  assert.deepEqual((await backups())[0].raw, candidate);
  assert.match(await page.locator("body").innerText(), /no content was replaced/u);
  assert.deepEqual(faults, []);
});

test("a stored empty document is labeled explicitly rather than implying the full article was saved", async () => {
  article = { ...article, body: "", bodyJson: { version: 1, blocks: [{ id: "empty", type: "paragraph", content: [] }] } };
  await reload();
  await page.waitForFunction(() => document.querySelector("[data-draft-readiness]")?.textContent === "Draft-save ready");
  assert.match(await page.locator("body").innerText(), /Empty document — no article text saved/u);
  await page.getByRole("button", { name: "Save Draft", exact: true }).click(); await waitRequest(); pending.shift()();
  await page.waitForFunction(() => !document.body.innerText.includes("Saving..."));
  assert.match(await page.locator("body").innerText(), /Empty document — no article text saved/u);
  assert.deepEqual(faults, []);
});

test("unavailable local storage visibly warns without losing invalid editor content or its leave guard", async () => {
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("btshq.writing.recovery.v1.")) throw new DOMException("Fixture storage blocked", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await update({ textAlignment: "center" }, "Raw content survives even when browser storage is unavailable.");
  const unsaved = await raw();
  await cycle();
  assert.deepEqual(await raw(), unsaved);
  assert.match(await page.locator("body").innerText(), /Local recovery could not be saved/u);
  assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event("beforeunload", { cancelable: true }))), true);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download current recovery copy" }).click();
  const downloaded = await downloadEvent;
  const contents = JSON.parse(await readFile(await downloaded.path(), "utf8"));
  assert.deepEqual(contents.raw, unsaved, "download retains unsupported raw properties and all text/formatting");
  assert.equal(contents.articleId, article.id);
  assert.equal(requests.length, 0);
  assert.deepEqual(faults, []);
});

test("real keyboard typing and bold formatting remain in the same editor and undo stack after Preview", async () => {
  const before = await raw();
  await page.locator('[aria-label="Article document"]').click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Control+b");
  await page.keyboard.type(" Written directly in the browser.");
  await page.keyboard.press("Control+b");
  const typed = await raw();
  assert.match(JSON.stringify(typed), /Written directly in the browser/u);
  assert.ok(typed.some((block) => block.content?.some((item) => item.type === "text" && item.text.includes("Written directly") && item.styles.bold)), JSON.stringify(typed));
  await page.getByRole("button", { name: /^preview$/i }).click();
  assert.match(await page.getByRole("region", { name: "Private article preview" }).innerText(), /Written directly in the browser/u);
  await page.getByRole("button", { name: /^edit$/i }).click();
  assert.deepEqual(await raw(), typed);
  await page.getByRole("button", { name: "Undo last document change" }).click();
  assert.deepEqual(await raw(), before);
  await page.getByRole("button", { name: "Redo document change" }).click();
  assert.deepEqual(await raw(), typed);
  assert.deepEqual(faults, []);
});

test("two real editor tabs keep separate article recovery copies without overwriting each other", async () => {
  await update({ textAlignment: "center" }, "First tab's full invalid document.");
  const first = await raw();
  const second = await context.newPage();
  second.on("pageerror", (error) => faults.push(error.message));
  await second.goto(origin);
  await second.getByRole("button", { name: "Continue with current version; keep recovery copies" }).click();
  await second.waitForFunction(() => !!window.__writingEditor);
  await second.evaluate(() => {
    const editor = window.__writingEditor;
    editor.updateBlock(editor.document[0], { props: { textAlignment: "right" }, content: [{ type: "text", text: "Second tab's different full invalid document.", styles: { italic: true } }] });
  });
  const other = await second.evaluate(() => structuredClone(window.__writingEditor.document));
  await cycle();
  assert.deepEqual(await raw(), first);
  const copies = await backups();
  assert.equal(copies.length, 2);
  assert.ok(copies.some((copy) => JSON.stringify(copy.raw) === JSON.stringify(first)));
  assert.ok(copies.some((copy) => JSON.stringify(copy.raw) === JSON.stringify(other)));
  assert.equal(requests.length, 0);
  assert.deepEqual(faults, []);
});

test("two tabs racing for the final recovery slot cannot exceed the shared bound or evict a copy", async () => {
  const second = await context.newPage();
  second.on("pageerror", (error) => faults.push(error.message));
  await second.goto(origin);
  await second.waitForFunction(() => document.querySelector("[data-draft-readiness]")?.textContent === "Draft-save ready");
  const original = await raw();
  for (let index = 0; index < 7; index++) await seedRecovery(original, `retained-${index}`);
  await page.evaluate(() => {
    void navigator.locks.request("btshq.writing.recovery.v1.", () => new Promise((resolve) => { window.__releaseRecoveryLock = resolve; }));
  });
  await page.waitForFunction(() => !!window.__releaseRecoveryLock);
  await Promise.all([page, second].map((tab, index) => tab.evaluate((index) => {
    const editor = window.__writingEditor;
    editor.updateBlock(editor.document[0], { props: { textAlignment: "center" }, content: `Full invalid draft from tab ${index}.` });
  }, index)));
  assert.equal(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("btshq.writing.recovery.v1.")).length), 7, "both writes wait for the same real browser lock");
  await page.evaluate(() => window.__releaseRecoveryLock());
  const copies = await backups();
  assert.equal(copies.length, 8);
  assert.equal(copies.filter((copy) => copy.owner.startsWith("retained-")).length, 7);
  await Promise.race([page, second].map((tab) => tab.getByText(/Local recovery storage is full \(8 copies\)/u).waitFor()));
  assert.equal(requests.length, 0);
  assert.deepEqual(faults, []);
});

test("queued save cleanup rechecks new invalid edits after the cross-tab lock becomes available", async () => {
  await update({}, "A complete valid draft submitted to the server.");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click(); await waitRequest();
  await page.evaluate(() => {
    void navigator.locks.request("btshq.writing.recovery.v1.", () => new Promise((resolve) => { window.__releaseRecoveryLock = resolve; }));
  });
  await page.waitForFunction(() => !!window.__releaseRecoveryLock);
  pending.shift()();
  await page.waitForFunction(() => !document.body.innerText.includes("Saving..."));
  await update({ textAlignment: "center" }, "Newer invalid content must outlive the queued cleanup.");
  const newer = await raw();
  await page.evaluate(() => window.__releaseRecoveryLock());
  const copies = await backups();
  assert.ok(copies.some((copy) => JSON.stringify(copy.raw) === JSON.stringify(newer)));
  assert.deepEqual(await raw(), newer);
  assert.match(await page.locator("body").innerText(), /Unsaved content — document blocked/u);
  assert.equal(requests.length, 1);
  assert.deepEqual(faults, []);
});

test("without cross-tab locks recovery refuses replacement and retains its existing local copy", async () => {
  const original = await raw();
  const candidate = structuredClone(original);
  candidate[0].content = [{ type: "text", text: "A recovery copy that must not be discarded.", styles: {} }];
  await seedRecovery(candidate); await reload();
  await page.getByRole("button", { name: "Restore this copy locally" }).waitFor();
  await page.evaluate(() => Object.defineProperty(navigator, "locks", { value: undefined, configurable: true }));
  await page.getByRole("button", { name: "Restore this copy locally" }).click();
  await page.getByText(/Safe local recovery is unavailable/u).waitFor();
  assert.deepEqual(await raw(), original);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("btshq.writing.recovery.v1.studio-fixture.previous")).raw), candidate);
  assert.equal(requests.length, 0);
  assert.deepEqual(faults, []);
});

test("malformed recovery metadata cannot replace a valid editor document with an empty stale snapshot", async () => {
  const original = await raw();
  await seedRecovery(original);
  const token = await page.evaluate(() => {
    const key = "btshq.writing.recovery.v1.studio-fixture.previous";
    const copy = JSON.parse(localStorage.getItem(key));
    copy.fields.document = { version: 1, blocks: [] };
    const token = JSON.stringify(copy);
    localStorage.setItem(key, token);
    return token;
  });
  await reload();
  await page.getByText(/A local recovery copy could not be read/u).waitFor();
  assert.equal(await page.getByRole("button", { name: "Restore this copy locally" }).count(), 0);
  assert.deepEqual(await raw(), original);
  assert.equal(await page.evaluate(() => localStorage.getItem("btshq.writing.recovery.v1.studio-fixture.previous")), token);
  assert.equal(requests.length, 0);
  assert.deepEqual(faults, []);
});

for (const textAlignment of ["center", "left"]) {
  test(`publish retains newer ${textAlignment === "center" ? "invalid" : "valid"} raw edits during queued cleanup even when local recovery fails`, async () => {
    await update({}, "Valid article content explicitly submitted for publication.");
    await backups();
    await page.getByRole("button", { name: "Publish article", exact: true }).first().click(); await waitRequest();
    assert.equal(requests[0].mode, "publish");
    await page.evaluate(() => {
      void navigator.locks.request("btshq.writing.recovery.v1.", () => new Promise((resolve) => { window.__releaseRecoveryLock = resolve; }));
    });
    await page.waitForFunction(() => !!window.__releaseRecoveryLock);
    pending.shift()();
    await page.waitForFunction(() => document.body.innerText.includes("Saved"));
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith("btshq.writing.recovery.v1.")) throw new DOMException("Fixture quota", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
    await update({ textAlignment }, "Newer authored content after publication acknowledgement.\nLine breaks and formatting must remain.");
    const newer = await raw();
    await page.evaluate(() => window.__releaseRecoveryLock());
    await Promise.race([
      page.waitForURL(`${origin}/writing/fixture-published`),
      page.waitForFunction(() => {
        const button = document.querySelector('button[aria-label="Publish article"]');
        return button && !button.textContent.includes("Publishing...");
      }),
    ]);
    assert.equal(page.url(), `${origin}/`, "the current editor must be checked again before redirecting");
    assert.deepEqual(await raw(), newer);
    assert.match(await page.locator("body").innerText(), textAlignment === "center" ? /Unsaved content — document blocked/u : /Unsaved changes/u);
    await page.getByText(/Local recovery could not be saved/u).waitFor();
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event("beforeunload", { cancelable: true }))), true);
    assert.equal(requests.length, 1, "newer edits are not silently saved or discarded");
    assert.equal(article.bodyJson.blocks[0].content[0].text, "Valid article content explicitly submitted for publication.");
    assert.deepEqual(faults, []);
  });
}

test("publish still redirects after complete success when no newer local changes remain", async () => {
  await update({}, "A complete valid article published without concurrent changes.");
  await backups();
  await page.getByRole("button", { name: "Publish article", exact: true }).first().click(); await waitRequest();
  pending.shift()();
  await page.waitForURL(`${origin}/writing/fixture-published`);
  assert.equal(article.status, "published");
  assert.equal(article.bodyJson.blocks[0].content[0].text, "A complete valid article published without concurrent changes.");
  assert.equal(requests.length, 1);
  assert.deepEqual(faults, []);
});
