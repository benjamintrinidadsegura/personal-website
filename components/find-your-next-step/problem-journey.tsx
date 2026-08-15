"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";

import { JourneyDock } from "@/components/find-your-next-step/journey-dock";
import { FynsResultActions } from "@/components/find-your-next-step/result-actions";
import { problemIntro, problemQuestions, problemSections } from "@/data/find-your-next-step-problem";
import {
  buildProblemResultText,
  buildProblemShareText,
  PROBLEM_RESULT_DISCLAIMER,
} from "@/lib/find-your-next-step-problem-export";
import {
  buildProblemResult,
  formatProblemSelectionCount,
  initialProblemState,
  problemJourneyReducer,
} from "@/lib/find-your-next-step-problem";
import type {
  ProblemEvidence,
  ProblemQuestion,
  ProblemResult,
  ProblemResultStatement,
} from "@/types/find-your-next-step-problem";

function selectionInstruction(question: ProblemQuestion): string {
  if (question.format === "text") return `10 bis ${question.maxLength ?? 280} Zeichen`;
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1 ? "Wähle eine Antwort." : `Wähle genau ${question.minSelections} Antworten.`;
  }
  return `Wähle ${question.minSelections} bis ${question.maxSelections} Antworten.`;
}

function EvidenceDetails({ evidence }: { evidence: readonly ProblemEvidence[] }) {
  return (
    <details className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-400">
      <summary className="min-h-11 cursor-pointer list-none rounded-lg py-3 font-bold text-[#d1c7ff] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8a5ff]">
        Worauf basiert das? <span aria-hidden="true">+</span>
      </summary>
      <ul className="mt-2 grid gap-2">
        {evidence.slice(0, 3).map((item) => (
          <li key={`${item.questionId}-${item.optionId}`} className="border-l border-[#b8a5ff]/45 pl-4 leading-6 text-slate-300">
            „{item.answer}“
          </li>
        ))}
      </ul>
    </details>
  );
}

function ResultCard({ statement }: { statement: ProblemResultStatement }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
      <h4 className="text-lg font-black text-white">{statement.title}</h4>
      <p className="mt-4 leading-7 text-slate-300">{statement.text}</p>
      <EvidenceDetails evidence={statement.evidence} />
    </article>
  );
}

