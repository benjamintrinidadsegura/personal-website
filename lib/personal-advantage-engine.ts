import { advantageQuestions } from "@/data/personal-advantage-questions";
import { advantageSignalById, advantageSignals } from "@/data/personal-advantage-signals";
import { curatedAdvantageSynergies } from "@/data/personal-advantage-synergies";
import type {
  AdvantageAnswer,
  AdvantageAnswerSet,
  AdvantageCalibration,
  AdvantageCandidate,
  AdvantageConfidence,
  AdvantageEvidence,
  AdvantageEvidenceClass,
  AdvantageProbe,
  AdvantageProbeAnswers,
  AdvantageQuestion,
  AdvantageSignalProfile,
  AdvantageSynergyDefinition,
  PersonalAdvantageMap,
} from "@/types/personal-advantage";

const evidenceWeights: Record<AdvantageEvidenceClass, number> = {
  "self-perception": .52,
  preference: .68,
  behavioral: 1,
  external: 1.12,
  outcome: 1.28,
  "cross-context": 1.15,
};

const strongEvidenceClasses = new Set<AdvantageEvidenceClass>(["behavioral", "external", "outcome"]);
const dynamicQuestionStrength: Record<string, number> = { q21: 1.05, q44: .25, q46: 1.1, q59: .9 };

function selectedValues(answer: AdvantageAnswer | undefined): readonly string[] {
  if (!answer || answer.skipped) return [];
  if (typeof answer.value === "string") return answer.value ? [answer.value] : [];
  return answer.value;
}

function hasMeaningfulText(answer: AdvantageAnswer | undefined): boolean {
  return Boolean(answer?.freeText?.trim());
}

export function isAdvantageQuestionActive(question: AdvantageQuestion, answers: AdvantageAnswerSet): boolean {
  if (!question.condition) return true;
  const dependency = answers[question.condition.questionId];
  if (question.condition.includesAny.includes("answered")) return hasMeaningfulText(dependency);
  const values = selectedValues(dependency);
  return question.condition.includesAny.some((value) => values.includes(value));
}

export function getActiveAdvantageQuestions(answers: AdvantageAnswerSet): AdvantageQuestion[] {
  return advantageQuestions.filter((question) => isAdvantageQuestionActive(question, answers));
}

export function reconcileAdvantageAnswers(answers: AdvantageAnswerSet): Record<string, AdvantageAnswer> {
  const next: Record<string, AdvantageAnswer> = { ...answers };
  let changed = true;
  while (changed) {
    changed = false;
    for (const question of advantageQuestions) {
      if (!isAdvantageQuestionActive(question, next) && next[question.id]) {
        delete next[question.id];
        changed = true;
      }
    }
  }
  return next;
}

export function normalizeAdvantageEvidence(answers: AdvantageAnswerSet): AdvantageEvidence[] {
  const evidence: AdvantageEvidence[] = [];
  for (const question of advantageQuestions) {
    if (!isAdvantageQuestionActive(question, answers)) continue;
    const answer = answers[question.id];
    const values = selectedValues(answer);
    if (question.type === "adaptive-signals") {
      for (const signalId of values) {
        if (!advantageSignalById.has(signalId)) continue;
        evidence.push({
          questionId: question.id,
          signalId,
          evidenceClass: question.evidenceClass,
          direction: question.id === "q59" ? "contradict" : "support",
          strength: dynamicQuestionStrength[question.id] ?? .5,
          ...(question.id === "q59" ? { modifier: "energy" as const } : question.id === "q46" ? { modifier: "experience" as const } : {}),
        });
      }
      continue;
    }
    for (const optionId of values) {
      const option = question.options.find(({ id }) => id === optionId);
      if (!option) continue;
      for (const effect of option.effects) {
        if (!advantageSignalById.has(effect.signalId)) continue;
        evidence.push({
          questionId: question.id,
          signalId: effect.signalId,
          evidenceClass: question.evidenceClass,
          direction: effect.direction ?? "support",
          strength: effect.strength ?? 1,
          ...(effect.modifier ? { modifier: effect.modifier } : {}),
        });
      }
    }
  }
  return evidence;
}

