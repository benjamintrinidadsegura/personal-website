"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, type ReactNode } from "react";

import { HumanContextJourneyDock } from "@/components/human-context/journey-dock";
import { HumanContextScene } from "@/components/human-context/context-scene";
import { PartnerActionPaths, PartnerComparisonLandscape, PartnerConversationTools, PartnerExperiments } from "@/components/life-alignment/partner/comparison-landscape";
import { PartnerResultActions } from "@/components/life-alignment/partner/partner-result-actions";
import {
  partnerCertaintyOptions,
  partnerConstraintOptions,
  partnerDimensions,
  partnerDirectionOptions,
  partnerDifferenceStanceOptions,
  partnerExpectationClarityOptions,
  partnerExperienceOptions,
  partnerImportanceOptions,
  partnerModule,
  partnerScene,
  partnerSections,
} from "@/data/life-alignment-partner";
import { buildPartnerClipboardSummary } from "@/lib/life-alignment-partner-export";
import {
  buildPartnerComparisonResult,
  formatPartnerSelectionCount,
  initialPartnerJourneyState,
  partnerJourneyReducer,
} from "@/lib/life-alignment-partner";
import type {
  PartnerComparisonResult,
  PartnerDimensionAnswer,
  PartnerDimensionId,
  PartnerJourneyAction,
  PartnerParticipantAnswers,
  PartnerParticipantId,
} from "@/types/life-alignment-partner";

const ACCENT = "#f5b971";
type Dispatch = React.Dispatch<PartnerJourneyAction>;

function SelectionCount({ selected }: { selected: number }) {
  return <span aria-live="polite" aria-atomic="true" className="ml-3 inline-flex min-h-8 shrink-0 items-center rounded-full border border-[#ff9a3d]/40 bg-[#ff9a3d]/[0.065] px-3 py-1 align-middle font-mono text-xs font-bold text-[#ffb36d]">{formatPartnerSelectionCount(selected)}</span>;
}

