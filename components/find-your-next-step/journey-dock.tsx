import type { CSSProperties } from "react";

interface JourneyDockSection {
  id: string;
  title: string;
}

interface JourneyDockProps {
  sections: readonly JourneyDockSection[];
  currentSectionIndex: number;
  globalQuestionNumber: number;
  totalQuestionCount: number;
  localQuestionNumber: number;
  localQuestionCount: number;
  accent: string;
  accessibleLabel: string;
  backLabel: string;
  nextLabel: string;
  onBack: () => void;
}

export function JourneyDock({
  sections,
  currentSectionIndex,
  globalQuestionNumber,
  totalQuestionCount,
  localQuestionNumber,
  localQuestionCount,
  accent,
  accessibleLabel,
  backLabel,
  nextLabel,
  onBack,
}: JourneyDockProps) {
  const currentSection = sections[currentSectionIndex];

  return (
    <nav
      aria-label={accessibleLabel}
      style={{ "--dock-accent": accent } as CSSProperties}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#061521]/95 shadow-[0_-1.25rem_3rem_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-x-3 gap-y-2.5 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-8 lg:grid-cols-[auto_minmax(18rem,1fr)_auto] lg:items-center lg:gap-5 lg:pt-3">
        <div className="col-span-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <div className="flex items-baseline justify-between gap-4 font-mono text-[10px] font-black uppercase tracking-[0.16em] sm:text-xs">
            <p className="text-[var(--dock-accent)]">
              Frage {globalQuestionNumber} von {totalQuestionCount}
            </p>
            <p className="shrink-0 whitespace-nowrap text-slate-400">
              <span className="lg:hidden">Abschnitt {currentSectionIndex + 1}/{sections.length} · hier {localQuestionNumber}/{localQuestionCount}</span>
              <span className="hidden lg:inline">Abschnitt {currentSectionIndex + 1} von {sections.length} · hier {localQuestionNumber} von {localQuestionCount}</span>
            </p>
          </div>
          <p className="mt-0.5 truncate text-sm font-black leading-5 text-white">
            {currentSection?.title}
          </p>
          <ol aria-label="Abschnitte der Journey" className="mt-2 grid items-center gap-2" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}>
            {sections.map((section, index) => {
              const current = index === currentSectionIndex;
              const completed = index < currentSectionIndex;
              return (
                <li key={section.id} aria-current={current ? "step" : undefined}>
                  <span
                    aria-hidden="true"
                    className={`block rounded-full ${current ? "h-1.5 bg-[var(--dock-accent)]" : completed ? "h-1 bg-[#9aaabd]/70" : "h-1 border-t border-dashed border-white/25"}`}
                  />
                  <span className="sr-only">
                    Abschnitt {index + 1}: {section.title}, {current ? "aktuell" : completed ? "abgeschlossen" : "noch nicht erreicht"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-full border border-white/15 px-3 py-3 text-center text-xs font-bold leading-5 text-slate-300 transition hover:border-white/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--dock-accent)] sm:px-5 sm:text-base lg:col-start-1 lg:row-start-1"
        >
          <span aria-hidden="true" className="mr-2 hidden sm:inline">←</span> {backLabel}
        </button>
        <button
          type="submit"
          className="inline-flex min-h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-full bg-[var(--dock-accent)] px-3 py-3 text-center text-xs font-black leading-5 text-[#041018] transition motion-safe:hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--dock-accent)] sm:px-6 sm:text-base lg:col-start-3 lg:row-start-1"
        >
          {nextLabel} <span aria-hidden="true" className="ml-2 hidden sm:inline">→</span>
        </button>
      </div>
    </nav>
  );
}
