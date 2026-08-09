import type {
  SelfReflectionDimensionId,
  SelfReflectionEvidenceRole,
  SelfReflectionQuestion,
  SelfReflectionResultSectionId,
  SelfReflectionSection,
} from "@/types/find-your-next-step";

export const selfReflectionIntro = {
  eyebrow: "Beta · Strukturierte Selbstreflexion",
  title: "Ein ruhiger Blick auf das, was dir gerade hilft.",
  description:
    "Diese Journey macht Muster in deinen aktuellen Prioritäten, deiner Energie und hilfreichen Bedingungen sichtbar. Sie ist eine Momentaufnahme – kein festes Persönlichkeitsprofil.",
  canDo: [
    "wiederkehrende Werte und Bedürfnisse sichtbar machen",
    "Arbeits- und Alltagsbedingungen gemeinsam betrachten",
    "hilfreiche Kombinationen und Spannungsfelder einordnen",
  ],
  cannotDo: [
    "keine Persönlichkeit, Eignung oder Leistungsfähigkeit bewerten",
    "keine medizinische oder psychologische Diagnose stellen",
    "keine wissenschaftliche Validierung ersetzen",
  ],
  duration: "15 Reflexionsentscheidungen in 5 Abschnitten · etwa 8–10 Minuten",
  privacy:
    "Deine Antworten werden nicht gespeichert und gehen verloren, wenn du die Seite neu lädst oder verlässt.",
} as const;

export const selfReflectionSections: readonly SelfReflectionSection[] = [
  {
    id: "priorities",
    title: "Was trägt dich?",
    description: "Werte, persönliche Prioritäten und das Gefühl, dass etwas für dich stimmig ist.",
  },
  {
    id: "decisions",
    title: "Wie gehst du vor und entscheidest?",
    description: "Wie du im Alltag, in Vorhaben und bei offenen Entscheidungen Orientierung findest.",
  },
  {
    id: "energy",
    title: "Energie und Aufmerksamkeit",
    description: "Was dich eher trägt, was Fokus ermöglicht und was längerfristig Kraft kosten kann.",
  },
  {
    id: "conditions",
    title: "Was hilft dir bei Veränderung?",
    description: "Bedingungen, die Halt geben, ohne Entwicklung oder Freiheit unnötig einzuengen.",
  },
  {
    id: "self-view",
    title: "Was erkennst du bei dir wieder?",
    description: "Eigene Beobachtungen, Kontextabhängigkeit und das, was im Ergebnis nicht fehlen sollte.",
  },
] as const;

export const selfReflectionDimensions: Readonly<
  Record<
    SelfReflectionDimensionId,
    {
      label: string;
      copy: Partial<Record<SelfReflectionResultSectionId, string>>;
    }
  >
