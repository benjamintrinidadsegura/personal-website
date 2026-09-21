import { careerModule } from "@/data/life-alignment-personal";
import type { Locale } from "@/lib/i18n/config";
import type { PersonalAlignmentAnswerSet, PersonalAlignmentResult, PersonalAlignmentSignal, PersonalModuleDefinition } from "@/types/life-alignment-personal";

function signal(current: number, importance: number): PersonalAlignmentSignal {
  if (current >= 4) return "strong";
  if (current <= 2 && importance >= 4) return "tension";
  if (importance >= 3) return "attention";
  return "background";
}

export function buildPersonalAlignmentResult(definition: PersonalModuleDefinition, answers: PersonalAlignmentAnswerSet, locale: Locale): PersonalAlignmentResult | null {
  if (definition.dimensions.some(({ id }) => !answers[id])) return null;
  const dimensions = definition.dimensions.map((dimension) => {
    const answer = answers[dimension.id]!;
    return { dimensionId: dimension.id, title: dimension.title[locale], current: answer.current, importance: answer.importance, signal: signal(answer.current, answer.importance) };
  });
  const tensions = dimensions.filter(({ signal: value }) => value === "tension").sort((a, b) => b.importance - a.importance);
  const strongSignals = dimensions.filter(({ signal: value }) => value === "strong").sort((a, b) => b.importance - a.importance);
  const worthExploring = dimensions.filter(({ signal: value }) => value === "attention").sort((a, b) => b.importance - a.importance);
  const focus = tensions[0] ?? worthExploring[0] ?? strongSignals[0];
  const nextReflection = focus
    ? locale === "de" ? `Was wäre ein kleiner, reversibler Versuch rund um „${focus.title}“, und woran würdest du seine Wirkung erkennen?` : `What is one small, reversible experiment around “${focus.title}”, and what would help you notice its effect?`
    : locale === "de" ? "Welche Beobachtung möchtest du aus dieser Momentaufnahme in den Alltag mitnehmen?" : "What observation from this snapshot would you like to carry into everyday life?";
  return { moduleId: definition.id, moduleVersion: definition.version, dimensions, strongSignals, tensions, worthExploring, nextReflection };
}

export function getPersonalModule(moduleId: "career"): PersonalModuleDefinition {
  if (moduleId !== "career") throw new Error("Unsupported personal module");
  return careerModule;
}
