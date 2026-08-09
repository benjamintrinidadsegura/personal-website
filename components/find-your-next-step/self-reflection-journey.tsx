"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";

import {
  selfReflectionIntro,
  selfReflectionQuestions,
  selfReflectionSections,
} from "@/data/find-your-next-step-self";
import {
  buildSelfReflectionResult,
  formatSelfReflectionSelectionCount,
  initialSelfReflectionState,
  selfReflectionJourneyReducer,
} from "@/lib/find-your-next-step-self";
import type {
  SelfReflectionQuestion,
  SelfReflectionResult,
  SelfReflectionResultStatement,
  SelfReflectionTensionResult,
  SelfReflectionVisibility,
} from "@/types/find-your-next-step";

const resultVisibilityStyles: Record<
  SelfReflectionVisibility,
  { badge: string; card: string }
> = {
  clear: {
    badge: "border-2 border-[#35d0e5]/65 bg-[#35d0e5]/[0.11] font-black text-[#73e3f1]",
    card: "border-l-2 border-l-[#35d0e5]/70 border-t border-t-[#35d0e5]/30 bg-[#35d0e5]/[0.045]",
  },
  multiple: {
    badge: "border border-[#9aaabd]/45 bg-[#9aaabd]/[0.065] font-bold text-slate-300",
    card: "border-l border-l-[#9aaabd]/45 border-t border-t-[#9aaabd]/20 bg-[#9aaabd]/[0.025]",
  },
};

function selectionInstruction(question: SelfReflectionQuestion): string {
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1
      ? "Wähle eine Antwort."
      : `Wähle genau ${question.minSelections} Antworten.`;
  }
  return `Wähle ${question.minSelections} bis ${question.maxSelections} Antworten.`;
}