export function buildAdvantageSignalProfiles(answers: AdvantageAnswerSet): AdvantageSignalProfile[] {
  const normalized = normalizeAdvantageEvidence(answers);
  return advantageSignals.map((signal) => {
    const signalEvidence = normalized.filter(({ signalId }) => signalId === signal.id);
    const support = signalEvidence
      .filter(({ direction, modifier }) => direction === "support" && modifier !== "energy")
      .reduce((sum, item) => sum + item.strength * evidenceWeights[item.evidenceClass], 0);
    const contradiction = signalEvidence
      .filter(({ direction, modifier }) => direction === "contradict" && modifier !== "energy")
      .reduce((sum, item) => sum + item.strength * evidenceWeights[item.evidenceClass], 0);
    const energy = signalEvidence
      .filter(({ modifier }) => modifier === "energy")
      .reduce((sum, item) => sum + (item.direction === "support" ? item.strength : -item.strength), 0);
    return {
      signal,
      support,
      contradiction,
      energy,
      evidenceClasses: [...new Set(signalEvidence.map(({ evidenceClass }) => evidenceClass))],
      evidence: signalEvidence,
      questionIds: [...new Set(signalEvidence.map(({ questionId }) => questionId))],
    };
  }).sort((left, right) => (right.support - right.contradiction) - (left.support - left.contradiction) || left.signal.id.localeCompare(right.signal.id));
}

function probeInteraction(candidateId: string, probes: readonly AdvantageProbe[], answers: AdvantageProbeAnswers): { interaction: number; energy: number; contexts: string[] } {
  const relevant = probes.filter(({ candidateId: id }) => id === candidateId);
  const resolved = relevant.flatMap((probe) => {
    const answer = answers[probe.id];
    const option = probe.options.find(({ id }) => id === answer);
    return option ? [{ probe, option }] : [];
  });
  if (!resolved.length) return { interaction: 0, energy: 0, contexts: [] };
  return {
    interaction: resolved.reduce((sum, { option }) => sum + option.interaction, 0) / resolved.length,
    energy: resolved.reduce((sum, { option }) => sum + (option.energy ?? 0), 0) / resolved.length,
    contexts: resolved.flatMap(({ option }) => option.context ? [option.context] : []),
  };
}

