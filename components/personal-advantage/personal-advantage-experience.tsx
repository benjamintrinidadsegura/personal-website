"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ResultFeedback } from "@/components/feedback/result-feedback";
import { PersonalAdvantageShareDialog } from "@/components/personal-advantage/personal-advantage-share-dialog";
import { advantageChapterCopy } from "@/data/personal-advantage-questions";
import { getPersonalAdvantageUiCopy } from "@/data/personal-advantage-locales";
import { advantageSignalById } from "@/data/personal-advantage-signals";
import { emitPersonalAdvantageEvent } from "@/lib/personal-advantage-analytics";
import {
  buildAdvantageCandidates,
  buildAdvantageSignalProfiles,
  buildPersonalAdvantageMap,
  generateAdvantageProbes,
  getActiveAdvantageQuestions,
  reconcileAdvantageAnswers,
} from "@/lib/personal-advantage-engine";
import {
  clearAdvantageState,
  readAdvantageState,
  writeAdvantageState,
} from "@/lib/personal-advantage-persistence";
import { localizeHref } from "@/lib/i18n/routing";
import type { Locale } from "@/lib/i18n/config";
import type {
  AdvantageAnswer,
  AdvantageAnswerSet,
  AdvantageCalibration,
  AdvantageCalibrationValue,
  AdvantageCandidate,
  AdvantageProbeAnswers,
  AdvantageQuestion,
  PersistedAdvantageState,
  PersonalAdvantageMap,
} from "@/types/personal-advantage";

type Phase = "intro" | PersistedAdvantageState["phase"];

