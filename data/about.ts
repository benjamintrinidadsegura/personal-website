import { findYourNextStep, nextStepJourneys } from "@/data/find-your-next-step";
import { lifeAlignment } from "@/data/life-alignment";
import { lifeAlignmentModules } from "@/data/life-alignment-modules";
import { getProject } from "@/data/projects";
import type { Value } from "@/types/content";

export const aboutPositioning = {
  name: "Benjamin Trinidad Segura",
  primary: "Building more human systems by making missing context visible.",
  explanation:
    "Ich entwickle Recruiting-Formate, Produkte und Reflexionswerkzeuge, die sichtbar machen, was Lebensläufe, Labels, Rankings oder einzelne Antworten nicht erzählen. Nicht, um Menschen genauer in Schubladen zu sortieren, sondern damit sie selbst und die Systeme um sie herum passendere Entscheidungen treffen können.",
  fields: [
    "Recruiting",
    "Talent Acquisition",
    "Product Thinking",
    "AI-assisted reflection",
    "Community",
    "Storytelling",
    "Discovery",
    "Human Context",
  ],
  alternative: "Give people — and their context — a stage.",
} as const;

export const values: Value[] = [
  {
    title: "Context before categories",
    description: "Ein Lebenslauf, Label oder Ergebnis kann ein Einstieg sein. Es darf nicht mit dem ganzen Menschen verwechselt werden.",
  },
  {
    title: "Change before features",
    description: "Die erste Produktfrage lautet: Was soll für den Menschen nachher sinnvoll anders sein? Erst dann geht es um Funktionen.",
  },
  {
    title: "Understand, don’t measure",
    description: "Reflexion darf ordnen und Unterschiede sichtbar machen, ohne daraus einen Menschen-, Lebens- oder Kompatibilitätsscore zu bauen.",
  },
  {
    title: "The person keeps authority",
    description: "Systeme können Muster und Fragen anbieten. Die Deutung bleibt bei der Person, deren Leben oder Erfahrung gemeint ist.",
  },
];

export const redThreadExamples = [
  {
    signal: "Lebenslauf & Jobtitel",
    missing: "Herkunft, Wendepunkte, Entscheidungen und Potenzial",
    change: "Die Geschichte hinter der beruflichen Station wird sichtbar.",
    href: "/people",
    linkLabel: "People / Spotlight",
  },
  {
    signal: "Employer-Kommunikation",
    missing: "Erlebte Recruiting-, Onboarding- und Offboarding-Erfahrung",
    change: "RateCom untersucht, wie diese Perspektive transparenter werden kann.",
    href: "/projects/ratecom",
    linkLabel: "RateCom",
  },
  {
    signal: "Auswahl & Präferenz",
    missing: "Warum etwas passt, welche Bedingungen gelten und was noch offen ist",
    change: "FYNS ordnet Gründe und realistische Erkundungsschritte statt einer fertigen Antwort.",
    href: findYourNextStep.href,
    linkLabel: "Find Your Next Step",
  },
  {
    signal: "Score & Typ",
    missing: "Heutige Situation, Prioritäten, Beziehungen, Grenzen und Richtung",
    change: "Life Alignment macht eine revidierbare Momentaufnahme sichtbar, keine Diagnose.",
    href: lifeAlignment.href,
    linkLabel: "Life Alignment",
  },
] as const;

type ProjectEvidence = {
  name: string;
  href: string;
  status: string;
  problem: string;
  change: string;
  connection: string;
  externalUrl?: string;
};

function requireProject(slug: string) {
  const project = getProject(slug);
  if (!project) throw new Error(`Missing canonical About project: ${slug}`);
  return project;
}

const goatrec = requireProject("goatrecrutainer");
const ratecom = requireProject("ratecom");
const digitalHq = requireProject("bts-online");

