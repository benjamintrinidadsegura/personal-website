"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
import { PersonalAlignmentResultQuote } from "@/components/quotes/result-quotes";
import { buildPersonalAlignmentResult } from "@/lib/life-alignment-personal";
import { appendPersonalRound, comparePersonalRounds, personalLongitudinalInsights } from "@/lib/life-alignment-longitudinal";
import type { PersonalAlignmentAnswer, PersonalAlignmentAnswerSet, PersonalModuleDefinition, PersonalRoundSnapshot } from "@/types/life-alignment-personal";

const HISTORY_KEY = "bts.life-alignment.personal-history.v1";
const values = [1, 2, 3, 4, 5] as const;

function readHistory(moduleId: PersonalModuleDefinition["id"]): PersonalRoundSnapshot[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PersonalRoundSnapshot => Boolean(item && typeof item === "object" && (item as PersonalRoundSnapshot).moduleId === moduleId && Number.isInteger((item as PersonalRoundSnapshot).roundNumber))).slice(-20);
  } catch { return []; }
}

export function PersonalAlignmentJourney({ definition }: { definition: PersonalModuleDefinition }) {
  const locale = useLocale();
  const localizeHref = useLocalizedHref();
  const [phase, setPhaseState] = useState<"intro" | "questions" | "result">("intro");
  const [answers, setAnswers] = useState<Record<string, PersonalAlignmentAnswer>>({});
  const [history, setHistory] = useState<PersonalRoundSnapshot[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const persistedResult = useRef<string | null>(null);
  const result = useMemo(() => buildPersonalAlignmentResult(definition, answers as PersonalAlignmentAnswerSet, locale), [answers, definition, locale]);

  const text = locale === "de" ? {
    privacy: "Nur in diesem Browser gespeichert. Keine KI, keine Bewertung deiner Karriere.", start: "Momentaufnahme beginnen", current: "Wie stimmig ist das heute?", importance: "Wie wichtig ist dir das?", finish: "Ergebnis ansehen", missing: "Bitte beantworte beide Skalen in jedem Thema.", strong: "Tragende Signale", tensions: "Spannungen mit hoher Bedeutung", explore: "Bereiche zum Erkunden", next: "Nächste Reflexion", timeline: "Alignment Timeline", noComparison: "Eine Momentaufnahme. Veränderungen werden erst ab Runde 2 beschrieben.", newRound: "Neue Runde beginnen", stable: "stabil", more: "mehr ausgerichtet", less: "weniger ausgerichtet", priority: "Priorität verändert", historyPrivacy: "Die Timeline enthält nur abgeleitete Signale, keine öffentliche Freigabe und keine Analytics-Payloads.",
  } : {
    privacy: "Stored only in this browser. No AI and no career rating.", start: "Begin snapshot", current: "How aligned is this today?", importance: "How important is this to you?", finish: "View result", missing: "Please answer both scales for every theme.", strong: "Strong signals", tensions: "High-importance tensions", explore: "Areas worth exploring", next: "Next reflection", timeline: "Alignment Timeline", noComparison: "One snapshot. Change is described only from round 2 onward.", newRound: "Start a new round", stable: "stable", more: "more aligned", less: "less aligned", priority: "changed priority", historyPrivacy: "The timeline contains derived signals only, with no public sharing or analytics payloads.",
  };
  const finishRound = () => {
    if (!result) { setMessage(text.missing); return; }
    const next = appendPersonalRound(readHistory(definition.id), definition.id, result).slice(-20);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
    setPhaseState("result");
  };
  const setPhase = (next: "intro" | "questions" | "result") => {
    if (next === "result") { finishRound(); return; }
    if (next === "questions" && phase === "intro") setHistory(readHistory(definition.id));
    setPhaseState(next);
  };

  if (phase === "intro") return <article className="section-lines min-h-screen px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-6xl"><Link href={localizeHref("/life-alignment")} className="font-mono text-xs text-slate-400">Life Alignment / {definition.title[locale]}</Link><header className="grid min-h-[60svh] items-center gap-10 border-b border-white/15 py-16 lg:grid-cols-[1.1fr_0.9fr]"><div><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#9dd9c5]">Life Alignment · Personal V1</p><h1 className="mt-6 text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] text-white">{definition.title[locale]}</h1><p className="mt-7 max-w-3xl text-xl leading-8 text-slate-300">{definition.description[locale]}</p><button type="button" onClick={() => setPhase("questions")} className="mt-9 min-h-14 rounded-full bg-[#9dd9c5] px-7 font-black text-[#06131c]">{text.start} →</button></div><aside className="border-l-2 border-[#9dd9c5] pl-7"><h2 className="text-2xl font-black text-white">{text.privacy}</h2><p className="mt-5 leading-7 text-slate-400">{history.length ? `${history.length} ${text.timeline}` : text.noComparison}</p></aside></header></div></article>;

  if (phase === "questions") {
    const complete = definition.dimensions.every(({ id }) => answers[id]);
    return <article className="section-lines min-h-screen px-5 pb-32 pt-28 sm:px-8"><div className="mx-auto max-w-5xl"><h1 className="text-4xl font-black text-white sm:text-6xl">{definition.title[locale]}</h1><div className="mt-10 grid gap-6">{definition.dimensions.map((dimension) => <fieldset key={dimension.id} className="rounded-3xl border border-white/10 p-5 sm:p-7"><legend className="px-2 text-2xl font-black text-white">{dimension.title[locale]}</legend><p className="mt-3 leading-7 text-slate-300">{dimension.prompt[locale]}</p><Scale label={text.current} selected={answers[dimension.id]?.current} onSelect={(current) => setAnswers((state) => ({ ...state, [dimension.id]: { current, importance: state[dimension.id]?.importance ?? 3 } }))}/><Scale label={text.importance} selected={answers[dimension.id]?.importance} onSelect={(importance) => setAnswers((state) => ({ ...state, [dimension.id]: { current: state[dimension.id]?.current ?? 3, importance } }))}/><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{dimension.lowLabel[locale]}</span><span>{dimension.highLabel[locale]}</span></div></fieldset>)}</div>{message ? <p role="alert" className="mt-6 text-[#ffd5a1]">{message}</p> : null}<button type="button" onClick={() => complete ? setPhase("result") : setMessage(text.missing)} className="mt-9 min-h-14 rounded-full bg-[#9dd9c5] px-7 font-black text-[#06131c]">{text.finish} →</button></div></article>;
  }

  if (!result) return null;
  const latest = history.at(-1);
  const previous = history.at(-2);
  const changes = previous && latest ? comparePersonalRounds(previous, latest) : [];
  const insights = personalLongitudinalInsights(history);
  const group = (title: string, items: typeof result.dimensions) => <section className="py-10"><h2 className="text-3xl font-black text-white">{title}</h2>{items.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{items.map((item) => <div key={item.dimensionId} className="rounded-2xl border border-white/10 p-5"><h3 className="font-black text-white">{item.title}</h3><p className="mt-2 text-sm text-slate-400">{text.current}: {item.current}/5 · {text.importance}: {item.importance}/5</p></div>)}</div> : <p className="mt-4 text-slate-400">—</p>}</section>;
  return <article className="section-lines min-h-screen px-5 pb-24 pt-28 sm:px-8"><div className="mx-auto max-w-6xl"><header className="border-b border-white/15 py-12"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#9dd9c5]">{text.timeline} · {history.length}</p><h1 className="mt-5 text-5xl font-black text-white sm:text-7xl">{definition.title[locale]}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{definition.description[locale]}</p></header>{group(text.strong, result.strongSignals)}{group(text.tensions, result.tensions)}{group(text.explore, result.worthExploring)}<section className="border-y border-white/15 py-10"><h2 className="text-3xl font-black text-white">{text.next}</h2><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{result.nextReflection}</p></section><section className="py-12"><h2 className="text-3xl font-black text-white">{text.timeline}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{text.historyPrivacy}</p><ol className="mt-7 grid gap-4">{history.map((round) => <li key={round.id} className="rounded-2xl border border-white/10 p-5"><strong className="text-white">Round {round.roundNumber}</strong><span className="ml-3 text-sm text-slate-400">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(round.completedAt))}</span>{round.roundNumber === latest?.roundNumber && changes.length ? <ul className="mt-3 flex flex-wrap gap-2">{changes.slice(0, 5).map((change) => <li key={change.dimensionId} className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">{change.dimensionId}: {change.kind === "more-aligned" ? text.more : change.kind === "less-aligned" ? text.less : change.kind === "changed-priority" ? text.priority : text.stable}</li>)}</ul> : null}</li>)}</ol>{history.length < 2 ? <p className="mt-5 text-slate-400">{text.noComparison}</p> : null}{insights.length ? <p className="mt-5 text-sm text-[#9dd9c5]">{insights.length} deterministic longitudinal signal{insights.length === 1 ? "" : "s"}</p> : null}</section><button type="button" onClick={() => { persistedResult.current = null; setAnswers({}); setMessage(null); setPhase("questions"); }} className="min-h-12 rounded-full bg-[#9dd9c5] px-6 font-black text-[#06131c]">{text.newRound}</button><div className="mt-12"><PersonalAlignmentResultQuote result={result}/></div></div></article>;
}

function Scale({ label, selected, onSelect }: { label: string; selected?: 1 | 2 | 3 | 4 | 5; onSelect: (value: 1 | 2 | 3 | 4 | 5) => void }) {
  return <div className="mt-6"><p className="text-sm font-black text-slate-300">{label}</p><div className="mt-2 grid grid-cols-5 gap-2">{values.map((value) => <button key={value} type="button" aria-pressed={selected === value} onClick={() => onSelect(value)} className={`min-h-12 rounded-xl border font-black ${selected === value ? "border-[#9dd9c5] bg-[#9dd9c5]/15 text-white" : "border-white/15 text-slate-400"}`}>{value}</button>)}</div></div>;
}
