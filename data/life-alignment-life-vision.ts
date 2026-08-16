import type {
  LifeVisionAreaId,
  LifeVisionConstraintId,
  LifeVisionEmphasis,
  LifeVisionExplorationMode,
  LifeVisionHorizon,
  LifeVisionProtectionId,
  LifeVisionSectionId,
  LifeVisionSource,
  LifeVisionTradeoffStance,
} from "@/types/life-alignment-life-vision";

export const lifeVision = {
  id: "life-alignment-life-vision",
  href: "/life-alignment/life-vision",
  name: "Life Vision",
  eyebrow: "Life Alignment · Für mich",
  title: "Welche Richtung soll dein Leben bekommen – und was soll dabei nicht verloren gehen?",
  description: "Eine qualitative Zukunftsreflexion über gewünschte Schwerpunkte, geschützte Prioritäten, reale Grenzen und mehrere mögliche Wege. Kein fertiger Lebensplan.",
  duration: "6 Abschnitte · etwa 10–14 Minuten",
  privacy: "Deine Antworten bleiben nur im aktuellen Seitenzustand. Sie werden weder gespeichert noch übertragen oder mit einem Konto verbunden.",
  authority: "Du entscheidest, welche Richtung zu dir gehört. Die Auswertung macht ausschließlich deine ausdrücklichen Angaben nachvollziehbar sichtbar.",
} as const;

export const lifeVisionSections: readonly { id: LifeVisionSectionId; title: string; description: string }[] = [
  { id: "frame", title: "Zukunftsrahmen", description: "Zeitraum und relevante Lebensbereiche." },
  { id: "direction", title: "Gewünschte Richtung", description: "Mehr, weniger, ähnlich, anders oder bewusst offen." },
  { id: "protect", title: "Was geschützt bleiben soll", description: "Prioritäten und Bedingungen, die nicht beiläufig optimiert werden sollen." },
  { id: "context", title: "Human Context", description: "Woher gewünschte Richtungen nach deiner eigenen Einschätzung kommen." },
  { id: "constraints", title: "Grenzen und Abwägungen", description: "Reale Bedingungen und möglicherweise konkurrierende Richtungen." },
  { id: "paths", title: "Mögliche Wege", description: "Welche Arten der Erkundung für dich überhaupt passen könnten." },
] as const;

export const lifeVisionAreas: readonly { id: LifeVisionAreaId; title: string; description: string }[] = [
  { id: "work-contribution", title: "Arbeit und Beitrag", description: "Erwerbsarbeit, Lernen, Projekte und gesellschaftlicher Beitrag." },
  { id: "relationships", title: "Enge Beziehungen", description: "Partnerschaft, Familie und andere verlässliche Bindungen." },
  { id: "community", title: "Freundschaft und Gemeinschaft", description: "Zugehörigkeit, Freundschaften und gemeinsames Engagement." },
  { id: "wellbeing", title: "Gesundheit und Wohlbefinden", description: "Körperliches und seelisches Wohlbefinden, ohne medizinische Bewertung." },
  { id: "rest-play", title: "Erholung und Spielraum", description: "Ruhe, Freude, freie Zeit und Regeneration." },
  { id: "security", title: "Praktische Sicherheit", description: "Finanzielle Grundlage, Planbarkeit und tragfähiger Alltag." },
  { id: "learning-creativity", title: "Lernen und Kreativität", description: "Neugier, Fähigkeiten, Ausdruck und Entwicklung." },
  { id: "home-place", title: "Zuhause und Ort", description: "Wohnen, Umgebung, Mobilität und Verbundenheit mit einem Ort." },
] as const;

export const lifeVisionHorizonOptions: Readonly<Record<LifeVisionHorizon, { label: string; description: string }>> = {
  "one-two-years": { label: "Die nächsten 1–2 Jahre", description: "Nah genug für konkrete Bedingungen, weit genug für erkennbare Veränderung." },
  "three-five-years": { label: "Die nächsten 3–5 Jahre", description: "Eine mittlere Perspektive mit mehr Raum für mehrere Schritte." },
  "open-horizon": { label: "Bewusst offener Horizont", description: "Die Richtung ist wichtiger als ein bestimmter Zeitpunkt." },
};

export const lifeVisionEmphasisOptions: Readonly<Record<LifeVisionEmphasis, { label: string; description: string }>> = {
  less: { label: "Weniger", description: "Dieser Bereich dürfte weniger Raum oder Druck einnehmen." },
  similar: { label: "Ähnlich", description: "Sein heutiger Stellenwert darf im Wesentlichen bleiben." },
  more: { label: "Mehr", description: "Dieser Bereich dürfte mehr Raum und Aufmerksamkeit erhalten." },
  different: { label: "Anders", description: "Nicht nur mehr oder weniger, sondern in einer anderen Form." },
  uncertain: { label: "Noch unsicher", description: "Du möchtest die Richtung noch nicht festlegen." },
  "intentionally-open": { label: "Bewusst offen", description: "Du willst Möglichkeiten erhalten, statt schon ein Ziel zu bestimmen." },
};