function candidateFromDefinition(
  definition: AdvantageSynergyDefinition,
  profilesById: ReadonlyMap<string, AdvantageSignalProfile>,
  probes: readonly AdvantageProbe[],
  probeAnswers: AdvantageProbeAnswers,
  calibration: AdvantageCalibration,
  source: AdvantageCandidate["source"] = "curated",
): AdvantageCandidate | null {
  const profiles = definition.signalIds.map((id) => profilesById.get(id)).filter((profile): profile is AdvantageSignalProfile => Boolean(profile));
  if (profiles.length !== definition.signalIds.length || profiles.filter(({ support }) => support >= .5).length < 2) return null;
  const classSet = new Set(profiles.flatMap(({ evidenceClasses }) => evidenceClasses));
  const evidenceStrength = profiles.reduce((sum, profile) => sum + Math.max(0, profile.support - profile.contradiction * .55), 0) / profiles.length;
  const interaction = probeInteraction(definition.id, probes, probeAnswers);
  const uniqueQuestions = new Set(profiles.flatMap(({ questionIds }) => questionIds));
  const explanatoryPower = Math.min(5, uniqueQuestions.size / 2.4 + classSet.size * .35);
  const contextEvidence = profiles.flatMap(({ evidence }) => evidence).filter(({ modifier }) => modifier === "context").length;
  const contextFit = Math.min(3, .75 + contextEvidence * .6 + interaction.contexts.length * .5);
  const energyAlignment = profiles.reduce((sum, profile) => sum + profile.energy, 0) / profiles.length + interaction.energy;
  const contradictionPenalty = profiles.reduce((sum, profile) => sum + profile.contradiction, 0) / profiles.length;
  const calibrationValue = calibration[definition.id];
  const calibrationModifier = calibrationValue === "very-true" ? .55 : calibrationValue === "sometimes-true" ? .1 : calibrationValue === "not-really" ? -.75 : 0;
  const hasStrongClass = [...classSet].some((value) => strongEvidenceClasses.has(value));
  const interactionSupported = interaction.interaction >= .35;
  const eligibleForCore = profiles.every(({ support }) => support >= .65)
    && classSet.size >= 2
    && hasStrongClass
    && interaction.interaction > -.2
    && contextFit > .5
    && explanatoryPower > 1.6
    && calibrationModifier > -.7;
  const confidence: AdvantageConfidence = eligibleForCore
    && (classSet.has("cross-context") || classSet.has("outcome") || classSet.has("external"))
    && interactionSupported
    && evidenceStrength >= 1.7
    ? "strong-pattern"
    : eligibleForCore && evidenceStrength >= 1.05 ? "supported" : "emerging";
  const ranking = evidenceStrength + interaction.interaction * .8 + explanatoryPower * .38 + contextFit * .2 + Math.max(-.6, energyAlignment * .25) - contradictionPenalty * .7 + calibrationModifier;
  return {
    id: definition.id,
    label: definition.label,
    signalIds: definition.signalIds,
    type: definition.type,
    source,
    synthesis: definition.synthesis,
    evidenceStrength: ranking,
    interactionStrength: interaction.interaction,
    explanatoryPower,
    contextFit,
    energyAlignment,
    contradictionPenalty,
    calibrationModifier,
    confidence,
    eligibleForCore,
    evidenceClasses: [...classSet],
    recognition: definition.recognition,
    contexts: [...new Set([...interaction.contexts, ...definition.contexts])].slice(0, 5),
    killers: definition.killers,
    shadow: definition.shadow,
    counterweight: definition.counterweight,
    multiplier: definition.multiplier,
  };
}

function composableDefinitions(profiles: readonly AdvantageSignalProfile[], curatedSignalSets: ReadonlySet<string>): AdvantageSynergyDefinition[] {
  const viable = profiles.filter(({ support, contradiction }) => support - contradiction > .65).slice(0, 8);
  const definitions: AdvantageSynergyDefinition[] = [];
  for (let left = 0; left < viable.length; left += 1) {
    for (let right = left + 1; right < viable.length; right += 1) {
      const pair = [viable[left].signal, viable[right].signal].sort((a, b) => a.id.localeCompare(b.id));
      const key = pair.map(({ id }) => id).join("|");
      if (curatedSignalSets.has(key)) continue;
      definitions.push({
        id: `composed-${pair.map(({ id }) => id).join("-")}`,
        label: `${pair[0].label} in Practice`,
        signalIds: pair.map(({ id }) => id),
        type: "reinforcement",
        synthesis: `${pair[0].definition} ${pair[1].definition} Your answers suggest these may become more useful when they happen together, but the interaction still deserves real-world testing.`,
        recognition: [`Look for a situation where ${pair[0].label} directly helps ${pair[1].label} produce a result.`],
        contexts: [...new Set(pair.flatMap(({ contexts }) => contexts))].slice(0, 4),
        killers: [`The work allows ${pair[0].label} but blocks ${pair[1].label}.`, "The two capabilities are used separately rather than as a sequence."],
        shadow: `Overuse can combine ${pair[0].overusePatterns[0]} with ${pair[1].overusePatterns[0]}.`,
        counterweight: "Use a small real-world test and a visible stopping rule before treating the combination as established.",
        multiplier: pair[0].possibleMultipliers[0] ?? pair[1].possibleMultipliers[0] ?? "feedback",
      });
      if (definitions.length === 12) return definitions;
    }
  }
  return definitions;
}

