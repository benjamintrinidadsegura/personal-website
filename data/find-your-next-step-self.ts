import type {
  SelfReflectionDimensionId,
  SelfReflectionEvidenceRole,
  SelfReflectionQuestion,
  SelfReflectionResultSectionId,
  SelfReflectionSection,
} from "@/types/find-your-next-step";
import type { Locale } from "@/lib/i18n/config";
import { formatSelfOption, getExtendedSelfIntro, getSelfDimensionCopy, getSelfResultSectionTitles, selfLocaleCopy } from "@/data/find-your-next-step-self-locales";

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

const selfReflectionIntroEn = {
  eyebrow: "Beta · Structured self-reflection",
  title: "A calm look at what is helping you right now.",
  description: "This journey makes patterns in your current priorities, energy and helpful conditions visible. It is a snapshot — not a fixed personality profile.",
  canDo: ["make recurring values and needs visible", "consider conditions in work and everyday life together", "put helpful combinations and tensions into context"],
  cannotDo: ["not assess personality, aptitude or performance", "not make a medical or psychological diagnosis", "not replace scientific validation"],
  duration: "15 reflection choices across 5 sections · about 8–10 minutes",
  privacy: "Your answers are not stored and will be lost if you reload or leave the page.",
} as const;

const sectionCopyEn = {
  priorities: { title: "What sustains you?", description: "Values, personal priorities and the sense that something feels right for you." },
  decisions: { title: "How do you approach things and decide?", description: "How you find direction in everyday life, projects and open decisions." },
  energy: { title: "Energy and attention", description: "What tends to sustain you, what enables focus and what may drain energy over time." },
  conditions: { title: "What helps you through change?", description: "Conditions that provide support without unnecessarily limiting development or freedom." },
  "self-view": { title: "What do you recognise in yourself?", description: "Your own observations, the role of context and what your result should not leave out." },
} as const;

const dimensionCopyEn: typeof selfReflectionDimensions = {
  agency: { label: "Room to decide", copy: { importance: "Having room to shape things yourself appears to be a recurring priority.", work: "You seem to prefer having a say in the approach and sequence.", energyGain: "Having room to decide for yourself may be more likely to give you energy.", energyDrain: "Very tight instructions without room of your own may be more likely to drain you.", conditions: "A clear framework with freedom inside it may be helpful." } },
  orientation: { label: "Direction", copy: { importance: "Clarity about direction and priorities appears meaningful to you.", work: "Clear goals and understandable criteria may make it easier for you to move forward.", energyGain: "A comprehensible direction may help you use your energy more deliberately.", energyDrain: "Unclear expectations or constantly changing priorities may be more likely to drain you.", conditions: "Manageable goals and visible boundaries may give you useful support." } },
  reliability: { label: "Reliability", copy: { importance: "A sustainable and reliable foundation appears to be an important condition.", work: "A comprehensible rhythm may help you carry projects forward calmly.", energyGain: "Reliable routines may leave you more energy for what matters.", energyDrain: "Constant short-notice changes without a stable foundation may be more likely to burden you.", conditions: "Predictable anchor points may give you security without determining everything." } },
  depth: { label: "Depth", copy: { importance: "Time for uninterrupted depth appears meaningful in your answers.", work: "You seem to like exploring subjects with enough calm and attention.", energyGain: "Protected focus time may be more likely to give you energy.", energyDrain: "Many interruptions and constant switching may be more likely to drain you.", conditions: "Longer uninterrupted blocks of time may be helpful for you." } },
  variety: { label: "Variety", copy: { importance: "Fresh input and changing perspectives appear to be a recurring priority.", work: "A deliberate shift between subjects or approaches may suit you.", energyGain: "Variety and new impressions may be more likely to give you energy.", energyDrain: "Long periods of sameness without fresh input may be more likely to drain you.", conditions: "A reliable base with room for change may be helpful." } },
  connection: { label: "Connection", copy: { importance: "Genuine exchange and connection with others appear meaningful to you.", work: "Purposeful collaboration may help you develop your thinking.", energyGain: "Good exchange with other people may be more likely to give you energy.", energyDrain: "Long periods without the right exchange may be more likely to drain you.", conditions: "People you can reach and deliberately chosen moments of exchange may be helpful." } },
  recovery: { label: "Solitude and recovery", copy: { importance: "Time for solitude and recovery appears to be an important condition.", work: "Breaks and protected quiet periods may help you stay attentive over time.", energyGain: "Uninterrupted time for yourself may be more likely to restore your energy.", energyDrain: "Constant availability without real withdrawal may be more likely to drain you.", conditions: "A rhythm with reliable space for recovery may be helpful." } },
  growth: { label: "Growth", copy: { importance: "Learning and personal growth appear to be a recurring priority.", work: "New challenges may help you retain interest and momentum.", energyGain: "Understanding or trying something new may be more likely to give you energy.", energyDrain: "Long periods without room to learn or grow may be more likely to drain you.", conditions: "An achievable challenge with time to learn may be helpful." } },
  purpose: { label: "Purpose and contribution", copy: { importance: "Visible meaning and making a personal contribution appear especially important to you.", work: "You seem to like connecting decisions with their effect and meaning.", energyGain: "A visible, meaningful contribution may be more likely to give you energy.", energyDrain: "Activities without a recognisable purpose may be more likely to drain you.", conditions: "A clear connection between what you do and its effect may be helpful." } },
  feedback: { label: "Feedback", copy: { importance: "Helpful feedback appears to be a meaningful point of orientation.", work: "The right feedback may help you put decisions and progress into context.", energyGain: "Honest and helpful feedback may be more likely to give you energy.", energyDrain: "Going a long time without feedback or a visible response may be more likely to drain you.", conditions: "A few reliable feedback points may be helpful for you." } },
};

