import type {
  AuthoritySource,
  CapacityEffect,
  CurrentEmphasis,
  DesiredDirection,
  EntanglementStatus,
  ExperimentMode,
  LifeAlignmentSnapshotGroupId,
  LifeAlignmentSectionId,
  LifeAreaDefinition,
  LifeConstraintId,
  TradeoffStatus,
} from "@/types/life-alignment";

export const lifeAlignment = {
  id: "tool-life-alignment",
  href: "/life-alignment",
  name: "Life Alignment",
  status: "Beta",
  eyebrow: "Human Context · Life Alignment",
  title: "Wie gut passt dein heutiges Leben zu dem, was gerade zählt?",
  description:
    "Eine private Momentaufnahme von Lebensbereichen, Aufmerksamkeit, Energie, gewünschten Richtungen und realen Grenzen – ohne Lebensscore oder fertige Antwort.",
  duration: "5 Abschnitte · meist 22–24 Entscheidungen · etwa 8–12 Minuten",
  privacy:
    "Deine Angaben bleiben ausschließlich im aktuellen Seitenzustand. Sie werden nicht gespeichert, nicht übertragen und auch dann nicht mit deinem BTS Account verknüpft, wenn du eingeloggt bist.",
  authority:
    "Du behältst die Deutungshoheit. Die Auswertung ordnet nur deine ausdrücklichen Angaben und darf von dir verändert oder verworfen werden.",
  discovery: {
    category: "Life Alignment Tool",
    tags: ["Lebensbereiche", "Ausrichtung", "Prioritäten", "Energie", "Aufmerksamkeit"],
    keywords: ["Leben ausrichten", "Lebensbalance", "Was ist mir wichtig", "Aktuelle Lebenssituation", "Gewünschte Veränderung"],
  },
} as const;

export const lifeAlignmentSections: readonly { id: LifeAlignmentSectionId; title: string; description: string }[] = [
  { id: "areas", title: "Was zählt gerade?", description: "Relevante Lebensbereiche und heutige Prioritäten." },
  { id: "reality", title: "Wie sieht es heute aus?", description: "Aufmerksamkeit und Wirkung auf deine Kapazität." },
  { id: "direction", title: "Was darf sich verändern?", description: "Mehr, weniger, ähnlich, anders oder noch unklar." },
  { id: "context", title: "Was begrenzt oder trägt?", description: "Reale Bedingungen und bewusste Abwägungen." },
  { id: "focus", title: "Was möchtest du erkunden?", description: "Deine Deutung und ein kleiner nächster Versuch." },
] as const;

export const lifeAreas: readonly LifeAreaDefinition[] = [
  { id: "work", title: "Arbeit und Beitrag", description: "Erwerbsarbeit, Ausbildung, Projekte und das Gefühl, etwas beizutragen." },
  { id: "close-relationships", title: "Enge Beziehungen und Familie", description: "Nähe, Partnerschaft, Familie und wichtige persönliche Bindungen.", highStakes: true },
  { id: "community", title: "Freundschaften und Gemeinschaft", description: "Freundschaften, Zugehörigkeit, Nachbarschaft und gemeinschaftliches Engagement." },
  { id: "wellbeing", title: "Gesundheit und Wohlbefinden", description: "Körperliches und seelisches Wohlbefinden, ohne medizinische Bewertung.", highStakes: true },
  { id: "rest-play", title: "Erholung und Spielraum", description: "Ruhe, Freude, Freizeit, Leichtigkeit und Regeneration." },
  { id: "security", title: "Finanzielle und praktische Sicherheit", description: "Einkommen, Verpflichtungen, Planbarkeit und materielle Grundlage.", highStakes: true },
  { id: "growth-creativity", title: "Lernen, Kreativität und Entwicklung", description: "Neugier, Ausdruck, Fähigkeiten und persönliche Entwicklung." },
  { id: "home-environment", title: "Zuhause und Umgebung", description: "Wohnen, Alltag, Orte und die Bedingungen deiner direkten Umgebung.", highStakes: true },
] as const;