> = {
  agency: {
    label: "Entscheidungsspielraum",
    copy: {
      importance: "Eigener Gestaltungsspielraum wirkt als wiederkehrende Priorität.",
      work: "Du scheinst Vorgehen und Reihenfolge gern mitgestalten zu wollen.",
      energyGain: "Eigener Spielraum könnte dir eher Energie geben.",
      energyDrain: "Sehr enge Vorgaben ohne eigenen Spielraum könnten dich eher Kraft kosten.",
      conditions: "Ein klarer Rahmen mit Freiheit innerhalb dieses Rahmens könnte hilfreich sein.",
    },
  },
  orientation: {
    label: "Orientierung",
    copy: {
      importance: "Klarheit über Richtung und Prioritäten wirkt für dich bedeutsam.",
      work: "Klare Ziele und nachvollziehbare Kriterien könnten dir das Vorgehen erleichtern.",
      energyGain: "Eine verständliche Richtung könnte dir helfen, deine Energie gezielter einzusetzen.",
      energyDrain: "Unklare Erwartungen oder ständig wechselnde Prioritäten könnten dich eher Kraft kosten.",
      conditions: "Überschaubare Ziele und erkennbare Grenzen könnten dir guten Halt geben.",
    },
  },
  reliability: {
    label: "Verlässlichkeit",
    copy: {
      importance: "Eine tragfähige und verlässliche Basis zeigt sich als wichtige Bedingung.",
      work: "Ein nachvollziehbarer Rhythmus könnte dir helfen, Vorhaben ruhig weiterzuführen.",
      energyGain: "Verlässliche Abläufe könnten dir eher Energie für das Wesentliche lassen.",
      energyDrain: "Dauernde kurzfristige Veränderungen ohne stabile Grundlage könnten dich eher belasten.",
      conditions: "Planbare Eckpunkte könnten dir Sicherheit geben, ohne alles festzulegen.",
    },
  },
  depth: {
    label: "Vertiefung",
    copy: {
      importance: "Zeit für ununterbrochene Vertiefung wirkt in deinen Antworten bedeutsam.",
      work: "Du scheinst Themen gern mit ausreichend Ruhe und Aufmerksamkeit zu durchdringen.",
      energyGain: "Geschützte Fokuszeit könnte dir eher Energie geben.",
      energyDrain: "Viele Unterbrechungen und ständige Wechsel könnten dich eher Kraft kosten.",
      conditions: "Längere ungestörte Zeitfenster könnten für dich hilfreich sein.",
    },
  },
  variety: {
    label: "Abwechslung",
    copy: {
      importance: "Neue Impulse und wechselnde Perspektiven wirken als wiederkehrende Priorität.",
      work: "Ein bewusster Wechsel zwischen Themen oder Vorgehensweisen könnte dir entsprechen.",
      energyGain: "Abwechslung und neue Eindrücke könnten dir eher Energie geben.",
      energyDrain: "Lange Gleichförmigkeit ohne neue Impulse könnte dich eher Kraft kosten.",
      conditions: "Eine verlässliche Basis mit Raum für Wechsel könnte hilfreich sein.",
    },
  },
  connection: {
    label: "Verbindung",
    copy: {
      importance: "Echter Austausch und Verbindung mit anderen wirken für dich bedeutsam.",
      work: "Gezielte Zusammenarbeit könnte dir helfen, Gedanken weiterzuentwickeln.",
      energyGain: "Guter Austausch mit anderen könnte dir eher Energie geben.",
      energyDrain: "Längere Phasen ohne passenden Austausch könnten dich eher Kraft kosten.",
      conditions: "Erreichbare Menschen und bewusst gewählte Austauschmomente könnten hilfreich sein.",
    },
  },
  recovery: {
    label: "Rückzug und Erholung",
    copy: {
      importance: "Zeit für Rückzug und Regeneration zeigt sich als wichtige Bedingung.",
      work: "Pausen und geschützte Ruhephasen könnten dir helfen, langfristig aufmerksam zu bleiben.",
      energyGain: "Ungestörte Zeit für dich könnte dir eher neue Energie geben.",
      energyDrain: "Dauernde Erreichbarkeit ohne echten Rückzug könnte dich eher Kraft kosten.",
      conditions: "Ein Rhythmus mit verlässlichen Erholungsräumen könnte hilfreich sein.",
    },
  },
  growth: {
    label: "Entwicklung",
    copy: {
      importance: "Lernen und persönliche Entwicklung wirken als wiederkehrende Priorität.",
      work: "Neue Herausforderungen könnten dir helfen, Interesse und Bewegung zu erhalten.",
      energyGain: "Etwas Neues zu verstehen oder zu erproben könnte dir eher Energie geben.",
      energyDrain: "Lange Phasen ohne Lern- oder Entwicklungsspielraum könnten dich eher Kraft kosten.",
      conditions: "Eine erreichbare Herausforderung mit Zeit zum Lernen könnte hilfreich sein.",
    },
  },
  purpose: {
    label: "Sinn und Beitrag",
    copy: {
      importance: "Erkennbare Bedeutung und ein persönlicher Beitrag wirken für dich besonders wichtig.",
      work: "Du scheinst Entscheidungen gern mit ihrer Wirkung und Bedeutung zu verbinden.",
      energyGain: "Ein sichtbarer sinnvoller Beitrag könnte dir eher Energie geben.",
      energyDrain: "Tätigkeiten ohne erkennbare Bedeutung könnten dich eher Kraft kosten.",
      conditions: "Eine nachvollziehbare Verbindung zwischen deinem Tun und seiner Wirkung könnte hilfreich sein.",
    },
  },
  feedback: {
    label: "Rückmeldung",
    copy: {
      importance: "Hilfreiche Resonanz zeigt sich als bedeutsamer Orientierungspunkt.",
      work: "Passende Rückmeldungen könnten dir helfen, Entscheidungen und Fortschritt einzuordnen.",
      energyGain: "Ehrliche und hilfreiche Resonanz könnte dir eher Energie geben.",
      energyDrain: "Lange ohne Rückmeldung oder erkennbare Resonanz zu bleiben, könnte dich eher Kraft kosten.",
      conditions: "Wenige, verlässliche Feedbackpunkte könnten für dich hilfreich sein.",
    },
  },
};