const questionCopyEn: Readonly<Record<string, { prompt: string; context: string }>> = {
  "priorities-everyday": { prompt: "What should ideally not be neglected in your everyday life?", context: "Choose what genuinely feels meaningful right now — not what merely sounds good in general." },
  "priorities-now": { prompt: "If only two conditions could matter especially right now, which would they be?", context: "This is about your current phase of life. Your choice may change later." },
  "priorities-good-day": { prompt: "What is the clearest sign that a day felt right for you?", context: "Choose one or two moments that best capture that feeling." },
  "decisions-new-beginning": { prompt: "When something new begins, what helps you get started?", context: "This might be a personal change, a project or a new task." },
  "decisions-uncertainty": { prompt: "An important decision is still open. What is more likely to move you forward?", context: "Several answers may be true at the same time." },
  "decisions-rhythm": { prompt: "Which rhythm tends to support you when several things come together?", context: "Think about everyday life and projects as a whole, not only paid work." },
  "energy-recharge": { prompt: "What is more likely to help you recover energy after a demanding period?", context: "Choose one or two forms that genuinely feel restorative to you." },
  "energy-sustaining": { prompt: "In which experience is your energy more likely to remain steady?", context: "This is not about what you can perform, but what feels sustainable over time." },
  "energy-drains": { prompt: "What might be more likely to drain you over time, even if you can cope with it?", context: "Choose only pressures you genuinely recognise in yourself." },
  "conditions-change": { prompt: "When many things change, what helps you stay flexible?", context: "Think of personal, social or practical changes." },
  "conditions-habitat": { prompt: "Which conditions should ideally be present in your environment?", context: "Choose two or three — in everyday life, relationships, projects or work." },
  "conditions-combinations": { prompt: "Which combinations sound especially helpful to you?", context: "Both sides of a statement may matter at the same time." },
  "self-view-strengths": { prompt: "What do you recognise as a natural tendency in yourself?", context: "This is not an assessment of ability. Choose up to three observations that feel familiar." },
  "self-view-context": { prompt: "Which preference depends especially on the situation and task for you?", context: "Being context-dependent is not a weaker signal; it is an observation in its own right." },
  "self-view-synthesis": { prompt: "What should your result definitely not overlook?", context: "Choose one or two statements that bring your previous answers together well." },
};

