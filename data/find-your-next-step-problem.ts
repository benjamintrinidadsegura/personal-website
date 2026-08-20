import type { ProblemQuestion, ProblemSection } from "@/types/find-your-next-step-problem";
import type { Locale } from "@/lib/i18n/config";
import { problemLocaleCopy } from "@/data/find-your-next-step-problem-locales";

export const problemIntro = {
  eyebrow: "V1 · Strukturierte Situationsklärung",
  title: "Ordne ein Problem, bevor du den nächsten Schritt wählst.",
  description:
    "Diese Journey hilft dir, Situation, Dringlichkeit, bisherige Versuche und deinen nächsten kleinen Schritt zu sortieren. Sie löst das Problem nicht für dich.",
  canDo: [
    "deine aktuelle Lage in wenige klare Teile zerlegen",
    "zwischen unmittelbarer Dringlichkeit und späterer Klärung unterscheiden",
    "einen überschaubaren nächsten Erkundungsschritt formulieren",
  ],
  cannotDo: [
    "keine medizinische, psychologische, rechtliche oder finanzielle Beratung leisten",
    "keine Gefahr, Diagnose, Schuld oder Erfolgsaussicht bewerten",
    "keine Entscheidung treffen oder automatisch Kontakt zu Dritten aufnehmen",
  ],
  duration: "9 kurze Klärungen in 4 Abschnitten · etwa 5–7 Minuten",
  privacy:
    "Deine Angaben bleiben nur im aktuellen Seitenzustand. Sie werden weder gespeichert noch übertragen und auch dann nicht mit deinem BTS Account verknüpft, wenn du eingeloggt bist.",
  urgentBoundary:
    "Wenn du oder eine andere Person unmittelbar gefährdet seid, nutze FYNS nicht zur Klärung. Wende dich jetzt an den örtlichen Notruf oder eine unmittelbar erreichbare geeignete Anlaufstelle.",
} as const;

export const problemSections: readonly ProblemSection[] = [
  { id: "situation", title: "Worum geht es?", description: "Problemfeld und gewünschte Veränderung." },
  { id: "urgency", title: "Wie dringend ist es?", description: "Zeitdruck und unmittelbare Sicherheit." },
  { id: "experience", title: "Was ist schon bekannt?", description: "Bisherige Versuche und eigener Einfluss." },
  { id: "next-step", title: "Was hilft jetzt?", description: "Unterstützung und eine passende nächste Bewegung." },
] as const;