export function PersonalAdvantageExperience({ formToken, locale }: { formToken: string | null; locale: Locale }) {
  const copy = getPersonalAdvantageUiCopy(locale);
  const [hydrated, setHydrated] = useState(false);
  const [resumeState, setResumeState] = useState<PersistedAdvantageState | null>(null);
  const [persistEnabled, setPersistEnabled] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<string, AdvantageAnswer>>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [probeAnswers, setProbeAnswers] = useState<Record<string, string>>({});
  const [probeIndex, setProbeIndex] = useState(0);
  const [calibration, setCalibration] = useState<Record<string, AdvantageCalibrationValue>>({});
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<number | null>(null);

  const activeQuestions = useMemo(() => getActiveAdvantageQuestions(answers), [answers]);
  const currentIndex = Math.max(0, activeQuestions.findIndex(({ id }) => id === currentQuestionId));
  const question = activeQuestions[currentIndex];
  const probes = useMemo(() => generateAdvantageProbes(answers), [answers]);
  const preliminaryCandidates = useMemo(() => buildAdvantageCandidates(answers, probes, probeAnswers).slice(0, 3), [answers, probeAnswers, probes]);
  const map = useMemo(() => buildPersonalAdvantageMap(answers, probes, probeAnswers, calibration), [answers, calibration, probeAnswers, probes]);

  useEffect(() => {
    const stored = readAdvantageState();
    const timer = window.setTimeout(() => { setResumeState(stored); setHydrated(true); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || !persistEnabled || phase === "intro") return;
    const persistedPhase = phase;
    writeAdvantageState({
      schemaVersion: 1,
      phase: persistedPhase,
      questionId: persistedPhase === "questions" ? question?.id ?? null : null,
      answers,
      probeAnswers,
      calibration,
      updatedAt: new Date().toISOString(),
      ...(persistedPhase === "result" ? { completedAt: new Date().toISOString() } : {}),
    });
  }, [answers, calibration, hydrated, persistEnabled, phase, probeAnswers, question?.id]);

  const startFresh = () => {
    clearAdvantageState();
    setAnswers({}); setProbeAnswers({}); setCalibration({}); setProbeIndex(0); setCurrentQuestionId("q1"); setResumeState(null); setPersistEnabled(true); setPhase("questions"); setSelectedExperiment(null);
    emitPersonalAdvantageEvent("advantage_started");
  };
  const resume = () => {
    if (!resumeState) return;
    const reconciled = reconcileAdvantageAnswers(resumeState.answers);
    setAnswers(reconciled); setProbeAnswers(resumeState.probeAnswers); setCalibration(resumeState.calibration); setCurrentQuestionId(resumeState.questionId ?? getActiveAdvantageQuestions(reconciled)[0]?.id ?? "q1"); setProbeIndex(0); setPersistEnabled(true); setPhase(resumeState.phase);
    emitPersonalAdvantageEvent("advantage_resumed");
  };
  const reset = () => { if (window.confirm(copy.resetConfirm)) startFresh(); };

  if (!hydrated) return <div className="min-h-[60svh]" aria-busy="true" />;
  if (phase === "intro") return <AdvantageIntro locale={locale} resumeState={resumeState} onResume={resume} onStart={startFresh} />;
  if (phase === "questions" && question) return <QuestionView copy={copy} question={question} answer={answers[question.id]} answers={answers} currentIndex={currentIndex} total={activeQuestions.length} onAnswer={(answer) => {
    setAnswers((current) => reconcileAdvantageAnswers({ ...current, [question.id]: answer }));
    setProbeAnswers({}); setCalibration({});
  }} onBack={() => { if (currentIndex > 0) setCurrentQuestionId(activeQuestions[currentIndex - 1].id); }} onNext={() => {
    const next = activeQuestions[currentIndex + 1];
    if (next) {
      if (next.chapter !== question.chapter) emitPersonalAdvantageEvent("advantage_chapter_completed");
      setCurrentQuestionId(next.id);
    } else { setProbeIndex(0); setPhase("probes"); }
  }} onReset={reset} />;
  if (phase === "probes") return <ProbeView copy={copy} probes={probes} answers={probeAnswers} index={Math.min(probeIndex, Math.max(0, probes.length - 1))} onBack={() => { if (probeIndex > 0) setProbeIndex((index) => index - 1); else { setPhase("questions"); setCurrentQuestionId(activeQuestions.at(-1)?.id ?? "q1"); } }} onAnswer={(probeId, answer) => setProbeAnswers((current) => ({ ...current, [probeId]: answer }))} onNext={() => { if (probeIndex < probes.length - 1) setProbeIndex((index) => index + 1); else setPhase("calibration"); }} onReset={reset} />;
  if (phase === "calibration") return <CalibrationView candidates={preliminaryCandidates} calibration={calibration} copy={copy} onBack={() => { setPhase("probes"); setProbeIndex(Math.max(0, probes.length - 1)); }} onChange={(id, value) => setCalibration((current) => ({ ...current, [id]: value }))} onContinue={() => setPhase("reveal")} onReset={reset} />;
  if (phase === "reveal") return <RevealView copy={copy} onReveal={() => { setPhase("result"); emitPersonalAdvantageEvent("advantage_completed"); emitPersonalAdvantageEvent("advantage_result_viewed"); }} />;
  return <AdvantageResult copy={copy} formToken={formToken} locale={locale} map={map} selectedExperiment={selectedExperiment} onSelectExperiment={(index) => { setSelectedExperiment(index); emitPersonalAdvantageEvent("advantage_experiment_selected"); }} onRetake={reset} onShare={() => setShareOpen(true)} shareOpen={shareOpen} onShareClose={() => setShareOpen(false)} />;
}

function AdvantageIntro({ locale, onResume, onStart, resumeState }: { locale: Locale; onResume: () => void; onStart: () => void; resumeState: PersistedAdvantageState | null }) {
  const copy = getPersonalAdvantageUiCopy(locale);
  return <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-[74rem] bg-[radial-gradient(circle_at_75%_15%,rgba(119,229,181,.14),transparent_30rem),radial-gradient(circle_at_15%_35%,rgba(53,208,229,.12),transparent_25rem)]" /><div className="relative mx-auto max-w-[90rem]">
    <header className="grid min-h-[72svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1fr_.62fr]"><div><p className="font-mono text-xs font-black uppercase tracking-[.27em] text-[#77e5b5]">{copy.method}</p><h1 className="mt-7 max-w-5xl text-[clamp(3.8rem,9vw,8.8rem)] font-black leading-[.85] tracking-[-.068em] text-white">What&apos;s Your <span className="text-[#77e5b5]">Unfair</span> Advantage?</h1><p className="mt-8 max-w-3xl text-2xl font-black leading-9 text-slate-100">{copy.tagline}</p><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">{copy.intro}</p><ul className="mt-8 flex flex-wrap gap-3">{copy.expectation.map((item) => <li key={item} className="rounded-full border border-white/15 px-4 py-2 font-mono text-xs font-bold text-slate-300">{item}</li>)}</ul></div><div className="rounded-[2rem] border border-[#77e5b5]/25 bg-[#071824]/80 p-7 sm:p-9">{resumeState ? <><p className="font-mono text-xs uppercase tracking-[.2em] text-[#77e5b5]">{copy.resumeTitle}</p><h2 className="mt-4 text-3xl font-black text-white">{copy.resumeBody}</h2><p className="mt-4 text-sm text-slate-500">{copy.localNotice}</p><div className="mt-7 grid gap-3"><button onClick={onResume} className="min-h-12 rounded-full bg-[#77e5b5] px-6 font-black text-[#041018]">{copy.continue}</button><button onClick={onStart} className="min-h-12 rounded-full border border-white/15 px-6 font-bold text-white">{copy.startOver}</button></div></> : <button onClick={onStart} className="min-h-14 w-full rounded-full bg-[#77e5b5] px-7 text-lg font-black text-[#041018] transition motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none">{copy.start} →</button>}</div></header>
    <section className="grid gap-10 border-b border-white/15 py-20 lg:grid-cols-2"><div><p className="font-mono text-xs uppercase tracking-[.2em] text-[#35d0e5]">Before starting</p><h2 className="mt-5 text-5xl font-black text-white">{copy.beforeTitle}</h2><ul className="mt-8 space-y-4">{copy.principles.map((item) => <li key={item} className="border-l border-white/15 pl-5 text-lg leading-8 text-slate-300">{item}</li>)}</ul></div><div className="rounded-[2rem] border border-[#ff9a3d]/25 bg-[#ff9a3d]/[.035] p-7 sm:p-9"><p className="font-mono text-xs uppercase tracking-[.2em] text-[#ffbd7c]">Privacy</p><h2 className="mt-5 text-4xl font-black text-white">{copy.privacyTitle}</h2><p className="mt-5 leading-7 text-slate-300">{copy.privacyBody}</p><ul className="mt-6 space-y-3 text-sm leading-6 text-slate-400">{copy.privacyPoints.map((item) => <li key={item}>— {item}</li>)}</ul><Link href={localizeHref("/privacy#personal-advantage", locale)} className="mt-6 inline-flex min-h-11 items-center font-bold text-[#35d0e5]">{copy.privacyLink} →</Link></div></section>
    <aside className="mt-12 border-l-2 border-[#b8a5ff] pl-6 text-sm leading-6 text-slate-500">{copy.languageNotice}</aside>
  </div></article>;
}

function QuestionView({ answer, answers, copy, currentIndex, onAnswer, onBack, onNext, onReset, question, total }: { answer?: AdvantageAnswer; answers: AdvantageAnswerSet; copy: ReturnType<typeof getPersonalAdvantageUiCopy>; currentIndex: number; onAnswer: (answer: AdvantageAnswer) => void; onBack: () => void; onNext: () => void; onReset: () => void; question: AdvantageQuestion; total: number }) {
  const chapter = advantageChapterCopy.find(({ id }) => id === question.chapter)!;
  const values = answer ? (Array.isArray(answer.value) ? answer.value : answer.value ? [answer.value] : []) : [];
  const dynamicOptions = question.type === "adaptive-signals" ? buildAdvantageSignalProfiles(answers).filter(({ support }) => support > 0).slice(0, 6).map(({ signal }) => ({ id: signal.id, label: signal.label })) : [];
  const answered = answer?.skipped || question.type === "text" || values.length > 0;
  const remainingMinutes = Math.max(1, Math.round((total - currentIndex - 1) * .34));
  return <article className="section-lines min-h-screen px-5 pb-24 pt-28 sm:px-8"><div className="mx-auto max-w-5xl"><JourneyHeader copy={copy} chapter={`${String(question.chapter).padStart(2, "0")} / 09 — ${chapter.label}`} progress={(currentIndex + 1) / total} remaining={`${remainingMinutes} min ${copy.remaining}`} onReset={onReset} />
    <main className="py-14 sm:py-20" lang="en"><p className="font-mono text-xs font-black uppercase tracking-[.22em] text-[#77e5b5]">{question.id.toUpperCase()} · {question.title}</p><h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-.035em] text-white sm:text-6xl">{question.prompt}</h1>{question.instruction ? <p className="mt-5 text-lg text-slate-400">{question.instruction}</p> : null}
      <div className="mt-10"><QuestionInput answer={answer} copy={copy} dynamicOptions={dynamicOptions} onAnswer={onAnswer} question={question} /></div>
    </main>
    <footer className="flex flex-col-reverse gap-3 border-t border-white/15 pt-7 sm:flex-row sm:items-center"><button type="button" onClick={onBack} disabled={currentIndex === 0} className="min-h-12 rounded-full border border-white/15 px-6 font-bold text-slate-200 disabled:opacity-30">← {copy.back}</button><button type="button" onClick={() => onAnswer({ value: "", skipped: true })} className="min-h-12 rounded-full px-5 text-sm font-bold text-slate-400 hover:text-white">{answer?.skipped ? copy.skipped : copy.skip}</button><button type="button" onClick={onNext} disabled={!answered} className="min-h-12 rounded-full bg-[#77e5b5] px-7 font-black text-[#041018] disabled:cursor-not-allowed disabled:opacity-35 sm:ml-auto">{copy.next} →</button></footer>
  </div></article>;
}

function QuestionInput({ answer, copy, dynamicOptions, onAnswer, question }: { answer?: AdvantageAnswer; copy: ReturnType<typeof getPersonalAdvantageUiCopy>; dynamicOptions: readonly { id: string; label: string }[]; onAnswer: (answer: AdvantageAnswer) => void; question: AdvantageQuestion }) {
  const values = answer ? (Array.isArray(answer.value) ? [...answer.value] : answer.value ? [answer.value] : []) : [];
  if (question.type === "text") return <div><label htmlFor={`${question.id}-text`} className="font-mono text-xs uppercase tracking-[.18em] text-slate-500">{copy.textOptional}</label><textarea id={`${question.id}-text`} maxLength={question.freeTextLimit ?? 280} rows={5} value={answer?.freeText ?? ""} onChange={(event) => onAnswer({ value: "", freeText: event.currentTarget.value })} className="mt-3 w-full rounded-[1.5rem] border border-white/15 bg-[#071824] p-5 text-lg leading-8 text-white outline-none focus:border-[#77e5b5]" /><div className="mt-3 flex justify-between gap-4 text-xs text-slate-500"><span>{copy.textNotPersisted}</span><span>{Array.from(answer?.freeText ?? "").length}/{question.freeTextLimit ?? 280}</span></div></div>;
  const options = question.type === "adaptive-signals" ? dynamicOptions : question.options;
  const multiple = question.type === "multi" || question.type === "adaptive-signals";
  return <fieldset><legend className="sr-only">{multiple ? copy.chooseSeveral : copy.chooseOne}</legend><p className="mb-4 font-mono text-xs uppercase tracking-[.18em] text-slate-500">{multiple ? copy.chooseSeveral : copy.chooseOne}{multiple && question.maxSelections ? ` · ${values.length}/${question.maxSelections} ${copy.selected}` : ""}</p><div className="grid gap-3">{options.map((option) => { const selected = values.includes(option.id); const atLimit = multiple && !selected && values.length >= (question.maxSelections ?? options.length); return <button key={option.id} type="button" role={multiple ? "checkbox" : "radio"} aria-checked={selected} disabled={atLimit} onClick={() => { if (!multiple) { onAnswer({ value: option.id }); return; } const next = selected ? values.filter((id) => id !== option.id) : [...values, option.id]; onAnswer({ value: next }); }} className={`min-h-14 rounded-2xl border px-5 py-4 text-left font-bold leading-6 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#77e5b5] ${selected ? "border-[#77e5b5] bg-[#77e5b5]/10 text-white" : "border-white/10 bg-white/[.025] text-slate-300 hover:border-white/25"} disabled:opacity-35`}><span className="mr-3 font-mono text-xs text-[#77e5b5]">{selected ? "●" : "○"}</span>{option.label}</button>; })}</div></fieldset>;
}

function JourneyHeader({ chapter, copy, onReset, progress, remaining }: { chapter: string; copy: ReturnType<typeof getPersonalAdvantageUiCopy>; onReset: () => void; progress: number; remaining?: string }) {
  return <header className="border-b border-white/15 py-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono text-xs font-black uppercase tracking-[.18em] text-[#77e5b5]">{chapter}</p>{remaining ? <p className="mt-2 text-xs text-slate-500">{remaining} · {copy.localNotice}</p> : null}</div><button type="button" onClick={onReset} className="min-h-11 rounded-full border border-white/10 px-4 text-xs font-bold text-slate-400 hover:text-white">{copy.startOver}</button></div><div role="progressbar" aria-label={copy.progressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} className="mt-5 h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full bg-[#77e5b5] transition-[width] motion-reduce:transition-none" style={{ width: `${Math.max(2, progress * 100)}%` }} /></div></header>;
}

function ProbeView({ answers, copy, index, onAnswer, onBack, onNext, onReset, probes }: { answers: AdvantageProbeAnswers; copy: ReturnType<typeof getPersonalAdvantageUiCopy>; index: number; onAnswer: (id: string, answer: string) => void; onBack: () => void; onNext: () => void; onReset: () => void; probes: ReturnType<typeof generateAdvantageProbes> }) {
  const probe = probes[index];
  if (!probe) return <RevealView copy={copy} onReveal={onNext} />;
  return <article className="section-lines min-h-screen px-5 pb-24 pt-28 sm:px-8"><div className="mx-auto max-w-5xl"><JourneyHeader copy={copy} chapter={copy.probesEyebrow} progress={(index + 1) / Math.max(1, probes.length)} onReset={onReset} /><main className="py-14 sm:py-20" lang="en"><p className="font-mono text-xs font-black uppercase tracking-[.22em] text-[#b8a5ff]">{copy.probesTitle} · {index + 1}/{probes.length}</p><p className="mt-4 max-w-3xl text-slate-400">{copy.probesBody}</p><h1 className="mt-8 max-w-4xl text-4xl font-black leading-tight text-white sm:text-6xl">{probe.prompt}</h1><div className="mt-10 grid gap-3">{probe.options.map((option) => <button key={option.id} type="button" role="radio" aria-checked={answers[probe.id] === option.id} onClick={() => onAnswer(probe.id, option.id)} className={`min-h-14 rounded-2xl border px-5 py-4 text-left font-bold ${answers[probe.id] === option.id ? "border-[#b8a5ff] bg-[#b8a5ff]/10 text-white" : "border-white/10 text-slate-300"}`}>{option.label}</button>)}</div></main><footer className="flex gap-3 border-t border-white/15 pt-7"><button onClick={onBack} className="min-h-12 rounded-full border border-white/15 px-6 font-bold text-white">← {copy.back}</button><button onClick={onNext} disabled={!answers[probe.id]} className="ml-auto min-h-12 rounded-full bg-[#b8a5ff] px-7 font-black text-[#041018] disabled:opacity-35">{copy.next} →</button></footer></div></article>;
}

function CalibrationView({ calibration, candidates, copy, onBack, onChange, onContinue, onReset }: { calibration: AdvantageCalibration; candidates: readonly AdvantageCandidate[]; copy: ReturnType<typeof getPersonalAdvantageUiCopy>; onBack: () => void; onChange: (id: string, value: AdvantageCalibrationValue) => void; onContinue: () => void; onReset: () => void }) {
  const complete = candidates.length > 0 && candidates.every(({ id }) => calibration[id]);
  return <article className="section-lines min-h-screen px-5 pb-24 pt-28 sm:px-8"><div className="mx-auto max-w-6xl"><JourneyHeader copy={copy} chapter={copy.calibrationEyebrow} progress={1} onReset={onReset} /><main className="py-14 sm:py-20"><h1 className="text-5xl font-black text-white sm:text-7xl">{copy.calibrationTitle}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{copy.calibrationBody}</p><div className="mt-12 grid gap-6">{candidates.map((candidate, index) => <section key={candidate.id} className="rounded-[1.75rem] border border-white/10 bg-[#071824]/70 p-6 sm:p-8" lang="en"><p className="font-mono text-xs text-[#77e5b5]">0{index + 1}</p><h2 className="mt-4 text-3xl font-black text-white">{candidate.label}</h2><p className="mt-3 font-mono text-xs leading-6 text-slate-500">{candidate.signalIds.map((id) => advantageSignalById.get(id)?.label ?? id).join(" × ")}</p><p className="mt-5 max-w-4xl leading-7 text-slate-300">{candidate.synthesis}</p><div className="mt-6 grid gap-2 sm:grid-cols-3">{(["very-true", "sometimes-true", "not-really"] as const).map((value) => <button key={value} role="radio" aria-checked={calibration[candidate.id] === value} onClick={() => onChange(candidate.id, value)} className={`min-h-12 rounded-full border px-4 font-bold ${calibration[candidate.id] === value ? "border-[#77e5b5] bg-[#77e5b5]/10 text-white" : "border-white/10 text-slate-300"}`}>{value === "very-true" ? copy.veryTrue : value === "sometimes-true" ? copy.sometimesTrue : copy.notReally}</button>)}</div></section>)}</div></main><footer className="flex gap-3 border-t border-white/15 pt-7"><button onClick={onBack} className="min-h-12 rounded-full border border-white/15 px-6 font-bold text-white">← {copy.back}</button><button onClick={onContinue} disabled={!complete} className="ml-auto min-h-12 rounded-full bg-[#77e5b5] px-7 font-black text-[#041018] disabled:opacity-35">{copy.connecting} →</button></footer></div></article>;
}

function RevealView({ copy, onReveal }: { copy: ReturnType<typeof getPersonalAdvantageUiCopy>; onReveal: () => void }) {
  return <article className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-28 text-center"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(119,229,181,.15),transparent_28rem)]" /><div className="relative max-w-4xl"><p className="font-mono text-xs font-black uppercase tracking-[.28em] text-[#77e5b5]">{copy.connecting}</p><h1 className="mt-7 text-6xl font-black text-white sm:text-8xl">{copy.gotIt}</h1><p className="mx-auto mt-7 max-w-2xl text-xl leading-8 text-slate-300">{copy.revealBody}</p><button onClick={onReveal} className="mt-10 min-h-14 rounded-full bg-[#77e5b5] px-8 text-lg font-black text-[#041018]">{copy.reveal} →</button></div></article>;
}

function AdvantageResult({ copy, formToken, locale, map, onRetake, onSelectExperiment, onShare, onShareClose, selectedExperiment, shareOpen }: { copy: ReturnType<typeof getPersonalAdvantageUiCopy>; formToken: string | null; locale: Locale; map: PersonalAdvantageMap; onRetake: () => void; onSelectExperiment: (index: number) => void; onShare: () => void; onShareClose: () => void; selectedExperiment: number | null; shareOpen: boolean }) {
  const stackLine = map.coreAdvantage.signalIds.map((id) => advantageSignalById.get(id)?.label ?? id).join(" × ");
  return <article className="section-lines px-5 pb-24 pt-28 sm:px-8"><div className="mx-auto max-w-[90rem]"><header id="advantage-overview" className="scroll-mt-28 min-h-[72svh] border-b border-white/15 py-16"><p className="font-mono text-xs font-black uppercase tracking-[.26em] text-[#77e5b5]">{copy.coreAdvantage}</p><h1 className="mt-7 max-w-6xl text-[clamp(4rem,10vw,9rem)] font-black leading-[.84] tracking-[-.07em] text-white">{map.coreAdvantage.label}</h1><p className="mt-8 font-mono text-sm font-black uppercase tracking-[.15em] text-[#b8a5ff]">{stackLine}</p><p className="mt-8 max-w-4xl text-2xl font-bold leading-10 text-slate-200">{map.coreAdvantage.synthesis}</p><p className="mt-8 inline-flex rounded-full border border-[#77e5b5]/30 px-4 py-2 text-sm font-bold text-[#77e5b5]">{copy.confidence[map.coreAdvantage.confidence]}</p></header>
    <ResultNavigation copy={copy} />
    <section className="grid gap-12 border-b border-white/15 py-20 lg:grid-cols-[.4fr_1fr]"><h2 className="text-4xl font-black text-white">{copy.recognize}</h2><ul className="space-y-5">{map.playbook.showsUp.map((item) => <li key={item} className="border-l-2 border-[#77e5b5] pl-6 text-lg leading-8 text-slate-300">{item}</li>)}</ul></section>
    <section id="advantage-stack" className="scroll-mt-28 border-b border-white/15 py-20"><p className="font-mono text-xs uppercase tracking-[.2em] text-[#35d0e5]">{copy.why}</p><h2 className="mt-5 text-5xl font-black text-white sm:text-7xl">{copy.stack}</h2><div className="mt-12 grid border-l border-t border-white/10 md:grid-cols-2 xl:grid-cols-3">{map.stack.map((item, index) => <article key={item.signalId} className="min-h-64 border-b border-r border-white/10 p-7"><span className="font-mono text-xs text-slate-600">0{index + 1}</span><p className="mt-8 font-mono text-[10px] uppercase tracking-[.18em] text-[#77e5b5]">{item.role === "core" ? copy.core : item.role === "amplifier" ? copy.amplifier : copy.supporting}</p><h3 className="mt-4 text-2xl font-black text-white">{item.label}</h3><p className="mt-4 leading-7 text-slate-400">{advantageSignalById.get(item.signalId)?.definition}</p></article>)}</div></section>
    <section id="advantage-evidence" className="scroll-mt-28 grid gap-12 border-b border-white/15 py-20 lg:grid-cols-[.4fr_1fr]"><div><p className="font-mono text-xs uppercase tracking-[.2em] text-[#b8a5ff]">Transparency</p><h2 className="mt-5 text-5xl font-black text-white">{copy.evidence}</h2></div><div className="space-y-5">{map.evidenceSummary.map((item) => <div key={item.label} className="rounded-2xl border border-white/10 p-6"><h3 className="font-black text-white">{item.label}</h3><p className="mt-3 leading-7 text-slate-400">{item.detail}</p></div>)}</div></section>
    {map.supportingAdvantages.length || map.emergingAdvantage ? <section className="border-b border-white/15 py-20"><h2 className="text-5xl font-black text-white">{copy.portfolio}</h2><div className="mt-10 grid gap-5 md:grid-cols-2">{map.supportingAdvantages.map((item) => <PortfolioCard key={item.id} copy={copy} candidate={item} />)}{map.emergingAdvantage ? <PortfolioCard copy={copy} candidate={map.emergingAdvantage} /> : null}</div></section> : null}
    {map.hiddenAdvantages.length ? <section className="border-b border-white/15 py-20"><p className="font-mono text-xs uppercase tracking-[.2em] text-[#ff9a3d]">Hidden Advantage</p><h2 className="mt-5 text-5xl font-black text-white">{copy.hidden}</h2>{map.hiddenAdvantages.map((item) => <div key={item.label} className="mt-10 max-w-4xl border-l-2 border-[#ff9a3d] pl-7"><h3 className="text-3xl font-black text-white">{item.label}</h3><p className="mt-4 leading-8 text-slate-300">{item.explanation}</p><p className="mt-5 font-bold text-[#ffbd7c]">{item.experiment}</p></div>)}</section> : null}
    <section id="advantage-environment" className="scroll-mt-28 border-b border-white/15 py-20"><div className="grid gap-10 lg:grid-cols-2"><div><h2 className="text-5xl font-black text-white">{copy.powerful}</h2><ul className="mt-8 flex flex-wrap gap-3">{map.amplifierEnvironments.map((item) => <li key={item} className="rounded-full border border-[#77e5b5]/35 px-4 py-2 font-bold text-[#b8f4d8]">{item}</li>)}</ul></div><div><h2 className="text-5xl font-black text-white">{copy.killers}</h2><ul className="mt-8 space-y-4">{map.killers.map((item) => <li key={item} className="border-l border-white/15 pl-5 leading-7 text-slate-300">{item}</li>)}</ul></div></div></section>
    <section id="advantage-tradeoffs" className="scroll-mt-28 border-b border-white/15 py-20"><div className="grid gap-6 lg:grid-cols-3"><ResultPanel eyebrow={copy.shadow} body={map.shadows[0]} accent="#ff9a3d" /><ResultPanel eyebrow={copy.counterweight} body={map.counterweights[0]} accent="#35d0e5" /><ResultPanel eyebrow={copy.multiplier} body={map.missingMultiplier ?? "A clearer feedback loop."} accent="#b8a5ff" /></div></section>
    <section id="advantage-playbook" className="scroll-mt-28 border-b border-white/15 py-20"><h2 className="text-5xl font-black text-white sm:text-7xl">{copy.playbook}</h2><div className="mt-12 grid gap-8 lg:grid-cols-2"><PlaybookList title={copy.showsUp} items={map.playbook.showsUp} /><PlaybookList title={copy.powerful} items={map.playbook.powerfulWhen} /><PlaybookList title={copy.tryThis} items={map.playbook.tryThis} /><PlaybookList title={copy.watchFor} items={map.playbook.watchFor} /></div></section>
    <section className="border-b border-white/15 py-20"><p className="font-mono text-xs uppercase tracking-[.2em] text-[#77e5b5]">Advantage Experiment</p><h2 className="mt-5 text-5xl font-black text-white">{copy.experimentTitle}</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{copy.experimentBody}</p><div className="mt-10 grid gap-4">{map.experiments.map((experiment, index) => <button key={experiment} type="button" aria-pressed={selectedExperiment === index} onClick={() => onSelectExperiment(index)} className={`min-h-16 rounded-2xl border p-5 text-left font-bold leading-7 ${selectedExperiment === index ? "border-[#77e5b5] bg-[#77e5b5]/10 text-white" : "border-white/10 text-slate-300"}`}><span className="mr-4 font-mono text-xs text-[#77e5b5]">0{index + 1}</span>{experiment}</button>)}</div></section>
    <section id="advantage-onepager" className="scroll-mt-28 py-20"><OnePager copy={copy} map={map} onShare={onShare} /><p className="mx-auto mt-12 max-w-3xl text-center text-lg leading-8 text-slate-400">{copy.hypothesis}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={onRetake} className="min-h-12 rounded-full border border-white/15 px-6 font-bold text-white">{copy.retake}</button><Link href={localizeHref("/about/how-my-brain-works", locale)} className="inline-flex min-h-12 items-center rounded-full border border-[#b8a5ff]/40 px-6 font-bold text-white">{copy.exploreBrain} →</Link></div></section>
    <ResultFeedback formToken={formToken} locale={locale} product="personal-advantage" />
  </div>{shareOpen ? <PersonalAdvantageShareDialog copy={copy} map={map} onClose={onShareClose} /> : null}</article>;
}

function ResultNavigation({ copy }: { copy: ReturnType<typeof getPersonalAdvantageUiCopy> }) { const links = [["advantage-overview", "Overview"], ["advantage-stack", copy.stack], ["advantage-evidence", copy.evidence], ["advantage-environment", "Environment"], ["advantage-tradeoffs", "Trade-offs"], ["advantage-playbook", copy.playbook], ["advantage-onepager", copy.onePager]]; return <nav aria-label="Advantage Map" className="sticky top-20 z-20 -mx-5 overflow-x-auto border-b border-white/10 bg-[#04111b]/92 px-5 backdrop-blur-xl sm:-mx-8 sm:px-8"><ul className="mx-auto flex min-w-max max-w-[90rem] gap-1 py-2">{links.map(([id, label]) => <li key={id}><a href={`#${id}`} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white">{label}</a></li>)}</ul></nav>; }
function PortfolioCard({ candidate, copy }: { candidate: AdvantageCandidate; copy: ReturnType<typeof getPersonalAdvantageUiCopy> }) { return <article className="rounded-[1.5rem] border border-white/10 p-6"><p className="font-mono text-xs uppercase tracking-[.18em] text-[#b8a5ff]">{copy.confidence[candidate.confidence]}</p><h3 className="mt-4 text-3xl font-black text-white">{candidate.label}</h3><p className="mt-3 font-mono text-xs text-slate-500">{candidate.signalIds.map((id) => advantageSignalById.get(id)?.label ?? id).join(" × ")}</p><p className="mt-5 leading-7 text-slate-300">{candidate.synthesis}</p></article>; }
function ResultPanel({ accent, body, eyebrow }: { accent: string; body: string; eyebrow: string }) { return <article className="rounded-[1.5rem] border border-white/10 p-6" style={{ borderTopColor: accent, borderTopWidth: 2 }}><p className="font-mono text-xs uppercase tracking-[.18em]" style={{ color: accent }}>{eyebrow}</p><p className="mt-5 leading-7 text-slate-300">{body}</p></article>; }
function PlaybookList({ items, title }: { items: readonly string[]; title: string }) { return <section><h3 className="text-2xl font-black text-white">{title}</h3><ul className="mt-5 space-y-3">{items.map((item) => <li key={item} className="border-l border-[#77e5b5]/50 pl-5 leading-7 text-slate-300">{item}</li>)}</ul></section>; }
function OnePager({ copy, map, onShare }: { copy: ReturnType<typeof getPersonalAdvantageUiCopy>; map: PersonalAdvantageMap; onShare: () => void }) { const hidden = map.hiddenAdvantages[0]; return <section className="mx-auto max-w-5xl rounded-[2rem] border border-[#77e5b5]/25 bg-[linear-gradient(145deg,#071824,#0b1c27)] p-7 shadow-2xl sm:p-12"><header className="flex flex-wrap justify-between gap-4 border-b border-white/15 pb-6"><p className="font-mono text-xs font-black uppercase tracking-[.22em] text-[#77e5b5]">{copy.onePager}</p><p className="font-mono text-xs text-slate-500">bts.online</p></header><div className="py-10"><p className="font-mono text-xs uppercase tracking-[.18em] text-slate-500">{copy.myAdvantage}</p><h2 className="mt-4 text-5xl font-black leading-none text-white sm:text-7xl">{map.coreAdvantage.label}</h2><p className="mt-5 font-mono text-xs leading-6 text-[#b8a5ff]">{map.stack.filter(({ role }) => role === "core").map(({ label }) => label).join(" × ")}</p><p className="mt-7 max-w-4xl text-xl font-bold leading-8 text-slate-200">{map.coreAdvantage.synthesis}</p></div><div className="grid gap-6 border-y border-white/10 py-8 md:grid-cols-2"><PlaybookList title={copy.putMeHere} items={map.amplifierEnvironments.slice(0, 4)} />{hidden ? <PlaybookList title={copy.myHiddenEdge} items={[hidden.label, hidden.explanation]} /> : <PlaybookList title={copy.counterweight} items={map.counterweights} />}<PlaybookList title={copy.watchFor} items={map.shadows} /><PlaybookList title={copy.remember} items={[map.reminder]} /></div><button onClick={() => { emitPersonalAdvantageEvent("advantage_onepager_opened"); onShare(); }} className="mt-8 min-h-12 rounded-full bg-[#77e5b5] px-7 font-black text-[#041018]">{copy.share} →</button></section>; }