const dimensionOptionLabelEn: Readonly<Record<SelfReflectionDimensionId, string>> = {
  agency: "Making my own decisions and having room to shape things",
  orientation: "A clear direction and understandable priorities",
  reliability: "Reliability and a sustainable foundation",
  depth: "Time to become genuinely absorbed in something",
  variety: "Variety and fresh input",
  connection: "Genuine exchange and connection with others",
  recovery: "Solitude, quiet and recovery",
  growth: "Learning, growth and challenge",
  purpose: "Purpose, impact and making a personal contribution",
  feedback: "Honest and helpful feedback",
};

const optionCopyEn: Readonly<Record<string, { label: string; reflection?: string }>> = {
  "good-day-agency-orientation": { label: "I knew what mattered and could choose my own way forward." },
  "good-day-reliability-recovery": { label: "The day had a sustainable rhythm and left room to breathe." },
  "good-day-depth-variety": { label: "I could go into depth while also receiving fresh input." },
  "good-day-connection-feedback": { label: "A good conversation or honest feedback shifted something." },
  "good-day-growth-purpose": { label: "I learnt something or contributed to something that felt meaningful." },
  "beginning-orientation": { label: "An understandable goal and visible next steps." }, "beginning-agency": { label: "Enough freedom to find my own way in." }, "beginning-depth": { label: "Time to observe and think quietly first." }, "beginning-connection-feedback": { label: "A conversation and some initial honest feedback." }, "beginning-variety-growth": { label: "Trying things, learning something new and developing the path as I go." }, "beginning-reliability": { label: "A reliable framework that will not immediately change again." },
  "uncertainty-depth-agency": { label: "Time to think for myself before other perspectives enter." }, "uncertainty-orientation": { label: "Clear criteria against which I can assess the options." }, "uncertainty-connection-feedback": { label: "Conversations with people whose perspective I value." }, "uncertainty-variety-growth": { label: "A small experiment from which I can learn something concrete." }, "uncertainty-reliability-purpose": { label: "A solution that feels sustainable and meaningful to me." },
  "rhythm-depth-orientation": { label: "Clear priorities and longer uninterrupted blocks of time." }, "rhythm-reliability": { label: "A recognisable routine with predictable anchor points." }, "rhythm-variety-agency": { label: "Flexibility and deliberately switching between subjects." }, "rhythm-connection-feedback": { label: "Regular moments for exchange and feedback." }, "rhythm-recovery": { label: "Breaks and time alone that do not merely have to be left over." },
  "recharge-recovery-depth": { label: "Quiet, solitude and time without fresh demands." }, "recharge-connection-feedback": { label: "An honest conversation with someone I trust." }, "recharge-variety": { label: "A change of place, subject or activity." }, "recharge-purpose": { label: "Doing something whose meaning or effect I can feel directly." }, "recharge-growth-agency": { label: "Discovering or trying something new on my own initiative." }, "recharge-reliability": { label: "Returning to a familiar, reliable rhythm." },
  "sustaining-depth-recovery": { label: "I can go into depth and genuinely switch off afterwards." }, "sustaining-variety-growth": { label: "I experience variety and learn something new in the process." }, "sustaining-connection-feedback": { label: "I feel connected to others and receive helpful feedback." }, "sustaining-agency-orientation": { label: "The direction is clear, but I can help shape the path." }, "sustaining-reliability-purpose": { label: "The framework is reliable and my contribution feels meaningful." },
  "drain-depth-recovery": { label: "Many interruptions and hardly any real solitude." }, "drain-variety-growth": { label: "Long periods of sameness without fresh input or growth." }, "drain-connection-feedback": { label: "Going a long time without the right exchange or helpful feedback." }, "drain-agency-orientation": { label: "Tight instructions combined with an unclear direction." }, "drain-reliability-purpose": { label: "Constant short-notice changes without a stable base or recognisable purpose." },
  "change-reliability-orientation": { label: "A few reliable anchor points and an understandable direction." }, "change-agency-variety": { label: "Room to respond myself and try new possibilities." }, "change-connection-feedback": { label: "People with whom I can speak openly and test my thinking." }, "change-depth-recovery": { label: "Time to process changes calmly and gain some distance." }, "change-growth-purpose": { label: "Understanding what I can learn and what the change might be good for." },
  "combination-orientation-agency": { label: "Clear goals and plenty of freedom in how to reach them." }, "combination-reliability-variety": { label: "A reliable base and deliberately changing tasks or impressions." }, "combination-depth-connection": { label: "Protected depth and purposeful exchange with others." }, "combination-growth-recovery": { label: "New challenges and genuine time to recover." }, "combination-purpose-feedback": { label: "A meaningful contribution and honest feedback on it." },
  "strength-overview": { label: "Bring order to confusing situations first.", reflection: "You selected that you often begin by bringing order to confusing situations." }, "strength-depth": { label: "Stay with a subject for a long time and give it close attention.", reflection: "You selected that you often stay with a subject for a long time and give it close attention." }, "strength-connect": { label: "Connect people or different perspectives.", reflection: "You selected that you often connect people or different perspectives." }, "strength-explore": { label: "See possibilities and try something new.", reflection: "You selected that you often see possibilities and try new things." }, "strength-follow-through": { label: "Take responsibility and carry things forward reliably.", reflection: "You selected that you often take responsibility and carry things forward reliably." }, "strength-meaning": { label: "Ask about meaning and look for the wider context.", reflection: "You selected that you often ask about meaning and look for the wider context." }, "strength-open": { label: "I deliberately want to leave this open for now.", reflection: "" },
  "context-depth-connection": { label: "Whether solitude or exchange feels helpful." }, "context-orientation-agency": { label: "How much clear direction or room of my own I want." }, "context-reliability-variety": { label: "Whether reliability or change helps me more right now." }, "context-growth-recovery": { label: "Whether I put challenge or recovery first." }, "context-agency-feedback": { label: "How independently I decide and when I seek feedback." }, "context-open": { label: "I cannot narrow this down clearly at the moment." },
  "synthesis-orientation-agency": { label: "I value a clear direction and want to shape my own path." }, "synthesis-reliability-variety": { label: "A stable foundation and room for something new belong together for me." }, "synthesis-depth-connection": { label: "I want to be able to go into depth while remaining deliberately connected." }, "synthesis-growth-recovery": { label: "Growth tends to sustain me when recovery has space as well." }, "synthesis-purpose-feedback": { label: "Meaning and honest feedback help me put my contribution into context." },
};

