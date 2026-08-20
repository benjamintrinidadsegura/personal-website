"use client";
import { formatLifeSectionProgress, lifeUiValue } from "@/data/i18n/life-alignment-ui";
import Link from "next/link";
import { useEffect, useReducer, useRef, type ReactNode } from "react";
import { HumanContextJourneyDock } from "@/components/human-context/journey-dock";
import { HumanContextScene } from "@/components/human-context/context-scene";
import { PartnerActionPaths, PartnerComparisonLandscape, PartnerConversationTools, PartnerExperiments } from "@/components/life-alignment/partner/comparison-landscape";
import { PartnerResultActions } from "@/components/life-alignment/partner/partner-result-actions";
import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
import { getPartnerAlignmentContent } from "@/data/i18n/life-alignment";
import { buildPartnerClipboardSummary } from "@/lib/life-alignment-partner-export";
import { buildPartnerComparisonResult, formatPartnerSelectionCount, initialPartnerJourneyState, partnerJourneyReducer, } from "@/lib/life-alignment-partner";
import type { PartnerComparisonResult, PartnerDimensionAnswer, PartnerDimensionId, PartnerJourneyAction, PartnerParticipantAnswers, PartnerParticipantId, } from "@/types/life-alignment-partner";
const ACCENT = "#f5b971";
type Dispatch = React.Dispatch<PartnerJourneyAction>;
function SelectionCount({ selected }: {
    selected: number;
}) {
    const locale = useLocale();
    return <span aria-live="polite" aria-atomic="true" className="ml-3 inline-flex min-h-8 shrink-0 items-center rounded-full border border-[#ff9a3d]/40 bg-[#ff9a3d]/[0.065] px-3 py-1 align-middle font-mono text-xs font-bold text-[#ffb36d]">{formatPartnerSelectionCount(selected, locale)}</span>;
}
function CheckCard({ checked, disabled = false, onChange, title, description }: {
    checked: boolean;
    disabled?: boolean;
    onChange: () => void;
    title: string;
    description?: string;
}) {
    return (<label className={`flex min-h-14 cursor-pointer gap-4 rounded-2xl border p-4 transition ${checked ? "border-[#f5b971]/70 bg-[#f5b971]/10" : "border-white/10 bg-[#061521]/70"} ${disabled ? "cursor-not-allowed opacity-45" : "hover:border-white/30"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="mt-1 size-5 shrink-0 accent-[#f5b971]"/>
      <span><span className="block font-black text-white">{title}</span>{description ? <span className="mt-1 block text-sm leading-6 text-slate-400">{description}</span> : null}</span>
    </label>);
}
function RadioCards({ legend, name, value, options, onChange }: {
    legend: string;
    name: string;
    value?: string;
    options: Readonly<Record<string, string>>;
    onChange: (value: string) => void;
}) {
    return (<fieldset>
      <legend className="font-bold text-slate-200">{legend}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.entries(options).map(([optionValue, label]) => (<label key={optionValue} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${value === optionValue ? "border-[#f5b971]/70 bg-[#f5b971]/10 text-white" : "border-white/10 bg-[#04111b]/70 text-slate-300"}`}>
            <input type="radio" name={name} value={optionValue} checked={value === optionValue} onChange={() => onChange(optionValue)} className="mt-1 size-4 shrink-0 accent-[#f5b971]"/>
            <span>{label}</span>
          </label>))}
      </div>
    </fieldset>);
}
function SectionIntro({ participant, number, title, description }: {
    participant: PartnerParticipantId;
    number: number;
    title: string;
    description: string;
}) {
    const locale = useLocale();
    return (<header className="border-b border-white/15 pb-10">
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">Person {participant.toUpperCase()} · {lifeUiValue(locale, "Your perspective only", "Nur deine Perspektive")} · {formatLifeSectionProgress(locale, number, 4)}</p>
      <h1 tabIndex={-1} data-partner-section-heading className="mt-4 text-4xl font-black text-white outline-none sm:text-6xl">{title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{description}</p>
      {participant === "b" ? <p className="mt-5 border-l-2 border-[#f5b971] pl-5 text-sm leading-6 text-slate-400">{lifeUiValue(locale, "Person A's answers are sealed and are not shown during your pass.", "Die Antworten von Person A sind versiegelt und werden in deinem Durchgang nicht angezeigt.")}</p> : null}
    </header>);
}
function DimensionsSection({ participant, answers, dispatch }: {
    participant: PartnerParticipantId;
    answers: PartnerParticipantAnswers;
    dispatch: Dispatch;
}) {
    const locale = useLocale();
    const content = getPartnerAlignmentContent(locale);
    const regular = content.dimensions.filter((dimension) => !("sensitive" in dimension && dimension.sensitive));
    const sensitive = content.dimensions.filter((dimension) => "sensitive" in dimension && dimension.sensitive);
    const full = answers.selectedDimensionIds.length >= 6;
    return (<>
      <SectionIntro participant={participant} number={1} title={lifeUiValue(locale, "Which topics would you like to include?", "Welche Themen möchtest du einbeziehen?")} description={lifeUiValue(locale, "Select only topics that meaningfully represent your own perspective. You do not need to select the same topics; missing overlap will remain explicitly visible.", "Wähle nur Themen, die deine eigene Perspektive sinnvoll abbilden. Ihr müsst nicht dieselben Themen auswählen; fehlende Überschneidungen werden später ausdrücklich sichtbar.")}/>
      <fieldset className="mt-10"><legend className="text-2xl font-black text-white">{lifeUiValue(locale, "Relationship topics", "Beziehungsthemen")} <SelectionCount selected={answers.selectedDimensionIds.length}/></legend><div className="mt-6 grid gap-3 sm:grid-cols-2">{regular.map((dimension) => { const checked = answers.selectedDimensionIds.includes(dimension.id); return <CheckCard key={dimension.id} checked={checked} disabled={!checked && full} onChange={() => dispatch({ type: "toggle-dimension", dimensionId: dimension.id })} title={dimension.title} description={`${dimension.description} ${lifeUiValue(locale, "For example", "Zum Beispiel")}: ${dimension.examples.join(" · ")}.`}/>; })}</div></fieldset>
      <fieldset className="mt-12 border-t border-white/15 pt-10">
        <legend className="text-2xl font-black text-white">{lifeUiValue(locale, "Sensitive topics—voluntary and separate", "Sensible Themen – freiwillig und einzeln")}</legend>
        <p className="mt-3 max-w-3xl leading-7 text-slate-400">{lifeUiValue(locale, "An opt-in makes a topic selectable. You may remove it at any time, which discards your answers for that topic.", "Ein Opt-in macht das Thema erst auswählbar. Du kannst es jederzeit wieder ausschließen; damit werden deine Antworten dazu verworfen.")}</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">{sensitive.map((dimension) => { const optedIn = answers.sensitiveOptIns.includes(dimension.id); const checked = answers.selectedDimensionIds.includes(dimension.id); return <div key={dimension.id} className="rounded-2xl border border-white/10 p-4"><CheckCard checked={optedIn} onChange={() => dispatch({ type: "toggle-sensitive-opt-in", dimensionId: dimension.id })} title={`${lifeUiValue(locale, "Voluntarily include", "freiwillig freigeben")} ${dimension.title}`} description={`${lifeUiValue(locale, "My structured view only; no free text. Examples", "Nur meine strukturierte Einordnung; kein Freitext. Beispiele")}: ${dimension.examples.join(" · ")}.`}/><div className="mt-3"><CheckCard checked={checked} disabled={!optedIn || !checked && full} onChange={() => dispatch({ type: "toggle-dimension", dimensionId: dimension.id })} title={lifeUiValue(locale, "Include in my pass", "In meinen Durchgang aufnehmen")}/></div></div>; })}</div>
      </fieldset>
    </>);
}
function ExperienceSection({ participant, answers, dispatch }: {
    participant: PartnerParticipantId;
    answers: PartnerParticipantAnswers;
    dispatch: Dispatch;
}) {
    const locale = useLocale();
    const content = getPartnerAlignmentContent(locale);
    return (<>
      <SectionIntro participant={participant} number={2} title={lifeUiValue(locale, "How do you experience these topics today?", "Wie erlebst du diese Themen heute?")} description={lifeUiValue(locale, "Answer from your perspective. Uncertainty is a complete answer and is not treated as a deficit.", "Antworte aus deiner Perspektive. Unsicherheit ist eine vollständige Antwort und wird später nicht als Defizit gewertet.")}/>
      <div className="mt-10 grid gap-8">{answers.selectedDimensionIds.map((dimensionId) => { const definition = content.dimensions.find(({ id }) => id === dimensionId)!; const answer = answers.dimensions[dimensionId] ?? {}; return <section key={dimensionId} aria-labelledby={`experience-${participant}-${dimensionId}`} className="rounded-[1.75rem] border border-white/10 bg-[#061521]/70 p-5 sm:p-7"><h2 id={`experience-${participant}-${dimensionId}`} className="text-2xl font-black text-white">{definition.title}</h2><div className="mt-6 grid gap-7"><RadioCards legend={lifeUiValue(locale, "My current experience", "Mein heutiges Erleben")} name={`${participant}-${dimensionId}-experience`} value={answer.experience} options={content.experience} onChange={(value) => dispatch({ type: "set-dimension-answer", dimensionId, field: "experience", value: value as NonNullable<PartnerDimensionAnswer["experience"]> })}/><RadioCards legend={lifeUiValue(locale, "Importance to me", "Bedeutung für mich")} name={`${participant}-${dimensionId}-importance`} value={answer.importance} options={content.importance} onChange={(value) => dispatch({ type: "set-dimension-answer", dimensionId, field: "importance", value: value as NonNullable<PartnerDimensionAnswer["importance"]> })}/><RadioCards legend={lifeUiValue(locale, "How certain is this view?", "Wie sicher ist diese Einordnung?")} name={`${participant}-${dimensionId}-certainty`} value={answer.certainty} options={content.certainty} onChange={(value) => dispatch({ type: "set-dimension-answer", dimensionId, field: "certainty", value: value as NonNullable<PartnerDimensionAnswer["certainty"]> })}/></div></section>; })}</div>
    </>);
}
function ExpectationsSection({ participant, answers, dispatch }: {
    participant: PartnerParticipantId;
    answers: PartnerParticipantAnswers;
    dispatch: Dispatch;
}) {
    const locale = useLocale();
    const content = getPartnerAlignmentContent(locale);
    const set = <K extends keyof PartnerDimensionAnswer>(dimensionId: PartnerDimensionId, field: K, value: NonNullable<PartnerDimensionAnswer[K]>) => dispatch({ type: "set-dimension-answer", dimensionId, field, value });
    return (<>
      <SectionIntro participant={participant} number={3} title={lifeUiValue(locale, "What do you want or expect?", "Was wünschst oder erwartest du?")} description={lifeUiValue(locale, "Keep your desired direction separate from assumptions, differences and the room actually available today.", "Trenne deine gewünschte Richtung von Annahmen, Differenzen und dem Spielraum, der heute tatsächlich verfügbar ist.")}/>
      <div className="mt-10 grid gap-8">{answers.selectedDimensionIds.map((dimensionId) => { const definition = content.dimensions.find(({ id }) => id === dimensionId)!; const answer = answers.dimensions[dimensionId] ?? {}; return <section key={dimensionId} aria-labelledby={`expectation-${participant}-${dimensionId}`} className="rounded-[1.75rem] border border-white/10 bg-[#061521]/70 p-5 sm:p-7"><h2 id={`expectation-${participant}-${dimensionId}`} className="text-2xl font-black text-white">{definition.title}</h2><div className="mt-6 grid gap-7"><RadioCards legend={lifeUiValue(locale, "My desired direction", "Meine gewünschte Richtung")} name={`${participant}-${dimensionId}-direction`} value={answer.desiredDirection} options={content.direction} onChange={(value) => set(dimensionId, "desiredDirection", value as NonNullable<PartnerDimensionAnswer["desiredDirection"]>)}/><RadioCards legend={lifeUiValue(locale, "How clear is our expectation?", "Wie klar ist unsere Erwartung dazu?")} name={`${participant}-${dimensionId}-clarity`} value={answer.expectationClarity} options={content.expectation} onChange={(value) => set(dimensionId, "expectationClarity", value as NonNullable<PartnerDimensionAnswer["expectationClarity"]>)}/><RadioCards legend={lifeUiValue(locale, "How would you like to approach a possible difference?", "Wie möchtest du mit einer möglichen Differenz umgehen?")} name={`${participant}-${dimensionId}-stance`} value={answer.differenceStance} options={content.difference} onChange={(value) => set(dimensionId, "differenceStance", value as NonNullable<PartnerDimensionAnswer["differenceStance"]>)}/><RadioCards legend={lifeUiValue(locale, "What limits the room available today?", "Was begrenzt den heutigen Spielraum?")} name={`${participant}-${dimensionId}-constraint`} value={answer.constraint} options={content.constraint} onChange={(value) => set(dimensionId, "constraint", value as NonNullable<PartnerDimensionAnswer["constraint"]>)}/></div></section>; })}</div>
    </>);
}
function ReviewSection({ participant, answers, dispatch }: {
    participant: PartnerParticipantId;
    answers: PartnerParticipantAnswers;
    dispatch: Dispatch;
}) {
    const locale = useLocale();
    const content = getPartnerAlignmentContent(locale);
    return (<>
      <SectionIntro participant={participant} number={4} title={lifeUiValue(locale, "Review your release.", "Prüfe deine Freigabe.")} description={lifeUiValue(locale, "Only your selected structured answers enter the shared comparison. There is no free text, hidden evaluation or transmission.", "Nur deine ausgewählten strukturierten Antworten gelangen in die gemeinsame Gegenüberstellung. Es gibt keinen Freitext, keine geheime Bewertung und keine Übertragung.")}/>
      <section aria-labelledby={`review-${participant}`} className="mt-10 rounded-[1.75rem] border border-white/10 bg-[#061521]/70 p-5 sm:p-7">
        <h2 id={`review-${participant}`} className="text-2xl font-black text-white">{lifeUiValue(locale, "Your included topics", "Deine einbezogenen Themen")}</h2>
        <div className="mt-6 grid gap-4">{answers.selectedDimensionIds.map((dimensionId) => { const definition = content.dimensions.find(({ id }) => id === dimensionId)!; const answer = answers.dimensions[dimensionId]!; return <details key={dimensionId} className="rounded-2xl border border-white/10 p-4"><summary className="min-h-11 cursor-pointer py-2 font-black text-white">{definition.title}{"sensitive" in definition && definition.sensitive ? <span className="ml-2 font-mono text-xs text-[#f5b971]">{lifeUiValue(locale, "sensitive", "sensibel")}</span> : null}</summary><dl className="mt-4 grid gap-3 text-sm leading-6 text-slate-300 sm:grid-cols-2"><div><dt className="text-slate-500">{lifeUiValue(locale, "Current experience", "Heutiges Erleben")}</dt><dd>{content.experience[answer.experience!]}</dd></div><div><dt className="text-slate-500">{lifeUiValue(locale, "Desired direction", "Gewünschte Richtung")}</dt><dd>{content.direction[answer.desiredDirection!]}</dd></div><div><dt className="text-slate-500">{lifeUiValue(locale, "Importance / certainty", "Bedeutung / Sicherheit")}</dt><dd>{content.importance[answer.importance!]} · {content.certainty[answer.certainty!]}</dd></div><div><dt className="text-slate-500">{lifeUiValue(locale, "Expectation", "Erwartung")}</dt><dd>{content.expectation[answer.expectationClarity!]}</dd></div><div><dt className="text-slate-500">{lifeUiValue(locale, "Possible difference", "Mögliche Differenz")}</dt><dd>{content.difference[answer.differenceStance!]}</dd></div><div><dt className="text-slate-500">{lifeUiValue(locale, "Available room", "Spielraum")}</dt><dd>{content.constraint[answer.constraint!]}</dd></div></dl></details>; })}</div>
      </section>
      <div className="mt-8 rounded-2xl border border-[#f5b971]/30 bg-[#f5b971]/[0.06] p-5 sm:p-6"><label className="flex cursor-pointer items-start gap-4"><input type="checkbox" checked={answers.comparisonConsent} onChange={(event) => dispatch({ type: "set-comparison-consent", value: event.target.checked })} className="mt-1 size-5 shrink-0 accent-[#f5b971]"/><span><span className="block font-black text-white">{lifeUiValue(locale, "I release these structured answers for our shared comparison.", "Ich gebe diese strukturierten Antworten für unsere gemeinsame Gegenüberstellung frei.")}</span><span className="mt-2 block text-sm leading-6 text-slate-300">{lifeUiValue(locale, "I understand that the other person can see answer evidence in the shared result. This consent can be withdrawn before completion by going back.", "Ich verstehe, dass die andere Person die Antwortnachweise im gemeinsamen Ergebnis sehen kann. Diese Zustimmung kann vor Abschluss über „Zurück“ wieder aufgehoben werden.")}</span></span></label></div>
    </>);
}
function RestartControls({ pending, dispatch }: {
    pending: boolean;
    dispatch: Dispatch;
}) {
    const locale = useLocale();
    if (!pending)
        return <button type="button" onClick={() => dispatch({ type: "request-restart" })} className="min-h-11 rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f5b971]">{lifeUiValue(locale, "Delete both perspectives", "Beide Perspektiven löschen")}</button>;
    return <div role="dialog" aria-labelledby="partner-restart-title" className="rounded-2xl border border-[#f5b971]/40 bg-[#071824] p-5"><p id="partner-restart-title" className="font-black text-white">{lifeUiValue(locale, "Irrevocably delete both perspectives and the result?", "Beide Perspektiven und das Ergebnis unwiderruflich löschen?")}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => dispatch({ type: "cancel-restart" })} className="min-h-11 rounded-full border border-white/20 px-5 font-bold text-white">{lifeUiValue(locale, "Keep", "Behalten")}</button><button type="button" onClick={() => dispatch({ type: "confirm-restart" })} className="min-h-11 rounded-full bg-[#f5b971] px-5 font-black text-[#07131d]">{lifeUiValue(locale, "Yes, delete all", "Ja, alles löschen")}</button></div></div>;
}
function Handoff({ dispatch, restart }: {
    dispatch: Dispatch;
    restart: ReactNode;
}) {
    const locale = useLocale();
    return (<article className="section-lines relative min-h-screen px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-4xl"><div className="flex justify-end">{restart}</div><header className="mt-12 border-y border-white/15 py-16 text-center"><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Perspective A sealed", "Perspektive A versiegelt")}</p><h1 tabIndex={-1} data-partner-section-heading className="mx-auto mt-5 max-w-3xl text-4xl font-black text-white outline-none sm:text-6xl">{lifeUiValue(locale, "Please hand the device to Person B now.", "Bitte übergib das Gerät jetzt an Person B.")}</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">{lifeUiValue(locale, "Person A should leave the screen. Their answers do not appear during the next pass. This UI seal reduces ordinary influence but is not a security boundary against someone with device or developer access.", "Person A sollte den Bildschirm verlassen. Ihre Antworten erscheinen im nächsten Durchgang nicht. Diese UI-Sperre vermindert gewöhnliche Beeinflussung, ist aber keine Sicherheitsgrenze gegenüber der Person mit Geräte- oder Entwicklerzugriff.")}</p><button type="button" onClick={() => dispatch({ type: "begin-participant-b" })} className="mt-9 min-h-14 rounded-full bg-[#f5b971] px-7 py-4 font-black text-[#07131d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5b971]">{lifeUiValue(locale, "I am Person B—begin my own pass", "Ich bin Person B – eigenen Durchgang beginnen")} →</button></header><aside className="mt-10 border-l-2 border-[#f5b971] pl-6"><h2 className="font-black text-white">{lifeUiValue(locale, "What this session cannot do", "Was diese Sitzung nicht kann")}</h2><p className="mt-2 leading-7 text-slate-400">{lifeUiValue(locale, "No invitation, second device, permanent seal or recovery after reload. Use this flow only voluntarily on a trusted shared device.", "Keine Einladung, kein zweites Gerät, keine dauerhafte Sperre und keine Wiederherstellung nach dem Neuladen. Nutzt den Ablauf nur freiwillig auf einem vertrauten gemeinsamen Gerät.")}</p></aside></div></article>);
}
function ResultView({ result, restart }: {
    result: PartnerComparisonResult;
    restart: ReactNode;
}) {
    const locale = useLocale();
    const copyText = buildPartnerClipboardSummary(result, locale);
    return (<article data-fyns-result-page className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-6xl" data-fyns-result-page-content>
        <div className="flex justify-end">{restart}</div>
        <header className="max-w-5xl py-14">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">Life Alignment · Partner / Relationship · {lifeUiValue(locale, "Shared reflection", "Gemeinsame Reflexion")}</p>
          <h1 tabIndex={-1} data-partner-result-heading className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white outline-none sm:text-7xl">{result.title}</h1>
          <p className="mt-7 max-w-4xl text-xl leading-8 text-slate-300">{result.description}</p>
          <p className="mt-6 max-w-4xl border-l-2 border-[#f5b971] pl-5 leading-7 text-slate-400">{result.disclaimer}</p>
        </header>
        <PartnerComparisonLandscape result={result}/>
        <PartnerActionPaths result={result}/>
        <PartnerExperiments result={result}/>
        <PartnerConversationTools result={result}/>
        <PartnerResultActions copyText={copyText}/>

        <section aria-hidden="true" className="fyns-print-document" data-fyns-print-document="life-alignment-partner">
          <header className="fyns-print-header"><p className="fyns-print-brand">Life Alignment · Partner / Relationship</p><h1>{result.title}</h1><p className="fyns-print-description">{result.description}</p></header>
          <section className="fyns-print-section"><h2>{lifeUiValue(locale, "Shared relationship context", "Gemeinsamer Beziehungskontext")}</h2><div className="fyns-print-stack">{result.sharedOverview.map((signal) => <div key={signal.id} className="fyns-print-block"><h3>{signal.label}</h3><p>{signal.headline}</p><p className="fyns-print-detail">{signal.explanation}</p></div>)}</div></section>
          <section className="fyns-print-section"><h2>{lifeUiValue(locale, "Concrete signals", "Konkrete Hinweise")}</h2><div className="fyns-print-stack">{result.findings.map((finding) => <div key={finding.id} className="fyns-print-block"><h3>{finding.categoryLabel}</h3><p>{finding.headline}</p><p className="fyns-print-detail">{finding.explanation} {finding.everydayTranslation}</p><p className="fyns-print-detail"><strong>{lifeUiValue(locale, "What you might learn", "Was ihr lernen könntet")}:</strong> {finding.whatCouldBeLearned}<br /><strong>{lifeUiValue(locale, "Boundary", "Grenze")}:</strong> {finding.boundary}</p><ul className="fyns-print-list">{finding.possibleNextSteps.map((step) => <li key={step}>{step}</li>)}</ul></div>)}</div></section>
          <section className="fyns-print-section"><h2>{lifeUiValue(locale, "Three reversible explorations", "Drei reversible Erkundungen")}</h2><div className="fyns-print-stack">{result.experiments.map((experiment) => <div key={experiment.id} className="fyns-print-block"><h3>{experiment.title}</h3><p>{experiment.why}</p><p className="fyns-print-detail">{lifeUiValue(locale, "What you might learn", "Was ihr lernen könntet")}: {experiment.whatCouldBeLearned}</p></div>)}</div></section>
          <section className="fyns-print-section"><h2>{lifeUiValue(locale, "Possible paths", "Mögliche Wege")}</h2><div className="fyns-print-stack">{result.paths.map((path) => <div key={path.id} className="fyns-print-block"><h3>{path.title}</h3><p>{path.why}</p><p className="fyns-print-detail">{path.approach} {lifeUiValue(locale, "What you might learn", "Was ihr lernen könntet")}: {path.whatCouldBeLearned} Trade-off: {path.tradeoffs} {lifeUiValue(locale, "Reversibility", "Reversibilität")}: {path.reversibility}</p></div>)}</div></section>
          <p className="fyns-print-disclaimer">{result.disclaimer}</p>
        </section>
      </div>
    </article>);
}
export function PartnerJourney() {
    const locale = useLocale();
    const localizeHref = useLocalizedHref();
    const content = getPartnerAlignmentContent(locale);
    const [state, dispatch] = useReducer((currentState: typeof initialPartnerJourneyState, action: PartnerJourneyAction) => partnerJourneyReducer(currentState, action, locale), initialPartnerJourneyState);
    const errorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (state.validationMessage)
            errorRef.current?.focus();
        else if (state.phase === "participant-a" || state.phase === "participant-b" || state.phase === "handoff")
            document.querySelector<HTMLElement>("[data-partner-section-heading]")?.focus();
        else if (state.phase === "result")
            document.querySelector<HTMLElement>("[data-partner-result-heading]")?.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [state.phase, state.sectionIndex, state.validationMessage]);
    const restart = <RestartControls pending={state.restartPending} dispatch={dispatch}/>;
    if (state.phase === "handoff")
        return <Handoff dispatch={dispatch} restart={restart}/>;
    if (state.phase === "result") {
        const output = buildPartnerComparisonResult(state.participants, state.participantASealed, locale);
        if (output.status === "complete")
            return <ResultView result={output.result} restart={restart}/>;
    }
    if (state.phase === "intro")
        return (<article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-[55rem] bg-[radial-gradient(circle_at_78%_10%,rgba(245,185,113,0.15),transparent_30rem)]"/><div className="relative mx-auto max-w-6xl"><nav aria-label={lifeUiValue(locale, "Breadcrumb", "Brotkrümelnavigation")} className="font-mono text-xs text-slate-400"><Link href={localizeHref("/life-alignment")} className="inline-flex min-h-11 items-center hover:text-white">Life Alignment</Link> <span aria-hidden="true">/</span> <span aria-current="page" className="text-[#f5b971]">Partner / Relationship</span></nav><header className="grid min-h-[60svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24"><div><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">{content.module.eyebrow}</p><h1 className="mt-7 text-[clamp(3rem,7vw,6.5rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">{content.module.name}</h1><p className="mt-7 max-w-3xl text-2xl font-black leading-tight text-white sm:text-4xl">{content.module.title}</p><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{content.module.description}</p><button type="button" onClick={() => dispatch({ type: "start" })} className="mt-9 min-h-14 rounded-full bg-[#f5b971] px-7 py-4 font-black text-[#07131d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5b971]">{lifeUiValue(locale, "Begin with Person A", "Mit Person A beginnen")} →</button><p className="mt-4 font-mono text-xs text-slate-500">{content.module.duration}</p></div><aside className="border-l border-[#f5b971] pl-7"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#f5b971]">{lifeUiValue(locale, "Independent first", "Unabhängig zuerst")}</p><h2 className="mt-5 text-2xl font-black text-white">{lifeUiValue(locale, "No account. No invitation. No compatibility score.", "Kein Konto. Keine Einladung. Kein Kompatibilitätsscore.")}</h2><p className="mt-4 leading-7 text-slate-400">{content.module.privacy}</p><p className="mt-4 leading-7 text-slate-400">{lifeUiValue(locale, "Each person decides which topics enter. The shared result is generated only after two releases.", "Beide Personen entscheiden selbst, welche Themen einfließen. Das gemeinsame Ergebnis wird erst nach zwei Freigaben erzeugt.")}</p></aside></header><div className="border-b border-white/15 py-12 sm:py-16"><HumanContextScene scene={content.scene} accent={ACCENT} priority/></div><section className="grid gap-10 py-16 lg:grid-cols-[0.35fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#f5b971]">{lifeUiValue(locale, "Before starting", "Vor dem Start")}</p><div><h2 className="text-4xl font-black text-white">{lifeUiValue(locale, "Voluntary, equal and on a trusted device.", "Freiwillig, gleichberechtigt und auf einem vertrauten Gerät.")}</h2><ul className="mt-7 grid gap-3 leading-7 text-slate-300">{(lifeUiValue(locale, ["Person A answers, reviews what is included and seals their perspective.", "Person B takes the device and answers without seeing A's answers.", "The shared comparison appears only after the second consent.", "Where there is fear, control, violence or a lack of safety, this shared flow may not be appropriate."], ["Person A antwortet, prüft die Einbeziehung und versiegelt ihre Perspektive.", "Person B übernimmt das Gerät und antwortet, ohne die Angaben von A zu sehen.", "Erst nach der zweiten Zustimmung erscheint die gemeinsame Gegenüberstellung.", "Bei Angst, Kontrolle, Gewalt oder fehlender Sicherheit ist dieser gemeinsame Ablauf möglicherweise nicht angemessen."])).map((item) => <li key={item}>{item}</li>)}</ul></div></section></div></article>);
    const participant: PartnerParticipantId = state.phase === "participant-b" ? "b" : "a";
    const answers = state.participants[participant];
    const sections = [DimensionsSection, ExperienceSection, ExpectationsSection, ReviewSection] as const;
    const CurrentSection = sections[state.sectionIndex] ?? DimensionsSection;
    const finalSection = state.sectionIndex === 3;
    return (<article className="section-lines relative min-h-screen px-5 pb-48 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-5xl"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><Link href={localizeHref("/life-alignment/partner")} className="font-mono text-xs text-slate-400 hover:text-white">Partner / Relationship</Link>{restart}</div><aside aria-label={`${lifeUiValue(locale, "Active perspective", "Aktive Perspektive")}: Person ${participant.toUpperCase()}`} className="sticky top-20 z-20 mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f5b971]/35 bg-[#071824]/95 px-4 py-3 shadow-xl backdrop-blur"><strong className="font-mono text-xs uppercase tracking-[0.16em] text-[#f5b971]">Person {participant.toUpperCase()} · {lifeUiValue(locale, "You answer only for yourself", "Du antwortest nur für dich")}</strong><span className="text-xs text-slate-300">{lifeUiValue(locale, "The other person's perspective is not visible here.", "Die Perspektive der anderen Person ist hier nicht sichtbar.")}</span></aside><form onSubmit={(event) => { event.preventDefault(); dispatch(finalSection ? { type: participant === "a" ? "seal-participant-a" : "finish-participant-b" } : { type: "continue" }); }} noValidate><CurrentSection participant={participant} answers={answers} dispatch={dispatch}/>{state.validationMessage ? <div ref={errorRef} tabIndex={-1} role="alert" className="mt-10 rounded-2xl border border-[#ffb36d]/40 bg-[#ffb36d]/10 p-5 font-bold leading-7 text-[#ffd3a8] outline-none">{state.validationMessage}</div> : null}<HumanContextJourneyDock sections={content.sections} currentSectionIndex={state.sectionIndex} accent={ACCENT} backLabel={lifeUiValue(locale, "Back", "Zurück")} nextLabel={finalSection ? participant === "a" ? (lifeUiValue(locale, "Seal and hand over", "Versiegeln und übergeben")) : (lifeUiValue(locale, "Consent and compare", "Zustimmen und vergleichen")) : (lifeUiValue(locale, "Continue", "Weiter"))} onBack={() => dispatch({ type: "back" })}/></form></div></article>);
}
