"use client";
import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import { useLocale } from "@/components/i18n/locale-context";
import { getSelfAlignmentContent } from "@/data/i18n/life-alignment";
import type { LifeAlignmentEvidence, LifeAlignmentResult } from "@/types/life-alignment";
function EvidenceDisclosure({ evidence }: {
    evidence: readonly LifeAlignmentEvidence[];
}) {
    const locale = useLocale();
    return (<details className="mt-6 border-t border-white/10 pt-4">
      <summary className="min-h-11 cursor-pointer py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-[#f5b971] marker:text-slate-500">
        {getSelfAlignmentContent(locale).depth.evidenceLabel}
      </summary>
      <dl className="mt-2 grid gap-3">
        {evidence.map((item, index) => (<div key={`${item.source}-${index}`} className="border-l border-white/15 pl-4">
            <dt className="text-xs font-bold text-slate-400">{item.source}</dt>
            <dd className="mt-1 text-sm leading-6 text-slate-200">{item.detail}</dd>
          </div>))}
      </dl>
    </details>);
}
export function SelfInsightSynthesis({ result }: {
    result: LifeAlignmentResult;
}) {
    const locale = useLocale();
    return (<section aria-labelledby="self-insights-title" className="border-t border-white/15 py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.34fr_1fr] lg:gap-14">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Relationships", "Zusammenhänge")}</p>
          <h2 id="self-insights-title" className="mt-4 text-4xl font-black text-white sm:text-5xl">{lifeUiValue(locale, "What becomes visible between the areas.", "Was zwischen den Bereichen sichtbar wird.")}</h2>
          <p className="mt-5 leading-7 text-slate-400">{lifeUiValue(locale, "These observations connect only your explicit answers. Each one shows its basis.", "Diese Aussagen verbinden nur deine ausdrücklichen Antworten. Jede zeigt ihre Grundlage.")}</p>
        </div>
        <ol className="grid gap-5">
          {result.insights.map((insight, index) => (<li key={insight.id} className="rounded-[1.6rem] border border-white/10 bg-[#061521]/70 p-6 sm:p-8">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#f5b971]">{String(index + 1).padStart(2, "0")} · {insight.eyebrow}</p>
              <h3 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">{insight.title}</h3>
              <p className="mt-5 leading-7 text-slate-300">{insight.explanation}</p>
              <div className="mt-5 rounded-xl border-l-2 border-[#74d8c8] bg-[#74d8c8]/[0.045] px-5 py-4">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#74d8c8]">{lifeUiValue(locale, "In everyday life this might mean", "Im Alltag könnte das heißen")}</p>
                <p className="mt-2 leading-7 text-slate-200">{insight.everydayInterpretation}</p>
              </div>
              <EvidenceDisclosure evidence={insight.evidence}/>
            </li>))}
        </ol>
      </div>
    </section>);
}
export function SelfContextualPaths({ result }: {
    result: LifeAlignmentResult;
}) {
    const locale = useLocale();
    return (<section aria-labelledby="self-paths-title" className="border-t border-white/15 py-16 sm:py-20">
      <div className="max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Several possible paths", "Mehrere mögliche Wege")}</p>
        <h2 id="self-paths-title" className="mt-4 text-4xl font-black text-white sm:text-5xl">{lifeUiValue(locale, "What you might try from here.", "Was du von hier aus versuchen könntest.")}</h2>
        <p className="mt-5 text-lg leading-8 text-slate-300">{lifeUiValue(locale, "No path is objectively right. Choose only what fits the room available today.", "Kein Weg ist objektiv richtig. Wähle höchstens, was zu deinem heutigen Spielraum passt.")}</p>
      </div>

      <ol className="mt-10 grid gap-5 lg:grid-cols-2">
        {result.actionPaths.map((path, index) => (<li key={path.id} className="flex flex-col rounded-[1.6rem] border border-white/10 bg-[#061521]/70 p-6 sm:p-8">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#f5b971]">{lifeUiValue(locale, "Possibility", "Möglichkeit")} {String(index + 1).padStart(2, "0")}</p>
            <h3 className="mt-4 text-2xl font-black leading-tight text-white">{path.title}</h3>
            <dl className="mt-6 grid gap-5 text-sm leading-6">
              <div><dt className="font-black text-slate-200">{lifeUiValue(locale, "Why this path may fit", "Warum dieser Weg passen könnte")}</dt><dd className="mt-2 text-slate-400">{path.why}</dd></div>
              <div><dt className="font-black text-slate-200">{lifeUiValue(locale, "A first step", "Ein erster Schritt")}</dt><dd className="mt-2 text-slate-300">{path.firstStep}</dd></div>
              <div><dt className="font-black text-slate-200">{lifeUiValue(locale, "Concrete example", "Konkretes Beispiel")}</dt><dd className="mt-2 text-slate-400">{path.example}</dd></div>
              <div className="rounded-xl border-l-2 border-[#74d8c8] bg-[#74d8c8]/[0.045] px-4 py-3"><dt className="font-black text-[#9ee8dc]">{lifeUiValue(locale, "What you might learn", "Was du dabei lernen könntest")}</dt><dd className="mt-2 text-slate-200">{path.learning}</dd></div>
              <div><dt className="font-black text-slate-200">{lifeUiValue(locale, "Possible trade-off", "Möglicher Trade-off")}</dt><dd className="mt-2 text-slate-400">{path.tradeoff}</dd></div>
              <div><dt className="font-black text-slate-200">{lifeUiValue(locale, "Reversibility", "Umkehrbarkeit")}</dt><dd className="mt-2 text-slate-400">{path.reversible ? (lifeUiValue(locale, "Yes—designed as a small experiment and easy to stop.", "Ja – als kleiner Versuch geplant und leicht wieder zu beenden.")) : (lifeUiValue(locale, "Not fully—a conversation cannot be undone, but it can remain open and free of decision pressure.", "Nicht vollständig – ein Gespräch lässt sich nicht zurücknehmen, kann aber offen und ohne Entscheidungsdruck geführt werden."))}</dd></div>
            </dl>
            <EvidenceDisclosure evidence={path.evidence}/>
          </li>))}
      </ol>
      <p className="mt-7 max-w-5xl text-sm leading-7 text-slate-500">{getSelfAlignmentContent(locale).depth.pathsBoundary}</p>
    </section>);
}
export function SelfMicroTools({ result }: {
    result: LifeAlignmentResult;
}) {
    const locale = useLocale();
    return (<section aria-labelledby="self-tools-title" className="border-t border-white/15 py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.34fr_1fr] lg:gap-14">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Small tools", "Kleine Werkzeuge")}</p>
          <h2 id="self-tools-title" className="mt-4 text-4xl font-black text-white sm:text-5xl">{lifeUiValue(locale, "From statement to your own observation.", "Von der Aussage zur eigenen Beobachtung.")}</h2>
          <p className="mt-5 leading-7 text-slate-400">{lifeUiValue(locale, "There is nothing to submit or store. Use only the tool that makes your question more concrete.", "Du brauchst nichts auszufüllen oder zu speichern. Nimm nur das Werkzeug, das deine Frage konkretisiert.")}</p>
        </div>
        <ul className="grid gap-5">
          {result.tools.map((tool) => (<li key={tool.id} className="rounded-[1.5rem] border border-white/10 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-2xl font-black text-white">{tool.title}</h3>
                <span className="rounded-full border border-[#f5b971]/30 bg-[#f5b971]/[0.06] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#f5b971]">{tool.duration}</span>
              </div>
              <p className="mt-4 leading-7 text-slate-300">{tool.purpose}</p>
              <ol className="mt-6 grid gap-3">
                {tool.steps.map((step, index) => <li key={step} className="grid grid-cols-[1.75rem_1fr] gap-3 text-sm leading-6 text-slate-300"><span className="font-mono font-black text-[#f5b971]">{index + 1}</span><span>{step}</span></li>)}
              </ol>
              <p className="mt-6 border-l-2 border-[#f5b971] pl-4 font-bold leading-7 text-white">{tool.prompt}</p>
            </li>))}
        </ul>
      </div>
      <p className="mt-7 max-w-5xl text-sm leading-7 text-slate-500">{getSelfAlignmentContent(locale).depth.toolsBoundary}</p>
    </section>);
}
export function SelfClosingOrientation({ result }: {
    result: LifeAlignmentResult;
}) {
    const locale = useLocale();
    return (<section aria-labelledby="self-closing-title" className="border-y border-[#f5b971]/25 bg-[#f5b971]/[0.035] px-6 py-12 sm:px-10 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "To take with you", "Zum Mitnehmen")}</p>
      <h2 id="self-closing-title" className="mt-4 max-w-5xl text-3xl font-black leading-tight text-white sm:text-5xl">{result.closing.title}</h2>
      <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-200">{result.closing.body}</p>
      <ul className="mt-8 grid gap-3 md:grid-cols-3">
        {result.closing.reminders.map((reminder) => <li key={reminder} className="border-l border-[#f5b971]/50 px-4 py-2 text-sm leading-6 text-slate-300">{reminder}</li>)}
      </ul>
    </section>);
}