function ProblemPrintDocument({ result }: { result: ProblemResult }) {
  return (
    <article className="fyns-print-document hidden" data-fyns-print-document="problem">
      <header className="fyns-print-header">
        <p className="fyns-print-brand">bts.online / FYNS / Problem</p>
        <h1>{result.title}</h1>
        <section className="fyns-print-summary" aria-labelledby="problem-print-summary-title">
          <h2 id="problem-print-summary-title">Zusammenfassung</h2>
          {result.summary.map((sentence) => <p key={sentence}>{sentence}</p>)}
        </section>
        <p className="fyns-print-description">{result.description}</p>
      </header>

      <section className="fyns-print-section" aria-labelledby="problem-print-boundary-title">
        <h2 id="problem-print-boundary-title">{result.boundary.title}</h2>
        <p>{result.boundary.text}</p>
      </section>
      {result.userNote ? (
        <section className="fyns-print-section" aria-labelledby="problem-print-note-title">
          <h2 id="problem-print-note-title">Woran du eine kleine Verbesserung erkennen würdest</h2>
          <p>{result.userNote}</p>
        </section>
      ) : null}
      <section className="fyns-print-section" aria-labelledby="problem-print-situation-title">
        <h2 id="problem-print-situation-title">Was die Situation gerade prägt</h2>
        <div className="fyns-print-stack">
          {result.situation.map(({ id, title, text }) => <article key={id} className="fyns-print-block"><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>
      <section className="fyns-print-section" aria-labelledby="problem-print-resources-title">
        <h2 id="problem-print-resources-title">Ressourcen und Grenzen</h2>
        <div className="fyns-print-stack">
          {result.resources.map(({ id, title, text }) => <article key={id} className="fyns-print-block"><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>
      <section className="fyns-print-section" aria-labelledby="problem-print-questions-title">
        <h2 id="problem-print-questions-title">Fragen zum Mitnehmen</h2>
        <ol>{result.questionsToCarry.map((question) => <li key={question}>{question}</li>)}</ol>
      </section>
      <section className="fyns-print-section fyns-print-next-step" aria-labelledby="problem-print-next-title">
        <p className="fyns-print-label">Dein nächster kleiner Schritt</p>
        <h2 id="problem-print-next-title">{result.nextStep.title}</h2>
        <p>{result.nextStep.text}</p>
      </section>
      <p className="fyns-print-disclaimer">{PROBLEM_RESULT_DISCLAIMER}</p>
    </article>
  );
}

function ResultView({
  result,
  dispatch,
  headingRef,
  restartPending,
}: {
  result: ProblemResult;
  dispatch: React.Dispatch<Parameters<typeof problemJourneyReducer>[1]>;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  restartPending: boolean;
}) {
  const copyText = buildProblemResultText(result);
  const shareText = buildProblemShareText(result);
  const urgent = result.boundary.level === "urgent";
  return (
    <>
      <section aria-labelledby="problem-result-title" className="py-16 sm:py-24" data-fyns-screen-result>
        <div className="grid gap-10 border-b border-white/15 pb-14 lg:grid-cols-[1.05fr_0.8fr] lg:items-end">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#d1c7ff]">Deine lokale Momentaufnahme</p>
            <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id="problem-result-title" className="mt-5 text-4xl font-black text-white outline-none sm:text-6xl">
              {result.title}
            </h2>
            <div className="mt-7 grid gap-3 text-lg font-bold leading-8 text-slate-200">
              {result.summary.map((sentence) => <p key={sentence}>{sentence}</p>)}
            </div>
          </div>
          <p className="border-l border-[#b8a5ff] pl-7 leading-7 text-slate-300">{result.description}</p>
        </div>

        <aside
          aria-labelledby="problem-boundary-title"
          className={`mt-10 rounded-[1.5rem] border p-6 sm:p-8 ${urgent ? "border-[#ff9a3d]/55 bg-[#ff9a3d]/[0.07]" : "border-[#b8a5ff]/30 bg-[#b8a5ff]/[0.04]"}`}
        >
          <p className={`font-mono text-xs font-black uppercase tracking-[0.2em] ${urgent ? "text-[#ffb36d]" : "text-[#d1c7ff]"}`}>Wichtige Grenze</p>
          <h3 id="problem-boundary-title" className="mt-4 text-2xl font-black text-white">{result.boundary.title}</h3>
          <p className="mt-4 max-w-4xl font-bold leading-7 text-slate-200">{result.boundary.text}</p>
        </aside>

        {result.userNote ? (
          <section aria-labelledby="problem-user-note-title" className="mt-14 border-l-2 border-[#b8a5ff] pl-6 sm:pl-8">
            <h3 id="problem-user-note-title" className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d1c7ff]">Woran du eine kleine Verbesserung erkennen würdest</h3>
            <p className="mt-4 max-w-4xl text-xl font-black leading-8 text-white">„{result.userNote}“</p>
          </section>
        ) : null}

        <div className="mt-16 grid gap-16">
          <section aria-labelledby="problem-situation-title">
            <h3 id="problem-situation-title" className="text-3xl font-black text-white sm:text-5xl">Was die Situation gerade prägt</h3>
            <div className="mt-7 grid gap-5 lg:grid-cols-3">{result.situation.map((statement) => <ResultCard key={statement.id} statement={statement} />)}</div>
          </section>
          <section aria-labelledby="problem-resources-title">
            <h3 id="problem-resources-title" className="text-3xl font-black text-white sm:text-5xl">Ressourcen und Grenzen</h3>
            <div className="mt-7 grid gap-5 lg:grid-cols-3">{result.resources.map((statement) => <ResultCard key={statement.id} statement={statement} />)}</div>
          </section>
          <section aria-labelledby="problem-questions-title" className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-7 sm:p-10">
            <h3 id="problem-questions-title" className="text-2xl font-black text-white sm:text-4xl">Fragen zum Mitnehmen</h3>
            <ol className="mt-7 grid gap-5">
              {result.questionsToCarry.map((question, index) => (
                <li key={question} className="flex gap-4 border-b border-white/10 pb-5 text-lg font-bold leading-8 text-slate-200 last:border-0 last:pb-0">
                  <span className="font-mono text-xs text-[#d1c7ff]">{String(index + 1).padStart(2, "0")}</span>{question}
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="problem-next-title" className="rounded-[1.75rem] border border-[#b8a5ff]/40 bg-[linear-gradient(135deg,rgba(184,165,255,0.11),rgba(255,255,255,0.02))] p-7 sm:p-10">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d1c7ff]">Dein nächster kleiner Schritt</p>
            <h3 id="problem-next-title" className="mt-5 text-3xl font-black text-white sm:text-5xl">{result.nextStep.title}</h3>
            <p className="mt-6 max-w-4xl text-lg font-bold leading-8 text-slate-200">{result.nextStep.text}</p>
            <EvidenceDetails evidence={result.nextStep.evidence} />
          </section>
        </div>

        <aside aria-labelledby="problem-human-context-title" className="mt-16 border-y border-white/10 py-10">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d1c7ff]">Human Context Check</p>
          <h3 id="problem-human-context-title" className="mt-4 text-2xl font-black text-white sm:text-4xl">Prüfe die Quelle deiner Annahmen selbst.</h3>
          <p className="mt-5 max-w-4xl leading-7 text-slate-300">
            Welche Grenze besteht heute tatsächlich – und welche könnte aus Gewohnheit, Erwartungen anderer oder einer älteren Erfahrung stammen? Was du wirklich willst, was du glaubst tun zu sollen und worüber du noch unsicher bist, darf auseinanderfallen. FYNS leitet diese Herkunft nicht aus deinen Antworten ab; deine Einordnung bleibt maßgeblich.
          </p>
        </aside>

        <FynsResultActions accent="#b8a5ff" copyText={copyText} shareTitle="FYNS – Problem – Situationsskizze" shareText={shareText} printTitle="FYNS – Problem – Situationsskizze" />

        <section aria-labelledby="problem-edit-title" className="mt-20 border-t border-white/15 pt-14">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1fr]">
            <div><h3 id="problem-edit-title" className="text-2xl font-black text-white">Antworten anpassen</h3><p className="mt-4 leading-7 text-slate-400">Öffne einen Abschnitt erneut. Deine übrigen Angaben bleiben erhalten und die Skizze wird danach neu erzeugt.</p></div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {problemSections.map((section, index) => <li key={section.id}><button type="button" onClick={() => dispatch({ type: "edit-section", sectionId: section.id })} className="flex min-h-14 w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-left font-bold text-slate-200 hover:border-[#b8a5ff]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8a5ff]"><span className="font-mono text-xs text-[#d1c7ff]">{String(index + 1).padStart(2, "0")}</span>{section.title}</button></li>)}
            </ol>
          </div>
        </section>

        <div className="mt-12 border-t border-white/10 pt-10">
          {!restartPending ? (
            <button type="button" onClick={() => dispatch({ type: "request-restart" })} className="min-h-12 rounded-full border border-white/15 px-6 py-3 font-bold text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b8a5ff]">Neu starten</button>
          ) : (
            <div className="max-w-2xl rounded-2xl border border-[#ff9a3d]/30 bg-[#ff9a3d]/[0.04] p-6">
              <p className="font-bold text-white">Alle aktuellen Angaben verwerfen?</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Dieser Schritt kann nach dem Bestätigen nicht rückgängig gemacht werden.</p>
              <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => dispatch({ type: "cancel-restart" })} className="min-h-11 rounded-full border border-white/15 px-5 py-2 font-bold text-slate-200">Behalten</button><button type="button" onClick={() => dispatch({ type: "confirm-restart" })} className="min-h-11 rounded-full bg-[#ff9a3d] px-5 py-2 font-black text-[#241204]">Angaben verwerfen</button></div>
            </div>
          )}
        </div>
      </section>
      <ProblemPrintDocument result={result} />
    </>
  );
}

export function ProblemJourney() {
  const [state, dispatch] = useReducer(problemJourneyReducer, initialProblemState);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const initialRender = useRef(true);
  const question = problemQuestions[state.questionIndex];
  const resultState = useMemo(() => buildProblemResult(state.answers), [state.answers]);

  useEffect(() => {
    if (initialRender.current) { initialRender.current = false; return; }
    headingRef.current?.focus();
  }, [state.phase, state.questionIndex]);
  useEffect(() => {
    if (state.validationMessage) { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ block: "center" }); }
  }, [state.validationMessage]);

  if (state.phase === "intro") {
    return (
      <section aria-labelledby="problem-intro-title" className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.82fr]">
          <div><p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#d1c7ff]">{problemIntro.eyebrow}</p><h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id="problem-intro-title" className="mt-6 text-3xl font-black text-white outline-none sm:text-5xl">{problemIntro.title}</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{problemIntro.description}</p><p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{problemIntro.duration}</p></div>
          <div className="grid gap-5">
            <div className="rounded-[1.5rem] border border-[#b8a5ff]/25 bg-[#b8a5ff]/[0.04] p-6"><h3 className="font-black text-white">Wobei sie helfen kann</h3><ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">{problemIntro.canDo.map((item) => <li key={item} className="border-l border-[#b8a5ff]/50 pl-4">{item}</li>)}</ul></div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6"><h3 className="font-black text-white">Was sie nicht leisten kann</h3><ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">{problemIntro.cannotDo.map((item) => <li key={item} className="border-l border-white/15 pl-4">{item}</li>)}</ul></div>
          </div>
        </div>
        <aside className="mt-10 rounded-[1.5rem] border border-[#ff9a3d]/45 bg-[#ff9a3d]/[0.06] p-6 sm:p-8"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ffb36d]">Bei unmittelbarer Gefahr</p><p className="mt-4 max-w-4xl font-bold leading-7 text-white">{problemIntro.urgentBoundary}</p></aside>
        <div className="mt-8 border-l-2 border-[#b8a5ff] bg-[#b8a5ff]/[0.035] p-6"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#d1c7ff]">Nur für diesen Moment</p><p className="mt-4 max-w-4xl font-bold leading-7 text-white">{problemIntro.privacy}</p></div>
        <button type="button" onClick={() => dispatch({ type: "start" })} className="mt-10 min-h-14 rounded-full bg-[#b8a5ff] px-7 py-4 font-black text-[#110d24] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b8a5ff]">Situationsklärung starten <span aria-hidden="true">→</span></button>
      </section>
    );
  }

  if (state.phase === "result") {
    if (resultState.status !== "complete") return <section className="py-20"><h2 ref={headingRef} tabIndex={-1} className="text-3xl font-black text-white outline-none">Deine Situationsskizze ist noch nicht vollständig.</h2><button type="button" onClick={() => dispatch({ type: "edit-section", sectionId: problemSections[0].id })} className="mt-8 min-h-12 rounded-full bg-[#b8a5ff] px-6 py-3 font-black text-[#110d24]">Zurück zu den Fragen</button></section>;
    return <ResultView result={resultState.result} dispatch={dispatch} headingRef={headingRef} restartPending={state.restartPending} />;
  }

  const values = state.answers[question.id] ?? [];
  const sectionQuestions = problemQuestions.filter(({ sectionId }) => sectionId === question.sectionId);
  const currentSectionIndex = problemSections.findIndex(({ id }) => id === question.sectionId);
  const currentQuestionNumber = sectionQuestions.findIndex(({ id }) => id === question.id) + 1;
  const lastInSection = sectionQuestions.at(-1)?.id === question.id;
  const lastInJourney = state.questionIndex === problemQuestions.length - 1;
  const nextLabel = state.editingSectionId && lastInSection ? "Skizze aktualisieren" : lastInJourney ? "Skizze ansehen" : "Weiter";
  const backLabel = state.editingSectionId && sectionQuestions[0]?.id === question.id ? "Zurück zur Skizze" : state.questionIndex === 0 ? "Zurück zur Einführung" : "Zurück";
  const guidanceId = `${question.id}-guidance`;
  const errorId = `${question.id}-error`;

  return (
    <section className="pb-[calc(12rem+env(safe-area-inset-bottom))] pt-14 sm:pt-20 lg:pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
      <form className="mx-auto max-w-4xl py-12 sm:py-16" aria-labelledby={`${question.id}-title`} onSubmit={(event) => { event.preventDefault(); dispatch({ type: "continue" }); }}>
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-slate-500">{problemSections[currentSectionIndex]?.title} · Klärung {String(state.questionIndex + 1).padStart(2, "0")}</p>
        <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id={`${question.id}-title`} className="mt-5 text-3xl font-black leading-tight text-white outline-none sm:text-5xl">{question.prompt}</h2>
        {question.context ? <p className="mt-5 max-w-3xl text-lg leading-7 text-slate-400">{question.context}</p> : null}

        {question.format === "text" ? (
          <div className="mt-10">
            <div id={guidanceId} className="flex justify-between gap-4 text-sm text-slate-400"><label htmlFor={question.id}>{selectionInstruction(question)}</label><span className="font-mono text-xs">{(values[0] ?? "").length} / {question.maxLength}</span></div>
            <textarea id={question.id} name={question.id} value={values[0] ?? ""} maxLength={question.maxLength} rows={5} aria-describedby={`${guidanceId}${state.validationMessage ? ` ${errorId}` : ""}`} onChange={(event) => dispatch({ type: "set-text", questionId: question.id, value: event.target.value })} className="mt-4 w-full resize-y rounded-2xl border border-white/15 bg-white/[0.03] p-5 text-lg leading-8 text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#b8a5ff]" />
          </div>
        ) : (
          <fieldset aria-describedby={`${guidanceId}${state.validationMessage ? ` ${errorId}` : ""}`} className="mt-10">
            <legend className="sr-only">{question.prompt}</legend>
            <div id={guidanceId} className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400"><span>{selectionInstruction(question)}</span><span className="ml-auto inline-flex min-h-8 items-center rounded-full border border-[#b8a5ff]/40 bg-[#b8a5ff]/[0.06] px-3 py-1 font-mono text-xs font-bold text-[#d1c7ff]">{formatProblemSelectionCount(values.length, question.maxSelections)}</span></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => {
                const selected = values.includes(option.id);
                const inputType = question.format === "single" ? "radio" : "checkbox";
                return <label key={option.id} className="group relative cursor-pointer"><input type={inputType} name={question.id} value={option.id} checked={selected} onChange={() => dispatch({ type: "toggle-option", questionId: question.id, optionId: option.id })} className="peer sr-only" /><span className={`flex min-h-20 items-start justify-between gap-4 rounded-2xl border px-5 py-5 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#b8a5ff] ${selected ? "border-[#b8a5ff]/70 bg-[#b8a5ff]/[0.1] text-white" : "border-white/10 bg-white/[0.025] text-slate-300 group-hover:border-white/25"}`}><span className="font-bold leading-6">{option.label}</span><span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center border text-xs font-black ${inputType === "radio" ? "rounded-full" : "rounded-md"} ${selected ? "border-[#b8a5ff] bg-[#b8a5ff] text-[#110d24]" : "border-white/25 text-transparent"}`}>✓</span>{selected ? <span className="sr-only">Ausgewählt</span> : null}</span></label>;
              })}
            </div>
          </fieldset>
        )}
        {state.validationMessage ? <p ref={errorRef} id={errorId} tabIndex={-1} role="alert" className="mt-5 border-l-2 border-[#ff9a3d] pl-4 font-bold text-[#ffb36d] outline-none">{state.validationMessage}</p> : null}
        <JourneyDock sections={problemSections} currentSectionIndex={currentSectionIndex} globalQuestionNumber={state.questionIndex + 1} totalQuestionCount={problemQuestions.length} localQuestionNumber={currentQuestionNumber} localQuestionCount={sectionQuestions.length} accent="#b8a5ff" accessibleLabel="Steuerung und Fortschritt der Situationsklärung" backLabel={backLabel} nextLabel={nextLabel} onBack={() => dispatch({ type: "back" })} />
      </form>
    </section>
  );
}
