"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { saveRelationshipAnswersAction, createRelationshipSessionAction, type RelationshipActionResult } from "@/app/life-alignment/actions";
import { buildSoloRelationshipResultAction } from "@/app/life-alignment/solo-actions";
import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
import { useRelationshipPrintMode } from "@/components/life-alignment/relationship/relationship-print-mode";
import { relationshipUi } from "@/data/i18n/life-alignment-relationship-ui";
import { relationshipText } from "@/data/life-alignment-relationship";
import type { RelationshipAnswer, RelationshipModuleDefinition, RelationshipSoloResult } from "@/types/life-alignment-relationship";

type Mode = "entry" | "solo" | "session" | "waiting" | "result";
const idleResult: RelationshipActionResult = { ok: false, code: "INVALID_REQUEST" };

export function RelationshipModuleJourney({ module, authenticated }: { module: RelationshipModuleDefinition; authenticated: boolean }) {
  const locale = useLocale();
  const localizeHref = useLocalizedHref();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("entry");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Partial<RelationshipAnswer>>>({});
  const [soloResult, setSoloResult] = useState<RelationshipSoloResult | null>(null);
  const [session, setSession] = useState<{ sessionId: string; invitePath: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const currentSection = module.sections[sectionIndex]!;
  const questions = useMemo(() => module.questions.filter(({ sectionId }) => sectionId === currentSection?.id), [currentSection?.id, module.questions]);

  function setAnswer(questionId: string, patch: Partial<RelationshipAnswer>) {
    setAnswers((current) => ({ ...current, [questionId]: { ...current[questionId], ...patch } }));
  }

  function serializedAnswers(): string {
    return JSON.stringify(Object.fromEntries(Object.entries(answers).filter(([, answer]) => answer.value && answer.importance)));
  }

  function sectionComplete(): boolean {
    return questions.every((question) => question.optional || Boolean(answers[question.id]?.value && answers[question.id]?.importance));
  }

  async function persistSessionAnswers(complete: boolean) {
    if (!session) return idleResult;
    const formData = new FormData();
    formData.set("sessionId", session.sessionId);
    formData.set("moduleId", module.id);
    formData.set("answers", serializedAnswers());
    formData.set("complete", complete ? "yes" : "no");
    return saveRelationshipAnswersAction(idleResult, formData);
  }

  function next() {
    if (!sectionComplete()) { setMessage(relationshipUi(locale, "answerRequired")); return; }
    setMessage(null);
    const final = sectionIndex === module.sections.length - 1;
    startTransition(async () => {
      if (mode === "session" && session) {
        const saved = await persistSessionAnswers(final);
        if (!saved.ok) { setMessage(relationshipUi(locale, "saveFailed")); return; }
        if (final) { setMode("waiting"); router.push(localizeHref(`/life-alignment/session/${session.sessionId}`)); return; }
        setMessage(relationshipUi(locale, "saved"));
      }
      if (final && mode === "solo") {
        const result = await buildSoloRelationshipResultAction(module.id, serializedAnswers());
        if (!result) { setMessage(relationshipUi(locale, "answerRequired")); return; }
        setSoloResult(result); setMode("result"); return;
      }
      setSectionIndex((index) => Math.min(index + 1, module.sections.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function createSession() {
    startTransition(async () => {
      const created = await createRelationshipSessionAction(module.id);
      if (!created.ok) { setMessage(created.code === "AUTH_REQUIRED" ? relationshipUi(locale, "accountRequired") : relationshipUi(locale, "sessionUnavailable")); return; }
      if (!created.sessionId || !created.invitePath) { setMessage(relationshipUi(locale, "sessionUnavailable")); return; }
      setSession({ sessionId: created.sessionId, invitePath: created.invitePath }); setMode("session"); setMessage(null);
    });
  }

  if (mode === "result" && soloResult) return <SoloResultView module={module} result={soloResult}/>;
  if (mode === "waiting" && session) return <article className="section-lines min-h-screen px-5 pb-24 pt-32 sm:px-8"><div className="mx-auto max-w-3xl rounded-[2rem] border border-[#74d8c8]/35 bg-[#061824] p-8 sm:p-12"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#74d8c8]">{relationshipUi(locale, "independentFirst")} → {relationshipUi(locale, "sharedAfterwards")}</p><h1 className="mt-6 text-4xl font-black text-white sm:text-6xl">{relationshipUi(locale, "waitingTitle")}</h1><p className="mt-6 text-lg leading-8 text-slate-300">{relationshipUi(locale, "waitingBody")}</p><Link href={localizeHref(`/life-alignment/session/${session.sessionId}`)} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#74d8c8] px-6 font-black text-[#04151d]">{relationshipUi(locale, "openSession")}</Link></div></article>;
  if (mode === "solo" || mode === "session") return <article className="section-lines min-h-screen px-5 pb-40 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-5xl"><header className="border-b border-white/15 pb-10"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#74d8c8]">{relationshipText(module.title, locale)} · {mode === "solo" ? relationshipUi(locale, "reflectSolo") : relationshipUi(locale, "privateInvite")}</p><h1 className="mt-5 text-4xl font-black text-white sm:text-6xl">{relationshipText(currentSection.title, locale)}</h1><p className="mt-4 max-w-3xl leading-7 text-slate-300">{relationshipText(currentSection.description, locale)}</p><p className="mt-5 font-mono text-xs text-slate-500">{sectionIndex + 1} / {module.sections.length}</p></header>{session ? <InviteBox session={session} copied={copied} onCopy={async () => { await navigator.clipboard.writeText(`${window.location.origin}${localizeHref(session.invitePath)}`); setCopied(true); }}/>: null}<div className="mt-10 grid gap-6">{questions.map((question) => <fieldset key={question.id} className="rounded-[1.5rem] border border-white/10 bg-[#061824]/70 p-5 sm:p-7"><legend className="px-2 text-xl font-black leading-7 text-white">{relationshipText(question.prompt, locale)} {question.optional ? <span className="ml-2 font-mono text-xs text-slate-500">{relationshipUi(locale, "optional")}</span> : null}</legend><div className="mt-6 grid grid-cols-5 gap-2" aria-label={relationshipText(question.prompt, locale)}>{([1,2,3,4,5] as const).map((value) => <label key={value} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border font-black ${answers[question.id]?.value === value ? "border-[#74d8c8] bg-[#74d8c8]/15 text-white" : "border-white/15 text-slate-300"}`}><input className="sr-only" type="radio" name={`${question.id}-value`} checked={answers[question.id]?.value === value} onChange={() => setAnswer(question.id, { value })}/>{value}</label>)}</div><div className="mt-3 flex justify-between gap-4 text-xs leading-5 text-slate-400"><span>{relationshipText(question.leftLabel, locale)}</span><span className="text-right">{relationshipText(question.rightLabel, locale)}</span></div><p className="mt-6 font-mono text-xs font-black uppercase tracking-[0.12em] text-slate-400">{relationshipUi(locale, "importance")}</p><div className="mt-3 flex flex-wrap gap-2">{(["low","medium","high"] as const).map((importance) => <label key={importance} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-bold ${answers[question.id]?.importance === importance ? "border-[#f5b971] bg-[#f5b971]/10 text-white" : "border-white/15 text-slate-300"}`}><input className="sr-only" type="radio" name={`${question.id}-importance`} checked={answers[question.id]?.importance === importance} onChange={() => setAnswer(question.id, { importance })}/>{relationshipUi(locale, importance)}</label>)}</div></fieldset>)}</div>{message ? <p role="alert" className="mt-8 rounded-xl border border-[#f5b971]/30 bg-[#f5b971]/10 p-4 font-bold text-[#ffd5a1]">{message}</p>: null}<nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#04121c]/95 p-4 backdrop-blur"><div className="mx-auto flex max-w-5xl justify-between gap-4"><button type="button" disabled={sectionIndex === 0 || pending} onClick={() => setSectionIndex((index) => Math.max(0, index - 1))} className="min-h-12 rounded-full border border-white/20 px-6 font-bold text-white disabled:opacity-40">{relationshipUi(locale, "back")}</button><button type="button" disabled={pending} onClick={next} className="min-h-12 rounded-full bg-[#74d8c8] px-7 font-black text-[#04151d] disabled:opacity-60">{pending ? relationshipUi(locale, "creating") : sectionIndex === module.sections.length - 1 ? relationshipUi(locale, "finish") : relationshipUi(locale, "continue")}</button></div></nav></div></article>;
  return <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-6xl"><nav aria-label={relationshipUi(locale, "breadcrumb")} className="font-mono text-xs text-slate-400"><Link href={localizeHref("/life-alignment")}>Life Alignment</Link> <span aria-hidden="true">/</span> <span className="text-[#74d8c8]">{relationshipText(module.title, locale)}</span></nav><header className="grid min-h-[58svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.1fr_0.9fr]"><div><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#74d8c8]">Life Alignment · Relationship Engine V1.1</p><h1 className="mt-6 break-words text-[clamp(2.65rem,8vw,7rem)] font-black hyphens-auto leading-[0.9] tracking-[-0.05em] text-white">{relationshipText(module.title, locale)}</h1><p className="mt-7 max-w-3xl text-xl leading-8 text-slate-300">{relationshipText(module.shortDescription, locale)}</p><div className="mt-8 flex flex-wrap gap-3"><span className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300">{relationshipUi(locale, "noScore")}</span><span className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300">{relationshipUi(locale, "noAi")}</span></div></div><aside className="border-l-2 border-[#74d8c8] pl-7"><p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#74d8c8]">{relationshipUi(locale, "independentFirst")}</p><p className="mt-4 text-2xl font-black text-white">→ {relationshipUi(locale, "sharedAfterwards")}</p><p className="mt-5 leading-7 text-slate-400">{relationshipUi(locale, "privacyBoundary")}</p></aside></header><section className="grid gap-6 py-16 lg:grid-cols-2"><ModeCard title={relationshipUi(locale, "reflectSolo")} body={relationshipUi(locale, "soloDescription")} action={relationshipUi(locale, "begin")} onClick={() => { setMode("solo"); setSectionIndex(0); }}/><div className="rounded-[1.75rem] border border-[#74d8c8]/25 bg-[#74d8c8]/[0.05] p-7 sm:p-9"><p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#74d8c8]">{relationshipUi(locale, "privateInvite")}</p><h2 className="mt-5 text-3xl font-black text-white">{relationshipUi(locale, "inviteSomeone")}</h2><p className="mt-4 leading-7 text-slate-300">{relationshipUi(locale, "inviteDescription")}</p>{authenticated ? <button type="button" disabled={pending} onClick={createSession} className="mt-8 min-h-12 rounded-full bg-[#74d8c8] px-6 font-black text-[#04151d] disabled:opacity-60">{pending ? relationshipUi(locale, "creating") : relationshipUi(locale, "createInvite")}</button> : <><p className="mt-6 text-sm leading-6 text-slate-400">{relationshipUi(locale, "accountRequired")}</p><Link href={localizeHref("/account/login")} className="mt-5 inline-flex min-h-12 items-center rounded-full border border-[#74d8c8]/50 px-6 font-black text-[#74d8c8]">{relationshipUi(locale, "signIn")}</Link></>}{message ? <p role="alert" className="mt-5 text-sm font-bold text-[#ffd5a1]">{message}</p>: null}</div></section>{module.id === "partner" ? <Link href={localizeHref("/life-alignment/partner/shared-device")} className="inline-flex min-h-11 items-center font-mono text-xs font-black uppercase tracking-[0.14em] text-slate-400 hover:text-white">{relationshipUi(locale, "sharedDevice")} →</Link>: null}</div></article>;
}

function ModeCard({ title, body, action, onClick }: { title: string; body: string; action: string; onClick: () => void }) { return <div className="rounded-[1.75rem] border border-[#f5b971]/25 bg-[#f5b971]/[0.04] p-7 sm:p-9"><p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#f5b971]">Solo</p><h2 className="mt-5 text-3xl font-black text-white">{title}</h2><p className="mt-4 leading-7 text-slate-300">{body}</p><button type="button" onClick={onClick} className="mt-8 min-h-12 rounded-full bg-[#f5b971] px-6 font-black text-[#07131d]">{action}</button></div>; }
function InviteBox({ session, copied, onCopy }: { session: { sessionId: string; invitePath: string }; copied: boolean; onCopy: () => void }) { const locale=useLocale(); const localizeHref=useLocalizedHref(); return <aside className="mt-8 rounded-2xl border border-[#74d8c8]/35 bg-[#74d8c8]/[0.06] p-5"><p className="font-black text-white">{relationshipUi(locale,"privateInvite")} · {relationshipUi(locale,"validSevenDays")}</p><p className="mt-2 text-sm leading-6 text-slate-300">{relationshipUi(locale,"answersPrivate")} {relationshipUi(locale,"sharedAfterBoth")}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={onCopy} className="min-h-11 rounded-full bg-[#74d8c8] px-5 font-black text-[#04151d]">{copied ? relationshipUi(locale,"copied") : relationshipUi(locale,"copyInvite")}</button><Link href={localizeHref(`/life-alignment/session/${session.sessionId}`)} className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 font-bold text-white">{relationshipUi(locale,"openSession")}</Link></div></aside>; }
function SoloResultView({ module, result }: { module: RelationshipModuleDefinition; result: RelationshipSoloResult }) { const locale=useLocale(); useRelationshipPrintMode(); return <article data-fyns-result-page className="section-lines px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-5xl" data-fyns-result-page-content><header className="border-b border-white/15 pb-12"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#f5b971]">{relationshipText(module.title,locale)} · Solo</p><h1 className="mt-6 text-5xl font-black text-white sm:text-7xl">{relationshipUi(locale,"resultTitle")}</h1><p className="mt-6 max-w-3xl leading-7 text-slate-300">{relationshipUi(locale,"soloDescription")} {relationshipUi(locale,"noScore")}</p></header><div className="mt-10 grid gap-5">{result.reflections.map((reflection)=><section key={reflection.id} className="rounded-2xl border border-white/10 p-6"><p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#f5b971]">{reflection.priority}</p><h2 className="mt-3 text-2xl font-black text-white">{reflection.title}</h2><p className="mt-4 leading-7 text-slate-300">{reflection.expectation}</p><h3 className="mt-5 font-black text-white">{relationshipUi(locale,"talkAboutThis")}</h3><p className="mt-2 leading-7 text-slate-400">{reflection.clarify}</p><h3 className="mt-5 font-black text-white">{relationshipUi(locale,"tryThis")}</h3><p className="mt-2 leading-7 text-slate-400">{reflection.tryThis}</p></section>)}</div><button type="button" onClick={()=>window.print()} className="mt-10 min-h-12 rounded-full bg-[#f5b971] px-6 font-black text-[#07131d]">{relationshipUi(locale,"print")}</button><section aria-hidden="true" className="fyns-print-document" data-fyns-print-document="life-alignment-relationship-solo"><header className="fyns-print-header"><p className="fyns-print-brand">Life Alignment · {relationshipText(module.title,locale)} · Solo</p><h1>{relationshipUi(locale,"resultTitle")}</h1></header>{result.reflections.map((reflection)=><section key={reflection.id} className="fyns-print-section"><h2>{reflection.title}</h2><p>{reflection.expectation}</p><p><strong>{relationshipUi(locale,"talkAboutThis")}:</strong> {reflection.clarify}</p><p><strong>{relationshipUi(locale,"tryThis")}:</strong> {reflection.tryThis}</p></section>)}</section></div></article>; }
