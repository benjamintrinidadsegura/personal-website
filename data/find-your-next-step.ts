import type { NextStepJourney } from "@/types/find-your-next-step";

export const findYourNextStep = {
  id: "tool-find-your-next-step",
  href: "/find-your-next-step",
  name: "Find Your Next Step",
  status: "Beta",
  eyebrow: "Human Context First",
  headline: "Dein nächster Schritt beginnt nicht mit einer fertigen Antwort.",
  introduction:
    "Find Your Next Step soll dir helfen, dich selbst, deine Situation und mögliche Richtungen klarer zu sehen – ohne dir vorzugeben, wie du leben oder entscheiden sollst.",
  principleTitle: "Keine richtige Lebensentscheidung. Eine passendere nächste Bewegung.",
  principleText:
    "Das Tool nimmt dir Entscheidungen nicht ab. Es soll Kontext sichtbar machen, Fragen ordnen und dir helfen, einen nächsten Schritt zu erkennen, der zu dir und deiner Situation passt.",
  pathsTitle: "Beginne dort, wo deine Frage gerade lebt.",
  pathsDescription:
    "Vier Ausgangspunkte für unterschiedliche Situationen – verbunden durch denselben Gedanken: Erst verstehen, dann weitergehen.",
  helpSteps: [
    {
      number: "01",
      title: "Verstehen",
      description: "Wahrnehmen, was dich, deine Situation oder deine Idee gerade wirklich prägt.",
    },
    {
      number: "02",
      title: "Einordnen",
      description: "Zusammenhänge sichtbar machen, ohne Menschen in schnelle Schubladen zu stecken.",
    },
    {
      number: "03",
      title: "Weitergehen",
      description: "Aus Klarheit einen nächsten Schritt ableiten, der realistisch und persönlich stimmig ist.",
    },
  ],
  developmentTitle: "Ein Fundament, das bewusst offen bleibt.",
  developmentText:
    "FYNS wird schrittweise aufgebaut. Die Self-Reflection ist als erste Journey in einer funktionalen Beta verfügbar. Career, Problem und Idea bleiben transparente Einstiegsseiten, bis ihre eigenen Journeys wirklich tragen.",
  privacyText:
    "Antworten der Self-Reflection bleiben ausschließlich im aktuellen Seitenzustand und werden weder gespeichert noch übertragen. Ein Neuladen oder Verlassen der Seite löscht sie. Nutzerkonten oder eine Datenbank sind dafür nicht im Einsatz.",
  closingText: "Du musst noch nicht die ganze Richtung kennen. Ein ehrlicher nächster Schritt reicht.",
  discovery: {
    category: "Orientation Tool",
    tags: ["Human Context First", "Orientierung", "Nächster Schritt"],
    keywords: ["Persönliche Richtung", "Situation klären", "Entscheidung vorbereiten"],
  },
} as const;

