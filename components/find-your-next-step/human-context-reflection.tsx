import type { CSSProperties } from "react";

export function HumanContextReflection({
  accent,
  titleId,
}: {
  accent: string;
  titleId: string;
}) {
  return (
    <section
      aria-labelledby={titleId}
      style={{ "--human-context-accent": accent } as CSSProperties}
      className="mt-12 border-y border-white/10 bg-white/[0.018] py-8 sm:mt-14 sm:py-10"
    >
      <div className="max-w-4xl border-l-2 border-[var(--human-context-accent)] pl-5 sm:pl-7">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[var(--human-context-accent)]">
          Human Context · Deine Deutung zählt
        </p>
        <h3 id={titleId} className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">
          Prüfe, was sich für dich wirklich stimmig anfühlt.
        </h3>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          Was davon möchtest du selbst? Was glaubst du, wollen zu sollen? Was ist übernommen, durch eine aktuelle
          Bedingung geprägt oder noch unsicher? Du entscheidest, welche Lesart hilfreich ist und was du verwerfen
          oder über deine Antworten anpassen möchtest.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
          Diese Reflexionsfragen werden nicht ausgewertet und verändern dein Ergebnis nicht. FYNS verknüpft dieses
          Ergebnis nicht mit deinem BTS Account; es bleibt nur im aktuellen Seitenzustand.
        </p>
      </div>
    </section>
  );
}
