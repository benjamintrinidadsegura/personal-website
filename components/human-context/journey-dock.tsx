"use client";

import { useLocale } from "@/components/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";

interface HumanContextJourneySection { id: string; title: string }

const dockCopy: Record<Locale, { back: string; next: string; navigation: string; section: string; of: string; sections: string; current: string; completed: string; pending: string }> = {
  de: { back: "Zurück", next: "Weiter", navigation: "Fortschritt und Navigation", section: "Abschnitt", of: "von", sections: "Abschnitte", current: "aktuell", completed: "abgeschlossen", pending: "noch nicht erreicht" },
  en: { back: "Back", next: "Continue", navigation: "Progress and navigation", section: "Section", of: "of", sections: "Sections", current: "current", completed: "completed", pending: "not reached yet" },
  es: { back: "Atrás", next: "Continuar", navigation: "Progreso y navegación", section: "Sección", of: "de", sections: "Secciones", current: "actual", completed: "completada", pending: "aún no alcanzada" },
  tr: { back: "Geri", next: "Devam", navigation: "İlerleme ve gezinme", section: "Bölüm", of: "/", sections: "Bölümler", current: "mevcut", completed: "tamamlandı", pending: "henüz ulaşılmadı" },
  pl: { back: "Wstecz", next: "Dalej", navigation: "Postęp i nawigacja", section: "Sekcja", of: "z", sections: "Sekcje", current: "obecna", completed: "ukończona", pending: "jeszcze nieosiągnięta" },
  el: { back: "Πίσω", next: "Συνέχεια", navigation: "Πρόοδος και πλοήγηση", section: "Ενότητα", of: "από", sections: "Ενότητες", current: "τρέχουσα", completed: "ολοκληρωμένη", pending: "δεν έχει φτάσει ακόμη" },
  ru: { back: "Назад", next: "Продолжить", navigation: "Ход и навигация", section: "Раздел", of: "из", sections: "Разделы", current: "текущий", completed: "завершён", pending: "ещё не достигнут" },
};

export function HumanContextJourneyDock({ sections, currentSectionIndex, accent, backLabel = "Zurück", nextLabel = "Weiter", onBack }: {
  sections: readonly HumanContextJourneySection[];
  currentSectionIndex: number;
  accent: string;
  backLabel?: string;
  nextLabel?: string;
  onBack: () => void;
}) {
  const locale = useLocale();
  const labels = dockCopy[locale];
  const effectiveBackLabel = backLabel === "Zurück" ? labels.back : backLabel;
  const effectiveNextLabel = nextLabel === "Weiter" ? labels.next : nextLabel;
  return (
    <nav aria-label={labels.navigation} className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#061521]/95 shadow-[0_-1.25rem_3rem_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <div className="flex justify-between gap-3 font-mono text-[10px] font-black uppercase tracking-[0.16em]">
            <span style={{ color: accent }}>{labels.section} {currentSectionIndex + 1} {labels.of} {sections.length}</span>
            <span className="truncate text-slate-400">{sections[currentSectionIndex]?.title}</span>
          </div>
          <ol aria-label={labels.sections} className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}>
            {sections.map((section, index) => (
              <li key={section.id} aria-current={index === currentSectionIndex ? "step" : undefined}>
                <span aria-hidden="true" className={`block rounded-full ${index === currentSectionIndex ? "h-1.5" : index < currentSectionIndex ? "h-1 bg-slate-400/70" : "h-1 border-t border-dashed border-white/25"}`} style={index === currentSectionIndex ? { backgroundColor: accent } : undefined} />
                <span className="sr-only">{section.title}, {index === currentSectionIndex ? labels.current : index < currentSectionIndex ? labels.completed : labels.pending}</span>
              </li>
            ))}
          </ol>
        </div>
        <button type="button" onClick={onBack} className="min-h-12 rounded-full border border-white/15 px-5 py-3 font-bold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-3 lg:col-start-1 lg:row-start-1" style={{ outlineColor: accent }}>← {effectiveBackLabel}</button>
        <button type="submit" className="min-h-12 rounded-full px-5 py-3 font-black text-[#07131d] focus-visible:outline-2 focus-visible:outline-offset-3 lg:col-start-3 lg:row-start-1" style={{ backgroundColor: accent, outlineColor: accent }}>{effectiveNextLabel} →</button>
      </div>
    </nav>
  );
}
