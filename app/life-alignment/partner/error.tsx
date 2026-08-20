"use client";
import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import Link from "next/link";
import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
export default function PartnerError({ reset }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    const locale = useLocale();
    const localizeHref = useLocalizedHref();
    return (<main className="section-lines min-h-screen px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-[#f5b971]/35 bg-[#061521]/90 p-7 sm:p-10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#f5b971]">Partner / Relationship {lifeUiValue(locale, "interrupted", "unterbrochen")}</p>
        <h1 className="mt-5 text-4xl font-black text-white">{lifeUiValue(locale, "This local session could not continue.", "Diese lokale Sitzung konnte nicht fortgesetzt werden.")}</h1>
        <p className="mt-5 leading-7 text-slate-300">{lifeUiValue(locale, "Answers are not stored and cannot be recovered after an error. You can restart the journey together or return to the Life Alignment hub.", "Antworten werden nicht gespeichert und lassen sich nach einem Fehler nicht wiederherstellen. Ihr könnt die Journey gemeinsam neu beginnen oder zum Life-Alignment-Hub zurückkehren.")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="min-h-11 rounded-full bg-[#f5b971] px-5 font-black text-[#07131d]">{lifeUiValue(locale, "Reload journey", "Journey neu laden")}</button>
          <Link href={localizeHref("/life-alignment")} className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 font-bold text-white">{lifeUiValue(locale, "To the hub", "Zum Hub")}</Link>
        </div>
      </div>
    </main>);
}
