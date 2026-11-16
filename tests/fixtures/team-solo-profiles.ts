import { getRelationshipModule } from "../../data/life-alignment-relationship";
import type { RelationshipAnswer, RelationshipAnswerSet } from "../../types/life-alignment-relationship";

const base = () => Object.fromEntries(getRelationshipModule("team").questions.map(q => [q.id, { value: 3, importance: "medium" }])) as Record<string, RelationshipAnswer>;
const profile = (id: string, mapping: string, changes: Record<string, number>, omit: string[] = []) => {
  const answers = base();
  for (const [key, value] of Object.entries(changes)) answers[key.includes("-scenario") ? key : `team-${key}-position`] = { value: value as RelationshipAnswer["value"], importance: "high" };
  for (const key of omit) delete answers[key];
  return { id, mapping, answers: answers as RelationshipAnswerSet };
};
export const teamProfiles = [
  profile("owned-flexible", "Requested autonomy/low structure: measures individual responsibility and flexible information flow, not freedom or autonomy as a trait.", { autonomy: 5, communication: 1 }),
  profile("explicit-under-pressure", "Requested structure/ambiguity: explicit information and predictability under pressure; ambiguity tolerance is not measured.", { communication: 5, reliability: 5 }),
  profile("collaborative", "Togetherness and shared decisions, not observed collaboration skill.", { collaboration: 5, decisions: 1 }),
  profile("individual-focus", "Individual space and individual ownership, not observed concentration ability.", { collaboration: 1, ownership: 5 }),
  profile("gradual-repair", "Requested conflict avoidance: only gradual feedback/repair is measured. Cannot infer avoidance or fear.", { feedback: 1, conflict: 1 }),
  profile("direct-repair", "Fast/direct feedback and conflict repair; no inference about tone or empathy.", { feedback: 5, conflict: 5 }),
  profile("context-shift", "Explicit information in ordinary conditions, flexible under pressure: context dependence, not a contradictory personality.", { communication: 5, "team-communication-scenario": 1 }),
  profile("incomplete", "Only one directional answer: no combined interpretation is justified. Existing completion guard must still reject final submission.", { communication: 5 }, getRelationshipModule("team").questions.filter(q => q.id !== "team-communication-position").map(q => q.id)),
  profile("midpoint", "Midpoints can mean balance, context dependence or uncertainty. The scale cannot distinguish them.", {}),
  profile("competing-priorities", "Fast pace and quality both high priority, plus shared decisions and individual execution.", { pace: 5, quality: 5, decisions: 1, ownership: 5, feedback: 5, conflict: 1 }),
];
