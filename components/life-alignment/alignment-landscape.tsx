import type { CSSProperties } from "react";

import type { LifeAlignmentResult, LifeAlignmentSnapshotGroupId } from "@/types/life-alignment";

const groupVisuals: Readonly<Record<LifeAlignmentSnapshotGroupId, { accent: string; symbol: string }>> = {
  support: { accent: "#74d8c8", symbol: "◆" },
  change: { accent: "#f5b971", symbol: "↗" },
  open: { accent: "#b9a5ff", symbol: "?" },
  steady: { accent: "#a9b5c2", symbol: "—" },
};

export function AlignmentLandscape({ result, onEdit }: { result: LifeAlignmentResult; onEdit: () => void }) {
  return (
    <section aria-labelledby="landscape-title" className="py-16 sm:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">Alignment Landscape</p>
          <h2 id="landscape-title" className="mt-4 text-4xl font-black text-white sm:text-5xl">Die Form deiner heutigen Momentaufnahme.</h2>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">Jeder Bereich erscheint genau einmal. Die Gruppen beschreiben deine Antworten; sie sind weder Stufen noch eine Rangliste.</p>
        </div>
        <button type="button" onClick={onEdit} className="min-h-11 self-start rounded-full border border-white/15 px-5 text-sm font-bold text-slate-200">Aktuelle Lage bearbeiten</button>
      </div>

      <ol className="mt-10 grid gap-3 lg:grid-cols-4" aria-label="Qualitative Gruppen deiner ausgewählten Lebensbereiche">
        {result.snapshot.map((group) => {
          const visual = groupVisuals[group.id];
          return (
            <li
              key={group.id}
              style={{ "--snapshot-accent": visual.accent } as CSSProperties}
              className="min-h-64 rounded-[1.5rem] border border-[var(--snapshot-accent)]/30 bg-[var(--snapshot-accent)]/[0.045] p-5"
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--snapshot-accent)]/45 font-mono font-black text-[var(--snapshot-accent)]">{visual.symbol}</span>
                <div>
                  <h3 className="font-black text-white">{group.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{group.description}</p>
                </div>
              </div>
              {group.areas.length > 0 ? (
                <ul className="mt-6 grid gap-2">
                  {group.areas.map((area) => (
                    <li key={area.id} className="rounded-xl border border-white/10 bg-[#061521]/75 px-3 py-3">
                      <span className="font-bold leading-5 text-slate-100">{area.title}</span>
                      {area.importantNow ? <span className="mt-1 block font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[var(--snapshot-accent)]">Wichtig jetzt</span> : null}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-6 border-t border-white/10 pt-4 text-sm leading-6 text-slate-500">Heute ist kein Bereich dieser Gruppe zugeordnet.</p>}
            </li>
          );
        })}
      </ol>

      <h3 className="mt-14 text-2xl font-black text-white">Bereich für Bereich</h3>
      <p className="mt-3 max-w-3xl leading-7 text-slate-400">Die Details zeigen die drei ausdrücklichen Angaben hinter jeder Zuordnung.</p>
      <ol className="mt-8 grid gap-4 md:grid-cols-2">
        {result.areas.map((area) => (
          <li key={area.id} className="rounded-[1.5rem] border border-white/10 bg-[#061521]/70 p-6">
            <article>
              <div className="flex items-start justify-between gap-4">
                <h4 className="text-2xl font-black text-white">{area.title}</h4>
                {area.importantNow ? <span className="rounded-full bg-[#f5b971]/15 px-3 py-1 text-xs font-black text-[#f5b971]">Wichtig jetzt</span> : null}
              </div>
              <p className="mt-5 font-black text-[#f5b971]">{area.signalLabel}</p>
              <dl className="mt-5 grid gap-3 text-sm">
                <div><dt className="text-slate-500">Heutiger Raum</dt><dd className="font-bold text-slate-200">{area.currentLabel}</dd></div>
                <div><dt className="text-slate-500">Wirkung</dt><dd className="font-bold text-slate-200">{area.capacityLabel}</dd></div>
                <div><dt className="text-slate-500">Gewünschte Richtung</dt><dd className="font-bold text-slate-200">{area.directionLabel}</dd></div>
              </dl>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
