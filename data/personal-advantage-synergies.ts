import { advantageSignalById } from "@/data/personal-advantage-signals";
import type { AdvantageSynergyDefinition, AdvantageSynergyType } from "@/types/personal-advantage";

type CuratedSynergySeed = readonly [
  id: string,
  label: string,
  type: AdvantageSynergyType,
  signalIds: readonly string[],
  synthesis?: string,
];

const seeds: readonly CuratedSynergySeed[] = [
  ["human-systems-sensemaking", "Human Systems Sensemaking", "translation", ["systems-thinking", "human-pattern-recognition"], "You can hold structural dependencies and human behaviour in the same model, making messy systems easier to understand without removing the people inside them."],
  ["systems-translation", "Systems Translation", "translation", ["systems-thinking", "communication-clarity"], "You can understand how parts interact and then make those dependencies usable to people who do not share the same mental model."],
  ["domain-innovation", "Domain Innovation", "amplification", ["domain-depth", "creative-recombination"], "Deep knowledge gives your recombination substance; recombination gives your expertise new ways to create value."],
  ["opportunity-connection", "Opportunity Connection", "bridge", ["connecting-people", "possibility-detection"], "You notice both an opening and the people who could make it real, turning possibility into a useful introduction rather than a loose idea."],
  ["builder-creator", "Builder / Creator Leverage", "amplification", ["idea-generation", "closing-ability"], "Ideas do not remain hypothetical as often when your ability to generate directions is paired with a real instinct for closure."],
  ["knowledge-translation", "Knowledge Translation", "translation", ["rapid-learning", "communication-clarity"], "You can become oriented in unfamiliar territory and then shorten the path for somebody else without pretending to be the final authority."],
  ["reliability-advantage", "Reliability Advantage", "reinforcement", ["precision", "risk-detection"], "Accuracy and early failure-mode detection reinforce each other, making your contribution especially useful where small errors carry real cost."],
  ["synthesis-advantage", "Synthesis Advantage", "distinctive-perspective", ["curiosity-drive", "cross-domain-transfer"], "Curiosity keeps bringing in new material; cross-domain transfer lets the useful principle travel rather than remain isolated trivia."],
  ["trusted-advisor", "Trusted Advisor Pattern", "reinforcement", ["trust-building", "listening-depth"], "People may share better information with you because you listen carefully, and that better information helps your guidance become more relevant."],
  ["constraint-operator", "Constraint Operator", "constraint-transformation", ["resourcefulness", "execution-speed"], "Limited options do not automatically stop movement: you can find a workable path and turn it into action without waiting for ideal conditions."],
  ["expert-curation", "Expert Curation", "reinforcement", ["taste-curation", "domain-depth"], "Your selection criteria are supported by real domain experience, so curation can become a useful filter rather than unexplained preference."],
  ["mobilization-advantage", "Mobilization Advantage", "distribution", ["network-access", "initiative"], "You can reach relevant people and are willing to start the motion that makes access useful."],
  ["human-influence", "Human Influence", "amplification", ["human-pattern-recognition", "persuasion"], "Understanding what matters to people can make your influence more relevant, less forceful and easier to adapt."],
  ["perspective-shifting", "Perspective Shifting", "translation", ["reframing", "communication-clarity"], "You can find a more useful frame and express it clearly enough that other people can actually use it."],
  ["experience-architecture", "Experience / System Architecture", "reinforcement", ["worldbuilding", "systems-thinking"], "You imagine a coherent experience while tracking the system required to make its parts reinforce one another."],
  ["human-systems-creator", "Human Systems Creator", "amplification", ["systems-thinking", "human-pattern-recognition", "creative-recombination"]],
  ["domain-pattern-translator", "Domain Pattern Translator", "translation", ["domain-depth", "pattern-recognition", "communication-clarity"]],
  ["trusted-network-builder", "Trusted Network Builder", "bridge", ["trust-building", "network-access", "connecting-people"]],
  ["venture-maker", "Venture Maker", "amplification", ["idea-generation", "initiative", "closing-ability"]],
  ["precision-guardian", "Precision Guardian", "reinforcement", ["precision", "risk-detection", "process-discipline"]],
  ["adaptive-synthesist", "Adaptive Synthesist", "distinctive-perspective", ["rapid-learning", "cross-domain-breadth", "curiosity-drive"]],
  ["complexity-to-clarity", "Complexity to Clarity", "translation", ["analytical-decomposition", "simplification"]],
  ["strategic-patterning", "Strategic Patterning", "reinforcement", ["pattern-recognition", "systems-thinking"]],
  ["ambiguity-navigator", "Ambiguity Navigator", "reinforcement", ["ambiguity-sensemaking", "uncertainty-tolerance"]],
  ["experimental-decider", "Experimental Decider", "amplification", ["experimentation", "decision-velocity"]],
  ["deep-questioner", "Deep Questioner", "reinforcement", ["depth-seeking", "question-quality"]],
  ["learning-builder", "Learning Builder", "amplification", ["rapid-learning", "initiative"]],
  ["evidence-reframer", "Evidence-led Reframer", "translation", ["analytical-decomposition", "reframing"]],
  ["possibility-curator", "Possibility Curator", "reinforcement", ["possibility-detection", "taste-curation"]],
  ["story-system-designer", "Story System Designer", "translation", ["narrative-thinking", "systems-thinking"]],
  ["human-story-translator", "Human Story Translator", "translation", ["emotional-translation", "narrative-thinking"]],
  ["needs-led-creator", "Needs-led Creator", "amplification", ["needs-detection", "creative-recombination"]],
  ["empathetic-reframer", "Empathetic Reframer", "translation", ["empathic-perspective", "reframing"]],
  ["trust-connector", "Trust Connector", "bridge", ["trust-building", "connecting-people"]],
  ["community-facilitator", "Community Facilitator", "reinforcement", ["community-instinct", "facilitation"]],
  ["clear-conflict-navigator", "Clear Conflict Navigator", "translation", ["conflict-navigation", "communication-clarity"]],
  ["relationship-steward", "Relationship Steward", "reinforcement", ["relationship-maintenance", "trust-building"]],
  ["access-translator", "Access Translator", "bridge", ["network-access", "communication-clarity"]],
  ["cultural-bridge", "Cultural Bridge", "bridge", ["cultural-language-access", "emotional-translation"]],
  ["community-distribution", "Community Distribution", "distribution", ["community-instinct", "audience-distribution"]],
  ["decisive-operator", "Decisive Operator", "amplification", ["decision-velocity", "operationalization"]],
  ["fast-finisher", "Fast Finisher", "amplification", ["execution-speed", "closing-ability"]],
  ["durable-owner", "Durable Owner", "reinforcement", ["ownership", "persistence"]],
  ["resourceful-improviser", "Resourceful Improviser", "constraint-transformation", ["resourcefulness", "improvisation"]],
  ["adaptive-operator", "Adaptive Operator", "reinforcement", ["adaptability", "operationalization"]],
  ["calm-decider", "Calm Decider", "amplification", ["calm-under-pressure", "decision-velocity"]],
  ["recovery-endurance", "Sustainable Endurance", "reinforcement", ["recovery-capacity", "persistence"]],
  ["quality-finisher", "Quality Finisher", "amplification", ["quality-sensitivity", "closing-ability"]],
  ["precision-craft", "Precision Craft", "reinforcement", ["precision", "domain-depth"]],
  ["dependable-system", "Dependable Systems Practice", "reinforcement", ["consistency", "process-discipline"]],
  ["risk-ready-improviser", "Risk-ready Improviser", "amplification", ["risk-detection", "improvisation"]],
  ["detail-quality", "Detail-led Quality", "reinforcement", ["detail-sensitivity", "quality-sensitivity"]],
  ["technical-operator", "Technical Operator", "amplification", ["technical-leverage", "operationalization"]],
  ["technical-creator", "Technical Creator", "amplification", ["technical-leverage", "creative-recombination"]],
  ["domain-distribution", "Expertise That Travels", "distribution", ["domain-depth", "audience-distribution"]],
  ["network-distribution", "Networked Distribution", "distribution", ["network-access", "audience-distribution"]],
  ["cross-domain-innovation", "Cross-domain Innovation", "distinctive-perspective", ["cross-domain-breadth", "creative-recombination"]],
  ["cultural-storytelling", "Cross-cultural Storytelling", "distinctive-perspective", ["cultural-language-access", "narrative-thinking"]],
  ["technical-teacher", "Technical Teacher", "translation", ["technical-leverage", "communication-clarity"]],
  ["human-product-sense", "Human Product Sense", "amplification", ["needs-detection", "systems-thinking", "taste-curation"]],
  ["ambiguity-builder", "Ambiguity Builder", "amplification", ["ambiguity-sensemaking", "initiative", "experimentation"]],
  ["calm-constraint-operator", "Calm Constraint Operator", "constraint-transformation", ["calm-under-pressure", "resourcefulness", "operationalization"]],
  ["deep-craft", "Deep Craft", "reinforcement", ["depth-seeking", "precision", "quality-sensitivity"]],
  ["reliable-specialist", "Reliable Specialist", "reinforcement", ["domain-depth", "consistency", "precision"]],
  ["human-opportunity-builder", "Human Opportunity Builder", "bridge", ["human-pattern-recognition", "connecting-people", "initiative"]],
  ["strategic-curator", "Strategic Curator", "reinforcement", ["systems-thinking", "taste-curation", "decision-velocity"]],
  ["learning-translator", "Learning Translator", "translation", ["curiosity-drive", "rapid-learning", "simplification"]],
  ["persuasive-storyteller", "Persuasive Storyteller", "amplification", ["narrative-thinking", "persuasion"]],
  ["relationship-mobilizer", "Relationship Mobilizer", "bridge", ["relationship-maintenance", "network-access", "initiative"]],
  ["pressure-coordinator", "Pressure Coordinator", "amplification", ["calm-under-pressure", "facilitation", "operationalization"]],
  ["adaptive-technologist", "Adaptive Technologist", "amplification", ["technical-leverage", "rapid-learning", "adaptability"]],
] as const;

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