export function buildAdvantageCandidates(
  answers: AdvantageAnswerSet,
  probes: readonly AdvantageProbe[] = [],
  probeAnswers: AdvantageProbeAnswers = {},
  calibration: AdvantageCalibration = {},
): AdvantageCandidate[] {
  const profiles = buildAdvantageSignalProfiles(answers);
  const profilesById = new Map(profiles.map((profile) => [profile.signal.id, profile]));
  const curatedSignalSets = new Set(curatedAdvantageSynergies.map(({ signalIds }) => [...signalIds].sort().join("|")));
  const definitions = [...curatedAdvantageSynergies, ...composableDefinitions(profiles, curatedSignalSets)];
  return definitions
    .map((definition) => candidateFromDefinition(definition, profilesById, probes, probeAnswers, calibration, definition.id.startsWith("composed-") ? "composable" : "curated"))
    .filter((candidate): candidate is AdvantageCandidate => Boolean(candidate))
    .sort((left, right) => right.evidenceStrength - left.evidenceStrength || right.explanatoryPower - left.explanatoryPower || left.id.localeCompare(right.id));
}

const archetypes: readonly AdvantageProbe["archetype"][] = ["pair-interaction", "outcome-check", "energy", "context-split", "social-proof", "overuse", "sequence", "missing-component", "bridge-test", "replacement-test"];

function probeFor(candidate: AdvantageCandidate, archetype: AdvantageProbe["archetype"], index: number): AdvantageProbe {
  const names = candidate.signalIds.map((id) => advantageSignalById.get(id)?.label ?? id);
  const base = { id: `probe-${index + 1}-${candidate.id}`, candidateId: candidate.id, archetype } as const;
  if (archetype === "pair-interaction") return { ...base, prompt: `You seem to use ${names[0]} and ${names[1]}. How do they relate?`, options: [{ id: "separate", label: "Usually separately.", interaction: -.35 }, { id: "helps", label: "One often helps the other.", interaction: .65 }, { id: "together", label: "They regularly happen together.", interaction: 1 }, { id: "unsure", label: "I'm not sure.", interaction: 0 }] };
  if (archetype === "outcome-check") return { ...base, prompt: `When ${names.slice(0, 2).join(" + ")} come together, has that produced something concrete?`, options: [{ id: "often", label: "Often.", interaction: 1 }, { id: "few", label: "A few times.", interaction: .55 }, { id: "not-yet", label: "Not yet.", interaction: -.1 }, { id: "unsure", label: "I'm not sure.", interaction: 0 }] };
  if (archetype === "energy") return { ...base, prompt: `You seem capable of ${candidate.label}. Do you enjoy using this combination?`, options: [{ id: "love", label: "Love it.", interaction: .25, energy: 1 }, { id: "usually", label: "Usually.", interaction: .2, energy: .55 }, { id: "needed", label: "Only when needed.", interaction: .05, energy: -.15 }, { id: "not", label: "Not really.", interaction: 0, energy: -.8 }] };
  if (archetype === "context-split") return { ...base, prompt: `Where does ${candidate.label} show up most clearly?`, options: [{ id: "work", label: "Work.", interaction: .35, context: "work" }, { id: "projects", label: "Personal projects.", interaction: .35, context: "personal projects" }, { id: "people", label: "People and relationships.", interaction: .35, context: "people and relationships" }, { id: "pressure", label: "High-pressure situations.", interaction: .35, context: "high-pressure situations" }, { id: "everywhere", label: "Across contexts.", interaction: .7, context: "across contexts" }] };
  if (archetype === "social-proof") return { ...base, prompt: `Have other people relied on you specifically for ${candidate.label}?`, options: [{ id: "repeated", label: "Repeatedly.", interaction: 1 }, { id: "sometimes", label: "Sometimes.", interaction: .5 }, { id: "not", label: "Not that I've noticed.", interaction: -.1 }] };
  if (archetype === "overuse") return { ...base, prompt: `When ${candidate.label} causes problems, what is closest?`, options: [{ id: "too-much", label: candidate.shadow, interaction: .35 }, { id: "wrong-context", label: "The context does not value the combination.", interaction: .2 }, { id: "none", label: "It is not usually a problem.", interaction: .1 }, { id: "unsure", label: "I'm not sure.", interaction: 0 }] };
  if (archetype === "sequence") return { ...base, prompt: "When you're at your best, which usually comes first?", options: [{ id: "a-b", label: `${names[0]} → ${names[1]}`, interaction: .45 }, { id: "b-a", label: `${names[1]} → ${names[0]}`, interaction: .45 }, { id: "together", label: "They happen almost together.", interaction: .7 }, { id: "unsure", label: "I'm not sure.", interaction: 0 }] };
  if (archetype === "missing-component") return { ...base, prompt: `What most determines whether ${candidate.label} produces a result?`, options: [{ id: "skill", label: candidate.multiplier, interaction: .35 }, { id: "environment", label: "The right environment.", interaction: .25 }, { id: "person", label: "A partner or collaborator.", interaction: .25 }, { id: "deadline", label: "An external deadline.", interaction: .25 }, { id: "unsure", label: "I'm not sure.", interaction: 0 }] };
  if (archetype === "bridge-test") return { ...base, prompt: `Have you created value specifically by bridging ${names[0]} with ${names[1]}?`, options: [{ id: "repeated", label: "Repeatedly.", interaction: 1 }, { id: "few", label: "A few times.", interaction: .5 }, { id: "not", label: "Not yet.", interaction: -.1 }, { id: "unsure", label: "Not sure.", interaction: 0 }] };
  return { ...base, prompt: `If you had to lose one part of ${candidate.label}, which loss would change how you operate more?`, options: [{ id: "a", label: names[0], interaction: .3 }, { id: "b", label: names[1], interaction: .3 }, { id: "unsure", label: "Not sure.", interaction: 0 }] };
}

