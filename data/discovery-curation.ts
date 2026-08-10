import type {
  DiscoveryDimensions,
  DiscoveryRelationship,
  DiscoverySynonymGroup,
  GuidedDiscoveryPrompt,
} from "@/types/discovery";

/**
 * Editorial context for contextual Discovery. Values stay short, traceable to
 * project copy, and capped at four entries per active dimension.
 */
export const discoveryDimensionsByItemId: Readonly<Record<string, DiscoveryDimensions>> = {
  "tool-find-your-next-step": {
    intent: ["Persönlichen nächsten Schritt klären", "Orientierung gewinnen", "Eigene Situation klären"],
    goals: ["Eine passende Richtung erkennen", "Eine Entscheidung vorbereiten"],
    problems: ["Unklarheit über den nächsten Schritt", "Orientierungslosigkeit"],
    useCases: ["Selbstverständnis", "Berufliche Orientierung", "Problem einordnen", "Idee strukturieren"],
  },
  "tool-find-your-next-step-self": {
    intent: ["Mich selbst besser verstehen", "Selbstreflexion durchführen"],
    goals: ["Eigene Stärken reflektieren", "Werte klären", "Bedürfnisse verstehen", "Arbeitsweise reflektieren"],
    problems: ["Unsicherheit über die eigene Richtung"],
    useCases: ["Prioritäten einordnen", "Energie verstehen", "Hilfreiche Bedingungen erkennen"],
  },
  "tool-find-your-next-step-career": {
    intent: ["Berufliche Orientierung gewinnen", "Passende berufliche Richtungen finden"],
    goals: ["Berufliche Passung klären", "Arbeitsumfeld klären", "Werte und Arbeit verbinden"],
    problems: ["Fehlende berufliche Orientierung", "Unklarheit beim nächsten Karriereschritt"],
    useCases: ["Jobwahl reflektieren", "Berufliche Neuorientierung", "Passenden Job finden", "Karriereentscheidung vorbereiten"],
  },
  "tool-find-your-next-step-problem": {
    intent: ["Problem einordnen", "Handlungsmöglichkeiten erkennen", "Anlaufstellen verstehen"],
    goals: ["Situation besser verstehen", "Nächsten sinnvollen Schritt erkennen"],
    problems: ["Eine schwierige Situation einordnen", "Fehlende Klarheit über Handlungsmöglichkeiten"],
    useCases: ["Problemfeld auswählen", "Situation strukturieren", "Mögliche nächste Schritte"],
  },
  "tool-find-your-next-step-idea": {
    intent: ["Idee strukturieren", "Idee umsetzen", "Konzept entwickeln"],
    goals: ["Nutzen und Zielgruppe klären", "Eigene Idee zu einem ersten Plan entwickeln"],
    problems: ["Unklare Idee", "Unklarer erster Umsetzungsschritt"],
    useCases: ["Problem und Zielgruppe verstehen", "Machbarkeit einordnen", "Nächste Schritte planen"],
  },
  "project-goatrecrutainer": {
    intent: ["Recruiting-Unterstützung finden", "Personal Brand kennenlernen", "Karrieregeschichten entdecken"],
    goals: ["Recruiting verbessern", "Menschen und Karrierewege sichtbar machen"],
    problems: ["Fehlende Recruiting-Kapazität", "Menschen hinter Lebensläufen bleiben unsichtbar"],
    useCases: ["Active Sourcing", "Recruiting as a Service", "End-to-End Recruiting", "Employer Branding und Storytelling"],
  },
  "project-ratecom": {
    intent: ["Recruiting-Erfahrungen vergleichen", "Bewerbungsprozess verstehen"],
    goals: ["Recruiting-Erfahrungen transparenter machen"],
    problems: ["Intransparente Recruiting-Erfahrungen", "Schwer vergleichbare Bewerbungsprozesse"],
    useCases: ["Recruitingprozess bewerten", "Onboarding-Erfahrung bewerten", "Offboarding-Erfahrung bewerten"],
  },
  "project-goatrecrutainer-area-career-agent": {
    intent: ["Job suchen", "Arbeitgeber wechseln", "Bewerbungsstrategie entwickeln"],
    goals: ["Berufliche Positionierung klären", "Karriereentscheidung treffen"],
    problems: ["Fehlende berufliche Orientierung", "Unsicherer Jobwechsel"],
    useCases: ["Berufswechsel", "Bewerbung vorbereiten", "Verhandlungen vorbereiten"],
  },
  "project-goatrecrutainer-area-recruiting-as-a-service": {
    intent: ["Recruiting-Unterstützung finden", "Recruiting-Kapazität ergänzen"],
    goals: ["Mitarbeitende finden", "Recruiting verbessern"],
    problems: ["Offene Stellen", "Fehlende Recruiting-Kapazität"],
    useCases: ["Active Sourcing", "End-to-End Recruiting", "Bewerbermanagement", "Prozessoptimierung"],
  },
  "project-goatrecrutainer-area-konzepterstellung": {
    intent: ["Idee umsetzen", "Konzept entwickeln"],
    goals: ["Recruiting-Idee konkretisieren", "Content-Idee konkretisieren", "Community-Idee konkretisieren"],
    useCases: ["Recruiting-Konzept", "Content-Konzept", "Community-Konzept", "Plattform-Konzept"],
  },
  "interview-career-spotlight": {
    intent: ["Karrieregeschichten entdecken", "Menschen und Geschichten kennenlernen"],
    goals: ["Orientierung finden", "Inspiration finden"],
    problems: ["Fehlende berufliche Orientierung"],
    useCases: ["Karrierewege verstehen", "Geschichten hinter Lebensläufen"],
  },
  "person-evgeny-vinokurov": {
    intent: ["Menschen und Geschichten kennenlernen", "Karrieregeschichte entdecken"],
    goals: ["Orientierung finden", "Inspiration finden"],
    useCases: ["Karriereweg verstehen", "Wendepunkte kennenlernen"],
  },
  "project-byc": {
    intent: ["Community gründen", "Community organisieren", "Idee umsetzen"],
    goals: ["Eigene Community aufbauen", "Community weiterentwickeln"],
    problems: ["Unübersichtliche Community-Plattformen", "Fehlende zentrale Community-Umgebung"],
    useCases: ["Community-Seiten", "Events und Aktivitäten", "Gruppen-Chats", "Rollen und Moderation"],
  },
  "project-hobbyswap": {
    intent: ["Neue Hobbys entdecken", "Interessen ausprobieren", "Community-Austausch finden"],
    goals: ["Erfahrungen teilen", "Neue Interessen kennenlernen"],
    problems: ["Hoher Aufwand vor dem Ausprobieren"],
    useCases: ["Hobbys tauschen", "Erfahrungen teilen"],
  },
  "tool-echowall": {
    intent: ["Feedback geben", "Austausch finden", "Gedanken teilen"],
    goals: ["Community-Austausch ermöglichen", "Reaktionen sammeln"],
    useCases: ["Feedback teilen", "Nachricht senden", "Reaktion hinterlassen"],
  },
};

