import type { IdeaQuestion, IdeaSection } from "@/types/find-your-next-step-idea";
import type { Locale } from "@/lib/i18n/config";
import { ideaLocaleCopy } from "@/data/find-your-next-step-idea-locales";

export const ideaIntro = {
  eyebrow: "Beta · Ideenklärung",
  title: "Mach aus deiner Idee eine kleine, prüfbare nächste Bewegung.",
  description:
    "Diese Journey ordnet deine heutige Sicht auf Idee, Problem, Menschen und Nutzen. Sie erstellt keinen Businessplan und behauptet nicht, dass eine Idee validiert ist.",
  canDo: [
    "deine Idee in wenigen eigenen Sätzen festhalten",
    "Beobachtungen, Annahmen und offene Fragen auseinanderhalten",
    "einen kleinen Lernschritt unter deinen realen Bedingungen formulieren",
  ],
  cannotDo: [
    "keinen Markt, Umsatz oder Erfolg vorhersagen",
    "keine Nachfrage, Machbarkeit oder rechtliche Zulässigkeit bestätigen",
    "keine Entscheidung oder Interpretation über deine Absicht übernehmen",
  ],
  duration: "9 kurze Entscheidungen in 4 Abschnitten · etwa 6–9 Minuten",
  privacy:
    "Deine Eingaben bleiben nur im aktuellen Seitenzustand. Sie werden nicht gespeichert, nicht mit einem Account verknüpft und nicht übertragen.",
  authority:
    "Du entscheidest, welche Formulierungen stimmen. Das Ergebnis bleibt eine veränderbare Arbeitsnotiz, keine Bewertung deiner Idee oder Person.",
} as const;

export const ideaSections: readonly IdeaSection[] = [
  { id: "core", title: "Worum geht es?", description: "Idee und Ausgangsproblem in deinen eigenen Worten." },
  { id: "people-value", title: "Für wen und wozu?", description: "Menschen und der erhoffte konkrete Nutzen." },
  { id: "reality", title: "Was weißt du schon?", description: "Beobachtungen, Annahmen und reale Grenzen getrennt halten." },
  { id: "experiment", title: "Was lernst du als Nächstes?", description: "Ein kleiner Versuch mit einer klaren Lernfrage." },
] as const;

const ideaIntroEn = {
  eyebrow: "Beta · Idea clarification",
  title: "Turn your idea into a small, testable next move.",
  description: "This journey organises how you currently see the idea, problem, people and value. It does not create a business plan or claim that an idea is validated.",
  canDo: ["capture your idea in a few sentences of your own", "separate observations, assumptions and open questions", "formulate a small learning step within your real constraints"],
  cannotDo: ["predict a market, revenue or success", "confirm demand, feasibility or legal permissibility", "take over a decision or interpretation of your intent"],
  duration: "9 short decisions in 4 sections · about 6–9 minutes",
  privacy: "Your input remains only in the current page state. It is not stored, connected to an account or transmitted.",
  authority: "You decide which wording is accurate. The result remains an editable working note, not an assessment of your idea or you.",
} as const;

const ideaSectionCopyEn: Readonly<Record<IdeaSection["id"], Pick<IdeaSection, "title" | "description">>> = {
  core: { title: "What is it about?", description: "The idea and starting problem in your own words." },
  "people-value": { title: "For whom and why?", description: "The people and the concrete value you hope to create." },
  reality: { title: "What do you know already?", description: "Keep observations, assumptions and real constraints separate." },
  experiment: { title: "What will you learn next?", description: "A small experiment with a clear learning question." },
};