export const currentEmphasisOptions: Readonly<Record<CurrentEmphasis, { label: string; description: string }>> = {
  little: { label: "Bekommt eher wenig Raum", description: "Dieser Bereich erhält aktuell wenig Zeit oder Aufmerksamkeit." },
  workable: { label: "Hat einen tragfähigen Raum", description: "Der heutige Anteil fühlt sich im Großen und Ganzen passend an." },
  "a-lot": { label: "Nimmt viel Raum ein", description: "Dieser Bereich beansprucht aktuell einen großen Teil deiner Kapazität." },
  unclear: { label: "Noch schwer einzuschätzen", description: "Die heutige Verteilung ist für dich noch nicht klar." },
};

export const capacityEffectOptions: Readonly<Record<CapacityEffect, { label: string; description: string }>> = {
  supportive: { label: "Unterstützt mich eher", description: "Dieser Bereich gibt Halt, Energie oder hilfreiche Orientierung." },
  mixed: { label: "Wirkt gemischt", description: "Unterstützende und belastende Seiten bestehen gleichzeitig." },
  draining: { label: "Kostet eher Kapazität", description: "Dieser Bereich beansprucht derzeit mehr Kraft oder Aufmerksamkeit." },
  unclear: { label: "Noch unklar", description: "Die Wirkung lässt sich im Moment nicht eindeutig einordnen." },
};

export const desiredDirectionOptions: Readonly<Record<DesiredDirection, { label: string; description: string }>> = {
  less: { label: "Weniger", description: "Dieser Bereich dürfte weniger Raum oder Druck einnehmen." },
  keep: { label: "Ähnlich weiter", description: "Die heutige Richtung darf im Wesentlichen bestehen bleiben." },
  more: { label: "Mehr", description: "Dieser Bereich dürfte mehr Raum oder Aufmerksamkeit erhalten." },
  different: { label: "Anders", description: "Nicht unbedingt mehr oder weniger – aber in einer anderen Form." },
  uncertain: { label: "Noch unsicher", description: "Eine gewünschte Richtung ist für dich noch offen." },
};

export const lifeConstraintOptions: Readonly<Record<LifeConstraintId, string>> = {
  "time-attention": "Zeit und Aufmerksamkeit sind derzeit eng begrenzt.",
  "energy-capacity": "Meine verfügbare Energie oder Belastbarkeit ist begrenzt.",
  "care-responsibility": "Fürsorge, Beziehungen oder Verantwortung für andere setzen einen realen Rahmen.",
  "income-commitment": "Einkommen, laufende Kosten oder finanzielle Verpflichtungen müssen tragfähig bleiben.",
  "location-access": "Ort, Wohnen, Mobilität oder Zugang begrenzen die Möglichkeiten.",
  "formal-obligation": "Verträge, Regeln oder andere formale Verpflichtungen wirken aktuell bindend.",
  "external-dependency": "Andere Menschen oder Institutionen entscheiden wesentlich mit.",
  uncertain: "Ich bin noch unsicher, welche Grenze tatsächlich entscheidend ist.",
  none: "Im Moment möchte ich keine konkrete Grenze festhalten.",
};

export const tradeoffOptions: Readonly<Record<TradeoffStatus, string>> = {
  "explore-change": "Ich möchte vorsichtig erkunden, ob eine kleine Veränderung möglich ist.",
  "accepted-now": "Diese Spannung ist für mich im Moment eine bewusste und akzeptable Abwägung.",
  "currently-fixed": "Ich möchte Veränderung, kann diesen Rahmen aktuell aber nicht sinnvoll bewegen.",
  uncertain: "Ich bin noch unsicher, wie ich zu dieser Spannung stehe.",
};

export const authoritySourceOptions: Readonly<Record<AuthoritySource, string>> = {
  intrinsic: "Ich möchte diese Richtung selbst.",
  social: "Mein Umfeld beeinflusst diese Richtung deutlich.",
  inherited: "Ich habe gelernt, dass ich das wollen oder tun sollte.",
  "constraint-driven": "Meine aktuelle Situation drängt mich in diese Richtung.",
  uncertain: "Ich bin noch nicht sicher, ob diese Richtung wirklich meine ist.",
};

export const entanglementOptions: Readonly<Record<EntanglementStatus, string>> = {
  current: "Dahinter steht eine konkrete gegenwärtige Bedingung.",
  historical: "Dahinter steht eher eine ältere Erwartung, Erfahrung oder ein früheres Selbstbild.",
  both: "Gegenwärtige Bedingungen und ältere Prägungen wirken gleichzeitig.",
  unsure: "Ich kann das im Moment nicht sicher unterscheiden.",
  "not-applicable": "Diese Frage passt zu meinem Fokus gerade nicht.",
};