/**
 * Aliases are matched only in their declared mode and map in one direction to
 * the canonical term. Canonical terms are never expanded again.
 */
export const discoverySynonymGroups: readonly DiscoverySynonymGroup[] = [
  {
    id: "recruiting",
    canonical: "Recruiting",
    aliases: [
      { value: "Recruiter", match: "token" },
      { value: "Talent Acquisition", match: "phrase" },
      { value: "HR", match: "token" },
      { value: "Personal", match: "whole-query" },
    ],
  },
  {
    id: "job",
    canonical: "Job",
    aliases: [
      { value: "Jobs", match: "token" },
      { value: "Beruf", match: "token" },
      { value: "Karriere", match: "token" },
      { value: "Berufswechsel", match: "token" },
      { value: "Arbeit", match: "whole-query" },
    ],
  },
  {
    id: "ideas",
    canonical: "Idee",
    aliases: [
      { value: "Gründen", match: "token" },
      { value: "Startup", match: "token" },
      { value: "Unternehmen", match: "whole-query" },
    ],
  },
  {
    id: "stories",
    canonical: "Geschichte",
    aliases: [
      { value: "Geschichten", match: "token" },
      { value: "Interview", match: "token" },
      { value: "Lebenslauf", match: "token" },
      { value: "Mensch", match: "whole-query" },
    ],
  },
  {
    id: "community",
    canonical: "Community",
    aliases: [
      { value: "Feedback", match: "token" },
      { value: "Austausch", match: "token" },
    ],
  },
  {
    id: "tools",
    canonical: "Tool",
    aliases: [{ value: "Tools", match: "token" }],
  },
];

