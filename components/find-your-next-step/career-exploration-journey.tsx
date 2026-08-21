"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";

import { JourneyDock } from "@/components/find-your-next-step/journey-dock";
import { HumanContextReflection } from "@/components/find-your-next-step/human-context-reflection";
import { FynsResultActions } from "@/components/find-your-next-step/result-actions";
import { FynsResultFigure } from "@/components/find-your-next-step/result-figure";
import { FynsResultRecovery } from "@/components/find-your-next-step/result-recovery";
import { useLocale } from "@/components/i18n/locale-context";
import { getCareerIntro, getCareerQuestions, getCareerSections } from "@/data/find-your-next-step-career";
import { careerUiCopy } from "@/data/find-your-next-step-career-ui-locales";
import {
  buildCareerResultText,
  buildCareerShareText,
} from "@/lib/find-your-next-step-career-export";
import type { Locale } from "@/lib/i18n/config";
import {
  buildCareerResult,
  careerJourneyReducer,
  formatCareerSelectionCount,
  initialCareerState,
} from "@/lib/find-your-next-step-career";
import type {
  CareerEvidence,
  CareerQuestion,
  CareerResult,
  CareerResultDirection,
  CareerResultJobTitle,
  CareerTensionResult,
} from "@/types/find-your-next-step";

function selectionInstruction(question: CareerQuestion, locale: Locale): string {
  const copy = careerUiCopy[locale];
  const instruction = question.minSelections === question.maxSelections
    ? question.minSelections === 1 ? copy.one : copy.exact(question.minSelections)
    : copy.range(question.minSelections, question.maxSelections);
  return question.format === "priority"
    ? `${instruction} ${copy.unranked}`
    : instruction;
}

type SafeCareerResultState = ReturnType<typeof buildCareerResult> | { status: "unavailable" };

function safelyBuildCareerResult(...args: Parameters<typeof buildCareerResult>): SafeCareerResultState {
  try {
    return buildCareerResult(...args);
  } catch {
    return { status: "unavailable" };
  }
}