function JourneyDock({
  question,
  backLabel,
  nextLabel,
  onBack,
}: {
  question: SelfReflectionQuestion;
  backLabel: string;
  nextLabel: string;
  onBack: () => void;
}) {
  const sectionIndex = selfReflectionSections.findIndex(({ id }) => id === question.sectionId);
  const sectionQuestions = selfReflectionQuestions.filter(({ sectionId }) => sectionId === question.sectionId);
  const questionInSection = sectionQuestions.findIndex(({ id }) => id === question.id);

  return (
    <nav
      aria-label="Steuerung und Fortschritt der Reflexion"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#061521]/95 shadow-[0_-1.25rem_3rem_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-x-3 gap-y-2.5 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-8 lg:grid-cols-[auto_minmax(18rem,1fr)_auto] lg:items-center lg:gap-5 lg:pt-3">
        <div className="col-span-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <div className="flex items-baseline justify-between gap-4 font-mono text-[10px] font-black uppercase tracking-[0.16em] sm:text-xs">
            <p className="text-[#35d0e5]">
              Abschnitt {sectionIndex + 1} von {selfReflectionSections.length}
            </p>
            <p className="shrink-0 text-slate-400">
              Frage {questionInSection + 1} von {sectionQuestions.length}
            </p>
          </div>
          <p className="mt-0.5 truncate text-sm font-black leading-5 text-white">
            {selfReflectionSections[sectionIndex]?.title}
          </p>
          <ol aria-label="Abschnitte der Reflexion" className="mt-2 grid grid-cols-5 items-center gap-2">
            {selfReflectionSections.map((section, index) => {
              const current = section.id === question.sectionId;
              const completed = index < sectionIndex;
              return (
                <li key={section.id} aria-current={current ? "step" : undefined}>
                  <span
                    aria-hidden="true"
                    className={`block rounded-full ${current ? "h-1.5 bg-[#35d0e5]" : completed ? "h-1 bg-[#9aaabd]/70" : "h-1 border-t border-dashed border-white/25"}`}
                  />
                  <span className="sr-only">
                    Abschnitt {index + 1}: {section.title}, {current ? "aktuell" : completed ? "abgeschlossen" : "noch nicht erreicht"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-full border border-white/15 px-3 py-3 text-center text-xs font-bold leading-5 text-slate-300 transition hover:border-white/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#35d0e5] sm:px-5 sm:text-base lg:col-start-1 lg:row-start-1"
        >
          <span aria-hidden="true" className="mr-2 hidden sm:inline">←</span> {backLabel}
        </button>
        <button
          type="submit"
          className="inline-flex min-h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-full bg-[#35d0e5] px-3 py-3 text-center text-xs font-black leading-5 text-[#041018] transition motion-safe:hover:-translate-y-0.5 hover:bg-[#73e3f1] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#35d0e5] sm:px-6 sm:text-base lg:col-start-3 lg:row-start-1"
        >
          {nextLabel} <span aria-hidden="true" className="ml-2 hidden sm:inline">→</span>
        </button>
      </div>
    </nav>
  );
}

function EvidenceDetails({ evidence }: Pick<SelfReflectionResultStatement, "evidence">) {
  return (
    <details className="mt-5 border-t border-white/10 pt-4 text-sm text-slate-400">
      <summary className="min-h-11 cursor-pointer list-none rounded-lg py-3 font-bold text-[#73e3f1] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]">
        Worauf basiert das? <span aria-hidden="true">+</span>
      </summary>
      <p className="mt-2 leading-6">Auf diesen von dir gewählten Antworten:</p>
      <ul className="mt-3 grid gap-2">
        {evidence.slice(0, 3).map((item) => (
          <li key={`${item.questionId}-${item.optionId}`} className="border-l border-[#35d0e5]/40 pl-4 leading-6 text-slate-300">
            „{item.answer}“
          </li>
        ))}
      </ul>
    </details>
  );
}

function ResultStatement({ statement }: { statement: SelfReflectionResultStatement }) {
  const visibilityStyles = statement.visibility ? resultVisibilityStyles[statement.visibility] : null;

  return (
    <article className={`${visibilityStyles?.card ?? "border-l border-t border-white/10 bg-[#061521]/70"} p-6 sm:p-7`}>
      {statement.dimensionLabel ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#35d0e5]">
            {statement.dimensionLabel}
          </p>
          {statement.visibility ? (
            <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${visibilityStyles?.badge}`}>
              {statement.visibility === "clear" ? "Besonders klar sichtbar" : "Mehrfach sichtbar"}
            </span>
          ) : null}
        </div>
      ) : null}
      <p className={`${statement.dimensionLabel ? "mt-5" : ""} text-lg font-bold leading-7 text-white`}>
        {statement.text}
      </p>
      {statement.contextual ? (
        <div className="mt-4 border-l-2 border-[#b8a5ff]/65 bg-[#b8a5ff]/[0.055] px-4 py-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#b8a5ff]">
            Kontextabhängiger Hinweis
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Dieses Muster zeigt sich in mehreren Antworten, scheint laut deiner Auswahl aber von Situation und Aufgabe abzuhängen.
          </p>
        </div>
      ) : null}
      <EvidenceDetails evidence={statement.evidence} />
    </article>
  );
}

function TensionCard({ tension }: { tension: SelfReflectionTensionResult }) {
  return (
    <article className="rounded-[1.5rem] border border-[#ff9a3d]/25 bg-[#ff9a3d]/[0.035] p-6 sm:p-8">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ffb36d]">{tension.title}</p>
      <p className="mt-5 text-lg font-bold leading-8 text-white">{tension.text}</p>
      <EvidenceDetails evidence={tension.evidence} />
    </article>
  );
}

function ResultView({
  result,
  dispatch,
  headingRef,
  restartPending,
}: {
  result: SelfReflectionResult;
  dispatch: React.Dispatch<Parameters<typeof selfReflectionJourneyReducer>[1]>;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  restartPending: boolean;
}) {
  return (
    <section aria-labelledby="self-result-title" className="py-16 sm:py-24">
      <div className="grid gap-8 border-b border-white/15 pb-14 lg:grid-cols-[1fr_0.72fr] lg:items-end">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.25em] text-[#35d0e5]">Deine Reflexion · Nicht gespeichert</p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            style={{ outline: "none" }}
            id="self-result-title"
            className="mt-6 max-w-4xl text-[clamp(2.5rem,7vw,5.8rem)] font-black leading-[0.92] tracking-[-0.05em] text-white outline-none"
          >
            {result.title}
          </h2>
          <div className="mt-7 max-w-3xl space-y-3 text-lg font-bold leading-8 text-slate-200 sm:text-xl sm:leading-9">
            {result.summary.map((sentence, index) => (
              <p key={`${index}-${sentence}`}>{sentence}</p>
            ))}
          </div>
        </div>
        <p className="border-l border-[#35d0e5] pl-7 text-base leading-7 text-slate-300 sm:pl-9">
          {result.description}
        </p>
      </div>

      <div className="mt-14 grid gap-16">
        {result.sections.map((section) => (
          <section key={section.id} aria-labelledby={`result-section-${section.id}`}>
            <h3 id={`result-section-${section.id}`} className="max-w-3xl text-2xl font-black text-white sm:text-4xl">
              {section.title}
            </h3>
            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              {section.statements.map((statement) => (
                <ResultStatement key={statement.id} statement={statement} />
              ))}
            </div>
          </section>
        ))}

        {result.tensions.length > 0 ? (
          <section aria-labelledby="self-tensions-title">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">Kein Widerspruch · eine Kombination</p>
            <h3 id="self-tensions-title" className="mt-4 max-w-3xl text-2xl font-black text-white sm:text-4xl">Spannungsfelder</h3>
            <p className="mt-4 max-w-3xl leading-7 text-slate-400">
              Mehrere Bedingungen können gleichzeitig wichtig sein. Genau diese Verbindung kann einen hilfreichen persönlichen Kontext beschreiben.
            </p>
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {result.tensions.map((tension) => <TensionCard key={tension.id} tension={tension} />)}
            </div>
          </section>
        ) : null}
      </div>

      <section aria-labelledby="edit-answers-title" className="mt-20 border-t border-white/15 pt-14">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1fr]">
          <div>
            <h3 id="edit-answers-title" className="text-2xl font-black text-white">Antworten anpassen</h3>
            <p className="mt-4 max-w-md leading-7 text-slate-400">
              Öffne einen Abschnitt erneut. Deine übrigen Antworten bleiben erhalten und das Ergebnis wird danach neu erzeugt.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {selfReflectionSections.map((section, index) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "edit-section", sectionId: section.id })}
                  className="flex min-h-14 w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-left font-bold text-slate-200 transition hover:border-[#35d0e5]/45 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]"
                >
                  <span className="font-mono text-xs text-[#35d0e5]">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className="mt-14 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#35d0e5]">Später anschlussfähig</p>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          Diese Reflexion könnte später helfen, Arbeitsumfelder und berufliche Richtungen bewusster einzuordnen. In dieser Beta findet noch keine automatische Weiterleitung oder berufliche Empfehlung statt.
        </p>
      </aside>

      <div className="mt-12 border-t border-white/10 pt-10">
        {!restartPending ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "request-restart" })}
            className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 py-3 font-bold text-slate-300 transition hover:border-[#ff9a3d]/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff9a3d]"
          >
            Neu starten
          </button>
        ) : (
          <div className="max-w-2xl rounded-2xl border border-[#ff9a3d]/30 bg-[#ff9a3d]/[0.04] p-6">
            <p className="font-bold text-white">Alle aktuellen Antworten verwerfen?</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Dieser Schritt kann nach dem Bestätigen nicht rückgängig gemacht werden.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => dispatch({ type: "cancel-restart" })} className="min-h-11 rounded-full border border-white/15 px-5 py-2 font-bold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]">
                Behalten
              </button>
              <button type="button" onClick={() => dispatch({ type: "confirm-restart" })} className="min-h-11 rounded-full bg-[#ff9a3d] px-5 py-2 font-black text-[#241204] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a3d]">
                Antworten verwerfen
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function SelfReflectionJourney() {
  const [state, dispatch] = useReducer(selfReflectionJourneyReducer, initialSelfReflectionState);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const initialRender = useRef(true);
  const question = selfReflectionQuestions[state.questionIndex];
  const resultState = useMemo(() => buildSelfReflectionResult(state.answers), [state.answers]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [state.phase, state.questionIndex]);

  useEffect(() => {
    if (state.validationMessage) {
      errorRef.current?.focus();
      errorRef.current?.scrollIntoView({ block: "center" });
    }
  }, [state.validationMessage]);

  if (state.phase === "intro") {
    return (
      <section aria-labelledby="self-intro-title" className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.82fr] lg:items-start">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#35d0e5]">{selfReflectionIntro.eyebrow}</p>
            <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id="self-intro-title" className="mt-6 max-w-4xl text-3xl font-black leading-tight text-white outline-none sm:text-5xl">
              {selfReflectionIntro.title}
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{selfReflectionIntro.description}</p>
            <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{selfReflectionIntro.duration}</p>
          </div>
          <div className="grid gap-5">
            <div className="rounded-[1.5rem] border border-[#35d0e5]/20 bg-[#35d0e5]/[0.035] p-6 sm:p-7">
              <h3 className="font-black text-white">Wobei sie helfen kann</h3>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
                {selfReflectionIntro.canDo.map((item) => <li key={item} className="border-l border-[#35d0e5]/50 pl-4">{item}</li>)}
              </ul>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
              <h3 className="font-black text-white">Was sie nicht leisten kann</h3>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">
                {selfReflectionIntro.cannotDo.map((item) => <li key={item} className="border-l border-white/15 pl-4">{item}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.035] p-6 sm:p-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ffb36d]">Nur für diesen Moment</p>
          <p className="mt-4 max-w-3xl font-bold leading-7 text-white">{selfReflectionIntro.privacy}</p>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: "start" })}
          className="mt-10 inline-flex min-h-14 items-center rounded-full bg-[#35d0e5] px-7 py-4 font-black text-[#041018] transition motion-safe:hover:-translate-y-0.5 hover:bg-[#73e3f1] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
        >
          Reflexion starten <span aria-hidden="true" className="ml-3">→</span>
        </button>
      </section>
    );
  }

  if (state.phase === "result") {
    if (resultState.status !== "complete") {
      return (
        <section className="py-20" aria-labelledby="incomplete-result-title">
          <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id="incomplete-result-title" className="text-3xl font-black text-white outline-none">Deine Reflexion ist noch nicht vollständig.</h2>
          <button type="button" onClick={() => dispatch({ type: "edit-section", sectionId: selfReflectionSections[0].id })} className="mt-8 min-h-12 rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018]">
            Zurück zu den Fragen
          </button>
        </section>
      );
    }
    return <ResultView result={resultState.result} dispatch={dispatch} headingRef={headingRef} restartPending={state.restartPending} />;
  }

  const selectedOptionIds = state.answers[question.id] ?? [];
  const sectionQuestions = selfReflectionQuestions.filter(({ sectionId }) => sectionId === question.sectionId);
  const currentSection = selfReflectionSections.find(({ id }) => id === question.sectionId);
  const lastInSection = sectionQuestions.at(-1)?.id === question.id;
  const lastInJourney = state.questionIndex === selfReflectionQuestions.length - 1;
  const nextLabel = state.editingSectionId && lastInSection
    ? "Ergebnis aktualisieren"
    : lastInJourney
      ? "Ergebnis ansehen"
      : "Weiter";
  const backLabel = state.editingSectionId && sectionQuestions[0]?.id === question.id
    ? "Zurück zum Ergebnis"
    : state.questionIndex === 0
      ? "Zurück zur Einführung"
      : "Zurück";
  const guidanceId = `${question.id}-guidance`;
  const errorId = `${question.id}-error`;

  return (
    <section className="pb-[calc(12rem+env(safe-area-inset-bottom))] pt-14 sm:pt-20 lg:pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
      <form
        className="mx-auto max-w-4xl py-12 sm:py-16"
        aria-labelledby={`${question.id}-title`}
        onSubmit={(event) => {
          event.preventDefault();
          dispatch({ type: "continue" });
        }}
      >
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-slate-500">
          {currentSection?.title} · Reflexionsentscheidung {String(state.questionIndex + 1).padStart(2, "0")}
        </p>
        <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id={`${question.id}-title`} className="mt-5 scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] text-3xl font-black leading-tight text-white outline-none sm:text-5xl lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]">
          {question.prompt}
        </h2>
        {question.context ? <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">{question.context}</p> : null}

        <fieldset aria-describedby={`${guidanceId}${state.validationMessage ? ` ${errorId}` : ""}`} className="mt-10">
          <legend className="sr-only">{question.prompt}</legend>
          <div id={guidanceId} className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <span>{selectionInstruction(question)}</span>
            <span className="ml-auto inline-flex min-h-8 shrink-0 items-center rounded-full border border-[#ff9a3d]/35 bg-[#ff9a3d]/[0.055] px-3 py-1 font-mono text-xs font-bold text-[#ffb36d]">
              {formatSelfReflectionSelectionCount(selectedOptionIds.length, question.maxSelections)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {question.options.map((option) => {
              const selected = selectedOptionIds.includes(option.id);
              const inputType = question.format === "single" ? "radio" : "checkbox";
              return (
                <label key={option.id} className="group relative cursor-pointer">
                  <input
                    type={inputType}
                    name={question.id}
                    value={option.id}
                    checked={selected}
                    onChange={() => dispatch({ type: "toggle-option", questionId: question.id, optionId: option.id })}
                    className="peer sr-only scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]"
                  />
                  <span className={`flex min-h-20 items-start justify-between gap-4 rounded-2xl border px-5 py-5 text-left transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#35d0e5] ${selected ? "border-[#35d0e5]/70 bg-[#35d0e5]/[0.09] text-white" : "border-white/10 bg-white/[0.025] text-slate-300 group-hover:border-white/25 group-hover:text-white"}`}>
                    <span className="font-bold leading-6">{option.label}</span>
                    <span aria-hidden="true" className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center border text-xs font-black ${inputType === "radio" ? "rounded-full" : "rounded-md"} ${selected ? "border-[#35d0e5] bg-[#35d0e5] text-[#041018]" : "border-white/25 text-transparent"}`}>
                      ✓
                    </span>
                    {selected ? <span className="sr-only">Ausgewählt</span> : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {state.validationMessage ? (
          <p ref={errorRef} tabIndex={-1} style={{ outline: "none" }} id={errorId} role="alert" className="mt-5 scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] border-l-2 border-[#ff9a3d] pl-4 font-bold text-[#ffb36d] outline-none lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]">
            {state.validationMessage}
          </p>
        ) : null}

        <JourneyDock
          question={question}
          backLabel={backLabel}
          nextLabel={nextLabel}
          onBack={() => dispatch({ type: "back" })}
        />
      </form>
    </section>
  );
}