const ideaQuestionCopyEn: Readonly<Record<string, { prompt: string; context: string; placeholder?: string; options?: Readonly<Record<string, { label: string; resultText: string }>> }>> = {
  "idea-summary": { prompt: "How would you describe your idea in one sentence today?", context: "A provisional description is enough. You can change it later.", placeholder: "For example: A service that …" },
  "problem-summary": { prompt: "What concrete problem or need do you want to understand better?", context: "Describe the situation, not the finished solution.", placeholder: "People currently experience …" },
  "audience-summary": { prompt: "For whom might this problem be particularly relevant?", context: "Be as specific as your current knowledge allows.", placeholder: "For example: People who …" },
  "value-summary": { prompt: "What might become noticeably better or easier for these people?", context: "Describe possible value, not a promise of success.", placeholder: "It could help them …" },
  "evidence-state": { prompt: "What is your view mainly based on at the moment?", context: "Choose the most honest snapshot. No level is automatically better.", options: {
    "direct-observation": { label: "Repeated personal observations of a concrete situation.", resultText: "Your current view is based on repeated personal observations." },
    conversations: { label: "Specific conversations with people who may be affected.", resultText: "Your current view is based on specific conversations with people who may be affected." },
    "own-experience": { label: "Primarily my own experience of the problem.", resultText: "Your own experience is the main starting point; how far it applies to others remains open." },
    "mixed-signals": { label: "A mixture of observations, conversations and assumptions.", resultText: "Your view combines early indications with assumptions that remain open." },
    "early-assumption": { label: "Still mostly a plausible assumption.", resultText: "Your view is currently based mostly on a plausible assumption." },
  } },
  "critical-assumptions": { prompt: "Which two assumptions deserve a closer look first?", context: "Prioritise uncertainty, not importance to a future business plan.", options: {
    "problem-repeats": { label: "The problem happens often enough or is sufficiently burdensome.", resultText: "How often the problem actually occurs and how burdensome it is." },
    "audience-specific": { label: "The intended audience is specific enough.", resultText: "Whether the intended group is defined specifically enough." },
    "current-alternatives": { label: "Existing alternatives leave a relevant gap.", resultText: "Which alternatives people already use and where a gap remains." },
    "value-matters": { label: "The possible value genuinely matters to these people.", resultText: "Whether the possible value genuinely matters to the people concerned." },
    "idea-usable": { label: "The idea can be made tangible in an understandable form.", resultText: "Whether the idea can be made understandable and small enough to experience." },
    "commitment-fit": { label: "I want to continue under real-life conditions.", resultText: "Whether you want to continue with the idea under your real-life conditions." },
  } },
  "real-constraints": { prompt: "Which boundaries should explicitly apply to the first experiment?", context: "Choose up to three. Boundaries are planning conditions, not weaknesses.", options: {
    "limited-time": { label: "Only a few hours are available.", resultText: "The first experiment should remain manageable within a few hours." },
    "no-budget": { label: "No budget, or only a very small one.", resultText: "The first experiment should require no meaningful budget." },
    "limited-access": { label: "Limited access to potential users so far.", resultText: "Access to people who may be affected is still limited." },
    "energy-boundary": { label: "My available energy is limited.", resultText: "The experiment should explicitly protect your available energy." },
    "privacy-boundary": { label: "Sensitive data and privacy must remain untouched.", resultText: "The experiment must not collect sensitive data or intrude on anyone’s privacy." },
    "legal-boundary": { label: "Legal or professional boundaries need clarification before implementation.", resultText: "Legal or professional boundaries must be clarified separately before implementation." },
    "no-clear-limit": { label: "I cannot name a clear boundary yet.", resultText: "A clear boundary for the first experiment remains open." },
  } },
  "learning-goal": { prompt: "What do you most want to understand better through the next small step?", context: "A learning goal keeps the experiment smaller than a complete implementation.", options: {
    "understand-problem": { label: "How people describe the problem themselves.", resultText: "how people who may be affected describe the problem in their own words" },
    "understand-alternatives": { label: "What people do instead today.", resultText: "which alternatives people use today and what those alternatives lack" },
    "understand-value": { label: "Whether the possible value feels clear and relevant.", resultText: "how clear and relevant the possible value feels to people" },
    "understand-use": { label: "How people would use a very simple version.", resultText: "how people actually use a very simple version" },
    "understand-fit": { label: "Whether I want to carry the idea forward under real-life conditions.", resultText: "whether you want to carry the idea forward under real-life conditions" },
  } },
  "experiment-mode": { prompt: "Which format best fits your first learning experiment?", context: "Choose the smallest format that can give you an honest indication.", options: {
    conversation: { label: "A short, open conversation without selling.", resultText: "Have a short, open conversation without trying to convince the person of your solution." },
    observation: { label: "Observe or document a real situation.", resultText: "Observe or document a real situation without collecting unnecessary personal data." },
    "paper-walkthrough": { label: "Walk through a sketch or process together.", resultText: "Walk through a simple sketch or process together with one person." },
    "manual-prototype": { label: "Try one tiny manual version.", resultText: "Try a tiny manual version once within a clearly bounded setting." },
    "desk-research": { label: "Compare existing alternatives systematically.", resultText: "Compare a small number of existing alternatives against one question written down in advance." },
    "private-reflection": { label: "First write a short personal decision note.", resultText: "First write a short personal decision note before involving anyone else." },
  } },
};

