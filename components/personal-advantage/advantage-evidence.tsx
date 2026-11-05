"use client";

import { useEffect } from "react";

import type { PersonalAdvantageUiCopy } from "@/data/personal-advantage-locales";
import type { PersonalAdvantageMap } from "@/types/personal-advantage";

export function revealAdvantageEvidence(scroll = false) {
  const disclosure = document.getElementById("advantage-evidence");
  if (!(disclosure instanceof HTMLDetailsElement)) return;
  disclosure.open = true;
  disclosure.querySelector("summary")?.focus({ preventScroll: true });
  if (scroll) disclosure.scrollIntoView({ block: "start", behavior: "instant" });
}

export function AdvantageEvidence({ copy, items, label, transparency }: {
  copy: PersonalAdvantageUiCopy;
  items: PersonalAdvantageMap["evidenceSummary"];
  label: string;
  transparency: string;
}) {
  useEffect(() => {
    const revealHashTarget = () => {
      if (window.location.hash === "#advantage-evidence") revealAdvantageEvidence(true);
    };
    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);
    return () => window.removeEventListener("hashchange", revealHashTarget);
  }, []);

  return (
    <details id="advantage-evidence" className="scroll-mt-28 border-t border-white/15 py-8">
      <summary className="min-h-12 cursor-pointer rounded-lg px-2 py-3 text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#77e5b5]">
        <span className="break-words text-xl font-bold">{label}</span>
      </summary>
      <div className="mt-6 grid gap-8 lg:grid-cols-[.4fr_1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.2em] text-[#b8a5ff]">{transparency}</p>
          <h2 className="mt-4 text-2xl font-bold text-white">{copy.evidence}</h2>
        </div>
        <div className="space-y-5">
          {items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 p-6">
              <h3 className="font-black text-white">{item.label}</h3>
              <p className="mt-3 leading-7 text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
