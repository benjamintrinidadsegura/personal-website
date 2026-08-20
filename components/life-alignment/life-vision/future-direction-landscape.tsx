"use client";
import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import { useLocale } from "@/components/i18n/locale-context";
import type { LifeVisionDirectionLaneId, LifeVisionResult } from "@/types/life-alignment-life-vision";
const laneStyles: Readonly<Record<LifeVisionDirectionLaneId, {
    border: string;
    surface: string;
    accent: string;
    symbol: string;
}>> = {
    protect: { border: "border-[#f5b971]/40", surface: "bg-[#f5b971]/[0.07]", accent: "text-[#ffd4a0]", symbol: "◇" },
    "move-toward": { border: "border-[#9dd9c5]/40", surface: "bg-[#9dd9c5]/[0.07]", accent: "text-[#c9f3e5]", symbol: "→" },
    reduce: { border: "border-[#d8a6a6]/35", surface: "bg-[#d8a6a6]/[0.065]", accent: "text-[#f0c7c7]", symbol: "↘" },
    "keep-open": { border: "border-[#b8afd8]/40", surface: "bg-[#b8afd8]/[0.07]", accent: "text-[#ded8f1]", symbol: "…" },
};
export function FutureDirectionLandscape({ result, onEdit }: {
    result: LifeVisionResult;
    onEdit: () => void;
}) {
    const locale = useLocale();
    const areaTitle = (areaId: string) => result.areas.find(({ id }) => id === areaId)?.title ?? areaId;
    return (<section aria-labelledby="future-landscape-title" className="py-16 sm:py-20">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#9dd9c5]">{lifeUiValue(locale, "Visual snapshot", "Visuelle Momentaufnahme")}</p>
          <h2 id="future-landscape-title" className="mt-4 max-w-4xl text-4xl font-black text-white sm:text-5xl">{result.visualSnapshot.headline}</h2>
          <p className="mt-5 max-w-3xl leading-7 text-slate-300">{result.visualSnapshot.description}</p>
        </div>
        <button type="button" onClick={onEdit} className="min-h-11 self-start rounded-full border border-white/15 px-5 text-sm font-bold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9dd9c5]">{lifeUiValue(locale, "Edit directions", "Richtungen bearbeiten")}</button>
      </div>

      <div className="mt-9 grid overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#061521]/70 lg:grid-cols-3">
        <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r"><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#9dd9c5]">{lifeUiValue(locale, "Direction view", "Richtungsbild")}</p><p className="mt-3 text-sm leading-6 text-slate-300">{result.visualSnapshot.directionSummary}</p></div>
        <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r"><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#f5b971]">{lifeUiValue(locale, "Protection view", "Schutzbild")}</p><p className="mt-3 text-sm leading-6 text-slate-300">{result.visualSnapshot.protectionSummary}</p></div>
        <div className="p-6"><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#e8a0a0]">{lifeUiValue(locale, "Context view", "Kontextbild")}</p><p className="mt-3 text-sm leading-6 text-slate-300">{result.visualSnapshot.contextSummary}</p></div>
      </div>

      <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#9dd9c5]">Future Direction Map</p><h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">{lifeUiValue(locale, "Four qualitative spaces, no axis and no ranking.", "Vier qualitative Räume, keine Achse und keine Rangfolge.")}</h3></div>
        <p className="max-w-md text-sm leading-6 text-slate-400">{lifeUiValue(locale, "An area may appear in several spaces, such as protect and move toward at the same time. That overlap is part of the view.", "Ein Bereich kann in mehreren Räumen erscheinen, etwa gleichzeitig „schützen“ und „hin zu“. Genau diese Überlagerung ist Teil der Darstellung.")}</p>
      </div>

      <ol className="relative mt-8 grid gap-4 lg:grid-cols-4" aria-label={lifeUiValue(locale, "Qualitative spaces in the Future Direction Map", "Qualitative Räume der Future Direction Map")}>
        <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-8 hidden border-t border-dashed border-white/15 lg:block"/>
        {result.directionMap.lanes.map((lane) => {
            const style = laneStyles[lane.id];
            return <li key={lane.id} className={`relative rounded-[1.6rem] border p-5 ${style.border} ${style.surface}`}>
            <span aria-hidden="true" className={`relative z-10 grid h-11 w-11 place-items-center rounded-full border bg-[#061521] text-xl font-black ${style.border} ${style.accent}`}>{style.symbol}</span>
            <h4 className={`mt-5 text-xl font-black ${style.accent}`}>{lane.title}</h4>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{lane.description}</p>
            {lane.areaIds.length ? <ul className="mt-5 grid gap-2">{lane.areaIds.map((areaId) => <li key={areaId} className="rounded-xl border border-white/10 bg-[#04111b]/80 px-3 py-3 text-sm font-bold text-white">{areaTitle(areaId)}</li>)}</ul> : <p className="mt-5 rounded-xl border border-dashed border-white/15 px-3 py-3 text-sm text-slate-500">{lifeUiValue(locale, "Nothing marked by you.", "Von dir nichts markiert.")}</p>}
          </li>;
        })}
      </ol>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
        <section aria-labelledby="map-constraints-title" className="rounded-[1.5rem] border border-[#e8a0a0]/30 bg-[#e8a0a0]/[0.045] p-5"><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#f0bcbc]">{lifeUiValue(locale, "Affects available room", "Wirkt auf den Spielraum")}</p><h4 id="map-constraints-title" className="mt-3 text-lg font-black text-white">{lifeUiValue(locale, "Real conditions", "Reale Bedingungen")}</h4>{result.directionMap.constraintLabels.length ? <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-300">{result.directionMap.constraintLabels.map((label) => <li key={label}>• {label}</li>)}</ul> : <p className="mt-4 text-sm leading-6 text-slate-400">{lifeUiValue(locale, "No specific constraint recorded.", "Keine konkrete Grenze festgehalten.")}</p>}</section>
        <section aria-labelledby="map-tradeoff-title" className="rounded-[1.5rem] border border-[#9ec5e5]/30 bg-[#9ec5e5]/[0.045] p-5"><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#c9e4f7]">{lifeUiValue(locale, "Connects directions", "Verbindet Richtungen")}</p><h4 id="map-tradeoff-title" className="mt-3 text-lg font-black text-white">{lifeUiValue(locale, "Trade-off", "Abwägung")}</h4><p className="mt-4 text-sm leading-6 text-slate-300">{result.directionMap.tradeoffLabel}</p></section>
        <section aria-labelledby="map-sources-title" className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5"><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{lifeUiValue(locale, "Remains subject to your interpretation", "Bleibt deiner Deutung unterstellt")}</p><h4 id="map-sources-title" className="mt-3 text-lg font-black text-white">{lifeUiValue(locale, "Source signals", "Herkunftssignale")}</h4><dl className="mt-4 grid gap-3">{result.directionMap.sourceSignals.map((signal) => <div key={signal.areaTitle}><dt className="text-sm font-black text-slate-200">{signal.areaTitle}</dt><dd className="mt-1 text-xs leading-5 text-slate-400">{signal.labels.join(" · ")}</dd></div>)}</dl></section>
      </div>

      <p className="mt-6 max-w-4xl text-sm leading-7 text-slate-500">{lifeUiValue(locale, "Text is authoritative: colours, positions and symbols only support overview. They measure no quality, strength, closeness or probability.", "Text ist maßgeblich: Farben, Positionen und Symbole helfen nur beim Überblick. Sie messen keine Qualität, Stärke, Nähe oder Wahrscheinlichkeit.")}</p>

      <section aria-labelledby="illustrations-title" className="mt-16 border-t border-white/15 pt-16">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#9dd9c5]">{lifeUiValue(locale, "Possible everyday illustrations", "Mögliche Alltagsbilder")}</p>
        <h3 id="illustrations-title" className="mt-4 max-w-4xl text-3xl font-black text-white sm:text-4xl">{lifeUiValue(locale, "Make it more concrete without claiming anything about your life.", "Konkreter vorstellen, ohne etwas über dein Leben zu behaupten.")}</h3>
        <p className="mt-4 max-w-3xl leading-7 text-slate-400">{lifeUiValue(locale, "These examples only illustrate what a signal could look like. They are not a diagnosis, prediction or description of your actual everyday life.", "Diese Beispiele illustrieren nur, wie ein Signal aussehen könnte. Sie sind keine Diagnose, Vorhersage oder Beschreibung deines tatsächlichen Alltags.")}</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {result.insights.map((insight) => <li key={insight.id} className="rounded-[1.4rem] border border-dashed border-white/15 bg-white/[0.02] p-5"><p className="font-black text-white">{insight.title}</p><p className="mt-3 text-sm leading-6 text-slate-400">{insight.illustrativeExample}</p></li>)}
        </ul>
      </section>

      <section aria-labelledby="path-tools-title" className="mt-16 border-t border-white/15 pt-16">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#9dd9c5]">{lifeUiValue(locale, "Learn rather than prescribe", "Lernen statt festlegen")}</p>
        <h3 id="path-tools-title" className="mt-4 max-w-4xl text-3xl font-black text-white sm:text-4xl">{lifeUiValue(locale, "Small tools for the paths you selected yourself.", "Kleine Hilfen für die Wege, die du selbst gewählt hast.")}</h3>
        <p className="mt-4 max-w-3xl leading-7 text-slate-400">{lifeUiValue(locale, "The tools are intentionally small and internal: no live resources, invented contacts or complete action system.", "Die Hilfen sind absichtlich klein und intern: keine Live-Ressourcen, keine erfundenen Kontakte und kein vollständiges Aktionssystem.")}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {result.actionPaths.map((path) => <article key={path.mode} className="rounded-[1.4rem] border border-[#9dd9c5]/20 bg-[#9dd9c5]/[0.035] p-5"><h4 className="text-lg font-black text-white">{path.title}</h4><dl className="mt-5 grid gap-4"><div><dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#9dd9c5]">{lifeUiValue(locale, "Learning question", "Lernfrage")}</dt><dd className="mt-2 text-sm leading-6 text-slate-300">{path.learningQuestion}</dd></div><div><dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#9dd9c5]">{lifeUiValue(locale, "Smallest fitting tool", "Kleinste passende Hilfe")}</dt><dd className="mt-2"><ul className="grid gap-2">{path.tools.map((tool) => <li key={tool.title} className="rounded-xl border border-white/10 bg-[#04111b]/70 p-3"><strong className="text-sm text-white">{tool.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-400">{tool.use}</span></li>)}</ul></dd></div></dl><details className="mt-5 border-t border-white/10 pt-3"><summary className="min-h-11 cursor-pointer py-2 text-sm font-bold text-[#9dd9c5]">{lifeUiValue(locale, "Why this tool appears", "Warum diese Hilfe erscheint")}</summary><dl className="mt-2 grid gap-3">{path.evidence.map((item, index) => <div key={`${item.label}-${index}`}><dt className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</dt><dd className="mt-1 text-xs leading-5 text-slate-300">{item.detail}</dd></div>)}</dl></details></article>)}
        </div>
      </section>

      <section aria-labelledby="closing-orientation-title" className="mt-16 rounded-[1.8rem] border border-[#f5b971]/30 bg-[#f5b971]/[0.05] p-6 sm:p-9">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Closing orientation", "Abschließende Orientierung")}</p>
        <h3 id="closing-orientation-title" className="mt-4 text-3xl font-black text-white sm:text-4xl">{result.closingOrientation.headline}</h3>
        <p className="mt-5 max-w-4xl text-lg font-bold leading-8 text-slate-200">{result.closingOrientation.orientation}</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]"><div><h4 className="font-black text-white">{lifeUiValue(locale, "Questions to take with you", "Fragen zum Mitnehmen")}</h4><ul className="mt-4 grid gap-3">{result.closingOrientation.questions.map((question) => <li key={question} className="border-l-2 border-[#f5b971] pl-4 leading-7 text-slate-300">{question}</li>)}</ul></div><details className="self-start rounded-2xl border border-white/10 bg-[#04111b]/60 p-4"><summary className="min-h-11 cursor-pointer py-2 font-bold text-[#f5b971]">{lifeUiValue(locale, "Basis for this orientation", "Grundlage dieser Orientierung")}</summary><dl className="mt-3 grid gap-3">{result.closingOrientation.evidence.map((item, index) => <div key={`${item.label}-${index}`}><dt className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</dt><dd className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</dd></div>)}</dl></details></div>
      </section>
    </section>);
}
