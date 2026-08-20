"use client";
import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import { useLocale } from "@/components/i18n/locale-context";
import type { PartnerComparisonFinding, PartnerComparisonResult, PartnerEvidenceReference, PartnerFindingCategory, PartnerParticipantId, PartnerSharedContextId, } from "@/types/life-alignment-partner";
const CATEGORY_ORDER: readonly PartnerFindingCategory[] = [
    "shared-ground",
    "worth-discussing",
    "direction-difference",
    "different-expectations",
    "present-constraint",
    "uncertainty",
    "accepted-difference",
    "not-assessed-by-both",
];
const SHARED_VISUALS: Readonly<Record<PartnerSharedContextId, {
    symbol: string;
    border: string;
    surface: string;
    accent: string;
}>> = {
    "shared-ground": { symbol: "◆", border: "border-[#73d5e6]/35", surface: "bg-[#73d5e6]/[0.055]", accent: "text-[#bceef5]" },
    "different-perspectives": { symbol: "↔", border: "border-[#f5b971]/35", surface: "bg-[#f5b971]/[0.055]", accent: "text-[#ffd7a5]" },
    "open-questions": { symbol: "?", border: "border-[#b8afd8]/35", surface: "bg-[#b8afd8]/[0.055]", accent: "text-[#ded8f1]" },
    "current-constraints": { symbol: "◇", border: "border-[#e8a0a0]/35", surface: "bg-[#e8a0a0]/[0.05]", accent: "text-[#f0c7c7]" },
    "conversation-opportunities": { symbol: "…", border: "border-[#9dd9c5]/35", surface: "bg-[#9dd9c5]/[0.05]", accent: "text-[#c9f3e5]" },
    "not-yet-explored-together": { symbol: "○", border: "border-white/15", surface: "bg-white/[0.025]", accent: "text-slate-300" },
};
const EVIDENCE_FIELD_LABELS: Readonly<Record<PartnerEvidenceReference["field"], string>> = {
    experience: "Heutiges Erleben",
    desiredDirection: "Gewünschte Richtung",
    importance: "Bedeutung",
    certainty: "Sicherheit der Einordnung",
    expectationClarity: "Aktueller Erwartungsstand",
    differenceStance: "Umgang mit möglicher Differenz",
    constraint: "Heutiger Spielraum",
    selected: "Themenwahl",
};
function topicTitle(result: PartnerComparisonResult, dimensionId: string): string {
    return result.tracks.find((track) => track.dimensionId === dimensionId)?.dimensionTitle ?? dimensionId;
}
function neutralPerspectiveLabel(finding: PartnerComparisonFinding, participant: PartnerParticipantId): string {
    const order = [...new Set(finding.evidence.map((item) => item.participant))];
    if (order.length === 1)
        return "Eine freigegebene Perspektive";
    return order.indexOf(participant) === 0 ? "Eine Perspektive" : "Die andere Perspektive";
}
function FindingCard({ finding, index, result }: {
    finding: PartnerComparisonFinding;
    index: number;
    result: PartnerComparisonResult;
}) {
    const locale = useLocale();
    const evidenceLabels: Readonly<Record<PartnerEvidenceReference["field"], string>> = lifeUiValue(locale, { experience: "Current experience", desiredDirection: "Desired direction", importance: "Importance", certainty: "Certainty", expectationClarity: "Current expectation status", differenceStance: "Approach to a possible difference", constraint: "Room available today", selected: "Topic selection" }, EVIDENCE_FIELD_LABELS);
    return (<article className="rounded-[1.75rem] border border-white/10 bg-[#061521]/75 p-6 sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[0.3fr_1fr]">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#f5b971]">
            {String(index + 1).padStart(2, "0")} · {finding.categoryLabel}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label={lifeUiValue(locale, "Topics involved", "Betroffene Themen")}>
            {finding.dimensionIds.map((id) => <li key={id} className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-slate-300">{topicTitle(result, id)}</li>)}
          </ul>
        </div>

        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{lifeUiValue(locale, "What becomes visible", "Was sichtbar wird")}</p>
          <h3 className="mt-3 text-2xl font-black text-white sm:text-3xl">{finding.headline}</h3>
          <p className="mt-4 leading-7 text-slate-300">{finding.explanation}</p>

          <section aria-label={lifeUiValue(locale, "Possible everyday meaning", "Mögliche Bedeutung im Alltag")} className="mt-6 rounded-xl border-l-2 border-[#f5b971] bg-[#04111b]/60 p-4">
            <h4 className="font-black text-white">{lifeUiValue(locale, "What this might mean in everyday life", "Was das im Alltag bedeuten könnte")}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">{finding.everydayTranslation}</p>
            <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#f5b971]">{lifeUiValue(locale, "Possible examples—not claims about your life", "Mögliche Beispiele – keine Aussagen über euren Alltag")}</p>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
              {finding.everydayExamples.map((example) => <li key={example} className="border-l border-white/15 pl-3">{example}</li>)}
            </ul>
          </section>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section>
              <h4 className="font-black text-white">{lifeUiValue(locale, "Questions you might examine", "Fragen, die ihr prüfen könntet")}</h4>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">{finding.questions.map((question) => <li key={question}>• {question}</li>)}</ul>
            </section>
            <section>
              <h4 className="font-black text-white">{lifeUiValue(locale, "Three small possibilities", "Drei kleine Möglichkeiten")}</h4>
              <ol className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
                {finding.possibleNextSteps.map((step, stepIndex) => <li key={step}><span className="font-mono text-[#f5b971]">{stepIndex + 1}.</span> {step}</li>)}
              </ol>
            </section>
          </div>

          <dl className="mt-6 grid gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-2">
            <div><dt className="font-black text-white">{lifeUiValue(locale, "What you might learn", "Was ihr lernen könntet")}</dt><dd className="mt-2 text-sm leading-6 text-slate-300">{finding.whatCouldBeLearned}</dd></div>
            <div><dt className="font-black text-white">{lifeUiValue(locale, "Boundary of this reading", "Grenze dieser Lesart")}</dt><dd className="mt-2 text-sm leading-6 text-slate-400">{finding.boundary}</dd></div>
          </dl>

          <details className="mt-6 border-t border-white/10 pt-4">
            <summary className="min-h-11 cursor-pointer py-2 font-bold text-[#f5b971]">{lifeUiValue(locale, "What is this based on?", "Worauf basiert das?")}</summary>
            <p className="mt-2 text-xs leading-5 text-slate-500">{lifeUiValue(locale, "The perspectives are deliberately labelled neutrally here. They still come from the two sequentially released passes on this device.", "Die Perspektiven werden hier bewusst neutral benannt. Sie stammen weiterhin aus den zwei nacheinander freigegebenen Durchgängen auf diesem Gerät.")}</p>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
              {finding.evidence.map((item, evidenceIndex) => (<li key={`${item.participant}-${item.dimensionId}-${item.field}-${evidenceIndex}`} className="rounded-xl border border-white/10 bg-[#04111b]/60 p-3">
                  <span className="font-black text-white">{lifeUiValue(locale, (finding.evidence.every(({ participant }) => participant === item.participant) ? "One released perspective" : finding.evidence.findIndex(({ participant }) => participant === item.participant) === 0 ? "One perspective" : "The other perspective"), neutralPerspectiveLabel(finding, item.participant))} · {topicTitle(result, item.dimensionId)}</span>
                  <span className="mt-1 block text-xs text-slate-500">{evidenceLabels[item.field]}</span>
                  <span className="mt-1 block">{item.label}</span>
                </li>))}
            </ul>
          </details>
        </div>
      </div>
    </article>);
}
export function PartnerComparisonLandscape({ result }: {
    result: PartnerComparisonResult;
}) {
    const locale = useLocale();
    const findings = CATEGORY_ORDER.flatMap((category) => result.findingsByCategory[category]);
    return (<section aria-labelledby="partner-landscape-title" className="py-16 sm:py-20">
      <header className="max-w-4xl">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Shared relationship context", "Gemeinsamer Beziehungskontext")}</p>
        <h2 id="partner-landscape-title" className="mt-4 text-4xl font-black text-white sm:text-6xl">{lifeUiValue(locale, "What becomes visible between you.", "Was zwischen euch sichtbar wird.")}</h2>
        <p className="mt-5 text-lg leading-8 text-slate-300">{lifeUiValue(locale, "The overview begins with shared patterns, open questions and real conditions. It evaluates neither of you or your relationship and does not set one person against the other.", "Die Übersicht beginnt mit gemeinsamen Mustern, offenen Fragen und realen Bedingungen. Sie bewertet weder euch noch eure Beziehung und stellt keine Person gegen die andere.")}</p>
      </header>

      <ol className="relative mt-10 grid gap-4 lg:grid-cols-3" aria-label={lifeUiValue(locale, "Qualitative overview of your shared relationship context", "Qualitative Übersicht eures gemeinsamen Beziehungskontexts")}>
        <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-8 hidden border-t border-dashed border-white/15 lg:block"/>
        {result.sharedOverview.map((signal) => {
            const visual = SHARED_VISUALS[signal.id];
            return (<li key={signal.id} className={`relative rounded-[1.6rem] border p-5 sm:p-6 ${visual.border} ${visual.surface}`}>
              <span aria-hidden="true" className={`relative z-10 grid size-11 place-items-center rounded-full border bg-[#061521] text-xl font-black ${visual.border} ${visual.accent}`}>{visual.symbol}</span>
              <p className={`mt-5 font-mono text-[10px] font-black uppercase tracking-[0.16em] ${visual.accent}`}>{signal.label}</p>
              <h3 className="mt-3 text-xl font-black leading-7 text-white">{signal.headline}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{signal.explanation}</p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label={lifeUiValue(locale, "Related topics", "Zugehörige Themen")}>
                {signal.dimensionIds.map((id) => <li key={id} className="rounded-full border border-white/10 bg-[#04111b]/70 px-3 py-1 text-xs font-bold text-slate-300">{topicTitle(result, id)}</li>)}
              </ul>
            </li>);
        })}
      </ol>

      <aside className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6" aria-labelledby="partner-not-overinterpret-title">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{lifeUiValue(locale, "Do not over-interpret", "Nicht überinterpretieren")}</p>
        <h3 id="partner-not-overinterpret-title" className="mt-3 text-xl font-black text-white">{lifeUiValue(locale, "This overview shows conversation context, not relationship truth.", "Diese Übersicht zeigt Gesprächskontext, keine Beziehungswahrheit.")}</h3>
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-400 sm:grid-cols-3">
          {(lifeUiValue(locale, ["Shared directions do not automatically mean the same needs.", "Different perspectives do not mean one person is wrong.", "Open questions need not be clarified today or together."], ["Gemeinsame Richtungen bedeuten nicht automatisch dieselben Bedürfnisse.", "Unterschiedliche Blickwinkel bedeuten nicht, dass eine Person falsch liegt.", "Offene Fragen müssen weder heute noch gemeinsam geklärt werden."])).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </aside>

      <section aria-labelledby="partner-synthesis-title" className="mt-20 border-t border-white/15 pt-14">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">Insight first</p>
        <h2 id="partner-synthesis-title" className="mt-4 max-w-4xl text-4xl font-black text-white sm:text-5xl">{lifeUiValue(locale, "Concrete signals that connect several answers.", "Konkrete Hinweise, die mehrere Antworten verbinden.")}</h2>
        <p className="mt-5 max-w-3xl leading-7 text-slate-300">{lifeUiValue(locale, "Each signal begins with a shared reading. Person-specific source answers remain optional and appear only in the evidence.", "Jeder Hinweis beginnt mit einer gemeinsamen Lesart. Personbezogene Ausgangsantworten bleiben optional und erscheinen erst in der Antwortgrundlage.")}</p>
        <div className="mt-10 grid gap-8">{findings.map((finding, index) => <FindingCard key={finding.id} finding={finding} index={index} result={result}/>)}</div>
      </section>
    </section>);
}
export function PartnerActionPaths({ result }: {
    result: PartnerComparisonResult;
}) {
    const locale = useLocale();
    return (<section aria-labelledby="partner-paths-title" className="border-t border-white/15 py-16 sm:py-20">
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Several possible paths", "Mehrere mögliche Wege")}</p>
      <h2 id="partner-paths-title" className="mt-4 max-w-4xl text-4xl font-black text-white sm:text-5xl">{lifeUiValue(locale, "No path is automatically the right one.", "Kein Weg ist automatisch der richtige.")}</h2>
      <p className="mt-5 max-w-3xl leading-7 text-slate-300">{lifeUiValue(locale, "You may choose, combine, change, postpone or reject every path. No conversation or agreement is required.", "Ihr könnt einen Weg wählen, kombinieren, verändern, vertagen oder alle verwerfen. Kein Gespräch und keine Einigung sind erforderlich.")}</p>
      <ol className="mt-10 grid gap-5 lg:grid-cols-2">
        {result.paths.map((path) => {
            const details = [
                [lifeUiValue(locale, "Why visible", "Warum sichtbar"), path.why],
                [lifeUiValue(locale, "Possible approach", "Möglicher Ansatz"), path.approach],
                [lifeUiValue(locale, "What you might learn", "Was ihr lernen könntet"), path.whatCouldBeLearned],
                [lifeUiValue(locale, "Trade-off / boundary", "Trade-off / Grenze"), path.tradeoffs],
                [lifeUiValue(locale, "Reversibility", "Reversibilität"), path.reversibility],
            ] as const;
            return <li key={path.id} className="rounded-[1.5rem] border border-[#f5b971]/20 bg-[#071824] p-6 sm:p-7"><article><h3 className="text-2xl font-black text-white">{path.title}</h3><dl className="mt-6 grid gap-5 text-sm leading-6">{details.map(([term, detail]) => <div key={term}><dt className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[#f5b971]">{term}</dt><dd className="mt-2 text-slate-300">{detail}</dd></div>)}</dl></article></li>;
        })}
      </ol>
    </section>);
}
export function PartnerExperiments({ result }: {
    result: PartnerComparisonResult;
}) {
    const locale = useLocale();
    return (<section aria-labelledby="partner-experiments-title" className="border-t border-white/15 py-16 sm:py-20">
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Three reversible explorations", "Drei reversible Erkundungen")}</p>
      <h2 id="partner-experiments-title" className="mt-4 text-4xl font-black text-white sm:text-5xl">{lifeUiValue(locale, "From a signal to a small shared test.", "Vom Hinweis zu einem kleinen gemeinsamen Test.")}</h2>
      <p className="mt-5 max-w-3xl leading-7 text-slate-400">{lifeUiValue(locale, "Only if both people want to participate. Pausing, stopping or changing nothing are always valid options.", "Nur wenn beide teilnehmen möchten. Pausieren, stoppen oder nichts verändern sind jederzeit gültige Möglichkeiten.")}</p>
      <ol className="mt-10 grid gap-5 lg:grid-cols-3">{result.experiments.map((experiment) => <li key={experiment.id} className="rounded-[1.5rem] border border-white/10 bg-[#061521]/75 p-6"><h3 className="text-xl font-black text-white">{experiment.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{experiment.why}</p><ol className="mt-5 grid gap-3">{experiment.steps.map((step, index) => <li key={step} className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm leading-6 text-slate-300"><span className="font-mono font-black text-[#f5b971]">{index + 1}</span><span>{step}</span></li>)}</ol><dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 text-sm leading-6"><div><dt className="font-black text-white">{lifeUiValue(locale, "What you might learn", "Was ihr lernen könntet")}</dt><dd className="mt-1 text-slate-300">{experiment.whatCouldBeLearned}</dd></div><div><dt className="font-black text-white">{lifeUiValue(locale, "Observation question", "Beobachtungsfrage")}</dt><dd className="mt-1 text-slate-300">{experiment.observationQuestion}</dd></div><div><dt className="font-black text-white">{lifeUiValue(locale, "Stop signal", "Stoppsignal")}</dt><dd className="mt-1 text-slate-400">{experiment.stopBoundary}</dd></div></dl></li>)}</ol>
    </section>);
}
export function PartnerConversationTools({ result }: {
    result: PartnerComparisonResult;
}) {
    const locale = useLocale();
    return (<section aria-labelledby="partner-tools-title" className="border-t border-white/15 py-16 sm:py-20">
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Conversation tools", "Gesprächswerkzeuge")}</p>
      <h2 id="partner-tools-title" className="mt-4 text-4xl font-black text-white sm:text-5xl">{lifeUiValue(locale, "A clear structure—only if both people want to talk.", "Eine klare Form – nur wenn beide sprechen möchten.")}</h2>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">{result.conversationTools.map((tool) => <article key={tool.id} className="rounded-[1.5rem] border border-[#73d5e6]/20 bg-[#061521]/75 p-6 sm:p-8"><h3 className="text-2xl font-black text-white">{tool.title}</h3><p className="mt-3 leading-7 text-slate-300"><strong className="text-[#bceef5]">{lifeUiValue(locale, "Useful when", "Hilfreich, wenn")}:</strong> {tool.usefulWhen}</p><ol className="mt-6 grid gap-4">{tool.steps.map((step, index) => <li key={step} className="grid grid-cols-[2rem_1fr] gap-3 leading-7 text-slate-300"><span className="flex size-8 items-center justify-center rounded-full border border-[#73d5e6]/40 font-mono text-sm font-black text-[#bceef5]">{index + 1}</span><span>{step}</span></li>)}</ol><p className="mt-6 border-l-2 border-[#73d5e6] pl-4 font-bold leading-7 text-white">{lifeUiValue(locale, "To close", "Zum Abschluss")}: {tool.closingQuestion}</p><p className="mt-5 text-sm leading-6 text-slate-400">{tool.safetyBoundary}</p></article>)}</div>
    </section>);
}
