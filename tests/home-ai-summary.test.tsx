import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  AiSummaryCard,
  buildAssistantPrefillUrl,
  copyPromptAndOpenDestination,
  formatProviderStatus,
  supportsAssistantPrefill,
  writeAiSummaryPrompt,
} from "../components/sections/ai-summary-card";
import { aiSummaryAssistants, aiSummaryDictionaries, getAiSummaryCopy } from "../data/i18n/ai-summary";
import { PUBLIC_CANONICAL_SOURCE_URL } from "../data/site";
import { locales, type Locale } from "../lib/i18n/config";

const expectedHeadlines: Record<Locale, string> = {
  de: "Lass dir btshq.online von deiner AI zusammenfassen",
  en: "Have your AI summarize btshq.online",
  es: "Haz que tu IA resuma btshq.online",
  tr: "btshq.online’ı yapay zekâ asistanına özetlet",
  pl: "Poproś swoją AI o podsumowanie btshq.online",
  el: "Ζήτησε από τον AI βοηθό σου να συνοψίσει το btshq.online",
  ru: "Попросите своего ИИ-ассистента кратко рассказать о btshq.online",
};

const citationCues: Record<Locale, RegExp> = {
  de: /Seiten als Quellen/u,
  en: /cite the relevant.*pages/u,
  es: /cita.*páginas/u,
  tr: /sayfalarını kaynak olarak göster/u,
  pl: /przytocz odpowiednie strony/u,
  el: /παράθεσε τις σχετικές σελίδες/u,
  ru: /укажи соответствующие страницы/u,
};

test("AI summary source experience has complete, natural copy and source-grounded prompts in all seven locales", () => {
  assert.deepEqual(Object.keys(aiSummaryDictionaries), locales);
  for (const locale of locales) {
    const copy = getAiSummaryCopy(locale);
    assert.equal(copy.headline, expectedHeadlines[locale], locale);
    assert.ok(copy.description.length > 80, locale);
    assert.match(copy.prompt, /https:\/\/btshq\.online/u, locale);
    assert.doesNotMatch(copy.prompt, /localhost|vercel\.app/iu, locale);
    assert.ok((copy.prompt.match(/btshq\.online/gu) ?? []).length >= 2, locale);
    assert.match(copy.prompt, citationCues[locale], locale);
    assert.ok(copy.copyAction.length > 4 && copy.copied.length > 4 && copy.copyError.length > 20, locale);
    assert.match(copy.providerCopied, /\{provider\}/u, locale);
    assert.ok(copy.providerPrepared.length > 80, locale);
  }
  assert.equal(PUBLIC_CANONICAL_SOURCE_URL, "https://btshq.online");
  assert.equal(getAiSummaryCopy("de").providerCopied, "Prompt kopiert – in {provider} einfügen und absenden.");
});

test("assistant registry is broad, configuration-driven and always includes a localized neutral fallback", () => {
  assert.deepEqual(aiSummaryAssistants.map(({ name }) => name), ["ChatGPT", "Claude", "Gemini", "Perplexity", "Microsoft Copilot", "Grok", "Meta AI", "DeepSeek", "Mistral", "You.com"]);
  for (const locale of locales) {
    const copy = getAiSummaryCopy(locale);
    const markup = renderToStaticMarkup(createElement(AiSummaryCard, { copy }));
    for (const assistant of aiSummaryAssistants) assert.match(markup, new RegExp(assistant.name.replace(".", "\\."), "u"), `${locale}: ${assistant.name}`);
    assert.match(markup, new RegExp(copy.otherAssistant, "u"), `${locale}: neutral fallback`);
  }
});

test("provider launch registry implements one tested A2 prefill and nine B copy-open fallbacks", () => {
  const expectedOfficialDestinations = new Map([
    ["ChatGPT", "https://chatgpt.com/"],
    ["Claude", "https://claude.ai/new"],
    ["Gemini", "https://gemini.google.com/app"],
    ["Perplexity", "https://www.perplexity.ai/"],
    ["Microsoft Copilot", "https://copilot.microsoft.com/"],
    ["Grok", "https://grok.com/"],
    ["Meta AI", "https://www.meta.ai/"],
    ["DeepSeek", "https://chat.deepseek.com/"],
    ["Mistral", "https://chat.mistral.ai/"],
    ["You.com", "https://you.com/"],
  ]);
  assert.deepEqual(
    aiSummaryAssistants.filter(({ launch }) => launch.kind === "prefill").map(({ name }) => name),
    ["Claude"],
  );
  assert.deepEqual(
    aiSummaryAssistants.filter(({ launch }) => launch.kind === "copy-open").map(({ name }) => name),
    ["ChatGPT", "Gemini", "Perplexity", "Microsoft Copilot", "Grok", "Meta AI", "DeepSeek", "Mistral", "You.com"],
  );

  for (const assistant of aiSummaryAssistants) {
    assert.equal(assistant.launch.officialUrl, expectedOfficialDestinations.get(assistant.name), assistant.name);
    const parsed = new URL(assistant.launch.officialUrl);
    assert.equal(parsed.protocol, "https:", assistant.name);
    assert.equal(parsed.search, "", assistant.name);
    assert.equal(parsed.hash, "", assistant.name);
    if (assistant.launch.kind === "prefill") {
      assert.equal(assistant.launch.prefill.baseUrl, "claude://claude.ai/new");
      assert.equal(assistant.launch.prefill.promptParameter, "q");
      assert.equal(assistant.launch.prefill.platform, "desktop");
    }
  }
});