export const experimentOptions: Readonly<Record<ExperimentMode, { label: string; action: string; observe: string }>> = {
  observe: { label: "Eine Situation bewusst beobachten", action: "Beobachte zwei konkrete Momente, in denen dieser Bereich Raum bekommt oder verliert.", observe: "Was trägt tatsächlich – und was kostet mehr Kapazität als erwartet?" },
  protect: { label: "Einen kleinen Raum schützen", action: "Schütze einmal ein kleines, realistisches Zeitfenster für das, was du in diesem Bereich ermöglichen möchtest.", observe: "Verändert dieser begrenzte Raum etwas an Energie, Klarheit oder Druck?" },
  conversation: { label: "Ein erkundendes Gespräch führen", action: "Führe ein ruhiges Gespräch, um eine Perspektive oder Bedingung besser zu verstehen – ohne eine sofortige Entscheidung zu verlangen.", observe: "Welche Möglichkeit oder Grenze wird danach konkreter?" },
  fact: { label: "Eine offene Bedingung klären", action: "Klär genau eine offene Information, Regel oder praktische Voraussetzung, die deinen Spielraum beeinflusst.", observe: "Ist die angenommene Grenze danach konkreter, kleiner, größer oder weiterhin unklar?" },
  reversible: { label: "Eine kleine reversible Veränderung testen", action: "Verändere einmal einen kleinen, risikoarmen Teil des heutigen Ablaufs und halte den Versuch leicht rückgängig zu machen.", observe: "Fühlt sich die andere Form hilfreicher an, oder zeigt der Versuch einen wichtigen Trade-off?" },
  pause: { label: "Noch nichts verändern", action: "Nimm die Momentaufnahme zunächst nur mit und entscheide später, ob ein Versuch überhaupt hilfreich wäre.", observe: "Welche Aussage bleibt nach etwas Abstand noch bedeutsam?" },
};

export const lifeAlignmentScene = {
  src: "/images/life-alignment/context-scenes/life-alignment.webp",
  eyebrow: "Life Alignment · Eine mögliche Situation",
  title: "Verschiedene Lebensbereiche dürfen gleichzeitig sichtbar sein.",
  description:
    "Die wiederkehrenden Figuren betrachten Alltag, Beziehungen, Arbeit und Erholung in einer gemeinsamen Szene. Sie stehen für keine Typen und beschreiben weder dich noch dein Ergebnis.",
  alt: "Vier Erwachsene betrachten in einem warmen Atelier verschiedene Alltagsszenen und Notizen zu Arbeit, Beziehungen, Erholung und Zuhause.",
} as const;

export const lifeAlignmentSnapshotCopy: Readonly<Record<LifeAlignmentSnapshotGroupId, { label: string; description: string }>> = {
  support: {
    label: "Trägt heute",
    description: "Bereiche, die du als unterstützend und in ihrer heutigen Richtung als passend beschrieben hast.",
  },
  change: {
    label: "Möchte Bewegung",
    description: "Bereiche mit gewünschter Veränderung, Kapazitätsspannung oder einer bewussten Abwägung.",
  },
  open: {
    label: "Bleibt offen",
    description: "Bereiche, bei denen Raum, Wirkung oder gewünschte Richtung noch nicht klar sein müssen.",
  },
  steady: {
    label: "Kann vorerst so bleiben",
    description: "Bereiche ohne ein deutliches Unterstützungs-, Spannungs- oder Offenheitssignal.",
  },
};

export const lifeAlignmentDepthCopy = {
  evidenceLabel: "Warum sehe ich das?",
  pathsBoundary:
    "Diese Wege sind Möglichkeiten, keine Rangliste und keine Empfehlung für eine große Lebensentscheidung. Du kannst einen Weg verändern, kombinieren oder bewusst nicht wählen.",
  toolsBoundary:
    "Die kleinen Werkzeuge arbeiten nur mit deinen Angaben. Sie speichern nichts und sollen Beobachtung oder Gespräch erleichtern – nicht dein Leben vermessen.",
} as const;