export const lifeVisionProtectionOptions: Readonly<Record<LifeVisionProtectionId, string>> = {
  "health-capacity": "Gesundheit und verfügbare Kapazität",
  "close-relationships": "Zeit und Verlässlichkeit für enge Beziehungen",
  "financial-floor": "Eine tragfähige finanzielle Grundlage",
  "time-autonomy": "Selbstbestimmung über einen Teil meiner Zeit",
  belonging: "Zugehörigkeit und soziale Verbundenheit",
  integrity: "Nach meinen Werten handeln zu können",
  rest: "Ausreichend Erholung und unverplante Zeit",
  curiosity: "Neugier, Lernen und kreativen Spielraum",
};

export const lifeVisionSourceOptions: Readonly<Record<LifeVisionSource, string>> = {
  intrinsic: "Diese Richtung fühlt sich von mir selbst gewollt an.",
  social: "Mein heutiges Umfeld beeinflusst diese Richtung deutlich.",
  inherited: "Übernommene Erwartungen oder frühere Prägungen wirken mit.",
  "constraint-driven": "Meine heutigen Bedingungen drängen mich in diese Richtung.",
  uncertain: "Ich bin noch unsicher, wie sehr diese Richtung wirklich meine ist.",
};

export const lifeVisionConstraintOptions: Readonly<Record<LifeVisionConstraintId, string>> = {
  time: "Zeit und Aufmerksamkeit sind begrenzt.",
  energy: "Energie oder Belastbarkeit setzen einen Rahmen.",
  care: "Fürsorge und Verantwortung für andere wirken mit.",
  money: "Einkommen, Kosten oder finanzielle Verpflichtungen müssen tragfähig bleiben.",
  "place-access": "Ort, Wohnen, Mobilität oder Zugang begrenzen Möglichkeiten.",
  commitment: "Verträge oder andere längerfristige Verpflichtungen binden mich.",
  "other-people": "Die Entscheidungen anderer Menschen beeinflussen den Spielraum.",
  "missing-information": "Wichtige Informationen fehlen noch.",
  none: "Ich möchte derzeit keine konkrete Grenze festhalten.",
};

export const lifeVisionTradeoffOptions: Readonly<Record<LifeVisionTradeoffStance, string>> = {
  explore: "Ich möchte erkunden, ob sich zwischen beiden Richtungen Spielraum schaffen lässt.",
  "accept-for-now": "Ich akzeptiere diese Abwägung für den gewählten Zeitraum bewusst.",
  "protect-both": "Beide Richtungen sollen vorerst geschützt bleiben, auch wenn Fortschritt langsamer wird.",
  uncertain: "Ich bin noch unsicher, ob hier überhaupt eine tragende Abwägung besteht.",
  "no-current-tension": "Ich sehe zwischen meinen gewählten Richtungen derzeit keine relevante Spannung.",
};

export const lifeVisionExplorationOptions: Readonly<Record<LifeVisionExplorationMode, { title: string; description: string }>> = {
  "direct-change": { title: "Etwas direkt verändern", description: "Einen kleinen Teil der heutigen Situation konkret verschieben." },
  "reduce-load": { title: "Belastung reduzieren", description: "Innerhalb des heutigen Rahmens Raum oder Kapazität zurückgewinnen." },
  "gather-information": { title: "Fehlende Informationen sammeln", description: "Annahmen durch konkrete Bedingungen und Fakten ersetzen." },
  conversation: { title: "Ein Gespräch führen", description: "Erwartungen, Möglichkeiten oder Abhängigkeiten mit Beteiligten klären." },
  boundary: { title: "Eine Grenze verändern", description: "Eine Zusage, Gewohnheit oder Erwartung neu verhandeln." },
  "build-capacity": { title: "Erst Kapazität aufbauen", description: "Praktische, zeitliche oder finanzielle Voraussetzungen stärken." },
  "explore-alternatives": { title: "Alternativen erkunden", description: "Mehrere Möglichkeiten prüfen, ohne sich schon festzulegen." },
  "accept-for-now": { title: "Eine Abwägung bewusst akzeptieren", description: "Nicht alles gleichzeitig lösen und die Entscheidung später erneut ansehen." },
  "reversible-experiment": { title: "Einen reversiblen Versuch machen", description: "Eine begrenzte Veränderung testen und ihre Wirkung beobachten." },
  "external-support": { title: "Passende Unterstützung erwägen", description: "Prüfen, ob eine geeignete Fachperson oder vertraute Unterstützung hilfreich wäre." },
};

export const lifeVisionScene = {
  src: "/images/life-alignment/context-scenes/life-vision.webp",
  eyebrow: "Life Vision · Eine mögliche Zukunftsbetrachtung",
  title: "Mehrere Richtungen und offene Möglichkeiten dürfen nebeneinander bestehen.",
  description: "Die wiederkehrenden Figuren betrachten mögliche Wege, geschützte Prioritäten und reale Bedingungen. Sie stehen für keine Typen und bilden weder dich noch dein Ergebnis ab.",
  alt: "Vier Erwachsene betrachten in einer warmen Abendlandschaft unterschiedliche mögliche Wege, während vertraute Alltagsgegenstände Nähe, Arbeit, Erholung und Zuhause andeuten.",
} as const;

export const LIFE_VISION_DISCLAIMER = "Life Vision ist eine qualitative Selbstreflexion und keine medizinische, psychologische, rechtliche oder finanzielle Beratung. Sie kennt nur deine hier gewählten Antworten, nicht dein gesamtes Leben. Bei weitreichenden Entscheidungen prüfe konkrete Risiken und Bedingungen mit geeigneten Fachpersonen.";