test("provider marks are local, byte-pinned first-party assets while restricted and neutral entries stay text-only", () => {
  const expectedHashes: Readonly<Record<string, string>> = {
    "/brand/ai/openai.svg": "8e1b976ba47e927ac2928303fd5362fcadfefd68743506510596f107df676e58",
    "/brand/ai/claude.ico": "816a55828befeb50fe8a9556cb92d80194efefbd3f4e04ccf694992dd8e085e3",
    "/brand/ai/gemini.png": "5e7cfecaa53f4f65a313fe89b0f389548126544a78fad8489510c70ae641a4a1",
    "/brand/ai/perplexity.ico": "df9a6478592660077e4e774d37bae6db1eb4d7d9d2cac31f0dcdab8804f76c06",
    "/brand/ai/microsoft-copilot.svg": "c5b0ad0fc0c6fd9c49131a972635e1aba4e65a0d0385c01d5be8735921d7ef8b",
    "/brand/ai/grok.svg": "c3db0dfaf760b702b8490c6cbefe07fd8bfe00db43cae6a0acccf768f44d6179",
    "/brand/ai/meta-ai.ico": "8ec01b05042d3f65e76224d91cbf3c41f04e281f28c0c3e94c956b3788cfa26d",
    "/brand/ai/mistral.svg": "66ceaf186f2075da38e5a3c2e46fc0015936e0cb57692d1f8ae0ba565354874d",
    "/brand/ai/you-com.ico": "bc108afac8491e981082ecbb84c1edc8a743c9da5d011bf50ccac677007b892e",
  };
  const logoAssistants = aiSummaryAssistants.filter((assistant) => "logo" in assistant && assistant.logo);
  assert.equal(logoAssistants.length, 9);
  for (const assistant of logoAssistants) {
    assert.ok("logo" in assistant && assistant.logo);
    assert.match(assistant.logo.src, /^\/brand\/ai\/[a-z0-9.-]+$/u);
    const asset = new URL(`../public${assistant.logo.src}`, import.meta.url);
    assert.equal(existsSync(asset), true, assistant.name);
    assert.equal(createHash("sha256").update(readFileSync(asset)).digest("hex"), expectedHashes[assistant.logo.src], assistant.name);
  }
  const deepSeek = aiSummaryAssistants.find(({ id }) => id === "deepseek");
  assert.ok(deepSeek);
  assert.equal("logo" in deepSeek, false);

  const markup = renderToStaticMarkup(createElement(AiSummaryCard, { copy: getAiSummaryCopy("en") }));
  assert.equal((markup.match(/<img /gu) ?? []).length, 9);
  assert.doesNotMatch(markup, /(?:src|href)="https?:\/\//u);
  assert.match(markup, /data-ai-provider="deepseek"[\s\S]*?<button[^>]*aria-label="DeepSeek"/u);
  assert.match(markup, /data-ai-provider="other-ai"[\s\S]*?<button[^>]*aria-label="Other AI"/u);
});

test("the semantic card server-renders its descriptive source context, full prompt and accessible copy state", () => {
  const copy = getAiSummaryCopy("de");
  const markup = renderToStaticMarkup(createElement(AiSummaryCard, { copy }));
  assert.match(markup, /^<section/u);
  assert.match(markup, /aria-labelledby=/u);
  assert.match(markup, new RegExp(copy.headline, "u"));
  assert.match(markup, new RegExp(copy.description, "u"));
  assert.match(markup, /<ul aria-label=/u);
  assert.match(markup, /<details/u);
  assert.match(markup, /https:\/\/btshq\.online/u);
  assert.match(markup, /<button type="button"/u);
  assert.equal((markup.match(/data-ai-provider=/gu) ?? []).length, 11);
  assert.equal((markup.match(/aria-describedby=/gu) ?? []).length, 12);
  assert.match(markup, /focus-visible:ring-2/u);
  assert.match(markup, /hover:border-/u);
  assert.match(markup, /role="status"/u);
  assert.match(markup, /aria-live="polite"/u);
  assert.match(markup, /aria-atomic="true"/u);
});

test("copy action writes only the localized prepared prompt", async () => {
  const expected = getAiSummaryCopy("en").prompt;
  const writes: string[] = [];
  await writeAiSummaryPrompt(expected, { writeText: async (value) => { writes.push(value); } });
  assert.deepEqual(writes, [expected]);
  await assert.rejects(writeAiSummaryPrompt(expected, undefined), /Clipboard API unavailable/u);
});

test("B launch starts clipboard copy before opening an exact official destination in the same user gesture", async () => {
  const events: string[] = [];
  let finishCopy: (() => void) | undefined;
  const operation = copyPromptAndOpenDestination(
    "localized prompt",
    "https://chatgpt.com/",
    { writeText: (value) => new Promise<void>((resolve) => { events.push(`copy:${value}`); finishCopy = resolve; }) },
    (destination) => { events.push(`open:${destination}`); },
  );
  assert.deepEqual(events, ["copy:localized prompt", "open:https://chatgpt.com/"]);
  assert.ok(finishCopy);
  finishCopy();
  await operation;
});

test("A2 prefill encodes the localized prompt without auto-submit and falls back by platform", () => {
  const prompt = "Fasse https://btshq.online zusammen — bitte.";
  const claude = aiSummaryAssistants.find(({ id }) => id === "claude");
  assert.ok(claude && claude.launch.kind === "prefill");
  assert.equal(
    buildAssistantPrefillUrl(claude.launch, prompt),
    `claude://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  );
  assert.doesNotMatch(buildAssistantPrefillUrl(claude.launch, prompt), /(?:send|submit|auto|ref|utm_)=/iu);
  assert.equal(supportsAssistantPrefill(claude.launch, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), true);
  assert.equal(supportsAssistantPrefill(claude.launch, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), true);
  assert.equal(supportsAssistantPrefill(claude.launch, "Mozilla/5.0 (X11; Linux x86_64)"), true);
  assert.equal(supportsAssistantPrefill(claude.launch, "Mozilla/5.0 (Linux; Android 16; Mobile)"), false);
  assert.equal(supportsAssistantPrefill(claude.launch, "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) Mobile"), false);
});

test("localized launch statuses remain truthful about prefill versus copy-and-paste", () => {
  for (const locale of locales) {
    const copy = getAiSummaryCopy(locale);
    const providerStatus = formatProviderStatus(copy.providerCopied, "Gemini");
    const preparedStatus = formatProviderStatus(copy.providerPrepared, "Claude");
    assert.match(providerStatus, /Gemini/u, locale);
    assert.doesNotMatch(providerStatus, /\{provider\}/u, locale);
    assert.doesNotMatch(providerStatus, /prefill|vorbefüll|prellenad|önceden dold|wstępnie wypeł|προσυμπληρ|предзаполн/iu, locale);
    assert.match(preparedStatus, /Claude/u, locale);
    assert.doesNotMatch(preparedStatus, /\{provider\}/u, locale);
  }
});

test("A2 is copy-first with a B fallback and Other AI remains C copy-only", () => {
  const component = readFileSync(new URL("../components/sections/ai-summary-card.tsx", import.meta.url), "utf8");
  const copyStart = component.indexOf("const copyOperation = writeAiSummaryPrompt(copy.prompt)");
  const prefillOpen = component.indexOf("openAssistantPrefill(assistant.launch, copy.prompt)");
  assert.ok(copyStart >= 0 && prefillOpen > copyStart);
  assert.match(component, /assistant\.launch\.officialUrl/u);
  assert.match(component, /assistant\.launch\.kind === "copy-only"[\s\S]*?await copyPrompt\(\);[\s\S]*?return;/u);
  assert.match(component, /\{ id: "other-ai", name: copy\.otherAssistant, launch: \{ kind: "copy-only" \} \}/u);
});

test("homepage integration is right-rail scoped, mobile-safe and free of provider calls or affiliation claims", () => {
  const component = readFileSync(new URL("../components/sections/ai-summary-card.tsx", import.meta.url), "utf8");
  const hero = readFileSync(new URL("../components/sections/hero.tsx", import.meta.url), "utf8");
  const allCopy = JSON.stringify(aiSummaryDictionaries);
  assert.match(hero, /<AiSummaryCard copy=\{aiSummaryCopy\} \/>/u);
  assert.match(hero, /<aside[\s\S]*<AiSummaryCard/u);
  assert.match(hero, /text-\[clamp\(2\.5rem,12\.5vw,3rem\)\]/u);
  assert.match(hero, /grid-cols-\[minmax\(0,1fr\)\]/u);
  assert.match(hero, /lg:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(0,0\.65fr\)\]/u);
  assert.match(component, /flex-wrap/u);
  assert.match(component, /min-w-0/u);
  assert.match(component, /break-words/u);
  assert.match(component, /max-w-full/u);
  assert.match(component, /motion-reduce:transition-none/u);
  assert.match(component, /prefillAttempted/u);
  assert.match(component, /noopener,noreferrer/u);
  assert.doesNotMatch(component, /fetch\(|XMLHttpRequest|sendBeacon|analytics|track\(/u);
  assert.doesNotMatch(allCopy, /powered by|partnership|sponsor|endorsement|integration/iu);
});
