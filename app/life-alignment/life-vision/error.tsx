"use client";
import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import Link from "next/link";
import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
export default function LifeVisionError({ reset }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    const locale = useLocale();
    const localizeHref = useLocalizedHref();
    return (<main className="section-lines min-h-screen px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-[#9dd9c5]/35 bg-[#061521]/90 p-7 sm:p-10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#9dd9c5]">Life Vision {lifeUiValue(locale, "interrupted", "unterbrochen")}</p>
        <h1 className="mt-5 text-4xl font-black text-white">{lifeUiValue(locale, "This local reflection could not continue.", "Diese lokale Reflexion konnte nicht fortgesetzt werden.")}</h1>
        <p className="mt-5 leading-7 text-slate-300">{lifeUiValue(locale, "Answers are not stored and cannot be recovered after an error. You can reload the journey or return to the Life Alignment hub.", "Antworten werden nicht gespeichert und lassen sich nach einem Fehler nicht wiederherstellen. Du kannst die Journey neu laden oder zum Life-Alignment-Hub zurückkehren.")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="min-h-11 rounded-full bg-[#9dd9c5] px-5 font-black text-[#07131d]">{lifeUiValue(locale, "Reload journey", "Journey neu laden")}</button>
          <Link href={localizeHref("/life-alignment")} className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 font-bold text-white">{lifeUiValue(locale, "To the hub", "Zum Hub")}</Link>
        </div>
      </div>
    </main>);
}