function CheckCard({ checked, disabled = false, onChange, title, description }: { checked: boolean; disabled?: boolean; onChange: () => void; title: string; description?: string }) {
  return (
    <label className={`flex min-h-14 cursor-pointer gap-4 rounded-2xl border p-4 transition ${checked ? "border-[#f5b971]/70 bg-[#f5b971]/10" : "border-white/10 bg-[#061521]/70"} ${disabled ? "cursor-not-allowed opacity-45" : "hover:border-white/30"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="mt-1 size-5 shrink-0 accent-[#f5b971]" />
      <span><span className="block font-black text-white">{title}</span>{description ? <span className="mt-1 block text-sm leading-6 text-slate-400">{description}</span> : null}</span>
    </label>
  );
}

function RadioCards({ legend, name, value, options, onChange }: { legend: string; name: string; value?: string; options: Readonly<Record<string, string>>; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="font-bold text-slate-200">{legend}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.entries(options).map(([optionValue, label]) => (
          <label key={optionValue} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${value === optionValue ? "border-[#f5b971]/70 bg-[#f5b971]/10 text-white" : "border-white/10 bg-[#04111b]/70 text-slate-300"}`}>
            <input type="radio" name={name} value={optionValue} checked={value === optionValue} onChange={() => onChange(optionValue)} className="mt-1 size-4 shrink-0 accent-[#f5b971]" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SectionIntro({ participant, number, title, description }: { participant: PartnerParticipantId; number: number; title: string; description: string }) {
  return (
    <header className="border-b border-white/15 pb-10">
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">Person {participant.toUpperCase()} · Nur deine Perspektive · Abschnitt {number} von 4</p>
      <h1 tabIndex={-1} data-partner-section-heading className="mt-4 text-4xl font-black text-white outline-none sm:text-6xl">{title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{description}</p>
      {participant === "b" ? <p className="mt-5 border-l-2 border-[#f5b971] pl-5 text-sm leading-6 text-slate-400">Die Antworten von Person A sind versiegelt und werden in deinem Durchgang nicht angezeigt.</p> : null}
    </header>
  );
}

function DimensionsSection({ participant, answers, dispatch }: { participant: PartnerParticipantId; answers: PartnerParticipantAnswers; dispatch: Dispatch }) {
  const regular = partnerDimensions.filter(({ sensitive }) => !sensitive);
  const sensitive = partnerDimensions.filter(({ sensitive }) => sensitive);
  const full = answers.selectedDimensionIds.length >= 6;
  return (
    <>
      <SectionIntro participant={participant} number={1} title="Welche Themen möchtest du einbeziehen?" description="Wähle nur Themen, die deine eigene Perspektive sinnvoll abbilden. Ihr müsst nicht dieselben Themen auswählen; fehlende Überschneidungen werden später ausdrücklich sichtbar." />
      <fieldset className="mt-10"><legend className="text-2xl font-black text-white">Beziehungsthemen <SelectionCount selected={answers.selectedDimensionIds.length} /></legend><div className="mt-6 grid gap-3 sm:grid-cols-2">{regular.map((dimension) => { const checked = answers.selectedDimensionIds.includes(dimension.id); return <CheckCard key={dimension.id} checked={checked} disabled={!checked && full} onChange={() => dispatch({ type: "toggle-dimension", dimensionId: dimension.id })} title={dimension.title} description={`${dimension.description} Zum Beispiel: ${dimension.examples.join(" · ")}.`} />; })}</div></fieldset>
      <fieldset className="mt-12 border-t border-white/15 pt-10">
        <legend className="text-2xl font-black text-white">Sensible Themen – freiwillig und einzeln</legend>
        <p className="mt-3 max-w-3xl leading-7 text-slate-400">Ein Opt-in macht das Thema erst auswählbar. Du kannst es jederzeit wieder ausschließen; damit werden deine Antworten dazu verworfen.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">{sensitive.map((dimension) => { const optedIn = answers.sensitiveOptIns.includes(dimension.id); const checked = answers.selectedDimensionIds.includes(dimension.id); return <div key={dimension.id} className="rounded-2xl border border-white/10 p-4"><CheckCard checked={optedIn} onChange={() => dispatch({ type: "toggle-sensitive-opt-in", dimensionId: dimension.id })} title={`${dimension.title} freiwillig freigeben`} description={`Nur meine strukturierte Einordnung; kein Freitext. Beispiele: ${dimension.examples.join(" · ")}.`} /><div className="mt-3"><CheckCard checked={checked} disabled={!optedIn || !checked && full} onChange={() => dispatch({ type: "toggle-dimension", dimensionId: dimension.id })} title="In meinen Durchgang aufnehmen" /></div></div>; })}</div>
      </fieldset>
    </>
  );
}

function ExperienceSection({ participant, answers, dispatch }: { participant: PartnerParticipantId; answers: PartnerParticipantAnswers; dispatch: Dispatch }) {
  return (
    <>
      <SectionIntro participant={participant} number={2} title="Wie erlebst du diese Themen heute?" description="Antworte aus deiner Perspektive. Unsicherheit ist eine vollständige Antwort und wird später nicht als Defizit gewertet." />
      <div className="mt-10 grid gap-8">{answers.selectedDimensionIds.map((dimensionId) => { const definition = partnerDimensions.find(({ id }) => id === dimensionId)!; const answer = answers.dimensions[dimensionId] ?? {}; return <section key={dimensionId} aria-labelledby={`experience-${participant}-${dimensionId}`} className="rounded-[1.75rem] border border-white/10 bg-[#061521]/70 p-5 sm:p-7"><h2 id={`experience-${participant}-${dimensionId}`} className="text-2xl font-black text-white">{definition.title}</h2><div className="mt-6 grid gap-7"><RadioCards legend="Mein heutiges Erleben" name={`${participant}-${dimensionId}-experience`} value={answer.experience} options={partnerExperienceOptions} onChange={(value) => dispatch({ type: "set-dimension-answer", dimensionId, field: "experience", value: value as NonNullable<PartnerDimensionAnswer["experience"]> })} /><RadioCards legend="Bedeutung für mich" name={`${participant}-${dimensionId}-importance`} value={answer.importance} options={partnerImportanceOptions} onChange={(value) => dispatch({ type: "set-dimension-answer", dimensionId, field: "importance", value: value as NonNullable<PartnerDimensionAnswer["importance"]> })} /><RadioCards legend="Wie sicher ist diese Einordnung?" name={`${participant}-${dimensionId}-certainty`} value={answer.certainty} options={partnerCertaintyOptions} onChange={(value) => dispatch({ type: "set-dimension-answer", dimensionId, field: "certainty", value: value as NonNullable<PartnerDimensionAnswer["certainty"]> })} /></div></section>; })}</div>
    </>
  );
}

function ExpectationsSection({ participant, answers, dispatch }: { participant: PartnerParticipantId; answers: PartnerParticipantAnswers; dispatch: Dispatch }) {
  const set = <K extends keyof PartnerDimensionAnswer>(dimensionId: PartnerDimensionId, field: K, value: NonNullable<PartnerDimensionAnswer[K]>) => dispatch({ type: "set-dimension-answer", dimensionId, field, value });
  return (
    <>
      <SectionIntro participant={participant} number={3} title="Was wünschst oder erwartest du?" description="Trenne deine gewünschte Richtung von Annahmen, Differenzen und dem Spielraum, der heute tatsächlich verfügbar ist." />
      <div className="mt-10 grid gap-8">{answers.selectedDimensionIds.map((dimensionId) => { const definition = partnerDimensions.find(({ id }) => id === dimensionId)!; const answer = answers.dimensions[dimensionId] ?? {}; return <section key={dimensionId} aria-labelledby={`expectation-${participant}-${dimensionId}`} className="rounded-[1.75rem] border border-white/10 bg-[#061521]/70 p-5 sm:p-7"><h2 id={`expectation-${participant}-${dimensionId}`} className="text-2xl font-black text-white">{definition.title}</h2><div className="mt-6 grid gap-7"><RadioCards legend="Meine gewünschte Richtung" name={`${participant}-${dimensionId}-direction`} value={answer.desiredDirection} options={partnerDirectionOptions} onChange={(value) => set(dimensionId, "desiredDirection", value as NonNullable<PartnerDimensionAnswer["desiredDirection"]>)} /><RadioCards legend="Wie klar ist unsere Erwartung dazu?" name={`${participant}-${dimensionId}-clarity`} value={answer.expectationClarity} options={partnerExpectationClarityOptions} onChange={(value) => set(dimensionId, "expectationClarity", value as NonNullable<PartnerDimensionAnswer["expectationClarity"]>)} /><RadioCards legend="Wie möchtest du mit einer möglichen Differenz umgehen?" name={`${participant}-${dimensionId}-stance`} value={answer.differenceStance} options={partnerDifferenceStanceOptions} onChange={(value) => set(dimensionId, "differenceStance", value as NonNullable<PartnerDimensionAnswer["differenceStance"]>)} /><RadioCards legend="Was begrenzt den heutigen Spielraum?" name={`${participant}-${dimensionId}-constraint`} value={answer.constraint} options={partnerConstraintOptions} onChange={(value) => set(dimensionId, "constraint", value as NonNullable<PartnerDimensionAnswer["constraint"]>)} /></div></section>; })}</div>
    </>
  );
}

function ReviewSection({ participant, answers, dispatch }: { participant: PartnerParticipantId; answers: PartnerParticipantAnswers; dispatch: Dispatch }) {
  return (
    <>
      <SectionIntro participant={participant} number={4} title="Prüfe deine Freigabe." description="Nur deine ausgewählten strukturierten Antworten gelangen in die gemeinsame Gegenüberstellung. Es gibt keinen Freitext, keine geheime Bewertung und keine Übertragung." />
      <section aria-labelledby={`review-${participant}`} className="mt-10 rounded-[1.75rem] border border-white/10 bg-[#061521]/70 p-5 sm:p-7">
        <h2 id={`review-${participant}`} className="text-2xl font-black text-white">Deine einbezogenen Themen</h2>
        <div className="mt-6 grid gap-4">{answers.selectedDimensionIds.map((dimensionId) => { const definition = partnerDimensions.find(({ id }) => id === dimensionId)!; const answer = answers.dimensions[dimensionId]!; return <details key={dimensionId} className="rounded-2xl border border-white/10 p-4"><summary className="min-h-11 cursor-pointer py-2 font-black text-white">{definition.title}{definition.sensitive ? <span className="ml-2 font-mono text-xs text-[#f5b971]">sensibel</span> : null}</summary><dl className="mt-4 grid gap-3 text-sm leading-6 text-slate-300 sm:grid-cols-2"><div><dt className="text-slate-500">Heutiges Erleben</dt><dd>{partnerExperienceOptions[answer.experience!]}</dd></div><div><dt className="text-slate-500">Gewünschte Richtung</dt><dd>{partnerDirectionOptions[answer.desiredDirection!]}</dd></div><div><dt className="text-slate-500">Bedeutung / Sicherheit</dt><dd>{partnerImportanceOptions[answer.importance!]} · {partnerCertaintyOptions[answer.certainty!]}</dd></div><div><dt className="text-slate-500">Erwartung</dt><dd>{partnerExpectationClarityOptions[answer.expectationClarity!]}</dd></div><div><dt className="text-slate-500">Mögliche Differenz</dt><dd>{partnerDifferenceStanceOptions[answer.differenceStance!]}</dd></div><div><dt className="text-slate-500">Spielraum</dt><dd>{partnerConstraintOptions[answer.constraint!]}</dd></div></dl></details>; })}</div>
      </section>
      <div className="mt-8 rounded-2xl border border-[#f5b971]/30 bg-[#f5b971]/[0.06] p-5 sm:p-6"><label className="flex cursor-pointer items-start gap-4"><input type="checkbox" checked={answers.comparisonConsent} onChange={(event) => dispatch({ type: "set-comparison-consent", value: event.target.checked })} className="mt-1 size-5 shrink-0 accent-[#f5b971]" /><span><span className="block font-black text-white">Ich gebe diese strukturierten Antworten für unsere gemeinsame Gegenüberstellung frei.</span><span className="mt-2 block text-sm leading-6 text-slate-300">Ich verstehe, dass die andere Person die Antwortnachweise im gemeinsamen Ergebnis sehen kann. Diese Zustimmung kann vor Abschluss über „Zurück“ wieder aufgehoben werden.</span></span></label></div>
    </>
  );
}

function RestartControls({ pending, dispatch }: { pending: boolean; dispatch: Dispatch }) {
  if (!pending) return <button type="button" onClick={() => dispatch({ type: "request-restart" })} className="min-h-11 rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f5b971]">Beide Perspektiven löschen</button>;
  return <div role="dialog" aria-labelledby="partner-restart-title" className="rounded-2xl border border-[#f5b971]/40 bg-[#071824] p-5"><p id="partner-restart-title" className="font-black text-white">Beide Perspektiven und das Ergebnis unwiderruflich löschen?</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => dispatch({ type: "cancel-restart" })} className="min-h-11 rounded-full border border-white/20 px-5 font-bold text-white">Behalten</button><button type="button" onClick={() => dispatch({ type: "confirm-restart" })} className="min-h-11 rounded-full bg-[#f5b971] px-5 font-black text-[#07131d]">Ja, alles löschen</button></div></div>;
}

function Handoff({ dispatch, restart }: { dispatch: Dispatch; restart: ReactNode }) {
  return (
    <article className="section-lines relative min-h-screen px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-4xl"><div className="flex justify-end">{restart}</div><header className="mt-12 border-y border-white/15 py-16 text-center"><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">Perspektive A versiegelt</p><h1 tabIndex={-1} data-partner-section-heading className="mx-auto mt-5 max-w-3xl text-4xl font-black text-white outline-none sm:text-6xl">Bitte übergib das Gerät jetzt an Person B.</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">Person A sollte den Bildschirm verlassen. Ihre Antworten erscheinen im nächsten Durchgang nicht. Diese UI-Sperre vermindert gewöhnliche Beeinflussung, ist aber keine Sicherheitsgrenze gegenüber der Person mit Geräte- oder Entwicklerzugriff.</p><button type="button" onClick={() => dispatch({ type: "begin-participant-b" })} className="mt-9 min-h-14 rounded-full bg-[#f5b971] px-7 py-4 font-black text-[#07131d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5b971]">Ich bin Person B – eigenen Durchgang beginnen →</button></header><aside className="mt-10 border-l-2 border-[#f5b971] pl-6"><h2 className="font-black text-white">Was diese Sitzung nicht kann</h2><p className="mt-2 leading-7 text-slate-400">Keine Einladung, kein zweites Gerät, keine dauerhafte Sperre und keine Wiederherstellung nach dem Neuladen. Nutzt den Ablauf nur freiwillig auf einem vertrauten gemeinsamen Gerät.</p></aside></div></article>
  );
}

function ResultView({ result, restart }: { result: PartnerComparisonResult; restart: ReactNode }) {
  const copyText = buildPartnerClipboardSummary(result);
  return (
    <article data-fyns-result-page className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-6xl" data-fyns-result-page-content>
        <div className="flex justify-end">{restart}</div>
        <header className="max-w-5xl py-14">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">Life Alignment · Partner / Relationship · Gemeinsame Reflexion</p>
          <h1 tabIndex={-1} data-partner-result-heading className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white outline-none sm:text-7xl">{result.title}</h1>
          <p className="mt-7 max-w-4xl text-xl leading-8 text-slate-300">{result.description}</p>
          <p className="mt-6 max-w-4xl border-l-2 border-[#f5b971] pl-5 leading-7 text-slate-400">{result.disclaimer}</p>
        </header>
        <PartnerComparisonLandscape result={result} />
        <PartnerActionPaths result={result} />
        <PartnerExperiments result={result} />
        <PartnerConversationTools result={result} />
        <PartnerResultActions copyText={copyText} />

        <section aria-hidden="true" className="fyns-print-document" data-fyns-print-document="life-alignment-partner">
          <header className="fyns-print-header"><p className="fyns-print-brand">Life Alignment · Partner / Relationship</p><h1>{result.title}</h1><p className="fyns-print-description">{result.description}</p></header>
          <section className="fyns-print-section"><h2>Gemeinsamer Beziehungskontext</h2><div className="fyns-print-stack">{result.sharedOverview.map((signal) => <div key={signal.id} className="fyns-print-block"><h3>{signal.label}</h3><p>{signal.headline}</p><p className="fyns-print-detail">{signal.explanation}</p></div>)}</div></section>
          <section className="fyns-print-section"><h2>Konkrete Hinweise</h2><div className="fyns-print-stack">{result.findings.map((finding) => <div key={finding.id} className="fyns-print-block"><h3>{finding.categoryLabel}</h3><p>{finding.headline}</p><p className="fyns-print-detail">{finding.explanation} {finding.everydayTranslation}</p><p className="fyns-print-detail"><strong>Was ihr lernen könntet:</strong> {finding.whatCouldBeLearned}<br /><strong>Grenze:</strong> {finding.boundary}</p><ul className="fyns-print-list">{finding.possibleNextSteps.map((step) => <li key={step}>{step}</li>)}</ul></div>)}</div></section>
          <section className="fyns-print-section"><h2>Drei reversible Erkundungen</h2><div className="fyns-print-stack">{result.experiments.map((experiment) => <div key={experiment.id} className="fyns-print-block"><h3>{experiment.title}</h3><p>{experiment.why}</p><p className="fyns-print-detail">Was ihr lernen könntet: {experiment.whatCouldBeLearned}</p></div>)}</div></section>
          <section className="fyns-print-section"><h2>Mögliche Wege</h2><div className="fyns-print-stack">{result.paths.map((path) => <div key={path.id} className="fyns-print-block"><h3>{path.title}</h3><p>{path.why}</p><p className="fyns-print-detail">{path.approach} Was ihr lernen könntet: {path.whatCouldBeLearned} Trade-off: {path.tradeoffs} Reversibilität: {path.reversibility}</p></div>)}</div></section>
          <p className="fyns-print-disclaimer">{result.disclaimer}</p>
        </section>
      </div>
    </article>
  );
}

export function PartnerJourney() {
  const [state, dispatch] = useReducer(partnerJourneyReducer, initialPartnerJourneyState);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.validationMessage) errorRef.current?.focus();
    else if (state.phase === "participant-a" || state.phase === "participant-b" || state.phase === "handoff") document.querySelector<HTMLElement>("[data-partner-section-heading]")?.focus();
    else if (state.phase === "result") document.querySelector<HTMLElement>("[data-partner-result-heading]")?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.phase, state.sectionIndex, state.validationMessage]);

  const restart = <RestartControls pending={state.restartPending} dispatch={dispatch} />;
  if (state.phase === "handoff") return <Handoff dispatch={dispatch} restart={restart} />;
  if (state.phase === "result") {
    const output = buildPartnerComparisonResult(state.participants, state.participantASealed);
    if (output.status === "complete") return <ResultView result={output.result} restart={restart} />;
  }

  if (state.phase === "intro") return (
    <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-[55rem] bg-[radial-gradient(circle_at_78%_10%,rgba(245,185,113,0.15),transparent_30rem)]" /><div className="relative mx-auto max-w-6xl"><nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400"><Link href="/life-alignment" className="inline-flex min-h-11 items-center hover:text-white">Life Alignment</Link> <span aria-hidden="true">/</span> <span aria-current="page" className="text-[#f5b971]">Partner / Relationship</span></nav><header className="grid min-h-[60svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24"><div><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">{partnerModule.eyebrow}</p><h1 className="mt-7 text-[clamp(3rem,7vw,6.5rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">{partnerModule.name}</h1><p className="mt-7 max-w-3xl text-2xl font-black leading-tight text-white sm:text-4xl">{partnerModule.title}</p><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{partnerModule.description}</p><button type="button" onClick={() => dispatch({ type: "start" })} className="mt-9 min-h-14 rounded-full bg-[#f5b971] px-7 py-4 font-black text-[#07131d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5b971]">Mit Person A beginnen →</button><p className="mt-4 font-mono text-xs text-slate-500">{partnerModule.duration}</p></div><aside className="border-l border-[#f5b971] pl-7"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#f5b971]">Unabhängig zuerst</p><h2 className="mt-5 text-2xl font-black text-white">Kein Konto. Keine Einladung. Kein Kompatibilitätsscore.</h2><p className="mt-4 leading-7 text-slate-400">{partnerModule.privacy}</p><p className="mt-4 leading-7 text-slate-400">Beide Personen entscheiden selbst, welche Themen einfließen. Das gemeinsame Ergebnis wird erst nach zwei Freigaben erzeugt.</p></aside></header><div className="border-b border-white/15 py-12 sm:py-16"><HumanContextScene scene={partnerScene} accent={ACCENT} priority /></div><section className="grid gap-10 py-16 lg:grid-cols-[0.35fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#f5b971]">Vor dem Start</p><div><h2 className="text-4xl font-black text-white">Freiwillig, gleichberechtigt und auf einem vertrauten Gerät.</h2><ul className="mt-7 grid gap-3 leading-7 text-slate-300"><li>Person A antwortet, prüft die Einbeziehung und versiegelt ihre Perspektive.</li><li>Person B übernimmt das Gerät und antwortet, ohne die Angaben von A zu sehen.</li><li>Erst nach der zweiten Zustimmung erscheint die gemeinsame Gegenüberstellung.</li><li>Bei Angst, Kontrolle, Gewalt oder fehlender Sicherheit ist dieser gemeinsame Ablauf möglicherweise nicht angemessen.</li></ul></div></section></div></article>
  );

  const participant: PartnerParticipantId = state.phase === "participant-b" ? "b" : "a";
  const answers = state.participants[participant];
  const sections = [DimensionsSection, ExperienceSection, ExpectationsSection, ReviewSection] as const;
  const CurrentSection = sections[state.sectionIndex] ?? DimensionsSection;
  const finalSection = state.sectionIndex === 3;
  return (
    <article className="section-lines relative min-h-screen px-5 pb-48 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-5xl"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><Link href="/life-alignment/partner" className="font-mono text-xs text-slate-400 hover:text-white">Partner / Relationship</Link>{restart}</div><aside aria-label={`Aktive Perspektive: Person ${participant.toUpperCase()}`} className="sticky top-20 z-20 mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f5b971]/35 bg-[#071824]/95 px-4 py-3 shadow-xl backdrop-blur"><strong className="font-mono text-xs uppercase tracking-[0.16em] text-[#f5b971]">Person {participant.toUpperCase()} · Du antwortest nur für dich</strong><span className="text-xs text-slate-300">Die Perspektive der anderen Person ist hier nicht sichtbar.</span></aside><form onSubmit={(event) => { event.preventDefault(); dispatch(finalSection ? { type: participant === "a" ? "seal-participant-a" : "finish-participant-b" } : { type: "continue" }); }} noValidate><CurrentSection participant={participant} answers={answers} dispatch={dispatch} />{state.validationMessage ? <div ref={errorRef} tabIndex={-1} role="alert" className="mt-10 rounded-2xl border border-[#ffb36d]/40 bg-[#ffb36d]/10 p-5 font-bold leading-7 text-[#ffd3a8] outline-none">{state.validationMessage}</div> : null}<HumanContextJourneyDock sections={partnerSections} currentSectionIndex={state.sectionIndex} accent={ACCENT} nextLabel={finalSection ? participant === "a" ? "Versiegeln und übergeben" : "Zustimmen und vergleichen" : "Weiter"} onBack={() => dispatch({ type: "back" })} /></form></div></article>
  );
}
