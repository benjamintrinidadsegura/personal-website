"use client";

import { useEffect, useRef } from "react";

import { useRelationshipPrintMode } from "@/components/life-alignment/relationship/relationship-print-mode";
import { relationshipUi } from "@/data/i18n/life-alignment-relationship-ui";
import { teamInsightText } from "@/data/i18n/life-alignment-team-insights";
import { getRelationshipModule, relationshipText } from "@/data/life-alignment-relationship";
import type { Locale } from "@/lib/i18n/config";
import type { TeamAnswerEvidence, TeamSoloInsights } from "@/types/life-alignment-team-insights";

const moduleDefinition = getRelationshipModule("team");

function Evidence({ items, locale }: { items: readonly TeamAnswerEvidence[]; locale: Locale }) {
  return <ul className="mt-4 space-y-5 text-sm leading-6 text-slate-300 print:text-[#17212b]">{items.map(item => {
    const question = moduleDefinition.questions.find(q => q.id === item.questionId)!;
    const direction = item.value === 3 ? teamInsightText("midpoint", locale) : relationshipText(item.value < 3 ? question.leftLabel : question.rightLabel, locale);
    return <li key={item.questionId}><p>{relationshipText(question.prompt, locale)}</p><p className="mt-1 text-white print:text-[#17212b]">{item.value}/5 · {direction}</p><p>{relationshipUi(locale, "importance")}: {relationshipUi(locale, item.importance)}</p></li>;
  })}</ul>;
}

function TeamContent({ result, locale, print = false }: { result: TeamSoloInsights; locale: Locale; print?: boolean }) {
  const [first, ...rest] = result.insights;
  const text = (key: Parameters<typeof teamInsightText>[0]) => teamInsightText(key, locale);
  const missingRequired = moduleDefinition.questions.filter(q => !q.optional && result.missingQuestionIds.includes(q.id));
  return <>
    {!result.complete ? <p className="mt-8 border-l-2 border-sky-200 pl-5 leading-7 text-sky-100 print:text-[#17212b]">{text("partial")}</p> : null}
    {first ? <section className="mt-10" aria-labelledby={print ? undefined : "team-current-picture"}>
      <h2 id={print ? undefined : "team-current-picture"} className="max-w-3xl text-3xl font-bold leading-tight text-white print:text-[#17212b] sm:text-4xl">{first.title}</h2>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200 print:text-[#17212b]">{first.meaning}</p>
      {first.tension ? <p className="mt-4 text-sm text-sky-200 print:text-[#17212b]">{text("friction")}</p> : null}
    </section> : <p className="mt-10 max-w-3xl text-lg leading-8 text-slate-200 print:text-[#17212b]">{text("limited")}</p>}
    {rest.length ? <section className="mt-10 border-t border-white/15 pt-8"><h2 className="text-xl font-bold text-sky-200 print:text-[#17212b]">{text("more")}</h2><div className="mt-6 space-y-8">{rest.map(item => <div key={item.id}><h3 className="text-2xl font-bold leading-snug text-white print:text-[#17212b]">{item.title}</h3><p className="mt-3 max-w-3xl leading-7 text-slate-200 print:text-[#17212b]">{item.meaning}</p>{item.tension ? <p className="mt-3 text-sm text-sky-200 print:text-[#17212b]">{text("friction")}</p> : null}</div>)}</div></section> : null}
    {result.insights.length ? <>
      <section className="mt-10 border-t border-white/15 pt-8"><h2 className="text-xl font-bold text-sky-200 print:text-[#17212b]">{text("action")}</h2><ol className="mt-5 list-decimal space-y-5 pl-5 text-slate-200 print:text-[#17212b]">{result.insights.map(item => <li key={item.id} className="pl-2 leading-7">{item.experiment}</li>)}</ol></section>
      <section className="mt-10"><h2 className="text-xl font-bold text-sky-200 print:text-[#17212b]">{text("talk")}</h2><ul className="mt-5 space-y-4">{result.insights.map(item => <li key={item.id} className="border-l-2 border-sky-200/60 pl-5 text-lg leading-8 text-white print:text-[#17212b]">{item.conversation}</li>)}</ul></section>
    </> : null}
    <section className="mt-10 border-t border-white/15 pt-8"><h2 className="text-xl font-bold text-sky-200 print:text-[#17212b]">{text("open")}</h2><div className="mt-5 space-y-4 leading-7 text-slate-300 print:text-[#17212b]">
      <p>{text("scope")}</p>
      {result.midpointQuestionIds.length ? <p>{text("midpoints")}</p> : null}
      {result.answeredScenarios < moduleDefinition.questions.filter(q => q.kind === "scenario").length ? <p>{text("pressureMissing")}</p> : null}
      {result.unmatchedQuestionIds.length ? <p>{text("uncovered")}</p> : null}
      {missingRequired.length ? <div><h3 className="font-bold text-white print:text-[#17212b]">{text("missing")}</h3><ul className="mt-2 list-disc space-y-2 pl-5">{missingRequired.map(q => <li key={q.id}>{relationshipText(q.prompt, locale)}</li>)}</ul></div> : null}
    </div></section>
    {result.insights.length ? <details open={print || undefined} className="mt-10 border-t border-white/15 pt-6"><summary className="cursor-pointer rounded-lg py-3 font-bold text-sky-100 print:text-[#17212b] outline-offset-4 focus-visible:outline-2 focus-visible:outline-sky-200">{text("evidence")}</summary><div className="mt-2 space-y-8">{result.insights.map(item => <section key={item.id}><h3 className="text-lg font-bold text-white print:text-[#17212b]">{item.title}</h3><Evidence items={item.evidence} locale={locale}/></section>)}</div></details> : null}
  </>;
}

export function TeamSoloResultView({ result, locale }: { result: TeamSoloInsights; locale: Locale }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useRelationshipPrintMode();
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  return <article data-fyns-result-page className="section-lines px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-3xl" data-fyns-result-page-content>
    <header className="border-b border-white/15 pb-8"><p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-sky-200 print:text-[#17212b]">{relationshipText(moduleDefinition.title, locale)} · Solo</p><h1 ref={heading} tabIndex={-1} className="mt-5 text-4xl font-black leading-tight text-white print:text-[#17212b] outline-offset-8 focus-visible:outline-2 focus-visible:outline-sky-200 sm:text-6xl">{teamInsightText("current", locale)}</h1><p className="mt-5 text-sm text-slate-300 print:text-[#17212b]">{result.answeredRequired}/{result.required} {teamInsightText("count", locale)}</p></header>
    <TeamContent result={result} locale={locale}/>
    <button type="button" onClick={() => window.print()} className="mt-10 min-h-12 rounded-full bg-sky-200 px-6 font-bold text-[#061824] outline-offset-4 focus-visible:outline-2 focus-visible:outline-sky-200">{relationshipUi(locale, "print")}</button>
    <section aria-hidden="true" className="fyns-print-document" data-fyns-print-document="life-alignment-relationship-solo"><header className="fyns-print-header"><p className="fyns-print-brand">Life Alignment · {relationshipText(moduleDefinition.title, locale)} · Solo</p><h1>{teamInsightText("current", locale)}</h1></header><TeamContent result={result} locale={locale} print/></section>
  </div></article>;
}