export const problemQuestions: readonly ProblemQuestion[] = [
  {
    id: "situation-area",
    sectionId: "situation",
    prompt: "In welchem Bereich liegt das Problem hauptsächlich?",
    context: "Wähle den Bereich, der für diese Klärung am wichtigsten ist. Mehrere Bereiche können trotzdem zusammenhängen.",
    format: "single",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "area-work", label: "Arbeit, Ausbildung oder berufliche Richtung" },
      { id: "area-relationship", label: "Beziehung, Familie oder Zusammenarbeit" },
      { id: "area-health", label: "Gesundheit oder seelisches Wohlbefinden" },
      { id: "area-finance", label: "Geld, Vertrag oder finanzielle Verpflichtung" },
      { id: "area-legal", label: "Rechtliche, behördliche oder formale Frage" },
      { id: "area-living", label: "Wohnen, Alltag oder praktische Organisation" },
      { id: "area-other", label: "Ein anderer oder noch nicht klarer Bereich" },
    ],
  },
  {
    id: "situation-change",
    sectionId: "situation",
    prompt: "Woran würdest du eine kleine Verbesserung erkennen?",
    context: "Ein kurzer Satz genügt. Beschreibe eine beobachtbare Veränderung, keine perfekte Lösung.",
    format: "text",
    minSelections: 1,
    maxSelections: 1,
    maxLength: 280,
    options: [],
  },
  {
    id: "urgency-pressure",
    sectionId: "urgency",
    prompt: "Wie viel zeitlichen Druck erlebst du gerade?",
    context: "Wähle die Beschreibung, die deiner tatsächlichen Situation am nächsten kommt.",
    format: "single",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "pressure-room", label: "Ich habe Zeit, die Situation in Ruhe zu prüfen." },
      { id: "pressure-soon", label: "Eine Entscheidung oder Reaktion wird bald nötig." },
      { id: "pressure-now", label: "Es braucht heute oder sehr kurzfristig eine Reaktion." },
    ],
  },
  {
    id: "urgency-safety",
    sectionId: "urgency",
    prompt: "Ist jemand unmittelbar gefährdet oder könnte sofortiger Schutz nötig sein?",
    context: "FYNS kann Gefahr nicht beurteilen. Wenn du unsicher bist, wähle bewusst die unsichere Antwort.",
    format: "single",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "safety-no", label: "Nein, ich erkenne keine unmittelbare Gefahr." },
      { id: "safety-unsure", label: "Ich bin unsicher, ob sofortiger Schutz nötig ist." },
      { id: "safety-immediate", label: "Ja, es könnte eine unmittelbare Gefahr bestehen." },
    ],
  },
  {
    id: "experience-tried",
    sectionId: "experience",
    prompt: "Was hast du bisher versucht?",
    context: "Wähle bis zu drei Schritte. Es ist völlig in Ordnung, wenn du noch nichts versucht hast.",
    format: "multi",
    minSelections: 1,
    maxSelections: 3,
    options: [
      { id: "tried-reflect", label: "Die Situation für mich selbst sortiert oder aufgeschrieben" },
      { id: "tried-talk", label: "Mit einer vertrauten oder beteiligten Person gesprochen" },
      { id: "tried-information", label: "Fakten, Regeln oder mögliche Anlaufstellen recherchiert" },
      { id: "tried-action", label: "Einen konkreten Lösungsversuch unternommen" },
      { id: "tried-professional", label: "Bereits qualifizierte Unterstützung gesucht" },
      { id: "tried-none", label: "Noch nichts davon", exclusive: true },
    ],
  },
  {
    id: "experience-effect",
    sectionId: "experience",
    prompt: "Was haben diese Versuche bisher verändert?",
    context: "Es geht nur um deine aktuelle Beobachtung, nicht um eine Bewertung deiner Bemühungen.",
    format: "single",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "effect-helped", label: "Etwas ist klarer oder leichter geworden." },
      { id: "effect-partly", label: "Ein Teil hat geholfen, anderes bleibt offen." },
      { id: "effect-none", label: "Bisher hat sich kaum etwas verbessert." },
      { id: "effect-unclear", label: "Das kann ich noch nicht einschätzen." },
    ],
  },
  {
    id: "experience-influence",
    sectionId: "experience",
    prompt: "Wie viel davon kannst du selbst direkt beeinflussen?",
    context: "Unterscheide zwischen deinem eigenen nächsten Schritt und Dingen, die von anderen, Regeln oder Umständen abhängen.",
    format: "single",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "influence-direct", label: "Einen wichtigen Teil kann ich selbst direkt bewegen." },
      { id: "influence-shared", label: "Ich kann beitragen, aber andere oder äußere Bedingungen entscheiden mit." },
      { id: "influence-low", label: "Mein direkter Einfluss ist im Moment gering." },
      { id: "influence-unclear", label: "Ich kann meinen Einfluss noch nicht klar einschätzen." },
    ],
  },
  {
    id: "next-support",
    sectionId: "next-step",
    prompt: "Welche Unterstützung wäre für den nächsten Schritt realistisch erreichbar?",
    context: "Wähle bis zu drei Möglichkeiten, die tatsächlich verfügbar sein könnten.",
    format: "multi",
    minSelections: 1,
    maxSelections: 3,
    options: [
      { id: "support-trusted", label: "Eine vertraute Person zum ruhigen Sortieren" },
      { id: "support-involved", label: "Ein direktes Gespräch mit einer beteiligten Person" },
      { id: "support-professional", label: "Eine fachlich qualifizierte Beratungs- oder Anlaufstelle" },
      { id: "support-information", label: "Verlässliche Informationen, Regeln oder Unterlagen" },
      { id: "support-practical", label: "Praktische Hilfe für einen kleinen konkreten Schritt" },
      { id: "support-none", label: "Im Moment ist keine dieser Möglichkeiten sicher erreichbar.", exclusive: true },
    ],
  },
  {
    id: "next-mode",
    sectionId: "next-step",
    prompt: "Welche nächste Bewegung fühlt sich gerade am ehesten tragfähig an?",
    context: "Diese Auswahl ist ein Vorschlag für deine Erkundung, keine Anweisung und keine Bewertung.",
    format: "single",
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: "mode-facts", label: "Zuerst die wichtigsten Fakten und offenen Fragen klären" },
      { id: "mode-talk", label: "Ein vorbereitetes Gespräch führen" },
      { id: "mode-small-step", label: "Einen kleinen, reversiblen Schritt ausprobieren" },
      { id: "mode-professional", label: "Eine passende qualifizierte Anlaufstelle kontaktieren" },
      { id: "mode-pause", label: "Kurz Abstand gewinnen und dann neu entscheiden" },
    ],
  },
] as const;