const resultSectionCopyEn: Readonly<Record<SelfReflectionResultSectionId, string>> = {
  importance: "What appears especially important to you", work: "How you probably like to approach things and decide", energyGain: "What may be more likely to give you energy", energyDrain: "What may be more likely to drain you", conditions: "Which conditions appear helpful", selfImage: "What you recognise in yourself",
};

const tensionCopyEn: Readonly<Record<string, { title: string; text: string }>> = {
  "orientation-agency": { title: "Clear direction · your own path", text: "Clear goals may help you while you prefer to shape the path towards them yourself." },
  "reliability-variety": { title: "Reliable base · fresh input", text: "A stable base may give you room to move deliberately between subjects, impressions or tasks." },
  "depth-connection": { title: "Depth · connection", text: "You may function especially well with protected periods of depth and purposeful exchange." },
  "growth-recovery": { title: "Growth · recovery", text: "New challenges may feel especially right for you when genuine recovery has space as well." },
  "agency-feedback": { title: "Independence · feedback", text: "Deciding independently and receiving feedback at the right points may work well together for you." },
  "purpose-reliability": { title: "Meaning · sustainable foundation", text: "A meaningful contribution may sustain you especially well when the foundation remains realistic and reliable." },
};

function localizeSelfOption(option: SelfReflectionQuestion["options"][number]) {
  const direct = optionCopyEn[option.id];
  if (direct) return { ...option, ...direct };
  const dimension = (Object.keys(dimensionOptionLabelEn) as SelfReflectionDimensionId[]).find((id) => option.id.endsWith(`-${id}`));
  return dimension ? { ...option, label: dimensionOptionLabelEn[dimension] } : option;
}

