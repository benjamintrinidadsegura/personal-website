import Link from "next/link";

import { generateWritingTranslationsAction, importWritingTranslationAction } from "@/app/admin/writing/actions";
import { localeDetails } from "@/lib/i18n/config";
import { getLocalizedPathname } from "@/lib/i18n/routing";
import { writingLanguages } from "@/types/writing";
import type { WritingTranslationSummary } from "@/types/writing";

const statusStyle = {
  source: "border-[#35d0e5]/40 text-[#9debf4]",
  translated: "border-emerald-300/40 text-emerald-200",
  stale: "border-[#ffb36d]/45 text-[#ffca96]",
  pending: "border-slate-400/35 text-slate-300",
  failed: "border-red-300/40 text-red-200",
} as const;

export function WritingTranslationsPanel({
  articleId,
  feedback,
  providerConfigured,
  slug,
  sourceLocale,
  sourceRevision,
  statuses,
}: {
  articleId: string;
  feedback?: { imported?: string; error?: string; generated?: string; generationError?: string };
  providerConfigured: boolean;
  slug: string | null;
  sourceLocale: (typeof writingLanguages)[number];
  sourceRevision: number;
  statuses: WritingTranslationSummary[] | null;
}) {
  const byLocale = new Map(statuses?.map((status) => [status.locale, status]));

  return (
    <section aria-labelledby="writing-translations-title" className="mt-10 rounded-2xl border border-white/10 bg-white/[0.018] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.65rem] font-black uppercase tracking-[0.18em] text-[#35d0e5]">Localization</p>
          <h2 id="writing-translations-title" className="mt-2 text-2xl font-black text-white">Translations</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">One canonical article identity · source revision {sourceRevision}. Stale or missing variants fall back to the source article.</p>
        </div>
        <form action={generateWritingTranslationsAction}>
          <input type="hidden" name="articleId" value={articleId} />
          <input type="hidden" name="sourceLocale" value={sourceLocale} />
          <input type="hidden" name="sourceRevision" value={sourceRevision} />
          <input type="hidden" name="targetLocale" value="all" />
          <button type="submit" disabled={!providerConfigured} title={providerConfigured ? "Generate missing, failed, or stale translations." : "Translation provider credentials are not configured on the server."} className="min-h-11 rounded-full border border-white/15 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:text-slate-500">Generate missing</button>
        </form>
      </div>

      {!statuses ? <p role="status" className="mt-6 border-l-2 border-[#ffb36d] pl-4 text-sm text-slate-300">Translation status is unavailable until the Writing completion migration is applied.</p> : null}
      {feedback?.imported ? <p role="status" className="mt-6 border-l-2 border-emerald-300 pl-4 text-sm text-emerald-100">{feedback.imported.toUpperCase()} translation imported.</p> : null}
      {feedback?.error ? <p role="alert" className="mt-6 border-l-2 border-[#ffb36d] pl-4 text-sm text-[#ffcfaa]">Translation import failed ({feedback.error}). The existing variant was not changed.</p> : null}
      {feedback?.generated ? <p role="status" className="mt-6 border-l-2 border-emerald-300 pl-4 text-sm text-emerald-100">{feedback.generated} translation{feedback.generated === "1" ? "" : "s"} generated.</p> : null}
      {feedback?.generationError ? <p role="alert" className="mt-6 border-l-2 border-[#ffb36d] pl-4 text-sm text-[#ffcfaa]">Automatic translation did not complete ({feedback.generationError}). Published source content remains available.</p> : null}

      <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {writingLanguages.map((locale) => {
          const status = byLocale.get(locale);
          const state = status?.status ?? "pending";
          const canImport = statuses && state !== "source";
          const generationLabel = state === "failed" ? "Retry failed" : state === "stale" ? "Regenerate stale" : state === "pending" ? "Generate missing" : null;
          return (
            <li key={locale} className="rounded-xl border border-white/[0.08] bg-[#04111b]/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-black text-white">{locale.toUpperCase()}</p><p className="mt-1 text-xs text-slate-500">{localeDetails[locale].languageName}</p></div>
                <span className={`rounded-full border px-2 py-1 font-mono text-[0.6rem] font-black uppercase tracking-[0.12em] ${statusStyle[state]}`}>{state}</span>
              </div>
              {status?.status === "translated" && slug ? <Link href={getLocalizedPathname(`/writing/${slug}`, locale)} className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-[#35d0e5]">Preview →</Link> : null}
              {generationLabel && providerConfigured && locale !== sourceLocale ? (
                <form action={generateWritingTranslationsAction} className="mt-3">
                  <input type="hidden" name="articleId" value={articleId} />
                  <input type="hidden" name="sourceLocale" value={sourceLocale} />
                  <input type="hidden" name="sourceRevision" value={sourceRevision} />
                  <input type="hidden" name="targetLocale" value={locale} />
                  <button type="submit" className="min-h-10 rounded-full border border-[#35d0e5]/40 px-4 text-sm font-black text-white">{generationLabel}</button>
                </form>
              ) : null}
              {canImport ? (
                <details className="mt-3">
                  <summary className="flex min-h-10 cursor-pointer items-center text-sm font-bold text-slate-300">Import JSON</summary>
                  <form action={importWritingTranslationAction} className="mt-3">
                    <input type="hidden" name="articleId" value={articleId} />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="sourceRevision" value={sourceRevision} />
                    <label htmlFor={`translation-${locale}`} className="text-xs leading-5 text-slate-500">title, deck, excerpt, and safe bodyJson only</label>
                    <textarea id={`translation-${locale}`} name="payload" required rows={7} spellCheck={false} className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-[#020b12] p-3 font-mono text-xs leading-5 text-white outline-none focus-visible:border-[#35d0e5]" />
                    <button type="submit" className="mt-3 min-h-10 rounded-full border border-[#35d0e5]/40 px-4 text-sm font-black text-white">Validate and import</button>
                  </form>
                </details>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-5 text-xs leading-5 text-slate-500">{providerConfigured ? "OpenAI translation is configured server-side. Publication schedules missing or stale locales automatically; manual actions remain AAL2-protected." : "OpenAI translation is safely disabled until server-side provider credentials are configured."}</p>
    </section>
  );
}