const ideaIntroByLocale = { de: ideaIntro, en: ideaIntroEn, es: ideaLocaleCopy.es.intro, tr: ideaLocaleCopy.tr.intro, pl: ideaLocaleCopy.pl.intro, el: ideaLocaleCopy.el.intro, ru: ideaLocaleCopy.ru.intro } as const;
const ideaSectionCopyByLocale = { en: ideaSectionCopyEn, es: ideaLocaleCopy.es.sections, tr: ideaLocaleCopy.tr.sections, pl: ideaLocaleCopy.pl.sections, el: ideaLocaleCopy.el.sections, ru: ideaLocaleCopy.ru.sections } as const;
const ideaQuestionCopyByLocale = { en: ideaQuestionCopyEn, es: ideaLocaleCopy.es.questions, tr: ideaLocaleCopy.tr.questions, pl: ideaLocaleCopy.pl.questions, el: ideaLocaleCopy.el.questions, ru: ideaLocaleCopy.ru.questions } as const;

export function getIdeaIntro(locale: Locale) { return ideaIntroByLocale[locale]; }

export function getIdeaSections(locale: Locale): readonly IdeaSection[] {
  const localize = (copy: (typeof ideaSectionCopyByLocale)[keyof typeof ideaSectionCopyByLocale]) => ideaSections.map((section) => ({ ...section, ...copy[section.id] }));
  return ({ de: () => ideaSections, en: () => localize(ideaSectionCopyByLocale.en), es: () => localize(ideaSectionCopyByLocale.es), tr: () => localize(ideaSectionCopyByLocale.tr), pl: () => localize(ideaSectionCopyByLocale.pl), el: () => localize(ideaSectionCopyByLocale.el), ru: () => localize(ideaSectionCopyByLocale.ru) } satisfies Record<Locale, () => readonly IdeaSection[]>)[locale]();
}

export function getIdeaQuestions(locale: Locale): readonly IdeaQuestion[] {
  const localize = (copies: (typeof ideaQuestionCopyByLocale)[keyof typeof ideaQuestionCopyByLocale]) => ideaQuestions.map((question) => {
    const copy = copies[question.id];
    if (question.format === "short-text") return { ...question, prompt: copy.prompt, context: copy.context, placeholder: copy.placeholder ?? question.placeholder };
    return { ...question, prompt: copy.prompt, context: copy.context, options: question.options.map((option) => ({ ...option, ...(copy.options?.[option.id] ?? { label: option.label, resultText: option.resultText }) })) };
  });
  return ({ de: () => ideaQuestions, en: () => localize(ideaQuestionCopyByLocale.en), es: () => localize(ideaQuestionCopyByLocale.es), tr: () => localize(ideaQuestionCopyByLocale.tr), pl: () => localize(ideaQuestionCopyByLocale.pl), el: () => localize(ideaQuestionCopyByLocale.el), ru: () => localize(ideaQuestionCopyByLocale.ru) } satisfies Record<Locale, () => readonly IdeaQuestion[]>)[locale]();
}

