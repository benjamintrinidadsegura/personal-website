interface HumanContextJourneySection { id: string; title: string }

export function HumanContextJourneyDock({ sections, currentSectionIndex, accent, backLabel = "Zurück", nextLabel = "Weiter", onBack }: {
  sections: readonly HumanContextJourneySection[];
  currentSectionIndex: number;
  accent: string;
  backLabel?: string;
  nextLabel?: string;
  onBack: () => void;
}) {
  return (
    <nav aria-label="Fortschritt und Navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#061521]/95 shadow-[0_-1.25rem_3rem_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <div className="flex justify-between gap-3 font-mono text-[10px] font-black uppercase tracking-[0.16em]">
            <span style={{ color: accent }}>Abschnitt {currentSectionIndex + 1} von {sections.length}</span>
            <span className="truncate text-slate-400">{sections[currentSectionIndex]?.title}</span>
          </div>
          <ol aria-label="Abschnitte" className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}>
            {sections.map((section, index) => (
              <li key={section.id} aria-current={index === currentSectionIndex ? "step" : undefined}>
                <span aria-hidden="true" className={`block rounded-full ${index === currentSectionIndex ? "h-1.5" : index < currentSectionIndex ? "h-1 bg-slate-400/70" : "h-1 border-t border-dashed border-white/25"}`} style={index === currentSectionIndex ? { backgroundColor: accent } : undefined} />
                <span className="sr-only">{section.title}, {index === currentSectionIndex ? "aktuell" : index < currentSectionIndex ? "abgeschlossen" : "noch nicht erreicht"}</span>
              </li>
            ))}
          </ol>
        </div>
        <button type="button" onClick={onBack} className="min-h-12 rounded-full border border-white/15 px-5 py-3 font-bold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-3 lg:col-start-1 lg:row-start-1" style={{ outlineColor: accent }}>← {backLabel}</button>
        <button type="submit" className="min-h-12 rounded-full px-5 py-3 font-black text-[#07131d] focus-visible:outline-2 focus-visible:outline-offset-3 lg:col-start-3 lg:row-start-1" style={{ backgroundColor: accent, outlineColor: accent }}>{nextLabel} →</button>
      </div>
    </nav>
  );
}
