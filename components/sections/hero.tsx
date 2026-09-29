"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "@/components/i18n/locale-context";
import { AiSummaryCard } from "@/components/sections/ai-summary-card";
import { getAiSummaryCopy } from "@/data/i18n/ai-summary";
import { getHomeCopy } from "@/data/i18n/home";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const locale = useLocale();
  const copy = getHomeCopy(locale).hero;
  const aiSummaryCopy = getAiSummaryCopy(locale);
  return (
    <section id="home" aria-labelledby="hero-title" className="hero-grid relative flex min-h-[96svh] items-center overflow-hidden px-5 pb-20 pt-32 sm:px-8">
      <div aria-hidden="true" className="hero-glow absolute inset-0" />
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: "easeOut" }} className="relative mx-auto grid min-w-0 w-full max-w-[90rem] grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-end">
        <div className="min-w-0">
          <p className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.34em] text-[#35d0e5]"><span className="signal-dot" aria-hidden="true" />btshq.online / Digital HQ</p>
          <h1 id="hero-title" className="mt-7 max-w-5xl text-[clamp(2.5rem,12.5vw,3rem)] font-black leading-[0.9] tracking-[-0.055em] text-white sm:text-7xl lg:text-[6.7rem]">Benjamin<br />Trinidad Segura</h1>
          <p className="mt-8 max-w-4xl text-xl font-black leading-snug text-white sm:text-3xl">{copy.role}</p>
          <p className="mt-7 max-w-3xl text-xl leading-8 text-slate-200">{copy.claim}</p>
          <p className="mt-5 max-w-3xl leading-7 text-slate-400">{copy.introduction}</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a href="#now" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#35d0e5] px-7 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]">{copy.explore} <span aria-hidden="true" className="ml-2">↓</span></a>
            <a href="#contact" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-7 py-3 font-black text-white transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/5">{copy.connect}</a>
          </div>
        </div>
        <aside aria-label={copy.signalAriaLabel} className="relative min-w-0 border-l border-white/15 pl-7 lg:mb-2">
          <div className="absolute -left-px top-0 h-20 w-px bg-[#35d0e5]" aria-hidden="true" />
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#ff9a3d]">{copy.signalLabel}</p>
          <ul className="mt-7 grid gap-5">
            {copy.signals.map((signal, index) => <li key={signal} className="flex items-center gap-4"><span className={`h-2 w-2 rounded-full ${index % 2 ? "bg-[#ff7a00]" : "signal-dot"}`} aria-hidden="true" /><span className="font-semibold text-slate-200">{signal}</span></li>)}
          </ul>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">{copy.lastSignal}</p>
          <div className="mt-8 min-w-0">
            <AiSummaryCard copy={aiSummaryCopy} />
          </div>
        </aside>
      </motion.div>
    </section>
  );
}