export const ideaQuestions: readonly IdeaQuestion[] = [
  {
    id: "idea-summary",
    sectionId: "core",
    prompt: "Wie würdest du deine Idee heute in einem Satz beschreiben?",
    context: "Eine vorläufige Formulierung reicht. Du darfst sie später verändern.",
    resultRole: "idea",
    format: "short-text",
    minLength: 12,
    maxLength: 220,
    placeholder: "Zum Beispiel: Ein Angebot, das …",
  },
  {
    id: "problem-summary",
    sectionId: "core",
    prompt: "Welches konkrete Problem oder Bedürfnis möchtest du besser verstehen?",
    context: "Beschreibe die Situation, nicht schon die fertige Lösung.",
    resultRole: "problem",
    format: "short-text",
    minLength: 12,
    maxLength: 240,
    placeholder: "Menschen erleben heute …",
  },
  {
    id: "audience-summary",
    sectionId: "people-value",
    prompt: "Für wen könnte dieses Problem besonders relevant sein?",
    context: "Bleib so konkret, wie es deine heutige Kenntnis erlaubt.",
    resultRole: "audience",
    format: "short-text",
    minLength: 8,
    maxLength: 180,
    placeholder: "Zum Beispiel: Menschen, die …",
  },
  {
    id: "value-summary",
    sectionId: "people-value",
    prompt: "Was könnte für diese Menschen danach spürbar besser oder leichter sein?",
    context: "Formuliere einen möglichen Nutzen, kein Erfolgsversprechen.",
    resultRole: "value",
    format: "short-text",
    minLength: 12,
    maxLength: 220,
    placeholder: "Sie könnten dadurch …",
  },
  {
    id: "evidence-state",
    sectionId: "reality",
    prompt: "Worauf stützt sich deine Sicht im Moment hauptsächlich?",
    context: "Wähle die ehrlichste Momentaufnahme. Keine Stufe ist automatisch besser.",
    resultRole: "evidence",
    format: "single",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "direct-observation", label: "Auf wiederholten eigenen Beobachtungen einer konkreten Situation.", resultText: "Du stützt dich aktuell auf wiederholte eigene Beobachtungen." },
      { id: "conversations", label: "Auf konkreten Gesprächen mit möglicherweise betroffenen Menschen.", resultText: "Du stützt dich aktuell auf konkrete Gespräche mit möglicherweise betroffenen Menschen." },
      { id: "own-experience", label: "Vor allem auf meiner eigenen Erfahrung mit dem Problem.", resultText: "Ausgangspunkt ist vor allem deine eigene Erfahrung; wie weit sie übertragbar ist, bleibt offen." },
      { id: "mixed-signals", label: "Auf einer Mischung aus Beobachtungen, Gesprächen und Vermutungen.", resultText: "Deine Sicht verbindet erste Hinweise mit noch offenen Vermutungen." },
      { id: "early-assumption", label: "Noch überwiegend auf einer plausiblen Vermutung.", resultText: "Deine Sicht ist aktuell überwiegend eine plausible Vermutung." },
    ],
  },
  {
    id: "critical-assumptions",
    sectionId: "reality",
    prompt: "Welche zwei Annahmen verdienen zuerst einen genaueren Blick?",
    context: "Priorisiere Unsicherheit, nicht Wichtigkeit für einen späteren Businessplan.",
    resultRole: "assumptions",
    format: "priority",
    minSelections: 2,
    maxSelections: 2,
    options: [
      { id: "problem-repeats", label: "Das Problem tritt häufig oder belastend genug auf.", resultText: "Wie häufig oder belastend das Problem tatsächlich auftritt." },
      { id: "audience-specific", label: "Die beschriebene Zielgruppe ist konkret genug.", resultText: "Ob die beschriebene Gruppe konkret genug gefasst ist." },
      { id: "current-alternatives", label: "Bestehende Alternativen lassen eine relevante Lücke offen.", resultText: "Welche Alternativen bereits genutzt werden und wo dabei eine Lücke bleibt." },
      { id: "value-matters", label: "Der mögliche Nutzen ist für diese Menschen wirklich bedeutsam.", resultText: "Ob der mögliche Nutzen für die gemeinten Menschen wirklich bedeutsam ist." },
      { id: "idea-usable", label: "Die Idee lässt sich in einer verständlichen Form erlebbar machen.", resultText: "Ob sich die Idee verständlich und klein genug erlebbar machen lässt." },
      { id: "commitment-fit", label: "Ich möchte das Vorhaben unter realen Bedingungen weiterverfolgen.", resultText: "Ob du das Vorhaben unter deinen realen Bedingungen weiterverfolgen möchtest." },
    ],
  },
  {
    id: "real-constraints",
    sectionId: "reality",
    prompt: "Welche Grenzen sollen beim ersten Versuch ausdrücklich gelten?",
    context: "Wähle bis zu drei. Grenzen sind Planungsbedingungen, keine Schwächen.",
    resultRole: "constraints",
    format: "multi",
    minSelections: 1,
    maxSelections: 3,
    options: [
      { id: "limited-time", label: "Nur wenige Stunden Zeit.", resultText: "Der erste Versuch soll in wenigen Stunden machbar bleiben." },
      { id: "no-budget", label: "Kein oder nur sehr kleines Budget.", resultText: "Der erste Versuch soll ohne nennenswertes Budget auskommen." },
      { id: "limited-access", label: "Noch wenig Zugang zu möglichen Nutzer:innen.", resultText: "Der Zugang zu möglicherweise betroffenen Menschen ist noch begrenzt." },
      { id: "energy-boundary", label: "Meine verfügbare Energie ist begrenzt.", resultText: "Der Versuch soll deine verfügbare Energie ausdrücklich schützen." },
      { id: "privacy-boundary", label: "Sensible Daten oder Privatsphäre dürfen nicht berührt werden.", resultText: "Der Versuch darf keine sensiblen Daten erheben oder Privatsphäre berühren." },
      { id: "legal-boundary", label: "Rechtliche oder fachliche Grenzen müssen vor Umsetzung geklärt werden.", resultText: "Vor einer Umsetzung müssen rechtliche oder fachliche Grenzen separat geklärt werden." },
      { id: "no-clear-limit", label: "Ich kann noch keine klare Grenze benennen.", resultText: "Eine klare Grenze für den ersten Versuch ist noch offen.", exclusive: true },
    ],
  },
  {
    id: "learning-goal",
    sectionId: "experiment",
    prompt: "Was möchtest du mit dem nächsten kleinen Schritt vor allem besser verstehen?",
    context: "Ein Lernziel hält den Versuch kleiner als eine komplette Umsetzung.",
    resultRole: "learning-goal",
    format: "single",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "understand-problem", label: "Wie Menschen das Problem selbst beschreiben.", resultText: "wie mögliche Betroffene das Problem in ihren eigenen Worten beschreiben" },
      { id: "understand-alternatives", label: "Was Menschen heute stattdessen tun.", resultText: "welche Alternativen Menschen heute nutzen und was daran fehlt" },
      { id: "understand-value", label: "Ob der mögliche Nutzen verständlich und relevant wirkt.", resultText: "wie verständlich und relevant der mögliche Nutzen auf Menschen wirkt" },
      { id: "understand-use", label: "Wie Menschen mit einer sehr einfachen Version umgehen würden.", resultText: "wie Menschen mit einer sehr einfachen Version tatsächlich umgehen" },
      { id: "understand-fit", label: "Ob ich selbst das Vorhaben unter realen Bedingungen weitertragen möchte.", resultText: "ob du selbst das Vorhaben unter realen Bedingungen weitertragen möchtest" },
    ],
  },
  {
    id: "experiment-mode",
    sectionId: "experiment",
    prompt: "Welche Form passt für deinen ersten Lernversuch am ehesten?",
    context: "Wähle die kleinste Form, die dir einen ehrlichen Hinweis geben kann.",
    resultRole: "experiment-mode",
    format: "single",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "conversation", label: "Ein kurzes, offenes Gespräch ohne Verkauf.", resultText: "Führe ein kurzes, offenes Gespräch, ohne die Person von deiner Lösung überzeugen zu wollen." },
      { id: "observation", label: "Eine reale Situation beobachten oder dokumentieren.", resultText: "Beobachte oder dokumentiere eine reale Situation, ohne unnötige personenbezogene Daten zu erfassen." },
      { id: "paper-walkthrough", label: "Eine Skizze oder einen Ablauf gemeinsam durchgehen.", resultText: "Gehe eine einfache Skizze oder einen Ablauf gemeinsam mit einer Person durch." },
      { id: "manual-prototype", label: "Eine winzige manuelle Version einmal erproben.", resultText: "Erprobe eine winzige manuelle Version einmal in einem klar begrenzten Rahmen." },
      { id: "desk-research", label: "Bestehende Alternativen strukturiert vergleichen.", resultText: "Vergleiche wenige bestehende Alternativen anhand einer vorher notierten Frage." },
      { id: "private-reflection", label: "Zuerst eine kurze persönliche Entscheidungsnotiz schreiben.", resultText: "Schreibe zuerst eine kurze persönliche Entscheidungsnotiz, bevor du andere einbeziehst." },
    ],
  },
] as const;