export function generateAdvantageProbes(answers: AdvantageAnswerSet): AdvantageProbe[] {
  const candidates = buildAdvantageCandidates(answers).slice(0, 6);
  if (!candidates.length) return [];
  const closeLeaders = candidates.length > 1 && Math.abs(candidates[0].evidenceStrength - candidates[1].evidenceStrength) < .8;
  const contradictions = buildAdvantageSignalProfiles(answers).filter(({ contradiction }) => contradiction > .4).length;
  const target = Math.min(15, 8 + (closeLeaders ? 2 : 0) + Math.min(3, contradictions));
  return Array.from({ length: target }, (_, index) => probeFor(candidates[index % candidates.length], archetypes[index % archetypes.length], index));
}

function countEvidenceClasses(candidate: AdvantageCandidate): string {
  const labels: Record<AdvantageEvidenceClass, string> = { "self-perception": "Self-perception", preference: "Preference", behavioral: "Repeated behaviour", external: "External reliance", outcome: "Outcome evidence", "cross-context": "Cross-context recurrence" };
  return candidate.evidenceClasses.map((item) => labels[item]).join(" · ");
}

export function buildPersonalAdvantageMap(
  answers: AdvantageAnswerSet,
  probes: readonly AdvantageProbe[],
  probeAnswers: AdvantageProbeAnswers,
  calibration: AdvantageCalibration,
): PersonalAdvantageMap {
  const candidates = buildAdvantageCandidates(answers, probes, probeAnswers, calibration);
  const profiles = buildAdvantageSignalProfiles(answers);
  const fallbackSignals = profiles.filter(({ support }) => support > 0).slice(0, 2);
  const fallback: AdvantageCandidate = {
    id: "emerging-personal-pattern",
    label: "Emerging Personal Pattern",
    signalIds: fallbackSignals.map(({ signal }) => signal.id),
    type: "reinforcement",
    source: "composable",
    synthesis: "There is not enough converging evidence yet to declare a Core Advantage. The useful next step is to test the strongest recurring signals in real situations.",
    evidenceStrength: 0,
    interactionStrength: 0,
    explanatoryPower: 0,
    contextFit: 0,
    energyAlignment: 0,
    contradictionPenalty: 0,
    calibrationModifier: 0,
    confidence: "emerging",
    eligibleForCore: false,
    evidenceClasses: [],
    recognition: ["Notice when a capability produces a concrete result more than once."],
    contexts: ["a small reversible experiment"],
    killers: ["Treating a first impression as a permanent label."],
    shadow: "Declaring certainty before real-life evidence has accumulated.",
    counterweight: "Collect one outcome and one external signal before strengthening the claim.",
    multiplier: "a real-world feedback loop",
  };
  const core = candidates.find(({ eligibleForCore }) => eligibleForCore) ?? candidates[0] ?? fallback;
  const supporting = candidates.filter(({ id, confidence }) => id !== core.id && confidence !== "emerging").slice(0, 2);
  const emerging = candidates.find(({ id, confidence }) => id !== core.id && confidence === "emerging");
  const coreSignalIds = new Set(core.signalIds);
  const stackProfiles = profiles.filter(({ support, contradiction }) => support - contradiction > .45).slice(0, 6);
  const stack = stackProfiles.map(({ signal, energy }, index) => ({
    signalId: signal.id,
    label: signal.label,
    role: coreSignalIds.has(signal.id) ? "core" as const : energy > .35 || index < 4 ? "amplifier" as const : "supporting" as const,
  }));
  const hiddenProfile = profiles.find(({ signal, support, contradiction, energy }) => !coreSignalIds.has(signal.id) && support > .65 && support < 2.4 && contradiction < .6 && energy >= 0);
  const hiddenAdvantages = hiddenProfile ? [{
    label: `${hiddenProfile.signal.label} as leverage`,
    explanation: `${hiddenProfile.signal.label} is not the centre of your result, but it could make ${core.label} travel further or become easier to use.`,
    experiment: `Use ${hiddenProfile.signal.label} deliberately in one ${core.contexts[0] ?? "real"} situation and watch whether the outcome changes.`,
  }] : [];
  const evidenceSummary = core.evidenceClasses.length ? [
    { label: "Evidence mix", detail: countEvidenceClasses(core) },
    { label: "Interaction", detail: core.interactionStrength > .35 ? "Adaptive probes support that the parts reinforce one another." : "The parts are supported; their interaction still needs real-world testing." },
    { label: "Confidence", detail: core.confidence === "strong-pattern" ? "Strong pattern — repeated, converging evidence." : core.confidence === "supported" ? "Supported — multiple sources align, with room to test." : "Emerging — worth testing, not declaring." },
  ] : [{ label: "Confidence", detail: "Emerging — the evidence is intentionally being kept provisional." }];
  const contexts = core.contexts.slice(0, 5);
  return {
    version: 1,
    coreAdvantage: core,
    supportingAdvantages: supporting,
    ...(emerging ? { emergingAdvantage: emerging } : {}),
    stack,
    hiddenAdvantages,
    amplifierEnvironments: contexts,
    killers: core.killers.slice(0, 4),
    shadows: [core.shadow],
    counterweights: [core.counterweight],
    missingMultiplier: core.multiplier,
    evidenceSummary,
    playbook: {
      showsUp: core.recognition.slice(0, 4),
      powerfulWhen: contexts,
      tryThis: [
        `Today: notice the next moment when ${core.signalIds.map((id) => advantageSignalById.get(id)?.label ?? id).join(" + ")} happen together.`,
        `This week: use ${core.label} on one bounded problem and record the concrete result.`,
        `Bigger bet: seek more ${contexts[0] ?? "real-world"} work where the whole combination is useful, not only one component.`,
      ],
      watchFor: [core.shadow, ...core.killers].slice(0, 4),
    },
    experiments: [
      `Ask one person who has seen you work when ${core.label} was most useful.`,
      `Use the stack deliberately on one reversible problem, then write down what each component contributed.`,
      `Temporarily add ${core.multiplier} and compare the result with your usual approach.`,
    ],
    reminder: core.confidence === "emerging" ? "Worth testing, not declaring." : `Use ${core.label} deliberately — and keep the counterweight visible.`,
  };
}

export function answerSignature(answers: AdvantageAnswerSet): string {
  return JSON.stringify(Object.entries(answers).sort(([left], [right]) => left.localeCompare(right)).map(([id, answer]) => [id, answer.value, answer.skipped ?? false]));
}