function MapLayers({ currentSectionIndex }: { currentSectionIndex?: number }) {
  const locale = useLocale();
  const ui = careerUiCopy[locale];
  const careerSections = getCareerSections(locale);
  return (
    <div className="rounded-[1.5rem] border border-[#ff9a3d]/20 bg-[#ff9a3d]/[0.035] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ffb36d]">Career Map · {ui.layers}</p>
        {currentSectionIndex !== undefined ? (
          <p className="text-sm font-bold text-white">{careerSections[currentSectionIndex]?.mapLabel}</p>
        ) : null}
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-5">
        {careerSections.map((section, index) => {
          const current = index === currentSectionIndex;
          const completed = currentSectionIndex !== undefined && index < currentSectionIndex;
          return (
            <li
              key={section.id}
              className={`flex min-h-11 items-center gap-3 border-l pl-3 text-sm font-bold ${current ? "border-[#ff9a3d] text-white" : completed ? "border-slate-400 text-slate-300" : "border-white/15 text-slate-500"}`}
            >
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${current ? "bg-[#ff9a3d]" : completed ? "bg-slate-400" : "border border-white/25"}`} />
              <span>{section.mapLabel}</span>
              <span className="sr-only">{current ? ui.current : completed ? ui.explored : ui.pending}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 text-sm leading-6 text-slate-400">
        {ui.mapHint}
      </p>
    </div>
  );
}

function EvidenceDetails({ evidence }: { evidence: readonly CareerEvidence[] }) {
  const locale = useLocale();
  const ui = careerUiCopy[locale];
  return (
    <details className="mt-5 border-t border-white/10 pt-3 text-sm text-slate-400">
      <summary className="min-h-11 cursor-pointer list-none rounded-lg py-3 font-bold text-[#ffb36d] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a3d]">
        {ui.based} <span aria-hidden="true">+</span>
      </summary>
      <p className="mt-2 leading-6">{ui.basedAnswers}</p>
      <ul className="mt-3 grid gap-2">
        {evidence.slice(0, 4).map((item) => (
          <li key={`${item.questionId}-${item.optionId}`} className="border-l border-[#ff9a3d]/45 pl-4 leading-6 text-slate-300">
            „{item.answer}“
          </li>
        ))}
      </ul>
    </details>
  );
}

function DirectionCard({
  direction,
  index,
  tier,
}: {
  direction: CareerResultDirection;
  index: number;
  tier: "primary" | "additional";
}) {
  const locale = useLocale();
  const ui = careerUiCopy[locale];
  const primary = tier === "primary";
  return (
    <article
      className={`${primary ? "rounded-[1.75rem] border-[#ff9a3d]/35 bg-[#ff9a3d]/[0.045] p-6 sm:p-8" : "rounded-[1.5rem] border-white/12 bg-white/[0.025] p-6"} border`}
    >
      <div className="flex items-start justify-between gap-5">
        <p className={`font-mono text-[10px] font-black uppercase tracking-[0.2em] ${primary ? "text-[#ffb36d]" : "text-slate-500"}`}>
          {primary ? ui.primaryPath : ui.furtherPath}
        </p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border font-mono text-xs font-black ${primary ? "border-[#ff9a3d]/45 text-[#ffb36d]" : "border-white/15 text-slate-500"}`}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h4 className={`${primary ? "mt-7 text-2xl sm:text-4xl" : "mt-6 text-2xl"} font-black leading-tight text-white`}>
        {direction.title}
      </h4>
      <p className="mt-5 leading-7 text-slate-300">{direction.description}</p>
      <div className="mt-6 border-l-2 border-[#ff9a3d]/55 pl-5">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ffb36d]">{ui.whyPath}</p>
        <p className="mt-3 font-bold leading-7 text-white">{direction.why}</p>
      </div>

      <details className="mt-6 border-t border-white/10 pt-3 text-sm text-slate-400">
        <summary className="min-h-11 cursor-pointer list-none rounded-lg py-3 font-bold text-slate-200 marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a3d]">
          {ui.details} <span aria-hidden="true">+</span>
        </summary>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h5 className="font-black text-white">{ui.fields}</h5>
            <ul className="mt-3 grid gap-2">
              {direction.fields.map((field) => <li key={field} className="border-l border-white/15 pl-3 leading-6 text-slate-300">{field}</li>)}
            </ul>
          </div>
          <div>
            <h5 className="font-black text-white">{ui.environments}</h5>
            <ul className="mt-3 grid gap-2">
              {direction.environments.map((environment) => <li key={environment} className="border-l border-white/15 pl-3 leading-6 text-slate-300">{environment}</li>)}
            </ul>
          </div>
        </div>
        {direction.qualificationNote ? (
          <div className="mt-6 rounded-2xl border border-[#b8a5ff]/25 bg-[#b8a5ff]/[0.045] p-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#c8bbff]">{ui.qualifications}</p>
            <p className="mt-3 leading-6 text-slate-300">{direction.qualificationNote}</p>
          </div>
        ) : null}
        {direction.constraintNotes.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {direction.constraintNotes.map((note) => (
              <div key={note} className="rounded-2xl border border-[#ff9a3d]/25 bg-[#ff9a3d]/[0.035] p-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ffb36d]">{ui.checkRoles}</p>
                <p className="mt-3 leading-6 text-slate-300">{note}</p>
              </div>
            ))}
          </div>
        ) : null}
      </details>
      <EvidenceDetails evidence={direction.evidence} />
    </article>
  );
}

function JobTitleCard({ job }: { job: CareerResultJobTitle }) {
  const locale = useLocale();
  const ui = careerUiCopy[locale];
  const hasDetails = job.aliases.length > 0 || Boolean(job.qualificationNote) || job.constraintNotes.length > 0;
  return (
    <article className="rounded-[1.35rem] border border-white/12 bg-white/[0.025] p-5 sm:p-6">
      <div className="flex flex-wrap gap-2">
        {job.directions.map((direction) => (
          <span
            key={`${job.id}-${direction.id}`}
            className={`rounded-full border px-3 py-1 font-mono text-[9px] font-black uppercase tracking-[0.14em] ${direction.tier === "primary" ? "border-[#ff9a3d]/35 text-[#ffb36d]" : "border-white/15 text-slate-400"}`}
          >
            {direction.title}
          </span>
        ))}
      </div>
      <h4 className="mt-5 text-xl font-black leading-tight text-white sm:text-2xl">{job.title}</h4>
      <p className="mt-3 leading-6 text-slate-300">{job.description}</p>
      <div className="mt-5 border-l-2 border-[#ff9a3d]/45 pl-4">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">{ui.whyHere}</p>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-100">{job.why}</p>
      </div>
      {hasDetails ? (
        <details className="mt-5 border-t border-white/10 pt-2 text-sm text-slate-400">
          <summary className="min-h-11 cursor-pointer list-none rounded-lg py-3 font-bold text-slate-200 marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a3d]">
            {ui.searchNotes} <span aria-hidden="true">+</span>
          </summary>
          {job.aliases.length > 0 ? (
            <div className="mt-3">
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{ui.aliases}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {job.aliases.map((alias) => <li key={alias} className="rounded-full border border-white/12 px-3 py-1.5 text-slate-300">{alias}</li>)}
              </ul>
            </div>
          ) : null}
          {job.qualificationNote ? (
            <div className="mt-4 rounded-xl border border-[#b8a5ff]/25 bg-[#b8a5ff]/[0.045] p-4">
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#c8bbff]">{ui.qualifications}</p>
              <p className="mt-2 leading-6 text-slate-300">{job.qualificationNote}</p>
            </div>
          ) : null}
          {job.constraintNotes.map((note) => (
            <div key={note} className="mt-3 rounded-xl border border-[#ff9a3d]/25 bg-[#ff9a3d]/[0.035] p-4">
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">{ui.checkAds}</p>
              <p className="mt-2 leading-6 text-slate-300">{note}</p>
            </div>
          ))}
        </details>
      ) : null}
    </article>
  );
}

function TensionCard({ tension }: { tension: CareerTensionResult }) {
  return (
    <article className="rounded-[1.5rem] border border-[#b8a5ff]/25 bg-[#b8a5ff]/[0.035] p-6 sm:p-8">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#c8bbff]">{tension.title}</p>
      <p className="mt-5 text-lg font-bold leading-8 text-white">{tension.text}</p>
      <EvidenceDetails evidence={tension.evidence} />
    </article>
  );
}

function CareerPrintDirection({
  direction,
  label,
}: {
  direction: CareerResultDirection;
  label: string;
}) {
  const locale = useLocale();
  const ui = careerUiCopy[locale];
  return (
    <article className="fyns-print-block">
      <p className="fyns-print-label">{label}</p>
      <h3>{direction.title}</h3>
      <p>{direction.description}</p>
      <div className="fyns-print-detail">
        <h4>{ui.whyPath}</h4>
        <p>{direction.why}</p>
      </div>
      {direction.qualificationNote ? (
        <div className="fyns-print-note">
          <h4>{ui.qualifications}</h4>
          <p>{direction.qualificationNote}</p>
        </div>
      ) : null}
      {direction.constraintNotes.length > 0 ? (
        <div className="fyns-print-note">
          <h4>{ui.checkRoles}</h4>
          <ul>{direction.constraintNotes.map((note) => <li key={note}>{note}</li>)}</ul>
        </div>
      ) : null}
    </article>
  );
}

function CareerPrintJobTitle({ job }: { job: CareerResultJobTitle }) {
  const locale = useLocale();
  const ui = careerUiCopy[locale];
  return (
    <article className="fyns-print-block">
      <p className="fyns-print-label">
        {job.directions.map(({ title }) => title).join(" / ")}
      </p>
      <h3>{job.title}</h3>
      <p>{job.description}</p>
      {job.qualificationNote ? (
        <div className="fyns-print-note">
          <h4>{ui.qualifications}</h4>
          <p>{job.qualificationNote}</p>
        </div>
      ) : null}
      {job.constraintNotes.length > 0 ? (
        <div className="fyns-print-note">
          <h4>{ui.checkAds}</h4>
          <ul>{job.constraintNotes.map((note) => <li key={note}>{note}</li>)}</ul>
        </div>
      ) : null}
    </article>
  );
}

function CareerPrintDocument({ result }: { result: CareerResult }) {
  const locale = useLocale();
  const ui = careerUiCopy[locale];
  return (
    <article className="fyns-print-document hidden" data-fyns-print-document="career">
      <header className="fyns-print-header">
        <p className="fyns-print-brand">bts.online / FYNS / Career</p>
        <h1>{result.title}</h1>
        <section className="fyns-print-summary" aria-labelledby="career-print-summary-title">
          <h2 id="career-print-summary-title">{ui.summary}</h2>
          {result.summary.map((sentence, index) => <p key={`${index}-${sentence}`}>{sentence}</p>)}
        </section>
        <p className="fyns-print-description">{result.description}</p>
      </header>

      {result.primaryDirections.length > 0 ? (
        <section className="fyns-print-section" aria-labelledby="career-print-primary-title">
          <h2 id="career-print-primary-title">{ui.primaryHeading}</h2>
          <div className="fyns-print-stack">
            {result.primaryDirections.map((direction, index) => (
              <CareerPrintDirection
                key={direction.id}
                direction={direction}
                label={`${ui.primaryDirection} ${String(index + 1).padStart(2, "0")}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {result.additionalDirections.length > 0 ? (
        <section className="fyns-print-section" aria-labelledby="career-print-additional-title">
          <h2 id="career-print-additional-title">{ui.additionalHeading}</h2>
          <div className="fyns-print-stack">
            {result.additionalDirections.map((direction, index) => (
              <CareerPrintDirection
                key={direction.id}
                direction={direction}
                label={`${ui.additionalDirection} ${String(index + 1).padStart(2, "0")}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {result.jobTitles.length > 0 ? (
        <section className="fyns-print-section" aria-labelledby="career-print-jobs-title">
          <h2 id="career-print-jobs-title">{ui.jobs}</h2>
          <div className="fyns-print-stack">
            {result.jobTitles.map((job) => <CareerPrintJobTitle key={job.id} job={job} />)}
          </div>
        </section>
      ) : null}

      {result.conditions.length > 0 ? (
        <section className="fyns-print-section" aria-labelledby="career-print-conditions-title">
          <h2 id="career-print-conditions-title">{ui.conditions}</h2>
          <ul className="fyns-print-list">
            {result.conditions.map((condition) => (
              <li key={condition.id}>
                <strong>{condition.kind === "constraint" ? ui.firm : condition.kind === "preference" ? ui.preference : ui.qualificationScope}:</strong>{" "}
                {condition.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.tensions.length > 0 ? (
        <section className="fyns-print-section" aria-labelledby="career-print-tensions-title">
          <h2 id="career-print-tensions-title">{ui.tensions}</h2>
          <div className="fyns-print-stack">
            {result.tensions.slice(0, 2).map((tension) => (
              <article key={tension.id} className="fyns-print-block">
                <h3>{tension.title}</h3>
                <p>{tension.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="fyns-print-section fyns-print-next-step" aria-labelledby="career-print-next-step-title">
        <p className="fyns-print-label">{ui.nextStep}</p>
        <h2 id="career-print-next-step-title">{result.nextStep.title}</h2>
        <p>{result.nextStep.text}</p>
      </section>

      <p className="fyns-print-disclaimer">{ui.disclaimer}</p>
    </article>
  );
}

function ResultView({
  result,
  dispatch,
  headingRef,
  restartPending,
}: {
  result: CareerResult;
  dispatch: React.Dispatch<Parameters<typeof careerJourneyReducer>[1]>;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  restartPending: boolean;
}) {
  const locale = useLocale();
  const ui = careerUiCopy[locale];
  const careerSections = getCareerSections(locale);
  const copyText = buildCareerResultText(result, locale);
  const shareText = buildCareerShareText(result, locale);

  return (
    <>
    <section aria-labelledby="career-result-title" className="py-16 sm:py-24" data-fyns-screen-result>
      <FynsResultFigure
        journey="career"
        accent="#ff9a3d"
        headingId="career-result-title"
        headingRef={headingRef}
        title={result.title}
        description={result.description}
        summary={result.summary}
        semanticIds={[
          ...result.primaryDirections.map(({ id }) => id),
          ...result.additionalDirections.map(({ id }) => id),
          `next-step-${result.nextStep.mode}`,
        ].slice(0, 3)}
      />

      <HumanContextReflection accent="#ff9a3d" titleId="career-human-context-title" />

      <div className="mt-16 grid gap-20">
        {result.primaryDirections.length > 0 ? (
          <section aria-labelledby="career-primary-title">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ffb36d]">{ui.primaryEyebrow}</p>
            <h3 id="career-primary-title" className="mt-4 max-w-3xl text-3xl font-black text-white sm:text-5xl">{ui.primaryHeading}</h3>
            <p className="mt-5 max-w-3xl leading-7 text-slate-400">{ui.primaryDescription}</p>
            <div className="relative mt-10 grid gap-7 lg:px-12">
              <div aria-hidden="true" className="absolute bottom-8 left-1/2 top-8 hidden w-px bg-gradient-to-b from-[#ff9a3d]/10 via-[#ff9a3d]/35 to-[#ff9a3d]/10 lg:block" />
              {result.primaryDirections.map((direction, index) => (
                <div key={direction.id} className={`relative lg:w-[calc(50%-1.5rem)] ${index % 2 === 0 ? "lg:justify-self-start" : "lg:justify-self-end"}`}>
                  <DirectionCard direction={direction} index={index} tier="primary" />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section aria-labelledby="career-open-map-title" className="rounded-[1.75rem] border border-[#ff9a3d]/25 bg-[#ff9a3d]/[0.035] p-7 sm:p-9">
            <h3 id="career-open-map-title" className="text-2xl font-black text-white sm:text-4xl">{ui.openTitle}</h3>
            <p className="mt-5 max-w-3xl leading-7 text-slate-300">{ui.openDescription}</p>
          </section>
        )}

        {result.additionalDirections.length > 0 ? (
          <section aria-labelledby="career-additional-title">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-slate-500">{ui.additionalEyebrow}</p>
            <h3 id="career-additional-title" className="mt-4 max-w-3xl text-3xl font-black text-white sm:text-5xl">{ui.worthLook}</h3>
            <div className="mt-9 grid gap-5 lg:grid-cols-2">
              {result.additionalDirections.map((direction, index) => <DirectionCard key={direction.id} direction={direction} index={index} tier="additional" />)}
            </div>
          </section>
        ) : null}

        {result.jobTitles.length > 0 ? (
          <section aria-labelledby="career-job-titles-title">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ffb36d]">{ui.jobsEyebrow}</p>
            <h3 id="career-job-titles-title" className="mt-4 max-w-3xl text-3xl font-black text-white sm:text-5xl">{ui.jobs}</h3>
            <p className="mt-5 max-w-3xl leading-7 text-slate-400">{ui.jobsDescription}</p>
            {result.primaryDirections.length === 0 ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{ui.jobsWeak}</p>
            ) : null}
            <div className="mt-8 grid items-start gap-4 md:grid-cols-2">
              {result.jobTitles.map((job) => <JobTitleCard key={job.id} job={job} />)}
            </div>
          </section>
        ) : null}

        {result.conditions.length > 0 ? (
          <section aria-labelledby="career-conditions-title">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ffb36d]">{ui.reality}</p>
            <h3 id="career-conditions-title" className="mt-4 max-w-3xl text-3xl font-black text-white sm:text-5xl">{ui.conditionsTitle}</h3>
            <p className="mt-5 max-w-3xl leading-7 text-slate-400">{ui.conditionsDescription}</p>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {result.conditions.map((condition) => (
                <li key={condition.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {condition.kind === "constraint" ? ui.firm : condition.kind === "preference" ? ui.preference : ui.qualificationScope}
                  </p>
                  <p className="mt-3 font-bold leading-7 text-white">{condition.text}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {result.tensions.length > 0 ? (
          <section aria-labelledby="career-tensions-title">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#c8bbff]">{ui.both}</p>
            <h3 id="career-tensions-title" className="mt-4 max-w-3xl text-3xl font-black text-white sm:text-5xl">{ui.tensions}</h3>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {result.tensions.map((tension) => <TensionCard key={tension.id} tension={tension} />)}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="career-next-step-title" className="rounded-[1.75rem] border border-[#ff9a3d]/35 bg-[linear-gradient(135deg,rgba(255,154,61,0.09),rgba(255,255,255,0.02))] p-7 sm:p-10">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ffb36d]">{ui.nextStep}</p>
          <h3 id="career-next-step-title" className="mt-5 max-w-3xl text-3xl font-black text-white sm:text-5xl">{result.nextStep.title}</h3>
          <p className="mt-6 max-w-4xl text-lg font-bold leading-8 text-slate-200">{result.nextStep.text}</p>
        </section>
      </div>

      <FynsResultActions
        accent="#ff9a3d"
        copyText={copyText}
        shareTitle={ui.resultTitle}
        shareText={shareText}
        printTitle={ui.resultTitle}
      />

      <section aria-labelledby="career-edit-title" className="mt-20 border-t border-white/15 pt-14">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1fr]">
          <div>
            <h3 id="career-edit-title" className="text-2xl font-black text-white">{ui.adjust}</h3>
            <p className="mt-4 max-w-md leading-7 text-slate-400">{ui.adjustDescription}</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {careerSections.map((section, index) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "edit-section", sectionId: section.id })}
                  className="flex min-h-14 w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-left font-bold text-slate-200 transition hover:border-[#ff9a3d]/45 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a3d]"
                >
                  <span className="font-mono text-xs text-[#ffb36d]">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mt-12 border-t border-white/10 pt-10">
        {!restartPending ? (
          <button type="button" onClick={() => dispatch({ type: "request-restart" })} className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 py-3 font-bold text-slate-300 transition hover:border-[#ff9a3d]/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff9a3d]">
            {ui.restart}
          </button>
        ) : (
          <div className="max-w-2xl rounded-2xl border border-[#ff9a3d]/30 bg-[#ff9a3d]/[0.04] p-6">
            <p className="font-bold text-white">{ui.discardTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{ui.discardDescription}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => dispatch({ type: "cancel-restart" })} className="min-h-11 rounded-full border border-white/15 px-5 py-2 font-bold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a3d]">{ui.keep}</button>
              <button type="button" onClick={() => dispatch({ type: "confirm-restart" })} className="min-h-11 rounded-full bg-[#ff9a3d] px-5 py-2 font-black text-[#241204] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a3d]">{ui.discard}</button>
            </div>
          </div>
        )}
      </div>
    </section>
    <CareerPrintDocument result={result} />
    </>
  );
}

export function CareerExplorationJourney() {
  const locale = useLocale();
  const ui = careerUiCopy[locale];
  const careerIntro = getCareerIntro(locale);
  const careerQuestions = getCareerQuestions(locale);
  const careerSections = getCareerSections(locale);
  const [state, dispatch] = useReducer(
    (current: typeof initialCareerState, action: Parameters<typeof careerJourneyReducer>[1]) => careerJourneyReducer(current, action, locale),
    initialCareerState,
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const initialRender = useRef(true);
  const question = careerQuestions[state.questionIndex];
  const resultState = useMemo(() => safelyBuildCareerResult(state.answers, locale), [locale, state.answers]);

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
      <section aria-labelledby="career-intro-title" className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.82fr] lg:items-start">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#ffb36d]">{careerIntro.eyebrow}</p>
            <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id="career-intro-title" className="mt-6 max-w-4xl text-3xl font-black leading-tight text-white outline-none sm:text-5xl">{careerIntro.title}</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{careerIntro.description}</p>
            <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{careerIntro.duration}</p>
          </div>
          <div className="grid gap-5">
            <div className="rounded-[1.5rem] border border-[#ff9a3d]/20 bg-[#ff9a3d]/[0.035] p-6 sm:p-7">
              <h3 className="font-black text-white">{ui.can}</h3>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">{careerIntro.canDo.map((item) => <li key={item} className="border-l border-[#ff9a3d]/50 pl-4">{item}</li>)}</ul>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
              <h3 className="font-black text-white">{ui.cannot}</h3>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400">{careerIntro.cannotDo.map((item) => <li key={item} className="border-l border-white/15 pl-4">{item}</li>)}</ul>
            </div>
          </div>
        </div>
        <div className="mt-10"><MapLayers /></div>
        <div className="mt-8 border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.035] p-6 sm:p-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ffb36d]">{ui.local}</p>
          <p className="mt-4 max-w-3xl font-bold leading-7 text-white">{careerIntro.privacy}</p>
        </div>
        <button type="button" onClick={() => dispatch({ type: "start" })} className="mt-10 inline-flex min-h-14 items-center rounded-full bg-[#ff9a3d] px-7 py-4 font-black text-[#241204] transition motion-safe:hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff9a3d]">
          {ui.start} <span aria-hidden="true" className="ml-3">→</span>
        </button>
      </section>
    );
  }

  if (state.phase === "result") {
    if (resultState.status === "unavailable") {
      return (
        <FynsResultRecovery
          accent="#ff9a3d"
          titleId="career-result-unavailable-title"
          title={ui.unavailableTitle}
          message={ui.unavailableMessage}
          actionLabel={ui.backQuestions}
          onAction={() => dispatch({ type: "edit-section", sectionId: careerSections[0].id })}
          headingRef={headingRef}
        />
      );
    }
    if (resultState.status !== "complete") {
      return (
        <FynsResultRecovery
          accent="#ff9a3d"
          titleId="career-incomplete-title"
          title={ui.incompleteTitle}
          message={ui.incompleteMessage}
          actionLabel={ui.backQuestions}
          onAction={() => dispatch({ type: "edit-section", sectionId: careerSections[0].id })}
          headingRef={headingRef}
        />
      );
    }
    return <ResultView result={resultState.result} dispatch={dispatch} headingRef={headingRef} restartPending={state.restartPending} />;
  }

  const selectedOptionIds = state.answers[question.id] ?? [];
  const sectionQuestions = careerQuestions.filter(({ sectionId }) => sectionId === question.sectionId);
  const currentSectionIndex = careerSections.findIndex(({ id }) => id === question.sectionId);
  const currentQuestionNumber = sectionQuestions.findIndex(({ id }) => id === question.id) + 1;
  const currentSection = careerSections[currentSectionIndex];
  const lastInSection = sectionQuestions.at(-1)?.id === question.id;
  const lastInJourney = state.questionIndex === careerQuestions.length - 1;
  const nextLabel = state.editingSectionId && lastInSection ? ui.update : lastInJourney ? ui.view : ui.next;
  const backLabel = state.editingSectionId && sectionQuestions[0]?.id === question.id ? ui.backMap : state.questionIndex === 0 ? ui.backIntro : ui.back;
  const guidanceId = `${question.id}-guidance`;
  const errorId = `${question.id}-error`;

  return (
    <section className="pb-[calc(12rem+env(safe-area-inset-bottom))] pt-14 sm:pt-20 lg:pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
      <form className="mx-auto max-w-4xl py-12 sm:py-16" aria-labelledby={`${question.id}-title`} onSubmit={(event) => { event.preventDefault(); dispatch({ type: "continue" }); }}>
        <MapLayers currentSectionIndex={currentSectionIndex} />
        <p className="mt-10 font-mono text-xs font-black uppercase tracking-[0.22em] text-slate-500">{currentSection?.title} · {ui.choice} {String(state.questionIndex + 1).padStart(2, "0")}</p>
        <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} id={`${question.id}-title`} className="mt-5 scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] text-3xl font-black leading-tight text-white outline-none sm:text-5xl lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]">{question.prompt}</h2>
        {question.context ? <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">{question.context}</p> : null}

        <fieldset aria-describedby={`${guidanceId}${state.validationMessage ? ` ${errorId}` : ""}`} className="mt-10">
          <legend className="sr-only">{question.prompt}</legend>
          <div id={guidanceId} className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <span>{selectionInstruction(question, locale)}</span>
            <span className="ml-auto inline-flex min-h-8 shrink-0 items-center rounded-full border border-[#ff9a3d]/40 bg-[#ff9a3d]/[0.065] px-3 py-1 font-mono text-xs font-bold text-[#ffb36d]">{formatCareerSelectionCount(selectedOptionIds.length, question.maxSelections, locale)}</span>
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
                  <span className={`flex min-h-20 items-start justify-between gap-4 rounded-2xl border px-5 py-5 text-left transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#ff9a3d] ${selected ? "border-[#ff9a3d]/75 bg-[#ff9a3d]/[0.095] text-white" : "border-white/10 bg-white/[0.025] text-slate-300 group-hover:border-white/25 group-hover:text-white"}`}>
                    <span>
                      <span className="font-bold leading-6">{option.label}</span>
                      {option.description ? <span className="mt-2 block text-sm leading-6 text-slate-400">{option.description}</span> : null}
                    </span>
                    <span aria-hidden="true" className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center border text-xs font-black ${inputType === "radio" ? "rounded-full" : "rounded-md"} ${selected ? "border-[#ff9a3d] bg-[#ff9a3d] text-[#241204]" : "border-white/25 text-transparent"}`}>✓</span>
                    {selected ? <span className="sr-only">{ui.selected}</span> : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {state.validationMessage ? <p ref={errorRef} tabIndex={-1} style={{ outline: "none" }} id={errorId} role="alert" className="mt-5 scroll-mb-[calc(12rem+env(safe-area-inset-bottom))] border-l-2 border-[#ff9a3d] pl-4 font-bold text-[#ffb36d] outline-none lg:scroll-mb-[calc(8.5rem+env(safe-area-inset-bottom))]">{state.validationMessage}</p> : null}

        <JourneyDock
          locale={locale}
          sections={careerSections}
          currentSectionIndex={currentSectionIndex}
          globalQuestionNumber={state.questionIndex + 1}
          totalQuestionCount={careerQuestions.length}
          localQuestionNumber={currentQuestionNumber}
          localQuestionCount={sectionQuestions.length}
          accent="#ff9a3d"
          accessibleLabel={ui.controls}
          backLabel={backLabel}
          nextLabel={nextLabel}
          onBack={() => dispatch({ type: "back" })}
        />
      </form>
    </section>
  );
}