export const aboutProjectEvidence: readonly ProjectEvidence[] = [
  {
    name: goatrec.name,
    href: `/projects/${goatrec.slug}`,
    status: goatrec.status,
    problem: goatrec.problem,
    change: "Menschen, Karrierewege und Angebote erhalten Raum, ihre Geschichte verständlich und in ihrer eigenen Stimme zu erzählen.",
    connection: "Recruiting, Storytelling und People / Spotlight bilden hier eine gemeinsame Praxis.",
    externalUrl: goatrec.externalUrl,
  },
  {
    name: ratecom.name,
    href: `/projects/${ratecom.slug}`,
    status: ratecom.status,
    problem: ratecom.problem,
    change: "Die Idee untersucht, wie erlebte Candidate- und Employee-Journey-Perspektiven unabhängiger sichtbar werden können.",
    connection: "Aktuell ein Rebuild — die Transparenzrichtung ist dokumentiert, keine bereits fertig ausgelieferte Plattform.",
    externalUrl: ratecom.externalUrl,
  },
  {
    name: digitalHq.name,
    href: `/projects/${digitalHq.slug}`,
    status: digitalHq.status,
    problem: digitalHq.problem,
    change: "Projekte, Gespräche, Texte und Werkzeuge werden als zusammenhängendes, durchsuchbares öffentliches System lesbar.",
    connection: "Der Zusammenhang selbst wird Teil des Produkts — statt eines losen Portfolios.",
  },
  {
    name: findYourNextStep.name,
    href: findYourNextStep.href,
    status: `${nextStepJourneys.length} Journeys · ${findYourNextStep.status}`,
    problem: "Orientierungsfragen werden schnell mit allgemeinen Empfehlungen oder einer vermeintlich richtigen Antwort beantwortet.",
    change: "FYNS macht Situation, Präferenzen, Bedingungen und nachvollziehbare nächste Schritte sichtbar.",
    connection: "Kontext dient der Orientierung; die Entscheidung bleibt bei der Person.",
  },
  {
    name: lifeAlignment.name,
    href: lifeAlignment.href,
    status: `${lifeAlignmentModules.filter(({ status }) => status === "available").length} Perspektiven · ${lifeAlignment.status}`,
    problem: "Lebens- und Beziehungsreflexion kann Menschen auf Scores, Typen oder eine angeblich richtige Richtung reduzieren.",
    change: "Life Alignment ordnet aktuelle Bedingungen, Prioritäten, Spannungen und gewünschte Richtungen qualitativ.",
    connection: "Verstehen statt vermessen — ausdrücklich ohne Diagnose und mit menschlicher Deutungshoheit.",
  },
] as const;

export const ownerStories = [
  {
    id: "benjamin-goatrecrutainer-introduction",
    title: "Vorstellung: GOATRECRUTAINER",
    label: "Benjamin says / First-person source",
    description:
      "Benjamin beschreibt GOATRECRUTAINER als Arbeit an Sichtbarkeit: Menschen, Unternehmen und ihre Geschichten authentisch, emotional und verständlich auf die Bühne zu bringen.",
    context: [
      "Recruiting und Karriere sind dabei nur ein Teil. Im Mittelpunkt stehen Potenziale, persönliche Entwicklung, Storytelling und neue Wege, Talente zu erreichen und zu begeistern.",
      "Diese Vorstellung ist Benjamins eigene öffentliche Beschreibung seiner Mission und Arbeitsweise. Sie ist die stärkste direkte Quelle auf dieser Seite — und keine externe Bewertung.",
    ],
    video: {
      youtubeId: "pT49Nlb9Msc",
      url: "https://www.youtube.com/watch?v=pT49Nlb9Msc",
      title: "Vorstellung: GOATRECRUTAINER",
      duration: "13:50",
    },
    publishedAt: "2026-04-22T11:31:08-07:00",
  },
  {
    id: "benjamin-ai-reflection",
    title: "Ein zweiter Blick auf wiederkehrende Muster",
    originalTitle: "Wer bin ich wirklich? – Eine KI analysiert mein Leben",
    label: "AI perspective / Secondary source",
    description:
      "Eine KI-generierte Interpretation auf Basis von Benjamins alten Blogs, Projekten, Ideen, Rückschlägen und ausgewähltem Gesprächskontext aus mehr als zehn Jahren.",
    context: [
      "Interessant ist die Perspektive dort, wo sie Motive erkennt, die sich anschließend an Benjamins eigenen Aussagen und an realen Projekten prüfen lassen — etwa Gemeinschaft, Sichtbarkeit, Entwicklung und die Suche nach einem verbindenden Muster.",
      "Sie ist weder neutrale Außenbeobachtung noch autoritative Identität. Das System bietet Muster und Fragen an, entscheidet aber nicht, wer er ist. Benjamin entscheidet selbst, was daran stimmt, was sich verändert hat und was verworfen werden sollte.",
    ],
    disclaimer:
      "AI-generated perspective und AI-assisted interpretation — keine objektive Wahrheit, keine psychologische Beurteilung oder Diagnose. Sie basiert auf ausgewähltem Schreib- und Gesprächskontext, ersetzt keine professionelle Einschätzung und lässt die Deutungshoheit vollständig bei Benjamin.",
    video: {
      youtubeId: "MD_H3Ia3cJY",
      url: "https://www.youtube.com/watch?v=MD_H3Ia3cJY",
      title: "Wer bin ich wirklich? – Eine KI analysiert mein Leben",
      duration: "15:59",
    },
    publishedAt: "2026-06-18T03:08:54-07:00",
  },
] as const;