const dimensionOptions = (
  prefix: string,
  weight: 1 | 2,
): SelfReflectionQuestion["options"] => [
  { id: `${prefix}-agency`, label: "Eigene Entscheidungen und Gestaltungsspielraum", signals: [{ dimension: "agency", weight }] },
  { id: `${prefix}-orientation`, label: "Eine klare Richtung und verständliche Prioritäten", signals: [{ dimension: "orientation", weight }] },
  { id: `${prefix}-reliability`, label: "Verlässlichkeit und eine tragfähige Basis", signals: [{ dimension: "reliability", weight }] },
  { id: `${prefix}-depth`, label: "Zeit, mich wirklich in etwas zu vertiefen", signals: [{ dimension: "depth", weight }] },
  { id: `${prefix}-variety`, label: "Abwechslung und neue Impulse", signals: [{ dimension: "variety", weight }] },
  { id: `${prefix}-connection`, label: "Echter Austausch und Verbindung mit anderen", signals: [{ dimension: "connection", weight }] },
  { id: `${prefix}-recovery`, label: "Rückzug, Ruhe und Erholung", signals: [{ dimension: "recovery", weight }] },
  { id: `${prefix}-growth`, label: "Lernen, Entwicklung und Herausforderung", signals: [{ dimension: "growth", weight }] },
  { id: `${prefix}-purpose`, label: "Sinn, Wirkung und ein persönlicher Beitrag", signals: [{ dimension: "purpose", weight }] },
  { id: `${prefix}-feedback`, label: "Ehrliche und hilfreiche Rückmeldung", signals: [{ dimension: "feedback", weight }] },
];