export function getSelfReflectionIntro(locale: Locale) {
  return ({ de: () => selfReflectionIntro, en: () => selfReflectionIntroEn, es: () => getExtendedSelfIntro("es"), tr: () => getExtendedSelfIntro("tr"), pl: () => getExtendedSelfIntro("pl"), el: () => getExtendedSelfIntro("el"), ru: () => getExtendedSelfIntro("ru") } as const)[locale]();
}

export function getSelfReflectionSections(locale: Locale): readonly SelfReflectionSection[] {
  const extended = (key: Exclude<Locale, "de" | "en">) => selfReflectionSections.map((section, index) => ({ ...section, title: selfLocaleCopy[key].sections[index][0], description: selfLocaleCopy[key].sections[index][1] }));
  return ({ de: () => selfReflectionSections, en: () => selfReflectionSections.map((section) => ({ ...section, ...sectionCopyEn[section.id] })), es: () => extended("es"), tr: () => extended("tr"), pl: () => extended("pl"), el: () => extended("el"), ru: () => extended("ru") } satisfies Record<Locale, () => readonly SelfReflectionSection[]>)[locale]();
}

export function getSelfReflectionDimensions(locale: Locale) {
  return ({ de: () => selfReflectionDimensions, en: () => dimensionCopyEn, es: () => getSelfDimensionCopy("es"), tr: () => getSelfDimensionCopy("tr"), pl: () => getSelfDimensionCopy("pl"), el: () => getSelfDimensionCopy("el"), ru: () => getSelfDimensionCopy("ru") })[locale]();
}

export function getSelfReflectionQuestions(locale: Locale): readonly SelfReflectionQuestion[] {
  const extended = (key: Exclude<Locale, "de" | "en">) => selfReflectionQuestions.map((question, index) => ({ ...question, prompt: selfLocaleCopy[key].questions[index], context: selfLocaleCopy[key].sections.find((_, sectionIndex) => selfReflectionSections[sectionIndex]?.id === question.sectionId)?.[1], options: question.options.map((option) => ({ ...option, ...formatSelfOption(key, option.signals?.map(({ dimension }) => dimension) ?? option.contextualDimensions ?? [], question.evidenceRole) })) }));
  return ({ de: () => selfReflectionQuestions, en: () => selfReflectionQuestions.map((question) => ({ ...question, ...questionCopyEn[question.id], options: question.options.map(localizeSelfOption) })), es: () => extended("es"), tr: () => extended("tr"), pl: () => extended("pl"), el: () => extended("el"), ru: () => extended("ru") } satisfies Record<Locale, () => readonly SelfReflectionQuestion[]>)[locale]();
}

export function getSelfReflectionResultSections(locale: Locale) {
  const extended = (key: Exclude<Locale, "de" | "en">) => { const titles = getSelfResultSectionTitles(key); return selfReflectionResultSections.map((section, index) => ({ ...section, title: titles[index] })); };
  return ({ de: () => selfReflectionResultSections, en: () => selfReflectionResultSections.map((section) => ({ ...section, title: resultSectionCopyEn[section.id] })), es: () => extended("es"), tr: () => extended("tr"), pl: () => extended("pl"), el: () => extended("el"), ru: () => extended("ru") })[locale]();
}

export function getSelfReflectionTensions(locale: Locale) {
  const extended = (key: Exclude<Locale, "de" | "en">) => { const dimensions = getSelfDimensionCopy(key); return selfReflectionTensions.map((tension) => ({ ...tension, title: tension.dimensions.map((id) => dimensions[id].label).join(" · "), text: tension.dimensions.map((id) => dimensions[id].copy.importance).join(" ") })); };
  return ({ de: () => selfReflectionTensions, en: () => selfReflectionTensions.map((tension) => ({ ...tension, ...tensionCopyEn[tension.id] })), es: () => extended("es"), tr: () => extended("tr"), pl: () => extended("pl"), el: () => extended("el"), ru: () => extended("ru") })[locale]();
}
