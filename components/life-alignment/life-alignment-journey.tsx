"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef } from "react";
import type { ReactNode } from "react";

import {
  authoritySourceOptions,
  capacityEffectOptions,
  currentEmphasisOptions,
  desiredDirectionOptions,
  entanglementOptions,
  experimentOptions,
  lifeAlignment,
  lifeAlignmentSections,
  lifeAreas,
  lifeConstraintOptions,
  tradeoffOptions,
} from "@/data/life-alignment";
import { buildLifeAlignmentClipboardSummary, LIFE_ALIGNMENT_DISCLAIMER } from "@/lib/life-alignment-export";
import {
  buildLifeAlignmentResult,
  formatLifeAlignmentSelectionCount,
  getLifeAreaTitle,
  initialLifeAlignmentState,
  lifeAlignmentReducer,
  normalizeLifeAlignmentText,
  validCustomAreaLabel,
  validFocusIntention,
} from "@/lib/life-alignment";
import type {
  AuthoritySource,
  CapacityEffect,
  CurrentEmphasis,
  DesiredDirection,
  EntanglementStatus,
  ExperimentMode,
  LifeAlignmentAnswers,
  LifeAlignmentResult,
  LifeConstraintId,
  TradeoffStatus,
} from "@/types/life-alignment";

import { HumanContextJourneyDock } from "@/components/human-context/journey-dock";
import { AlignmentLandscape } from "./alignment-landscape";
import { LifeAlignmentContext } from "./life-alignment-context";
import { LifeAlignmentResultActions } from "./life-alignment-result-actions";
import {
  SelfClosingOrientation,
  SelfContextualPaths,
  SelfInsightSynthesis,
  SelfMicroTools,
} from "./self-depth/self-depth-sections";

const ACCENT = "#f5b971";
const currentOrder: readonly CurrentEmphasis[] = ["little", "workable", "a-lot", "unclear"];
const capacityOrder: readonly CapacityEffect[] = ["supportive", "mixed", "draining", "unclear"];
const directionOrder: readonly DesiredDirection[] = ["less", "keep", "more", "different", "uncertain"];
const constraintOrder: readonly LifeConstraintId[] = ["time-attention", "energy-capacity", "care-responsibility", "income-commitment", "location-access", "formal-obligation", "external-dependency", "uncertain", "none"];
const tradeoffOrder: readonly TradeoffStatus[] = ["explore-change", "accepted-now", "currently-fixed", "uncertain"];
const authorityOrder: readonly AuthoritySource[] = ["intrinsic", "social", "inherited", "constraint-driven", "uncertain"];
const entanglementOrder: readonly EntanglementStatus[] = ["current", "historical", "both", "unsure", "not-applicable"];
const experimentOrder: readonly ExperimentMode[] = ["observe", "protect", "conversation", "fact", "reversible", "pause"];

function SelectionCount({ selected, min, max, verb = "ausgewählt" }: { selected: number; min: number; max: number; verb?: "ausgewählt" | "markiert" }) {
  return (
    <span aria-live="polite" aria-atomic="true" className="ml-3 inline-flex min-h-8 shrink-0 items-center rounded-full border border-[#ff9a3d]/40 bg-[#ff9a3d]/[0.065] px-3 py-1 align-middle font-mono text-xs font-bold text-[#ffb36d]">
      {formatLifeAlignmentSelectionCount(selected, min, max, verb)}
    </span>
  );
}

function Choice({ name, value, checked, disabled = false, onChange, title, description }: {
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title: string;
  description?: string;
}) {
  return (
    <label className={`relative block rounded-2xl border p-4 transition ${checked ? "border-[#f5b971] bg-[#f5b971]/10" : "border-white/10 bg-[#071824]/70 hover:border-white/25"} ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}>
      <input className="sr-only" type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} />
      <span className="flex items-start gap-3">
        <span aria-hidden="true" className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${checked ? "border-[5px] border-[#f5b971]" : "border-white/40"}`} />
        <span>
          <span className="block font-black leading-6 text-white">{title}</span>
          {description ? <span className="mt-1 block text-sm leading-6 text-slate-400">{description}</span> : null}
        </span>
      </span>
    </label>
  );
}