export const discoveryRelationships: readonly DiscoveryRelationship[] = [
  { id: "understand-self", query: "Wer bin ich", terms: ["Mich selbst besser verstehen"] },
  { id: "career-fit", query: "Welcher Job passt zu mir", terms: ["Berufliche Passung klären"] },
  { id: "career-fit-profession", query: "Welcher Beruf passt zu mir", terms: ["Passende berufliche Richtungen finden"] },
  { id: "find-profession", query: "Beruf finden", terms: ["Passende berufliche Richtungen finden"] },
  { id: "career-orientation", query: "Karriere Orientierung", terms: ["Berufliche Orientierung gewinnen"] },
  { id: "career-question", query: "Was soll ich beruflich machen", terms: ["Passende berufliche Richtungen finden"] },
  { id: "career-direction", query: "Berufliche Richtung", terms: ["Passende berufliche Richtungen finden"] },
  { id: "feeling-stuck", query: "Ich weiß nicht weiter", terms: ["Persönlichen nächsten Schritt klären"] },
  { id: "have-a-problem", query: "Ich habe ein Problem", terms: ["Problem einordnen"] },
  { id: "have-an-idea", query: "Ich habe eine Idee", terms: ["Idee strukturieren"] },
  { id: "shape-my-idea", query: "Was mache ich mit meiner Idee", terms: ["Eigene Idee zu einem ersten Plan entwickeln"] },
  { id: "next-step", query: "Was soll ich als Nächstes tun", terms: ["Persönlichen nächsten Schritt klären"] },
  { id: "change-employer", query: "Arbeitgeber wechseln", terms: ["Berufswechsel", "Jobwechsel"] },
  { id: "implement-idea", query: "Idee umsetzen", terms: ["Idee umsetzen", "Konzept entwickeln"] },
  { id: "people-and-stories", query: "Menschen und Geschichten", terms: ["Menschen und Geschichten", "Karrierewege", "Geschichten hinter Lebensläufen"] },
  { id: "tools-and-orientation", query: "Tools und Orientierung", terms: ["Tool", "Orientierung finden"] },
  { id: "community-and-feedback", query: "Community und Feedback", terms: ["Community", "Feedback"] },
];

export const discoveryNeutralTerms: readonly string[] = [
  "ich",
  "ein",
  "eine",
  "einen",
  "einem",
  "einer",
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "möchte",
  "will",
  "suche",
  "brauche",
  "und",
  "oder",
  "im",
  "in",
  "am",
  "für",
  "nach",
  "not",
  "mir",
  "mich",
  "gerne",
];

export const guidedDiscoveryPrompts: readonly GuidedDiscoveryPrompt[] = [
  { id: "recruiting", label: "Recruiting entdecken", query: "Recruiting" },
  { id: "career", label: "Karriere und Jobs", query: "Karriere und Jobs" },
  { id: "stories", label: "Menschen und Geschichten", query: "Menschen und Geschichten" },
  { id: "ideas", label: "Projekte und Ideen", query: "Idee umsetzen" },
  { id: "orientation", label: "Nächsten Schritt finden", query: "Was soll ich als Nächstes tun?" },
  { id: "community", label: "Community und Feedback", query: "Community und Feedback" },
];