function buildDefinition([id, label, type, signalIds, customSynthesis]: CuratedSynergySeed): AdvantageSynergyDefinition {
  const signals = signalIds.map((signalId) => {
    const item = advantageSignalById.get(signalId);
    if (!item) throw new Error(`Unknown signal in curated synergy ${id}: ${signalId}`);
    return item;
  });
  const signalNames = signals.map(({ label: name }) => name);
  const synthesis = customSynthesis ?? `${signalNames.slice(0, -1).join(", ")}${signalNames.length > 2 ? "," : ""} and ${signalNames.at(-1)} reinforce one another: ${signals.map(({ definition }) => definition.charAt(0).toLocaleLowerCase() + definition.slice(1)).join(" Together, this ")}`;
  const contexts = unique(signals.flatMap(({ contexts }) => contexts)).slice(0, 5);
  const overuse = unique(signals.flatMap(({ overusePatterns }) => overusePatterns));
  const multipliers = unique(signals.flatMap(({ possibleMultipliers }) => possibleMultipliers));
  return {
    id,
    label,
    type,
    signalIds,
    synthesis,
    recognition: [
      `A situation needs both ${signalNames[0]} and ${signalNames[1]} rather than either in isolation.`,
      `Other people rely on you when ${signalNames.join(" + ")} have to produce something usable.`,
      `You move between ${contexts.slice(0, 2).join(" and ")} without treating them as separate problems.`,
    ],
    contexts,
    killers: [
      `A role rewards ${signalNames[0]} but prevents ${signalNames[1]} from contributing.`,
      `The work is split into fragments before the combination can form.`,
      `Speed or certainty is demanded without enough room for the stack to operate.`,
    ],
    shadow: `When this stack overfires, ${overuse.slice(0, 2).join(" and ")} can become more expensive than the value they create.`,
    counterweight: signals.some(({ id: signalId }) => signalId === "taste-curation" || signalId === "closing-ability") ? "Use a visible definition of done and protect the strongest direction." : "Choose the context deliberately, set a stopping rule and ask what evidence would change the decision.",
    multiplier: multipliers[0] ?? "a clearer feedback loop",
  };
}

export const curatedAdvantageSynergies: readonly AdvantageSynergyDefinition[] = seeds.map(buildDefinition);