function CheckChoice({ checked, disabled = false, onChange, title, description }: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title: string;
  description?: string;
}) {
  return (
    <label className={`relative block rounded-2xl border p-4 transition ${checked ? "border-[#f5b971] bg-[#f5b971]/10" : "border-white/10 bg-[#071824]/70 hover:border-white/25"} ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}>
      <input className="sr-only" type="checkbox" checked={checked} disabled={disabled} onChange={onChange} />
      <span className="flex items-start gap-3">
        <span aria-hidden="true" className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded border ${checked ? "border-[#f5b971] bg-[#f5b971] text-[#07131d]" : "border-white/40"}`}>{checked ? "✓" : ""}</span>
        <span>
          <span className="block font-black leading-6 text-white">{title}</span>
          {description ? <span className="mt-1 block text-sm leading-6 text-slate-400">{description}</span> : null}
        </span>
      </span>
    </label>
  );
}

function SectionIntro({ number, title, description, children }: { number: number; title: string; description: string; children?: ReactNode }) {
  return (
    <header className="border-b border-white/15 pb-10">
      <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#f5b971]">Abschnitt {number} von 5</p>
      <h1 tabIndex={-1} data-life-section-heading className="mt-5 text-4xl font-black tracking-[-0.04em] text-white outline-none sm:text-6xl">{title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{description}</p>
      {children}
    </header>
  );
}

function AreasSection({ answers, dispatch }: { answers: LifeAlignmentAnswers; dispatch: React.Dispatch<Parameters<typeof lifeAlignmentReducer>[1]> }) {
  const selectionFull = answers.selectedAreaIds.length >= 6;
  const priorityFull = answers.priorityAreaIds.length >= 3;
  return (
    <>
      <SectionIntro number={1} title="Was zählt gerade?" description="Wähle vier bis sechs Lebensbereiche für diese Momentaufnahme. Danach markierst du ein bis drei, die im Moment besondere Aufmerksamkeit verdienen." />
      <fieldset className="mt-10">
        <legend className="text-2xl font-black text-white">Lebensbereiche <SelectionCount selected={answers.selectedAreaIds.length} min={4} max={6} /></legend>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {lifeAreas.map((area) => {
            const checked = answers.selectedAreaIds.includes(area.id);
            return <CheckChoice key={area.id} checked={checked} disabled={!checked && selectionFull} onChange={() => dispatch({ type: "toggle-area", areaId: area.id })} title={area.title} description={area.description} />;
          })}
          {(["custom-1", "custom-2"] as const).map((areaId, index) => {
            const checked = answers.selectedAreaIds.includes(areaId);
            const valid = validCustomAreaLabel(answers.customLabels[areaId]);
            return (
              <div key={areaId} className={`rounded-2xl border p-4 ${checked ? "border-[#f5b971] bg-[#f5b971]/10" : "border-white/10 bg-[#071824]/70"}`}>
                <label htmlFor={areaId} className="font-black text-white">Eigener Lebensbereich {index + 1}</label>
                <input id={areaId} value={answers.customLabels[areaId]} maxLength={40} aria-invalid={Boolean(answers.customLabels[areaId]) && !valid} onChange={(event) => dispatch({ type: "set-custom-label", areaId, value: event.target.value })} placeholder="z. B. Spiritualität" className="mt-3 min-h-12 w-full rounded-xl border border-white/15 bg-[#04111b] px-4 text-white placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5b971]" />
                <label className={`mt-3 flex min-h-11 items-center gap-3 text-sm font-bold ${!valid || (!checked && selectionFull) ? "cursor-not-allowed text-slate-600" : "cursor-pointer text-slate-200"}`}>
                  <input type="checkbox" checked={checked} disabled={!valid || (!checked && selectionFull)} onChange={() => dispatch({ type: "toggle-area", areaId })} className="h-5 w-5 accent-[#f5b971]" /> In Momentaufnahme aufnehmen
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="mt-14 border-t border-white/15 pt-10">
        <legend className="text-2xl font-black text-white">Was ist gerade besonders wichtig? <SelectionCount selected={answers.priorityAreaIds.length} min={1} max={3} verb="markiert" /></legend>
        <p className="mt-3 text-slate-400">Wichtig bedeutet nicht automatisch problematisch. Markiere ein bis drei deiner gewählten Bereiche.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {answers.selectedAreaIds.map((areaId) => {
            const checked = answers.priorityAreaIds.includes(areaId);
            return <CheckChoice key={areaId} checked={checked} disabled={!checked && priorityFull} onChange={() => dispatch({ type: "toggle-priority", areaId })} title={getLifeAreaTitle(answers, areaId)} />;
          })}
        </div>
      </fieldset>
    </>
  );
}

function RealitySection({ answers, dispatch }: { answers: LifeAlignmentAnswers; dispatch: React.Dispatch<Parameters<typeof lifeAlignmentReducer>[1]> }) {
  return (
    <>
      <SectionIntro number={2} title="Wie sieht es heute aus?" description="Ordne jeden gewählten Bereich zweimal ein: Wie viel Raum nimmt er ein – und wie wirkt er auf deine verfügbare Kapazität?" />
      <div className="mt-10 grid gap-8">
        {answers.selectedAreaIds.map((areaId, index) => <section key={areaId} aria-labelledby={`reality-${areaId}`} className="rounded-[1.75rem] border border-white/10 bg-[#061521]/65 p-5 sm:p-7">
          <p className="font-mono text-xs text-[#f5b971]">{String(index + 1).padStart(2, "0")}</p>
          <h2 id={`reality-${areaId}`} className="mt-2 text-2xl font-black text-white">{getLifeAreaTitle(answers, areaId)}</h2>
          <fieldset className="mt-7"><legend className="font-black text-slate-200">Wie viel Raum bekommt dieser Bereich aktuell?</legend><div className="mt-4 grid gap-3 sm:grid-cols-2">{currentOrder.map((value) => <Choice key={value} name={`current-${areaId}`} value={value} checked={answers.areas[areaId]?.currentEmphasis === value} onChange={() => dispatch({ type: "set-area-answer", areaId, field: "currentEmphasis", value })} title={currentEmphasisOptions[value].label} description={currentEmphasisOptions[value].description} />)}</div></fieldset>
          <fieldset className="mt-8 border-t border-white/10 pt-7"><legend className="font-black text-slate-200">Wie wirkt dieser Bereich heute auf deine Kapazität?</legend><div className="mt-4 grid gap-3 sm:grid-cols-2">{capacityOrder.map((value) => <Choice key={value} name={`capacity-${areaId}`} value={value} checked={answers.areas[areaId]?.capacityEffect === value} onChange={() => dispatch({ type: "set-area-answer", areaId, field: "capacityEffect", value })} title={capacityEffectOptions[value].label} description={capacityEffectOptions[value].description} />)}</div></fieldset>
        </section>)}
      </div>
    </>
  );
}

function DirectionSection({ answers, dispatch }: { answers: LifeAlignmentAnswers; dispatch: React.Dispatch<Parameters<typeof lifeAlignmentReducer>[1]> }) {
  return (
    <>
      <SectionIntro number={3} title="Was darf sich verändern?" description="Eine Richtung kann mehr, weniger, ähnlich oder einfach anders bedeuten. Unsicherheit ist ebenfalls eine vollständige Antwort." />
      <div className="mt-10 grid gap-7">
        {answers.selectedAreaIds.map((areaId) => <fieldset key={areaId} className="rounded-[1.75rem] border border-white/10 bg-[#061521]/65 p-5 sm:p-7"><legend className="px-2 text-2xl font-black text-white">{getLifeAreaTitle(answers, areaId)}</legend><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{directionOrder.map((value) => <Choice key={value} name={`direction-${areaId}`} value={value} checked={answers.areas[areaId]?.desiredDirection === value} onChange={() => dispatch({ type: "set-area-answer", areaId, field: "desiredDirection", value })} title={desiredDirectionOptions[value].label} description={desiredDirectionOptions[value].description} />)}</div></fieldset>)}
      </div>
    </>
  );
}

function ContextSection({ answers, dispatch }: { answers: LifeAlignmentAnswers; dispatch: React.Dispatch<Parameters<typeof lifeAlignmentReducer>[1]> }) {
  const full = answers.constraints.length >= 3;
  return (
    <>
      <SectionIntro number={4} title="Was begrenzt oder trägt?" description="Wähle bis zu drei reale Bedingungen, die deinen heutigen Spielraum am stärksten prägen. Das ist Kontext, keine Ausrede und keine Bewertung." />
      <fieldset className="mt-10"><legend className="text-2xl font-black text-white">Gegenwärtige Bedingungen <SelectionCount selected={answers.constraints.length} min={1} max={3} /></legend><div className="mt-5 grid gap-3 sm:grid-cols-2">{constraintOrder.map((constraintId) => { const checked = answers.constraints.includes(constraintId); return <CheckChoice key={constraintId} checked={checked} disabled={!checked && (full || (answers.constraints.includes("none") && constraintId !== "none"))} onChange={() => dispatch({ type: "toggle-constraint", constraintId })} title={lifeConstraintOptions[constraintId]} />; })}</div></fieldset>
      <fieldset className="mt-12 border-t border-white/15 pt-10"><legend className="text-2xl font-black text-white">Wie stehst du heute zu einer möglichen Spannung?</legend><div className="mt-5 grid gap-3 sm:grid-cols-2">{tradeoffOrder.map((value) => <Choice key={value} name="tradeoff" value={value} checked={answers.tradeoffStatus === value} onChange={() => dispatch({ type: "set-tradeoff", value })} title={tradeoffOptions[value]} />)}</div></fieldset>
      <aside className="mt-10 border-l-2 border-[#f5b971] pl-6"><h2 className="font-black text-white">Du musst keine Grenze rechtfertigen.</h2><p className="mt-2 max-w-3xl leading-7 text-slate-400">Die spätere Momentaufnahme trennt einen Veränderungswunsch von dem Spielraum, der heute tatsächlich verfügbar ist.</p></aside>
    </>
  );
}

function FocusSection({ answers, dispatch }: { answers: LifeAlignmentAnswers; dispatch: React.Dispatch<Parameters<typeof lifeAlignmentReducer>[1]> }) {
  return (
    <>
      <SectionIntro number={5} title="Was möchtest du erkunden?" description="Wähle einen Fokus, ordne deine eigene Deutung ein und entscheide dich für einen kleinen, freiwilligen nächsten Modus." />
      <fieldset className="mt-10"><legend className="text-2xl font-black text-white">Ein Fokus für diese Momentaufnahme</legend><div className="mt-5 grid gap-3 sm:grid-cols-2">{answers.selectedAreaIds.map((areaId) => <Choice key={areaId} name="focus" value={areaId} checked={answers.focusAreaId === areaId} onChange={() => dispatch({ type: "set-focus", areaId })} title={getLifeAreaTitle(answers, areaId)} description={answers.priorityAreaIds.includes(areaId) ? "Von dir als besonders wichtig markiert." : undefined} />)}</div></fieldset>
      <fieldset className="mt-12 border-t border-white/15 pt-10"><legend className="text-2xl font-black text-white">Woher könnte diese Richtung kommen? <SelectionCount selected={answers.authoritySources.length} min={1} max={2} /></legend><div className="mt-5 grid gap-3 sm:grid-cols-2">{authorityOrder.map((value) => { const checked = answers.authoritySources.includes(value); const disabled = !checked && (answers.authoritySources.length >= 2 || (answers.authoritySources.includes("uncertain") && value !== "uncertain")); return <CheckChoice key={value} checked={checked} disabled={disabled} onChange={() => dispatch({ type: "toggle-authority", value })} title={authoritySourceOptions[value]} />; })}</div></fieldset>
      <fieldset className="mt-12 border-t border-white/15 pt-10"><legend className="text-2xl font-black text-white">Ist die verbundene Annahme oder Grenze noch aktuell?</legend><div className="mt-5 grid gap-3 sm:grid-cols-2">{entanglementOrder.map((value) => <Choice key={value} name="entanglement" value={value} checked={answers.entanglementStatus === value} onChange={() => dispatch({ type: "set-entanglement", value })} title={entanglementOptions[value]} />)}</div></fieldset>
      <div className="mt-12 border-t border-white/15 pt-10"><label htmlFor="focus-intention" className="text-2xl font-black text-white">Was möchtest du schützen oder ermöglichen? <span className="text-base font-normal text-slate-400">(optional)</span></label><p id="focus-intention-help" className="mt-3 text-slate-400">12–240 Zeichen, falls du etwas festhalten möchtest. Diese Notiz bleibt lokal und fehlt bewusst in der Kopier-Kurzfassung.</p><textarea id="focus-intention" aria-describedby="focus-intention-help" aria-invalid={!validFocusIntention(answers.focusIntention)} rows={4} maxLength={240} value={answers.focusIntention} onChange={(event) => dispatch({ type: "set-focus-intention", value: event.target.value })} className="mt-5 w-full rounded-2xl border border-white/15 bg-[#061521] p-4 leading-7 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5b971]" /><p className="mt-2 text-right font-mono text-xs text-slate-500">{Array.from(normalizeLifeAlignmentText(answers.focusIntention)).length}/240</p></div>
      <fieldset className="mt-12 border-t border-white/15 pt-10"><legend className="text-2xl font-black text-white">Welcher kleine nächste Modus passt?</legend><p className="mt-3 text-slate-400">Keiner dieser Schritte ist eine Verpflichtung. „Noch nichts verändern“ ist eine gleichwertige Option.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{experimentOrder.map((value) => <Choice key={value} name="experiment" value={value} checked={answers.experimentMode === value} onChange={() => dispatch({ type: "set-experiment", value })} title={experimentOptions[value].label} description={experimentOptions[value].action} />)}</div></fieldset>
    </>
  );
}

function RestartControls({ pending, onRequest, onCancel, onConfirm }: { pending: boolean; onRequest: () => void; onCancel: () => void; onConfirm: () => void }) {
  if (!pending) return <button type="button" onClick={onRequest} className="min-h-11 rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f5b971]">Neu beginnen</button>;
  return <div role="dialog" aria-labelledby="restart-title" className="rounded-2xl border border-[#f5b971]/40 bg-[#071824] p-5"><p id="restart-title" className="font-black text-white">Alle Angaben dieser Momentaufnahme verwerfen?</p><p className="mt-2 text-sm text-slate-400">Das lässt sich nicht rückgängig machen.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={onCancel} className="min-h-11 rounded-full border border-white/20 px-5 font-bold text-white">Behalten</button><button type="button" onClick={onConfirm} className="min-h-11 rounded-full bg-[#f5b971] px-5 font-black text-[#07131d]">Ja, neu beginnen</button></div></div>;
}

function ResultView({ result, onEdit, restart }: { result: LifeAlignmentResult; onEdit: (sectionIndex: number) => void; restart: ReactNode }) {
  const copyText = buildLifeAlignmentClipboardSummary(result);
  return (
    <article data-fyns-result-page className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[50rem] bg-[radial-gradient(circle_at_78%_10%,rgba(245,185,113,0.15),transparent_28rem)]" />
      <div data-fyns-result-page-content className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><Link href="/" className="font-mono text-xs text-slate-400 hover:text-white">Digital HQ / Life Alignment</Link>{restart}</div>
        <header className="max-w-5xl border-b border-white/15 py-16 sm:py-20">
          <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#f5b971]">Private qualitative Momentaufnahme</p>
          <h1 tabIndex={-1} data-life-result-heading className="mt-6 text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-[-0.055em] text-white outline-none">{result.title}</h1>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-300">{result.description}</p>
          <div className="mt-8 grid gap-4">{result.summary.map((line) => <p key={line} className="border-l-2 border-[#f5b971] pl-5 text-xl font-black leading-8 text-white">{line}</p>)}</div>
        </header>

        <AlignmentLandscape result={result} onEdit={() => onEdit(1)} />

        <SelfInsightSynthesis result={result} />

        <section aria-labelledby="signals-title" className="border-t border-white/15 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">Qualitative Signale</p>
          <h2 id="signals-title" className="mt-4 text-4xl font-black text-white sm:text-5xl">Was in deiner Momentaufnahme sichtbar wird.</h2>
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {result.supportiveAreas.length ? <section className="rounded-[1.5rem] border border-white/10 p-6"><h3 className="text-xl font-black text-white">Was dich derzeit unterstützt</h3><ul className="mt-4 grid gap-2 text-slate-300">{result.supportiveAreas.map((area) => <li key={area.id}>• {area.title}</li>)}</ul></section> : null}
            {result.drainingAreas.length ? <section className="rounded-[1.5rem] border border-white/10 p-6"><h3 className="text-xl font-black text-white">Was derzeit Kapazität kostet</h3><ul className="mt-4 grid gap-2 text-slate-300">{result.drainingAreas.map((area) => <li key={area.id}>• {area.title}</li>)}</ul></section> : null}
            {result.tensionAreas.length ? <section className="rounded-[1.5rem] border border-white/10 p-6"><h3 className="text-xl font-black text-white">Gewünschte Verschiebungen und Spannungsfelder</h3><ul className="mt-4 grid gap-2 text-slate-300">{result.tensionAreas.map((area) => <li key={area.id}>• {area.title}: {area.signalLabel}</li>)}</ul></section> : null}
            {result.uncertainAreas.length ? <section className="rounded-[1.5rem] border border-white/10 p-6"><h3 className="text-xl font-black text-white">Was bewusst offen bleibt</h3><ul className="mt-4 grid gap-2 text-slate-300">{result.uncertainAreas.map((area) => <li key={area.id}>• {area.title}</li>)}</ul></section> : null}
            {result.focus.signal === "accepted" ? <section className="rounded-[1.5rem] border border-white/10 p-6"><h3 className="text-xl font-black text-white">Bewusst akzeptierte Abwägung</h3><p className="mt-4 leading-7 text-slate-300">{result.focus.title}: {result.tradeoffLabel}</p></section> : null}
          </div>
        </section>

        <section aria-labelledby="context-result-title" className="border-y border-white/15 py-16 sm:py-20"><div className="grid gap-10 lg:grid-cols-[0.36fr_1fr]"><div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">Realer Kontext</p><button type="button" onClick={() => onEdit(3)} className="mt-5 min-h-11 rounded-full border border-white/15 px-5 text-sm font-bold text-slate-200">Bedingungen bearbeiten</button></div><div><h2 id="context-result-title" className="text-4xl font-black text-white">Spielraum ist nicht grenzenlos.</h2>{result.constraints.length ? <ul className="mt-7 grid gap-3">{result.constraints.map((item) => <li key={item} className="border-l border-[#f5b971] pl-5 leading-7 text-slate-300">{item}</li>)}</ul> : <p className="mt-6 text-slate-300">Du hast für heute keine konkrete Grenze festgehalten.</p>}</div></div></section>

        <section aria-labelledby="focus-result-title" className="py-16 sm:py-20"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">Dein gewählter Fokus</p><h2 id="focus-result-title" className="mt-4 text-4xl font-black text-white sm:text-5xl">{result.focus.title}</h2></div><button type="button" onClick={() => onEdit(4)} className="min-h-11 self-start rounded-full border border-white/15 px-5 text-sm font-bold text-slate-200">Fokus bearbeiten</button></div><div className="mt-9 grid gap-5 lg:grid-cols-2"><div className="rounded-[1.5rem] border border-white/10 bg-[#061521]/70 p-6"><h3 className="text-lg font-black text-white">Deine heutige Einordnung</h3><p className="mt-4 leading-7 text-slate-300">{result.tradeoffLabel}</p>{result.focusIntention ? <blockquote className="mt-5 border-l-2 border-[#f5b971] pl-5 text-lg font-bold leading-8 text-white">{result.focusIntention}</blockquote> : null}</div><div className="rounded-[1.5rem] border border-white/10 bg-[#061521]/70 p-6"><h3 className="text-lg font-black text-white">Quelle und eigene Deutung</h3><ul className="mt-4 grid gap-2 text-slate-300">{result.authorityLabels.map((item) => <li key={item}>• {item}</li>)}</ul><p className="mt-5 border-t border-white/10 pt-5 leading-7 text-slate-400">{result.entanglementLabel}</p></div></div>{result.highStakesBoundary ? <aside className="mt-7 rounded-2xl border border-[#ffb36d]/30 bg-[#ffb36d]/5 p-5"><h3 className="font-black text-white">Bei weitreichenden Entscheidungen</h3><p className="mt-2 leading-7 text-slate-300">Nutze diese Reflexion nicht allein für medizinische, psychologische, rechtliche, finanzielle oder andere folgenreiche Entscheidungen. Kläre konkrete Risiken und Bedingungen mit passenden Fachpersonen.</p></aside> : null}</section>

        <section aria-labelledby="experiment-title" className="rounded-[2rem] border border-[#f5b971]/35 bg-[#f5b971]/[0.055] p-7 sm:p-10"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">Kleiner nächster Versuch</p><h2 id="experiment-title" className="mt-4 text-3xl font-black text-white sm:text-5xl">{result.experiment.title}</h2><p className="mt-6 max-w-4xl text-lg font-bold leading-8 text-slate-200">{result.experiment.action}</p><div className="mt-7 border-l-2 border-[#f5b971] pl-5"><h3 className="font-black text-white">Beobachtungsfrage</h3><p className="mt-2 leading-7 text-slate-300">{result.experiment.observe}</p></div><p className="mt-7 text-sm leading-7 text-slate-400">{result.experiment.boundary}</p></section>

        <SelfContextualPaths result={result} />
        <SelfMicroTools result={result} />
        <SelfClosingOrientation result={result} />

        <LifeAlignmentResultActions copyText={copyText} />
        <p className="mt-12 max-w-4xl text-sm leading-7 text-slate-500">{LIFE_ALIGNMENT_DISCLAIMER}</p>

        <section className="fyns-print-document" aria-label="Druckfassung der Life-Alignment-Momentaufnahme">
          <header className="fyns-print-header"><p className="fyns-print-brand">Life Alignment · bts.online</p><h1>{result.title}</h1><p className="fyns-print-description">{result.description}</p></header>
          <section className="fyns-print-summary"><h2>Momentaufnahme</h2>{result.summary.map((line) => <p key={line}>{line}</p>)}</section>
          <section className="fyns-print-section"><h2>Alignment Landscape</h2><div className="fyns-print-stack">{result.areas.map((area) => <div key={area.id} className="fyns-print-block"><h3>{area.title}</h3><p>{area.signalLabel}</p><p className="fyns-print-detail">{area.currentLabel}; {area.capacityLabel}; gewünschte Richtung: {area.directionLabel}.</p></div>)}</div></section>
          <section className="fyns-print-section"><h2>Zusammenhänge</h2><div className="fyns-print-stack">{result.insights.map((insight) => <div key={insight.id} className="fyns-print-block"><h3>{insight.title}</h3><p>{insight.explanation}</p><p className="fyns-print-detail"><strong>Im Alltag:</strong> {insight.everydayInterpretation}</p></div>)}</div></section>
          <section className="fyns-print-section"><h2>Fokus: {result.focus.title}</h2><p>{result.tradeoffLabel}</p>{result.focusIntention ? <p className="fyns-print-note">{result.focusIntention}</p> : null}</section>
          <section className="fyns-print-section fyns-print-next-step"><p className="fyns-print-label">Kleiner nächster Versuch</p><h2>{result.experiment.title}</h2><p>{result.experiment.action}</p><p><strong>Beobachtungsfrage:</strong> {result.experiment.observe}</p></section>
          <section className="fyns-print-section"><h2>Mögliche Wege</h2><div className="fyns-print-stack">{result.actionPaths.map((path) => <div key={path.id} className="fyns-print-block"><h3>{path.title}</h3><p>{path.why}</p><p className="fyns-print-detail"><strong>Erster Schritt:</strong> {path.firstStep}<br /><strong>Was du lernen könntest:</strong> {path.learning}<br /><strong>Trade-off:</strong> {path.tradeoff}</p></div>)}</div></section>
          <section className="fyns-print-section"><h2>Kleine Werkzeuge</h2><div className="fyns-print-stack">{result.tools.map((tool) => <div key={tool.id} className="fyns-print-block"><h3>{tool.title} · {tool.duration}</h3><p>{tool.purpose}</p><ol className="fyns-print-list">{tool.steps.map((step) => <li key={step}>{step}</li>)}</ol><p className="fyns-print-detail">{tool.prompt}</p></div>)}</div></section>
          <section className="fyns-print-section"><h2>{result.closing.title}</h2><p>{result.closing.body}</p><ul className="fyns-print-list">{result.closing.reminders.map((reminder) => <li key={reminder}>{reminder}</li>)}</ul></section>
          <p className="fyns-print-disclaimer">{LIFE_ALIGNMENT_DISCLAIMER}</p>
        </section>
      </div>
    </article>
  );
}

export function LifeAlignmentJourney() {
  const [state, dispatch] = useReducer(lifeAlignmentReducer, initialLifeAlignmentState);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.validationMessage) errorRef.current?.focus();
    else if (state.phase === "journey") document.querySelector<HTMLElement>("[data-life-section-heading]")?.focus();
    else if (state.phase === "result") document.querySelector<HTMLElement>("[data-life-result-heading]")?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.phase, state.sectionIndex, state.validationMessage]);

  const restart = <RestartControls pending={state.restartPending} onRequest={() => dispatch({ type: "request-restart" })} onCancel={() => dispatch({ type: "cancel-restart" })} onConfirm={() => dispatch({ type: "confirm-restart" })} />;

  if (state.phase === "result") {
    const output = buildLifeAlignmentResult(state.answers);
    if (output.status === "complete") return <ResultView result={output.result} onEdit={(sectionIndex) => dispatch({ type: "edit-section", sectionIndex })} restart={restart} />;
  }

  if (state.phase === "intro") return (
    <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[55rem] bg-[radial-gradient(circle_at_78%_10%,rgba(245,185,113,0.15),transparent_30rem)]" />
      <div className="relative mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400"><Link href="/" className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link> <span aria-hidden="true">/</span> <span aria-current="page" className="text-[#f5b971]">Life Alignment</span></nav>
        <header className="grid min-h-[60svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24"><div><p className="font-mono text-xs font-black uppercase tracking-[0.26em] text-[#f5b971]">{lifeAlignment.eyebrow} · {lifeAlignment.status}</p><h1 className="mt-7 text-[clamp(3rem,8vw,7rem)] font-black leading-[0.88] tracking-[-0.06em] text-white">{lifeAlignment.name}</h1><p className="mt-8 max-w-3xl text-2xl font-black leading-tight text-white sm:text-4xl">{lifeAlignment.title}</p><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{lifeAlignment.description}</p><button type="button" onClick={() => dispatch({ type: "start" })} className="mt-9 min-h-14 rounded-full bg-[#f5b971] px-7 py-4 font-black text-[#07131d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5b971]">Reflexion beginnen →</button><p className="mt-4 font-mono text-xs text-slate-500">{lifeAlignment.duration}</p></div><aside className="border-l border-[#f5b971] pl-7"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#f5b971]">Privat by design</p><h2 className="mt-5 text-2xl font-black text-white">Kein Konto. Kein Speichern. Kein Lebensscore.</h2><p className="mt-4 leading-7 text-slate-400">{lifeAlignment.privacy}</p><p className="mt-4 leading-7 text-slate-400">{lifeAlignment.authority}</p></aside></header>
        <div className="mt-16"><LifeAlignmentContext priority /></div>
        <section aria-labelledby="expect-title" className="grid gap-10 py-16 lg:grid-cols-[0.36fr_1fr] sm:py-24"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">So funktioniert es</p><div><h2 id="expect-title" className="text-4xl font-black text-white sm:text-5xl">Fünf Abschnitte, eine heutige Momentaufnahme.</h2><ol className="mt-9 grid gap-3 sm:grid-cols-2">{lifeAlignmentSections.map((section, index) => <li key={section.id} className="border-l border-white/15 p-5"><span className="font-mono text-xs text-[#f5b971]">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-3 font-black text-white">{section.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{section.description}</p></li>)}</ol></div></section>
      </div>
    </article>
  );

  const sections = [AreasSection, RealitySection, DirectionSection, ContextSection, FocusSection] as const;
  const CurrentSection = sections[state.sectionIndex] ?? AreasSection;
  return (
    <article className="section-lines relative min-h-screen px-5 pb-48 pt-28 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><Link href="/life-alignment" onClick={(event) => { event.preventDefault(); dispatch({ type: "request-restart" }); }} className="font-mono text-xs text-slate-400 hover:text-white">Life Alignment</Link>{restart}</div>
        <form onSubmit={(event) => { event.preventDefault(); dispatch({ type: "continue" }); }} noValidate>
          <CurrentSection answers={state.answers} dispatch={dispatch} />
          {state.validationMessage ? <div ref={errorRef} tabIndex={-1} role="alert" className="mt-10 rounded-2xl border border-[#ffb36d]/40 bg-[#ffb36d]/10 p-5 font-bold leading-7 text-[#ffd3a8] outline-none">{state.validationMessage}</div> : null}
          <HumanContextJourneyDock sections={lifeAlignmentSections} currentSectionIndex={state.sectionIndex} accent={ACCENT} nextLabel={state.sectionIndex === 4 ? "Momentaufnahme ansehen" : "Weiter"} onBack={() => dispatch({ type: "back" })} />
        </form>
      </div>
    </article>
  );
}
