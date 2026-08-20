"use client";
import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import { useLocale } from "@/components/i18n/locale-context";
export default function LifeAlignmentError({ reset }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    const locale = useLocale();
    return (<section className="mx-auto min-h-[70svh] max-w-3xl px-5 pb-24 pt-36 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">Life Alignment</p>
      <h1 className="mt-5 text-4xl font-black text-white">{lifeUiValue(locale, "The module hub could not be displayed.", "Der Modul-Hub konnte nicht angezeigt werden.")}</h1>
      <p className="mt-5 leading-7 text-slate-300">{lifeUiValue(locale, "You can reload the overview and then select Self, Partner or Life Vision.", "Du kannst die Übersicht erneut laden und anschließend Self, Partner oder Life Vision auswählen.")}</p>
      <button type="button" onClick={reset} className="mt-8 min-h-12 rounded-full bg-[#f5b971] px-6 font-black text-[#07131d]">{lifeUiValue(locale, "Try again", "Erneut versuchen")}</button>
    </section>);
}