export const selfReflectionQuestions: readonly SelfReflectionQuestion[] = [
  {
    id: "priorities-everyday",
    sectionId: "priorities",
    prompt: "Was soll in deinem Alltag möglichst nicht zu kurz kommen?",
    context: "Wähle, was sich gerade wirklich bedeutsam anfühlt – nicht, was allgemein gut klingt.",
    format: "multi",
    evidenceRole: "priority",
    minSelections: 2,
    maxSelections: 4,
    options: dimensionOptions("everyday", 1),
  },
  {
    id: "priorities-now",
    sectionId: "priorities",
    prompt: "Wenn im Moment nur zwei Bedingungen besonders zählen dürften: Welche wären es?",
    context: "Es geht um deine aktuelle Lebensphase. Die Auswahl darf sich später verändern.",
    format: "priority",
    evidenceRole: "priority",
    minSelections: 2,
    maxSelections: 2,
    options: dimensionOptions("priority", 2),
  },
  {
    id: "priorities-good-day",
    sectionId: "priorities",
    prompt: "Woran merkst du am ehesten, dass ein Tag für dich stimmig war?",
    context: "Wähle ein oder zwei Momente, die dieses Gefühl am besten treffen.",
    format: "multi",
    evidenceRole: "priority",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "good-day-agency-orientation", label: "Ich wusste, worauf es ankommt, und konnte meinen Weg selbst wählen.", signals: [{ dimension: "agency", weight: 1 }, { dimension: "orientation", weight: 1 }] },
      { id: "good-day-reliability-recovery", label: "Der Tag hatte einen tragfähigen Rhythmus und ließ Raum zum Durchatmen.", signals: [{ dimension: "reliability", weight: 1 }, { dimension: "recovery", weight: 1 }] },
      { id: "good-day-depth-variety", label: "Ich konnte mich vertiefen und bekam zugleich einen neuen Impuls.", signals: [{ dimension: "depth", weight: 1 }, { dimension: "variety", weight: 1 }] },
      { id: "good-day-connection-feedback", label: "Ein guter Austausch oder ehrliche Resonanz hat etwas bewegt.", signals: [{ dimension: "connection", weight: 1 }, { dimension: "feedback", weight: 1 }] },
      { id: "good-day-growth-purpose", label: "Ich habe etwas gelernt oder zu etwas beigetragen, das mir sinnvoll erschien.", signals: [{ dimension: "growth", weight: 1 }, { dimension: "purpose", weight: 1 }] },
    ],
  },
  {
    id: "decisions-new-beginning",
    sectionId: "decisions",
    prompt: "Wenn etwas Neues beginnt: Was hilft dir am ehesten beim Einstieg?",
    context: "Das kann eine private Veränderung, ein Vorhaben oder eine neue Aufgabe sein.",
    format: "multi",
    evidenceRole: "decision",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "beginning-orientation", label: "Ein verständliches Ziel und erkennbare nächste Schritte.", signals: [{ dimension: "orientation", weight: 1 }] },
      { id: "beginning-agency", label: "Genug Freiheit, meinen eigenen Zugang zu finden.", signals: [{ dimension: "agency", weight: 1 }] },
      { id: "beginning-depth", label: "Zeit, erst einmal ruhig zu beobachten und nachzudenken.", signals: [{ dimension: "depth", weight: 1 }] },
      { id: "beginning-connection-feedback", label: "Ein Gespräch und eine erste ehrliche Rückmeldung.", signals: [{ dimension: "connection", weight: 1 }, { dimension: "feedback", weight: 1 }] },
      { id: "beginning-variety-growth", label: "Ausprobieren, Neues lernen und den Weg dabei entwickeln.", signals: [{ dimension: "variety", weight: 1 }, { dimension: "growth", weight: 1 }] },
      { id: "beginning-reliability", label: "Ein verlässlicher Rahmen, der nicht sofort wieder wechselt.", signals: [{ dimension: "reliability", weight: 1 }] },
    ],
  },
  {
    id: "decisions-uncertainty",
    sectionId: "decisions",
    prompt: "Eine wichtige Entscheidung ist noch offen. Was bringt dich eher weiter?",
    context: "Mehrere Antworten dürfen gleichzeitig stimmen.",
    format: "multi",
    evidenceRole: "decision",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "uncertainty-depth-agency", label: "Eigene Denkzeit, bevor andere Perspektiven dazukommen.", signals: [{ dimension: "depth", weight: 1 }, { dimension: "agency", weight: 1 }] },
      { id: "uncertainty-orientation", label: "Klare Kriterien, an denen ich Möglichkeiten prüfen kann.", signals: [{ dimension: "orientation", weight: 1 }] },
      { id: "uncertainty-connection-feedback", label: "Gespräche mit Menschen, deren Blick ich schätze.", signals: [{ dimension: "connection", weight: 1 }, { dimension: "feedback", weight: 1 }] },
      { id: "uncertainty-variety-growth", label: "Ein kleiner Versuch, aus dem ich konkret lernen kann.", signals: [{ dimension: "variety", weight: 1 }, { dimension: "growth", weight: 1 }] },
      { id: "uncertainty-reliability-purpose", label: "Eine Lösung, die tragfähig wirkt und für mich Bedeutung hat.", signals: [{ dimension: "reliability", weight: 1 }, { dimension: "purpose", weight: 1 }] },
    ],
  },
  {
    id: "decisions-rhythm",
    sectionId: "decisions",
    prompt: "Welcher Rhythmus unterstützt dich eher, wenn mehrere Dinge zusammenkommen?",
    context: "Denke an Alltag und Vorhaben insgesamt, nicht nur an Erwerbsarbeit.",
    format: "multi",
    evidenceRole: "work",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "rhythm-depth-orientation", label: "Klare Prioritäten und längere ungestörte Zeitfenster.", signals: [{ dimension: "depth", weight: 1 }, { dimension: "orientation", weight: 1 }] },
      { id: "rhythm-reliability", label: "Ein wiedererkennbarer Ablauf mit planbaren Eckpunkten.", signals: [{ dimension: "reliability", weight: 1 }] },
      { id: "rhythm-variety-agency", label: "Flexibilität und ein bewusster Wechsel zwischen Themen.", signals: [{ dimension: "variety", weight: 1 }, { dimension: "agency", weight: 1 }] },
      { id: "rhythm-connection-feedback", label: "Regelmäßige Austausch- und Rückmeldungsmomente.", signals: [{ dimension: "connection", weight: 1 }, { dimension: "feedback", weight: 1 }] },
      { id: "rhythm-recovery", label: "Pausen und Rückzugszeiten, die nicht erst übrig bleiben müssen.", signals: [{ dimension: "recovery", weight: 1 }] },
    ],
  },
  {
    id: "energy-recharge",
    sectionId: "energy",
    prompt: "Was hilft dir eher, nach einer fordernden Phase wieder Energie zu finden?",
    context: "Wähle ein oder zwei Formen, die sich für dich tatsächlich erholsam anfühlen.",
    format: "multi",
    evidenceRole: "energyGain",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "recharge-recovery-depth", label: "Ruhe, Rückzug und Zeit ohne neue Anforderungen.", signals: [{ dimension: "recovery", weight: 1 }, { dimension: "depth", weight: 1 }] },
      { id: "recharge-connection-feedback", label: "Ein ehrliches Gespräch mit einem vertrauten Menschen.", signals: [{ dimension: "connection", weight: 1 }, { dimension: "feedback", weight: 1 }] },
      { id: "recharge-variety", label: "Ein Orts-, Themen- oder Aktivitätswechsel.", signals: [{ dimension: "variety", weight: 1 }] },
      { id: "recharge-purpose", label: "Etwas tun, dessen Bedeutung oder Wirkung ich direkt spüre.", signals: [{ dimension: "purpose", weight: 1 }] },
      { id: "recharge-growth-agency", label: "Aus eigenem Antrieb etwas Neues entdecken oder ausprobieren.", signals: [{ dimension: "growth", weight: 1 }, { dimension: "agency", weight: 1 }] },
      { id: "recharge-reliability", label: "Zu einem vertrauten, verlässlichen Rhythmus zurückkehren.", signals: [{ dimension: "reliability", weight: 1 }] },
    ],
  },
  {
    id: "energy-sustaining",
    sectionId: "energy",
    prompt: "Bei welchem Erleben bleibt deine Energie eher erhalten?",
    context: "Es geht nicht darum, was du leisten kannst, sondern was sich längerfristig tragfähig anfühlt.",
    format: "multi",
    evidenceRole: "energyGain",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "sustaining-depth-recovery", label: "Ich kann mich vertiefen und habe danach wirklich Zeit zum Abschalten.", signals: [{ dimension: "depth", weight: 1 }, { dimension: "recovery", weight: 1 }] },
      { id: "sustaining-variety-growth", label: "Ich erlebe Abwechslung und lerne dabei etwas Neues.", signals: [{ dimension: "variety", weight: 1 }, { dimension: "growth", weight: 1 }] },
      { id: "sustaining-connection-feedback", label: "Ich bin mit anderen verbunden und bekomme hilfreiche Resonanz.", signals: [{ dimension: "connection", weight: 1 }, { dimension: "feedback", weight: 1 }] },
      { id: "sustaining-agency-orientation", label: "Die Richtung ist klar, aber ich kann den Weg mitgestalten.", signals: [{ dimension: "agency", weight: 1 }, { dimension: "orientation", weight: 1 }] },
      { id: "sustaining-reliability-purpose", label: "Der Rahmen ist verlässlich und mein Beitrag fühlt sich sinnvoll an.", signals: [{ dimension: "reliability", weight: 1 }, { dimension: "purpose", weight: 1 }] },
    ],
  },
  {
    id: "energy-drains",
    sectionId: "energy",
    prompt: "Was könnte dich über längere Zeit eher Kraft kosten, auch wenn du damit umgehen kannst?",
    context: "Wähle nur Belastungen, die du bei dir tatsächlich wiedererkennst.",
    format: "multi",
    evidenceRole: "energyDrain",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "drain-depth-recovery", label: "Viele Unterbrechungen und kaum echter Rückzug.", signals: [{ dimension: "depth", weight: 1 }, { dimension: "recovery", weight: 1 }] },
      { id: "drain-variety-growth", label: "Lange Gleichförmigkeit ohne neue Impulse oder Entwicklung.", signals: [{ dimension: "variety", weight: 1 }, { dimension: "growth", weight: 1 }] },
      { id: "drain-connection-feedback", label: "Lange ohne passenden Austausch oder hilfreiche Resonanz zu bleiben.", signals: [{ dimension: "connection", weight: 1 }, { dimension: "feedback", weight: 1 }] },
      { id: "drain-agency-orientation", label: "Enge Vorgaben bei gleichzeitig unklarer Richtung.", signals: [{ dimension: "agency", weight: 1 }, { dimension: "orientation", weight: 1 }] },
      { id: "drain-reliability-purpose", label: "Ständige kurzfristige Wechsel ohne stabile Basis oder erkennbaren Sinn.", signals: [{ dimension: "reliability", weight: 1 }, { dimension: "purpose", weight: 1 }] },
    ],
  },
  {
    id: "conditions-change",
    sectionId: "conditions",
    prompt: "Wenn sich vieles verändert: Was hilft dir, beweglich zu bleiben?",
    context: "Denke an persönliche, soziale oder praktische Veränderungen.",
    format: "multi",
    evidenceRole: "condition",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "change-reliability-orientation", label: "Einige verlässliche Eckpunkte und eine verständliche Richtung.", signals: [{ dimension: "reliability", weight: 1 }, { dimension: "orientation", weight: 1 }] },
      { id: "change-agency-variety", label: "Spielraum, selbst zu reagieren und neue Möglichkeiten auszuprobieren.", signals: [{ dimension: "agency", weight: 1 }, { dimension: "variety", weight: 1 }] },
      { id: "change-connection-feedback", label: "Menschen, mit denen ich offen sprechen und Gedanken prüfen kann.", signals: [{ dimension: "connection", weight: 1 }, { dimension: "feedback", weight: 1 }] },
      { id: "change-depth-recovery", label: "Zeit, Veränderungen in Ruhe zu verarbeiten und Abstand zu gewinnen.", signals: [{ dimension: "depth", weight: 1 }, { dimension: "recovery", weight: 1 }] },
      { id: "change-growth-purpose", label: "Zu verstehen, was ich lernen kann und wofür die Veränderung gut sein könnte.", signals: [{ dimension: "growth", weight: 1 }, { dimension: "purpose", weight: 1 }] },
    ],
  },
  {
    id: "conditions-habitat",
    sectionId: "conditions",
    prompt: "Welche Bedingungen sollten in deinem Umfeld möglichst vorhanden sein?",
    context: "Wähle zwei oder drei – im Alltag, in Beziehungen, in Projekten oder bei der Arbeit.",
    format: "multi",
    evidenceRole: "condition",
    minSelections: 2,
    maxSelections: 3,
    options: dimensionOptions("habitat", 1),
  },
  {
    id: "conditions-combinations",
    sectionId: "conditions",
    prompt: "Welche Kombinationen klingen für dich besonders hilfreich?",
    context: "Beide Seiten einer Aussage dürfen gleichzeitig wichtig sein.",
    format: "multi",
    evidenceRole: "condition",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "combination-orientation-agency", label: "Klare Ziele und viel Freiheit beim Weg dorthin.", signals: [{ dimension: "orientation", weight: 2 }, { dimension: "agency", weight: 2 }] },
      { id: "combination-reliability-variety", label: "Eine verlässliche Basis und bewusst wechselnde Aufgaben oder Eindrücke.", signals: [{ dimension: "reliability", weight: 2 }, { dimension: "variety", weight: 2 }] },
      { id: "combination-depth-connection", label: "Geschützte Vertiefung und gezielter Austausch mit anderen.", signals: [{ dimension: "depth", weight: 2 }, { dimension: "connection", weight: 2 }] },
      { id: "combination-growth-recovery", label: "Neue Herausforderungen und echte Zeit zur Erholung.", signals: [{ dimension: "growth", weight: 2 }, { dimension: "recovery", weight: 2 }] },
      { id: "combination-purpose-feedback", label: "Ein sinnvoller Beitrag und ehrliche Resonanz darauf.", signals: [{ dimension: "purpose", weight: 2 }, { dimension: "feedback", weight: 2 }] },
    ],
  },
  {
    id: "self-view-strengths",
    sectionId: "self-view",
    prompt: "Was erkennst du als natürliche Bewegung bei dir selbst wieder?",
    context: "Das ist keine Fähigkeitsbewertung. Wähle bis zu drei Beobachtungen, die sich vertraut anfühlen.",
    format: "multi",
    evidenceRole: "selfImage",
    minSelections: 1,
    maxSelections: 3,
    options: [
      { id: "strength-overview", label: "In unübersichtlichen Situationen erst einmal Ordnung schaffen.", reflection: "Du hast ausgewählt, dass du in unübersichtlichen Situationen häufig zuerst Ordnung schaffst." },
      { id: "strength-depth", label: "Mich lange und aufmerksam mit einem Thema beschäftigen.", reflection: "Du hast ausgewählt, dass du dich häufig lange und aufmerksam mit einem Thema beschäftigst." },
      { id: "strength-connect", label: "Menschen oder unterschiedliche Perspektiven miteinander verbinden.", reflection: "Du hast ausgewählt, dass du häufig Menschen oder unterschiedliche Perspektiven verbindest." },
      { id: "strength-explore", label: "Möglichkeiten sehen und etwas Neues ausprobieren.", reflection: "Du hast ausgewählt, dass du häufig Möglichkeiten siehst und Neues ausprobierst." },
      { id: "strength-follow-through", label: "Verantwortung übernehmen und Dinge verlässlich weiterführen.", reflection: "Du hast ausgewählt, dass du häufig Verantwortung übernimmst und Dinge verlässlich weiterführst." },
      { id: "strength-meaning", label: "Nach Bedeutung fragen und den größeren Zusammenhang suchen.", reflection: "Du hast ausgewählt, dass du häufig nach Bedeutung und einem größeren Zusammenhang suchst." },
      { id: "strength-open", label: "Das möchte ich gerade bewusst offenlassen.", reflection: "", exclusive: true },
    ],
  },
  {
    id: "self-view-context",
    sectionId: "self-view",
    prompt: "Welche Präferenz hängt bei dir besonders von Situation und Aufgabe ab?",
    context: "Kontextabhängigkeit ist kein schwächeres Signal, sondern eine eigene Beobachtung.",
    format: "single",
    evidenceRole: "context",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "context-depth-connection", label: "Ob ich Rückzug oder Austausch hilfreich finde.", contextualDimensions: ["depth", "connection"] },
      { id: "context-orientation-agency", label: "Wie viel klare Führung oder eigenen Spielraum ich möchte.", contextualDimensions: ["orientation", "agency"] },
      { id: "context-reliability-variety", label: "Ob mir Verlässlichkeit oder Veränderung gerade mehr hilft.", contextualDimensions: ["reliability", "variety"] },
      { id: "context-growth-recovery", label: "Ob ich Herausforderung oder Erholung in den Vordergrund stelle.", contextualDimensions: ["growth", "recovery"] },
      { id: "context-agency-feedback", label: "Wie eigenständig ich entscheide und wann ich Rückmeldung suche.", contextualDimensions: ["agency", "feedback"] },
      { id: "context-open", label: "Das lässt sich für mich im Moment nicht klar eingrenzen." },
    ],
  },
  {
    id: "self-view-synthesis",
    sectionId: "self-view",
    prompt: "Was sollte dein Ergebnis auf keinen Fall übersehen?",
    context: "Wähle ein oder zwei Aussagen, die deine bisherigen Antworten gut zusammenführen.",
    format: "priority",
    evidenceRole: "synthesis",
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: "synthesis-orientation-agency", label: "Ich schätze eine klare Richtung und möchte meinen Weg selbst gestalten.", signals: [{ dimension: "orientation", weight: 2 }, { dimension: "agency", weight: 2 }] },
      { id: "synthesis-reliability-variety", label: "Eine stabile Grundlage und Raum für Neues gehören für mich zusammen.", signals: [{ dimension: "reliability", weight: 2 }, { dimension: "variety", weight: 2 }] },
      { id: "synthesis-depth-connection", label: "Ich möchte mich vertiefen können und zugleich bewusst verbunden bleiben.", signals: [{ dimension: "depth", weight: 2 }, { dimension: "connection", weight: 2 }] },
      { id: "synthesis-growth-recovery", label: "Entwicklung trägt mich eher, wenn Regeneration ebenfalls Platz hat.", signals: [{ dimension: "growth", weight: 2 }, { dimension: "recovery", weight: 2 }] },
      { id: "synthesis-purpose-feedback", label: "Bedeutung und ehrliche Resonanz helfen mir, meinen Beitrag einzuordnen.", signals: [{ dimension: "purpose", weight: 2 }, { dimension: "feedback", weight: 2 }] },
    ],
  },
] as const;