export const nextStepJourneys: readonly NextStepJourney[] = [
  {
    id: "tool-find-your-next-step-self",
    slug: "self",
    href: "/find-your-next-step/self",
    number: "01",
    title: "Wer bin ich?",
    description:
      "Eine strukturierte Selbstreflexion, die Muster in deinen Werten, Bedürfnissen, deiner Energie und hilfreichen Bedingungen sichtbar macht – ohne dich in einen Typ zu pressen.",
    expectations: [
      "Ruhige Fragen statt schneller Schubladen",
      "15 Entscheidungen über Alltag, Energie und hilfreiche Bedingungen",
      "Ein nachvollziehbares Reflexionsbild ohne Persönlichkeits-Score",
      "Kombinationen von Bedürfnissen statt vermeintlicher Widersprüche",
    ],
    analysisAreas: [
      "Persönliche Prioritäten und Werte",
      "Entscheidungen und Gestaltungsspielraum",
      "Energie, Aufmerksamkeit und Regeneration",
      "Soziale Verbindung und Rückmeldung",
      "Verlässlichkeit und Umgang mit Veränderung",
      "Selbst beobachtete Stärken",
    ],
    status: "Beta",
    accent: "#35d0e5",
    discovery: {
      category: "Find Your Next Step",
      tags: ["Selbstverständnis", "Selbstreflexion", "Persönliche Entwicklung"],
      keywords: ["Stärken", "Werte", "Arbeitsweise", "Bedürfnisse", "Energie", "Entscheidungen", "Regeneration"],
    },
  },
  {
    id: "tool-find-your-next-step-career",
    slug: "career",
    href: "/find-your-next-step/career",
    number: "02",
    title: "Welcher Job passt zu mir?",
    description:
      "Ein Weg, der später mehrere passende berufliche Richtungen sichtbar machen soll – mit nachvollziehbaren Gründen statt einer einzigen vermeintlich richtigen Antwort.",
    expectations: [
      "Orientierung vor konkreter Stellensuche",
      "Ein Blick auf Fähigkeiten, Werte und Energie",
      "Mehrere berufliche Richtungen statt eines einzigen Berufs",
      "Nachvollziehbare Verbindungen zwischen dir und möglicher Arbeit",
    ],
    analysisAreas: [
      "Fähigkeiten",
      "Energie",
      "Arbeitsumfeld",
      "Sicherheitsbedürfnis",
      "Kreativität",
      "Menschenkontakt",
      "Einkommen",
      "Werte und bevorzugte Arbeitsweise",
    ],
    status: "In Development",
    accent: "#ff9a3d",
    discovery: {
      title: "FYNS · Berufliche Passung",
      category: "Find Your Next Step",
      tags: ["Berufliche Orientierung", "Berufliche Passung", "Karriererichtung"],
      keywords: ["Fähigkeiten", "Arbeitsumfeld", "Sicherheitsbedürfnis", "Kreativität", "Arbeitsweise"],
    },
  },
  {
    id: "tool-find-your-next-step-problem",
    slug: "problem",
    href: "/find-your-next-step/problem",
    number: "03",
    title: "Ich habe ein Problem – was kann ich tun?",
    description:
      "Ein Weg, der später dabei helfen soll, eine schwierige Situation zu strukturieren, Handlungsmöglichkeiten zu erkennen und passende nächste Schritte einzuordnen.",
    expectations: [
      "Eine ruhige Eingrenzung des Problemfelds",
      "Wenige strukturierte Fragen zu deiner Situation",
      "Mögliche nächste Schritte statt pauschaler Lösungen",
      "Hinweise auf passende Anlaufstellen, wenn sie sinnvoll sind",
    ],
    analysisAreas: [
      "Problemfeld und Kontext",
      "Aktuelle Belastung und Dringlichkeit",
      "Bereits versuchte Schritte",
      "Eigene Handlungsmöglichkeiten",
      "Unterstützung und mögliche Anlaufstellen",
    ],
    status: "In Development",
    accent: "#b8a5ff",
    discovery: {
      category: "Find Your Next Step",
      tags: ["Situationsklärung", "Handlungsmöglichkeiten", "Orientierung"],
      keywords: ["Problem einordnen", "Situation strukturieren", "Nächste Schritte", "Anlaufstellen"],
    },
    professionalBoundary:
      "Die spätere Orientierung in diesem Bereich wird keine professionelle medizinische, psychologische, rechtliche oder andere fachliche Beratung ersetzen. Sie soll dabei helfen, eine Situation zu ordnen und mögliche nächste Anlaufpunkte bewusster zu erkennen.",
  },
  {
    id: "tool-find-your-next-step-idea",
    slug: "idea",
    href: "/find-your-next-step/idea",
    number: "04",
    title: "Ich habe eine Idee – wie setze ich sie um?",
    description:
      "Ein Weg, der später aus einer unscharfen Idee einen ersten umsetzbaren Plan entwickeln soll – ausgehend von Problem, Zielgruppe, Nutzen und Machbarkeit.",
    expectations: [
      "Die Idee in verständliche Teile zerlegen",
      "Problem, Zielgruppe und Nutzen schärfen",
      "Annahmen und Machbarkeit realistisch einordnen",
      "Einen ersten umsetzbaren nächsten Schritt formulieren",
    ],
    analysisAreas: [
      "Ausgangsidee und Motivation",
      "Problem und Zielgruppe",
      "Nutzen und Unterschiede zu bestehenden Lösungen",
      "Ressourcen und Machbarkeit",
      "Erste Tests und nächste Schritte",
    ],
    status: "In Development",
    accent: "#77e5b5",
    discovery: {
      category: "Find Your Next Step",
      tags: ["Ideenentwicklung", "Konzept", "Zielgruppe", "Machbarkeit"],
      keywords: ["Idee strukturieren", "Umsetzungsplan", "Idee konkretisieren", "Nächste Schritte"],
    },
  },
];

export function getNextStepJourney(slug: string) {
  return nextStepJourneys.find((journey) => journey.slug === slug);
}