const problemIntroEn = {
  eyebrow: "V1 · Structured situation review",
  title: "Make sense of a problem before choosing your next step.",
  description: "This journey helps you sort the situation, urgency, previous attempts and your next small step. It does not solve the problem for you.",
  canDo: ["break your current situation into a few clear parts", "distinguish immediate urgency from something that can be clarified later", "formulate a manageable next exploration step"],
  cannotDo: ["provide medical, psychological, legal or financial advice", "assess danger, diagnosis, blame or likelihood of success", "make a decision or contact anyone automatically"],
  duration: "9 short prompts in 4 sections · about 5–7 minutes",
  privacy: "Your answers remain only in the current page state. They are neither stored nor transmitted and are not connected to your BTS Account, even when you are logged in.",
  urgentBoundary: "If you or another person are in immediate danger, do not use FYNS to assess the situation. Contact your local emergency services or another appropriate source of immediate help now.",
} as const;

const problemSectionCopyEn: Readonly<Record<ProblemSection["id"], Pick<ProblemSection, "title" | "description">>> = {
  situation: { title: "What is happening?", description: "The problem area and the change you want." },
  urgency: { title: "How urgent is it?", description: "Time pressure and immediate safety." },
  experience: { title: "What is already known?", description: "Previous attempts and your own influence." },
  "next-step": { title: "What could help now?", description: "Support and a fitting next move." },
};

const problemQuestionCopyEn: Readonly<Record<string, { prompt: string; context?: string; options?: Readonly<Record<string, string>> }>> = {
  "situation-area": { prompt: "Which area is the problem mainly about?", context: "Choose the area that matters most for this review. Several areas may still be connected.", options: {
    "area-work": "Work, education or professional direction", "area-relationship": "A relationship, family or collaboration", "area-health": "Health or emotional wellbeing", "area-finance": "Money, a contract or a financial obligation", "area-legal": "A legal, administrative or formal question", "area-living": "Housing, daily life or practical organisation", "area-other": "Another area, or one that is not clear yet",
  } },
  "situation-change": { prompt: "What small change would tell you that things are improving?", context: "One short sentence is enough. Describe an observable change, not a perfect solution." },
  "urgency-pressure": { prompt: "How much time pressure are you experiencing right now?", context: "Choose the description that comes closest to your actual situation.", options: {
    "pressure-room": "I have time to examine the situation calmly.", "pressure-soon": "A decision or response will be needed soon.", "pressure-now": "A response is needed today or very shortly.",
  } },
  "urgency-safety": { prompt: "Is anyone in immediate danger, or might immediate protection be needed?", context: "FYNS cannot assess danger. If you are unsure, deliberately choose the uncertain answer.", options: {
    "safety-no": "No, I cannot see an immediate danger.", "safety-unsure": "I am unsure whether immediate protection is needed.", "safety-immediate": "Yes, there may be an immediate danger.",
  } },
  "experience-tried": { prompt: "What have you tried so far?", context: "Choose up to three steps. It is completely fine if you have not tried anything yet.", options: {
    "tried-reflect": "Sorted through or written down the situation for myself", "tried-talk": "Spoken with someone I trust or someone involved", "tried-information": "Researched facts, rules or possible sources of support", "tried-action": "Made a concrete attempt to improve the situation", "tried-professional": "Already sought qualified support", "tried-none": "None of these yet",
  } },
  "experience-effect": { prompt: "What have these attempts changed so far?", context: "This is only about what you currently observe, not a judgement of your efforts.", options: {
    "effect-helped": "Something has become clearer or easier.", "effect-partly": "One part helped; other things remain unresolved.", "effect-none": "Very little has improved so far.", "effect-unclear": "I cannot assess that yet.",
  } },
  "experience-influence": { prompt: "How much of this can you directly influence yourself?", context: "Distinguish your own next step from things that depend on other people, rules or circumstances.", options: {
    "influence-direct": "I can directly move an important part myself.", "influence-shared": "I can contribute, but other people or external conditions also decide.", "influence-low": "My direct influence is limited at the moment.", "influence-unclear": "I cannot yet assess my influence clearly.",
  } },
  "next-support": { prompt: "What support could realistically be available for the next step?", context: "Choose up to three possibilities that may actually be accessible.", options: {
    "support-trusted": "Someone I trust who can help me think calmly", "support-involved": "A direct conversation with someone involved", "support-professional": "A suitably qualified advisory service or professional", "support-information": "Reliable information, rules or documents", "support-practical": "Practical help with one small concrete step", "support-none": "None of these options is reliably available right now.",
  } },
  "next-mode": { prompt: "Which next move feels most manageable right now?", context: "This choice suggests a way to explore, not an instruction or judgement.", options: {
    "mode-facts": "First clarify the most important facts and open questions", "mode-talk": "Have a prepared conversation", "mode-small-step": "Try one small, reversible step", "mode-professional": "Contact an appropriate qualified source of support", "mode-pause": "Take a short step back, then decide again",
  } },
};