export const selfReflectionResultSections: readonly {
  id: SelfReflectionResultSectionId;
  title: string;
  roles: readonly SelfReflectionEvidenceRole[];
  limit: number;
}[] = [
  { id: "importance", title: "Was bei dir besonders wichtig wirkt", roles: ["priority", "synthesis"], limit: 3 },
  { id: "work", title: "Wie du wahrscheinlich gern vorgehst und entscheidest", roles: ["work", "decision"], limit: 3 },
  { id: "energyGain", title: "Was dir eher Energie geben könnte", roles: ["energyGain"], limit: 3 },
  { id: "energyDrain", title: "Was dir eher Energie kosten könnte", roles: ["energyDrain"], limit: 3 },
  { id: "conditions", title: "Welche Bedingungen hilfreich wirken", roles: ["condition", "synthesis"], limit: 3 },
] as const;

export const selfReflectionTensions: readonly {
  id: string;
  title: string;
  dimensions: readonly [SelfReflectionDimensionId, SelfReflectionDimensionId];
  text: string;
}[] = [
  { id: "orientation-agency", title: "Klare Richtung · eigener Weg", dimensions: ["orientation", "agency"], text: "Klare Ziele könnten dir helfen, während du den Weg dorthin gern selbst gestaltest." },
  { id: "reliability-variety", title: "Verlässliche Basis · neue Impulse", dimensions: ["reliability", "variety"], text: "Eine stabile Basis könnte dir Raum geben, bewusst zwischen Themen, Eindrücken oder Aufgaben zu wechseln." },
  { id: "depth-connection", title: "Vertiefung · Verbindung", dimensions: ["depth", "connection"], text: "Du könntest besonders gut mit geschützten Phasen der Vertiefung und gezieltem Austausch funktionieren." },
  { id: "growth-recovery", title: "Entwicklung · Erholung", dimensions: ["growth", "recovery"], text: "Neue Herausforderungen könnten für dich besonders stimmig sein, wenn echte Erholung ebenfalls Platz bekommt." },
  { id: "agency-feedback", title: "Eigenständigkeit · Resonanz", dimensions: ["agency", "feedback"], text: "Eigenständig zu entscheiden und an passenden Punkten Resonanz zu erhalten, könnte für dich gut zusammenpassen." },
  { id: "purpose-reliability", title: "Bedeutung · tragfähige Grundlage", dimensions: ["purpose", "reliability"], text: "Ein sinnvoller Beitrag könnte besonders tragen, wenn die Grundlage zugleich realistisch und verlässlich bleibt." },
] as const;