const problemIntroByLocale = { de: problemIntro, en: problemIntroEn, es: problemLocaleCopy.es.intro, tr: problemLocaleCopy.tr.intro, pl: problemLocaleCopy.pl.intro, el: problemLocaleCopy.el.intro, ru: problemLocaleCopy.ru.intro } as const;
const problemSectionCopyByLocale = { en: problemSectionCopyEn, es: problemLocaleCopy.es.sections, tr: problemLocaleCopy.tr.sections, pl: problemLocaleCopy.pl.sections, el: problemLocaleCopy.el.sections, ru: problemLocaleCopy.ru.sections } as const;
const problemQuestionCopyByLocale = { en: problemQuestionCopyEn, es: problemLocaleCopy.es.questions, tr: problemLocaleCopy.tr.questions, pl: problemLocaleCopy.pl.questions, el: problemLocaleCopy.el.questions, ru: problemLocaleCopy.ru.questions } as const;

export function getProblemIntro(locale: Locale) { return problemIntroByLocale[locale]; }

export function getProblemSections(locale: Locale): readonly ProblemSection[] {
  const localize = (copy: (typeof problemSectionCopyByLocale)[keyof typeof problemSectionCopyByLocale]) => problemSections.map((section) => ({ ...section, ...copy[section.id] }));
  return ({ de: () => problemSections, en: () => localize(problemSectionCopyByLocale.en), es: () => localize(problemSectionCopyByLocale.es), tr: () => localize(problemSectionCopyByLocale.tr), pl: () => localize(problemSectionCopyByLocale.pl), el: () => localize(problemSectionCopyByLocale.el), ru: () => localize(problemSectionCopyByLocale.ru) } satisfies Record<Locale, () => readonly ProblemSection[]>)[locale]();
}

export function getProblemQuestions(locale: Locale): readonly ProblemQuestion[] {
  const localize = (copies: (typeof problemQuestionCopyByLocale)[keyof typeof problemQuestionCopyByLocale]) => problemQuestions.map((question) => {
    const copy = copies[question.id];
    return {
      ...question,
      prompt: copy.prompt,
      ...(copy.context ? { context: copy.context } : {}),
      options: question.options.map((option) => ({ ...option, label: copy.options?.[option.id] ?? option.label })),
    };
  });
  return ({ de: () => problemQuestions, en: () => localize(problemQuestionCopyByLocale.en), es: () => localize(problemQuestionCopyByLocale.es), tr: () => localize(problemQuestionCopyByLocale.tr), pl: () => localize(problemQuestionCopyByLocale.pl), el: () => localize(problemQuestionCopyByLocale.el), ru: () => localize(problemQuestionCopyByLocale.ru) } satisfies Record<Locale, () => readonly ProblemQuestion[]>)[locale]();
}
