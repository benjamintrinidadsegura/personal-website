import { getLifeVisionContent, getPartnerAlignmentContent, getSelfAlignmentContent } from "@/data/i18n/life-alignment";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { isAddedLifeLocale } from "@/data/i18n/life-alignment-extra";
import type {
  LifeAlignmentAnswers,
  LifeAlignmentEvidence,
  LifeAlignmentResult,
  LifeAreaId,
} from "@/types/life-alignment";
import type {
  PartnerComparisonFinding,
  PartnerComparisonResult,
  PartnerDimensionAnswer,
  PartnerDimensionId,
  PartnerEvidenceReference,
  PartnerParticipantAnswers,
  PartnerParticipantId,
} from "@/types/life-alignment-partner";
import type {
  LifeVisionAnswers,
  LifeVisionEvidence,
  LifeVisionExplorationMode,
  LifeVisionInsight,
  LifeVisionResult,
} from "@/types/life-alignment-life-vision";
import { localizeAddedPartnerResult, localizeAddedSelfResult, localizeAddedVisionResult } from "@/lib/life-alignment-localization-extra";

function joinEnglish(values: readonly string[]): string {
  if (values.length < 2) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function selfAreaTitle(answers: LifeAlignmentAnswers, areaId: LifeAreaId): string {
  if (areaId === "custom-1" || areaId === "custom-2") return answers.customLabels[areaId].trim() || "Custom life area";
  return getSelfAlignmentContent("en").areas.find(({ id }) => id === areaId)?.title ?? "Life area";
}

const selfSignalLabels = {
  supportive: "Supports you at present",
  tension: "Desired change or tension",
  constrained: "Desired change within real constraints",
  accepted: "A conscious trade-off for now",
  uncertain: "Intentionally left open",
  steady: "No clear desire for change at present",
} as const;

const selfInsightCopy: Readonly<Record<string, { eyebrow: string; title: string; explanation: string; everyday: string }>> = {
  "support-and-pressure": { eyebrow: "Relationship across areas", title: "Support and pressure are present at the same time.", explanation: "Your answers show at least one supportive area and at least one area involving pressure or desired movement. Neither cancels out the other.", everyday: "A useful day-to-day question is what currently replenishes capacity and what consumes it." },
  "competing-capacity": { eyebrow: "Capacity", title: "Several important areas may be drawing on the same capacity.", explanation: "You marked more than one area as important while also describing limited or draining capacity. This is a distribution question, not a personal deficit.", everyday: "Naming which area needs enough rather than more can make the trade-off more concrete." },
  redistribution: { eyebrow: "Distribution", title: "One desired reduction may create room elsewhere.", explanation: "Your selected directions include both less and more or different. This suggests possible redistribution without assuming that capacity transfers automatically.", everyday: "A small reduction can first create rest rather than immediately funding another commitment." },
  "priority-is-not-more": { eyebrow: "Priority", title: "Important does not automatically mean more.", explanation: "At least one area marked important does not carry a simple request for expansion. Protecting, changing form or keeping something open can also express priority.", everyday: "You can treat an area as important by preserving its minimum viable form." },
  "declared-uncertainty": { eyebrow: "Open information", title: "Some parts of the snapshot are deliberately unresolved.", explanation: "You selected uncertainty explicitly. The result treats that as information rather than filling in an answer for you.", everyday: "A short observation period can be more useful than forcing a direction now." },
  "focus-under-constraints": { eyebrow: "Context", title: "Your focus sits within real present-day conditions.", explanation: "The selected focus and your constraints need to be read together. A constraint is context, not evidence that the direction is wrong.", everyday: "The first useful move may be to clarify or protect a condition before changing the area itself." },
  "descriptive-focus": { eyebrow: "Focus", title: "Your chosen focus provides a place to look more closely.", explanation: "The result highlights the area you explicitly chose without ranking it above the rest of your life.", everyday: "One observable moment is enough to test what your current interpretation means in practice." },
};

function selfEvidence(evidence: readonly LifeAlignmentEvidence[], answers: LifeAlignmentAnswers): readonly LifeAlignmentEvidence[] {
  return evidence.map((item) => ({
    source: item.areaId ? "Your selected answer for this life area" : "Your explicitly selected answer",
    detail: item.areaId ? `This observation uses your selections for ${selfAreaTitle(answers, item.areaId)}.` : "This observation uses only information you entered in this reflection.",
    areaId: item.areaId,
  }));
}

const selfPathCopy: Readonly<Record<string, { title: string; why: string; firstStep: string; example: string; learning: string; tradeoff: string }>> = {
  "chosen-experiment": { title: "Use your chosen experiment", why: "You selected this mode yourself, so it can translate the snapshot into a limited observation without prescribing a decision.", firstStep: "Define one small action, a time boundary and a moment to review what happened.", example: "Try the smallest version once and record what became easier, harder or clearer.", learning: "Whether the selected direction fits your real conditions and what should change in the next version.", tradeoff: "Even a small experiment uses attention and may affect another area." },
  "reduce-load": { title: "Reduce one source of load", why: "Your answers contain pressure, drain or limited capacity. Relief may be a valid direction before adding anything new.", firstStep: "Choose one repeatable demand that could be simplified, delayed or paused once.", example: "Remove one non-essential step from a recurring task for a week.", learning: "Whether the change creates usable capacity and what costs appear elsewhere.", tradeoff: "Reducing load may disappoint an expectation or slow something down." },
  "create-capacity": { title: "Build a small amount of capacity", why: "A desired direction may depend on time, energy, knowledge or practical room that is not yet available.", firstStep: "Name one prerequisite and make the smallest move that tests whether it is truly the bottleneck.", example: "Reserve one protected block or gather one missing resource before committing further.", learning: "Whether this prerequisite changes the available room or reveals a different constraint.", tradeoff: "Preparation can delay visible progress while making later movement more sustainable." },
  "clarify-source": { title: "Clarify where the direction comes from", why: "You selected more than one possible source, or indicated that its origin remains uncertain.", firstStep: "Write the direction once as your own wish and once as an expectation you may have absorbed.", example: "Ask what you would still want if nobody approved or objected.", learning: "Which parts feel personally chosen, context-driven or still mixed.", tradeoff: "Greater clarity may unsettle a familiar expectation without immediately creating an alternative." },
  "gather-information": { title: "Gather one missing piece of information", why: "Your snapshot includes uncertainty that may be reduced by a concrete fact rather than a larger decision.", firstStep: "Formulate the one question whose answer would change your next choice.", example: "Check one actual condition, deadline, cost or dependency.", learning: "Which assumption becomes clearer and which uncertainty remains meaningful.", tradeoff: "Information takes time and may not produce a single answer." },
  "observe-before-changing": { title: "Observe before changing", why: "You allowed the direction to remain open. Observation can protect that openness while adding experience.", firstStep: "Choose one recurring moment and note what supports or drains you there.", example: "Record the same situation three times without trying to improve it.", learning: "Whether a stable pattern appears or the situation is more variable than expected.", tradeoff: "Waiting preserves flexibility but leaves the current condition in place for now." },
  "protect-what-works": { title: "Protect what already works", why: "At least one selected area is supportive or steady and does not need to become a project.", firstStep: "Name the smallest condition that lets this area remain supportive.", example: "Keep one boundary, routine or amount of unplanned space intact.", learning: "Which condition is genuinely load-bearing and which can change safely.", tradeoff: "Protection uses capacity too and may limit expansion elsewhere." },
};

const selfToolCopy: Readonly<Record<string, { title: string; duration: string; purpose: string; steps: readonly string[]; prompt: string }>> = {
  "two-moment-note": { title: "Two-moment note", duration: "5 minutes on two occasions", purpose: "Compare two real moments without turning them into a score.", steps: ["Choose one ordinary moment involving your focus area.", "Write what happened, what it required and what effect followed.", "Repeat once and compare only what changed or stayed stable."], prompt: "What is different between the two moments, and what remains unknown?" },
  "constraint-sort": { title: "Constraint sort", duration: "8 minutes", purpose: "Separate fixed conditions, assumptions and negotiable elements.", steps: ["List the conditions currently affecting the focus.", "Mark each as fixed today, assumed or potentially negotiable.", "Choose one item that needs information rather than action."], prompt: "Which condition is real and current, and which one still needs checking?" },
  "space-trade": { title: "Space trade", duration: "10 minutes", purpose: "Make a possible redistribution concrete without promising permanent change.", steps: ["Name where a little less space might be acceptable.", "Name what that space should protect or enable.", "Set a review point before treating the trade as permanent."], prompt: "What would receive the space, and what cost should stay visible?" },
  "source-check": { title: "Source check", duration: "7 minutes", purpose: "Explore how your own wishes and contextual expectations interact.", steps: ["State the desired direction in one sentence.", "List who or what may have shaped it.", "Rewrite it in language that feels explicitly yours—or leave it open."], prompt: "What remains when approval, habit and obligation are considered separately?" },
  "minimum-version": { title: "Minimum version", duration: "10 minutes", purpose: "Turn a desired direction into the smallest reversible form.", steps: ["State what you want to make possible.", "Remove everything unnecessary for a one-time experiment.", "Keep one action that fits the current conditions and is easy to stop."], prompt: "What is small enough for this week and large enough to teach you something?" },
};

export function localizeLifeAlignmentResult(result: LifeAlignmentResult, answers: LifeAlignmentAnswers, locale: Locale): LifeAlignmentResult {
  if (isAddedLifeLocale(locale)) return localizeAddedSelfResult(result, answers, locale);
  if (locale === defaultLocale) return result;
  const content = getSelfAlignmentContent("en");
  const areas = result.areas.map((area) => ({ ...area, title: selfAreaTitle(answers, area.id), currentLabel: content.currentEmphasis[area.currentEmphasis].label, capacityLabel: content.capacity[area.capacityEffect].label, directionLabel: content.direction[area.desiredDirection].label, signalLabel: selfSignalLabels[area.signal] }));
  const byId = new Map(areas.map((area) => [area.id, area]));
  const pick = (values: LifeAlignmentResult["areas"]) => values.map(({ id }) => byId.get(id)!).filter(Boolean);
  const supportive = pick(result.supportiveAreas);
  const tensions = pick(result.tensionAreas);
  const uncertain = pick(result.uncertainAreas);
  const summary = [
    supportive.length ? `${joinEnglish(supportive.map(({ title }) => title))} ${supportive.length === 1 ? "appears" : "appear"} supportive in today's snapshot.` : "",
    tensions.length ? `${joinEnglish(tensions.map(({ title }) => title))} ${tensions.length === 1 ? "shows" : "show"} desired movement, tension or a conscious trade-off.` : "",
    uncertain.length ? `Your direction for ${joinEnglish(uncertain.map(({ title }) => title))} remains deliberately open.` : "",
  ].filter(Boolean);
  if (!summary.length) summary.push("Your selected areas do not produce one clear support or tension signal today—and that is also a valid snapshot.");
  const insights = result.insights.map((insight) => {
    const copy = selfInsightCopy[insight.id] ?? selfInsightCopy["descriptive-focus"];
    return { ...insight, eyebrow: copy.eyebrow, title: copy.title, explanation: copy.explanation, everydayInterpretation: copy.everyday, evidence: selfEvidence(insight.evidence, answers) };
  });
  const actionPaths = result.actionPaths.map((path) => ({ ...path, ...(selfPathCopy[path.id] ?? selfPathCopy["chosen-experiment"]), evidence: selfEvidence(path.evidence, answers) }));
  const tools = result.tools.map((tool) => ({ ...tool, ...(selfToolCopy[tool.id] ?? selfToolCopy["minimum-version"]) }));
  const focus = byId.get(result.focus.id)!;
  const experimentDefinition = content.experiments[answers.experimentMode!];
  return {
    ...result,
    title: "Your Life Alignment snapshot",
    description: "A qualitative organisation of your own answers—not an evaluation of your life and not an objective measure of alignment.",
    summary: summary.slice(0, 3),
    areas,
    supportiveAreas: supportive,
    drainingAreas: pick(result.drainingAreas),
    tensionAreas: tensions,
    uncertainAreas: uncertain,
    constraints: answers.constraints.filter((id) => id !== "none").map((id) => content.constraints[id]),
    focus,
    tradeoffLabel: content.tradeoffs[answers.tradeoffStatus!],
    authorityLabels: answers.authoritySources.map((source) => content.authority[source]),
    entanglementLabel: content.entanglement[answers.entanglementStatus!],
    experiment: { title: `${experimentDefinition.label}: ${focus.title}`, action: experimentDefinition.action, observe: experimentDefinition.observe, boundary: "Treat this as a voluntary, reversible exploration. It replaces no professional advice and does not have to lead to a decision." },
    snapshot: result.snapshot.map((group) => ({ ...group, ...content.snapshot[group.id], areas: pick(group.areas) })),
    insights,
    actionPaths,
    tools,
    closing: {
      title: "Take a direction with you—not an obligation to solve everything.",
      body: answers.tradeoffStatus === "accepted-now" ? "You consciously accepted a trade-off for now. That is a current choice that may be revisited when conditions change." : answers.tradeoffStatus === "currently-fixed" ? "You want movement and also see a currently fixed frame. Both can be true; protection, information or capacity may be the next useful step." : answers.tradeoffStatus === "uncertain" ? "Your interpretation may remain open. This snapshot does not require a clear life decision today." : "You want to explore change carefully. One small observable step is enough to add lived experience to the snapshot.",
      reminders: ["The result describes today's answers, not a fixed truth about your life.", "Supportive areas may simply remain supportive; not everything needs work at once.", "When conditions change, your interpretation may change too."],
    },
  };
}

function partnerDimensionTitle(id: PartnerDimensionId): string {
  return getPartnerAlignmentContent("en").dimensions.find((dimension) => dimension.id === id)?.title ?? "Relationship topic";
}

function localizePerspective(answer: Required<PartnerDimensionAnswer>) {
  const content = getPartnerAlignmentContent("en");
  return { ...answer, experienceLabel: content.experience[answer.experience], directionLabel: content.direction[answer.desiredDirection], importanceLabel: content.importance[answer.importance], certaintyLabel: content.certainty[answer.certainty], expectationClarityLabel: content.expectation[answer.expectationClarity], differenceStanceLabel: content.difference[answer.differenceStance], constraintLabel: content.constraint[answer.constraint] };
}

const sharedContextCopy = {
  "shared-ground": ["Shared ground", "You both considered at least one relationship topic.", "A shared view is not automatically agreement, but it provides an explicit basis for the observations below."],
  "different-perspectives": ["Different perspectives", "Different experiences or desired directions are visible.", "This describes two released perspectives. It does not decide who is right or measure the relationship."],
  "open-questions": ["Not yet clarified together", "Some directions, expectations or interpretations remain open.", "Openness may reflect missing information, uncertainty, intentional non-commitment or different topic choices. No cause is inferred."],
  "current-constraints": ["Current conditions", "At least one present-day constraint affects the available room.", "Time, energy, practical conditions and other responsibilities are treated as context—not as lack of interest."],
  "conversation-opportunities": ["Possible clarification", "A voluntary clarification could add information.", "This is not a prompt to talk immediately. Pausing, thinking alone, seeking support or leaving it open are equally valid."],
  "not-yet-explored-together": ["Not yet explored together", "Some topics were part of only one of the two passes.", "No disinterest or avoidance is inferred. A topic may remain outside this shared reflection."],
} as const;

function localizedPartnerEvidence(item: PartnerEvidenceReference, participants: Readonly<Record<PartnerParticipantId, PartnerParticipantAnswers>>): PartnerEvidenceReference {
  const answer = participants[item.participant].dimensions[item.dimensionId];
  let label = "Topic selected for this perspective";
  if (item.field !== "selected" && answer?.[item.field]) {
    const localized = localizePerspective({
      experience: answer.experience ?? "unclear", desiredDirection: answer.desiredDirection ?? "open", importance: answer.importance ?? "not-central", certainty: answer.certainty ?? "unsure", expectationClarity: answer.expectationClarity ?? "currently-unclear", differenceStance: answer.differenceStance ?? "uncertain", constraint: answer.constraint ?? "unclear",
    });
    const labels = { experience: localized.experienceLabel, desiredDirection: localized.directionLabel, importance: localized.importanceLabel, certainty: localized.certaintyLabel, expectationClarity: localized.expectationClarityLabel, differenceStance: localized.differenceStanceLabel, constraint: localized.constraintLabel };
    label = labels[item.field];
  }
  return { ...item, label };
}

function localizePartnerFinding(finding: PartnerComparisonFinding, participants: Readonly<Record<PartnerParticipantId, PartnerParticipantAnswers>>): PartnerComparisonFinding {
  const content = getPartnerAlignmentContent("en");
  const topics = joinEnglish(finding.dimensionIds.map(partnerDimensionTitle));
  const headlineById: Readonly<Record<string, string>> = {
    "conversation-priorities": `Important, different directions and unconfirmed expectations meet around ${topics}.`,
    "shared-directions": `You named the same desired direction around ${topics}.`,
    "other-direction-differences": `Your desired directions differ around ${topics}.`,
    "direction-meets-constraints": `At least one wish for change sits beside a present-day constraint around ${topics}.`,
    "open-information": `Some certainty or current shared clarification is missing around ${topics}.`,
    "accepted-differences": `At least one person marked a possible difference around ${topics} as acceptable.`,
    "not-assessed-by-both": `${topics} was not assessed by both people.`,
  };
  const explanationByCategory = {
    "shared-ground": "This is a useful shared starting point, but it does not prove that you mean the same concrete behaviour or have equal capacity.",
    "different-expectations": "Two valid expectations can differ without either one becoming the correct standard.",
    "direction-difference": "A difference describes two valid perspectives. It says neither that the relationship is wrong nor who should give way.",
    uncertainty: "Openness and uncertainty are information. The result invents no intention for the other person and treats no earlier conversation as automatically current.",
    "accepted-difference": "Not every difference needs resolution. Acceptance still does not override consent, boundaries or unequal effects.",
    "present-constraint": "The constraint is not interpreted as lack of interest. Wishes, capacity and practical dependencies remain distinct.",
    "worth-discussing": "The combination makes one specific voluntary clarification more useful than a broad judgement about the relationship.",
    "not-assessed-by-both": "No agreement or disagreement is inferred. A different topic choice may be worth asking about, but need not mean anything.",
  } as const;
  return {
    ...finding,
    categoryLabel: content.findingLabels[finding.category],
    headline: headlineById[finding.id] ?? `A qualitative signal is visible around ${topics}.`,
    explanation: explanationByCategory[finding.category],
    everydayTranslation: "Use one observable everyday moment rather than trying to resolve the whole relationship topic at once.",
    everydayExamples: finding.dimensionIds.flatMap((id) => content.dimensions.find((dimension) => dimension.id === id)?.examples ?? []).slice(0, Math.max(3, finding.everydayExamples.length)),
    questions: ["What does each perspective mean in one concrete situation?", "What is a wish, a boundary, a current constraint or still only an assumption?"],
    possibleNextSteps: ["Describe one current example without interpreting the other person's intention.", "Check what has actually been agreed and what remains assumed.", "Choose together whether to explore, pause or leave the topic open."],
    whatCouldBeLearned: "Whether the difference concerns words, situations, capacity, expectations or genuinely competing needs.",
    boundary: "This reading uses only released answers. It does not determine consent, safety, truth or who is right.",
    evidence: finding.evidence.map((item) => localizedPartnerEvidence(item, participants)),
  };
}

export function localizePartnerComparisonResult(result: PartnerComparisonResult, participants: Readonly<Record<PartnerParticipantId, PartnerParticipantAnswers>>, locale: Locale): PartnerComparisonResult {
  if (isAddedLifeLocale(locale)) return localizeAddedPartnerResult(result, participants, locale);
  if (locale === defaultLocale) return result;
  const content = getPartnerAlignmentContent("en");
  const tracks = result.tracks.map((track) => ({ ...track, dimensionTitle: partnerDimensionTitle(track.dimensionId), participantA: track.participantA ? localizePerspective(track.participantA) : null, participantB: track.participantB ? localizePerspective(track.participantB) : null }));
  const findings = result.findings.map((finding) => localizePartnerFinding(finding, participants));
  const byFindingId = new Map(findings.map((finding) => [finding.id, finding]));
  const paths = result.paths.map((path) => ({ ...path, ...content.pathCopy[path.id], why: "This path is visible because it corresponds to one or more qualitative signals in your released answers." }));
  const experiments: PartnerComparisonResult["experiments"] = result.experiments.map((experiment) => ({
    ...experiment,
    title: experiment.id === "one-moment" ? "One moment, two descriptions" : experiment.id === "capacity-version" ? "The smallest capacity-aware version" : "Bring one expectation up to date",
    why: "A small, voluntary experiment can make the two perspectives more concrete without turning it into a permanent agreement.",
    steps: ["Choose one specific situation only if both people want to explore it.", "Describe each experience, wish and boundary without interpreting the other person's motives.", "Compare what became clearer and decide separately whether to repeat, change, stop or leave it open."] as const,
    observationQuestion: "What became more precise, and what remains different or open?",
    whatCouldBeLearned: "Whether the issue concerns language, a practical situation, capacity, expectations or different needs.",
    stopBoundary: "Either person may pause or stop without justification. Agreement is not required.",
  }));
  const conversationTools: PartnerComparisonResult["conversationTools"] = result.conversationTools.map((tool) => ({
    ...tool,
    title: tool.id === "speaker-listener" ? "Speak · Reflect · Correct" : "Request · Boundary · Possible offer",
    usefulWhen: "Useful only when both people voluntarily want a structured conversation and there is enough safety to pause or stop.",
    steps: ["One person names one specific observation and what matters to them.", "The other reflects what they understood; the first corrects only the understanding.", "Switch roles, then each person chooses whether to continue, pause or leave the topic open."] as const,
    closingQuestion: "What do I understand more precisely now, even if I experience it differently?",
    safetyBoundary: "A wish creates no entitlement. Either person may stop. Where there is fear, control, threats or violence, this is not intended as a joint conversation framework.",
  }));
  return {
    ...result,
    title: "What becomes visible between you",
    description: "A shared qualitative orientation from answers you both explicitly released—insight-first, without a compatibility score, winning side or hidden ranking.",
    tracks,
    findings,
    findingsByCategory: Object.fromEntries(Object.entries(result.findingsByCategory).map(([category, values]) => [category, values.map(({ id }) => byFindingId.get(id)!).filter(Boolean)])) as unknown as PartnerComparisonResult["findingsByCategory"],
    sharedOverview: result.sharedOverview.map((signal) => { const copy = sharedContextCopy[signal.id]; return { ...signal, label: copy[0], headline: `${copy[1]}${signal.dimensionIds.length ? ` Topics: ${joinEnglish(signal.dimensionIds.map(partnerDimensionTitle))}.` : ""}`, explanation: copy[2] }; }),
    paths,
    experiments,
    conversationTools,
    disclaimer: content.disclaimer,
  };
}

const visionInsightCopy: Readonly<Record<string, { title: string; finding: string; why: string }>> = {
  "direction-shape": { title: "Your selected directions form a shape, not a single goal.", finding: "More, less, different and continuity can coexist across life areas.", why: "The result keeps these directions separate so no total-life target or score is invented." },
  "protected-directions": { title: "Some movement has explicitly protected conditions.", finding: "Your desired directions sit beside priorities you do not want to sacrifice casually.", why: "Protection is part of the direction itself, not an obstacle to be optimised away." },
  "competing-directions": { title: "Two directions may be competing for room.", finding: "You explicitly marked a possible tension between selected areas.", why: "The result describes the trade-off without deciding which area should win." },
  "protected-movement": { title: "Movement and protection can belong together.", finding: "At least one area is both a direction of movement and something to protect.", why: "Changing the form of an area does not have to mean reducing its importance." },
  "possible-redistribution": { title: "A reduction may create room for another direction.", finding: "Your selections include both reducing and moving toward something.", why: "This is a possible redistribution, not a promise that capacity transfers automatically." },
  "context-influence": { title: "Some directions visibly sit within a wider context.", finding: "You selected social, inherited or constraint-driven source signals for one or more areas.", why: "That makes a direction neither false nor inauthentic; it shows where personal wishes and context may be considered together." },
  "open-directions": { title: "Not every direction needs to be settled.", finding: "One or more areas remain explicitly open or uncertain.", why: "Openness is treated as a complete answer, not as a missing result." },
  "open-and-context": { title: "Openness and source signals can be explored together.", finding: "An open direction also carries a social, inherited or uncertain source signal.", why: "Both selections point toward clarification before commitment, not against the direction." },
  "direction-and-constraints": { title: "Desired movement meets real conditions.", finding: "At least one direction of change sits beside constraints you explicitly named.", why: "Direction and present-day room stay distinct so a constraint is not framed as personal failure." },
};

const visionPathCopy: Readonly<Record<LifeVisionExplorationMode, { whyItMayFit: string; firstStep: string; tradeoff: string; learningQuestion: string; reversibility: string; tools: readonly { title: string; use: string }[] }>> = {
  "direct-change": { whyItMayFit: "You selected this path to make one direction observable without treating it as a permanent decision.", firstStep: "Choose one small, bounded change and set a review point.", tradeoff: "Direct movement may use capacity from another area.", learningQuestion: "What became easier, harder or clearer?", reversibility: "Limit duration and keep a simple route back.", tools: [{ title: "Before-and-after note", use: "Write one sentence about effect and effort before and after." }] },
  "reduce-load": { whyItMayFit: "Relief can be useful before adding more growth within named constraints.", firstStep: "Choose one repeatable demand to simplify, reduce or pause temporarily.", tradeoff: "Relief may affect other people's expectations or slow something down.", learningQuestion: "Did usable capacity appear, and where did it go?", reversibility: "Test the reduction for a fixed period.", tools: [{ title: "Load filter", use: "Ask: necessary, necessary now, necessary from me?" }] },
  "gather-information": { whyItMayFit: "Part of your room may depend on what is actually possible or required.", firstStep: "Formulate one concrete open question and check only decision-relevant information.", tradeoff: "Information takes time and may not create immediate certainty.", learningQuestion: "Which assumption changed and which question remains?", reversibility: "Information creates no commitment.", tools: [{ title: "One-question sheet", use: "Record the question, reliable source and decision-relevant answer." }] },
  conversation: { whyItMayFit: "Your direction may involve relationships, commitments or other people's decisions.", firstStep: "Request an exploratory conversation and name both your wish and what you want to understand.", tradeoff: "A conversation may reveal different expectations without resolving them.", learningQuestion: "What is clarified, still different or still open?", reversibility: "Agree only on a next review point, not a final commitment.", tools: [{ title: "Conversation sketch", use: "Three lines: what I notice, what matters, what I want to understand." }] },
  boundary: { whyItMayFit: "More room for one priority may require a clearer limit elsewhere.", firstStep: "Identify one expectation or commitment whose scope could be discussed.", tradeoff: "A changed boundary may create disappointment or adjustment.", learningQuestion: "Does the boundary protect what matters without unexpected costs?", reversibility: "Start with a time-limited or situation-specific boundary.", tools: [{ title: "Boundary sentence", use: "State what you can offer, what you cannot, and when you will review." }] },
  "build-capacity": { whyItMayFit: "A desired change may first need time, energy, knowledge or financial stability.", firstStep: "Choose one prerequisite and the smallest step that tests whether it is the bottleneck.", tradeoff: "Preparation slows visible movement but may make it sustainable.", learningQuestion: "Is this prerequisite truly the constraint?", reversibility: "Review after the first step before investing further.", tools: [{ title: "Prerequisite check", use: "Record the direction, suspected bottleneck and smallest test." }] },
  "explore-alternatives": { whyItMayFit: "Open or uncertain directions may benefit from comparison before commitment.", firstStep: "Sketch two or three distinct possibilities and identify one unknown for each.", tradeoff: "Keeping options open can temporarily increase uncertainty.", learningQuestion: "Which option deserves more exploration, and which can be released?", reversibility: "Exploration includes no commitment.", tools: [{ title: "Three-options sheet", use: "For each: attractive, difficult, most important open question." }] },
  "accept-for-now": { whyItMayFit: "Not every tension must be resolved within this horizon.", firstStep: "Name what you accept for now, what it protects and when to revisit it.", tradeoff: "Stability is protected while part of a desired direction remains smaller or open.", learningQuestion: "Does the trade-off still feel consciously chosen later?", reversibility: "Set a realistic review date.", tools: [{ title: "Review date", use: "Record the choice, protected reason and review point." }] },
  "reversible-experiment": { whyItMayFit: "A bounded test can make a direction tangible in everyday life.", firstStep: "Test one change small enough to stop without major follow-on costs.", tradeoff: "A short experiment represents long-term conditions only partly.", learningQuestion: "What observable effect supports continuing, adapting or stopping?", reversibility: "Set duration, stop condition and route back in advance.", tools: [{ title: "Experiment card", use: "Record duration, change, observation question, stop condition and route back." }] },
  "external-support": { whyItMayFit: "Some constraints or far-reaching choices may be explored more responsibly with suitable support.", firstStep: "Clarify what kind of support is needed and how you would check its suitability.", tradeoff: "Support may require time, money or openness and does not replace your authority.", learningQuestion: "What exact question should support help clarify?", reversibility: "An initial information session creates no long-term commitment.", tools: [{ title: "Requirements note", use: "Record the topic, desired help, qualification criterion and one first-contact question." }] },
};

function visionEvidence(evidence: readonly LifeVisionEvidence[]): readonly LifeVisionEvidence[] {
  return evidence.map(() => ({ label: "Your explicitly selected answer", detail: "This observation uses only the directions, protections, source signals or constraints you selected." }));
}

export function localizeLifeVisionResult(result: LifeVisionResult, answers: LifeVisionAnswers, locale: Locale): LifeVisionResult {
  if (isAddedLifeLocale(locale)) return localizeAddedVisionResult(result, answers, locale);
  if (locale === defaultLocale) return result;
  const content = getLifeVisionContent("en");
  const areas = result.areas.map((area) => ({ ...area, title: content.areas.find(({ id }) => id === area.id)?.title ?? "Life area", emphasisLabel: content.emphasis[area.emphasis].label, sourceLabels: (answers.sourcesByArea[area.id] ?? []).map((source) => content.source[source]) }));
  const byId = new Map(areas.map((area) => [area.id, area]));
  const areaNames = (ids: readonly string[], fallback: string) => ids.map((id) => byId.get(id as typeof areas[number]["id"])?.title).filter((value): value is string => Boolean(value)).join(", ") || fallback;
  const toward = areas.filter(({ emphasis }) => emphasis === "more" || emphasis === "different");
  const reduced = areas.filter(({ emphasis }) => emphasis === "less");
  const open = areas.filter(({ emphasis }) => emphasis === "uncertain" || emphasis === "intentionally-open");
  const protectedAreas = areas.filter(({ protected: isProtected }) => isProtected);
  const insights: readonly LifeVisionInsight[] = result.insights.map((insight) => { const copy = visionInsightCopy[insight.id] ?? visionInsightCopy["direction-shape"]; return { ...insight, ...copy, illustrativeExample: "Illustration only—not a claim about your life: one small real-world example could test this relationship without requiring a permanent decision.", evidence: visionEvidence(insight.evidence) }; });
  const actionPaths = result.actionPaths.map((path) => ({ ...path, title: content.exploration[path.mode].title, ...visionPathCopy[path.mode], evidence: visionEvidence(path.evidence) }));
  const horizon = content.horizon[answers.horizon!].label;
  return {
    ...result,
    title: "Your Future Direction Landscape",
    description: "An explainable view of your selected future directions, protected priorities, open questions and present-day conditions. You decide what is meaningful.",
    horizonLabel: horizon,
    areas,
    protectedLabels: answers.protectionIds.map((id) => content.protection[id]),
    constraintLabels: answers.constraintIds.filter((id) => id !== "none").map((id) => content.constraint[id]),
    competingAreas: result.competingAreas.map(({ id }) => byId.get(id)!).filter(Boolean),
    tradeoffLabel: content.tradeoff[answers.tradeoffStance!],
    visualSnapshot: {
      headline: toward.length && protectedAreas.length ? "Movement with explicitly protected conditions" : open.length ? "A direction with intentionally preserved possibility" : "A direction made of movement and continuity",
      description: `For ${horizon.toLocaleLowerCase("en")}, your selections form no target specification but a configuration you may test and revise.`,
      directionSummary: `Toward or different: ${areaNames(toward.map(({ id }) => id), "nothing explicitly marked")}. Less: ${areaNames(reduced.map(({ id }) => id), "nothing explicitly marked")}. Open: ${areaNames(open.map(({ id }) => id), "nothing explicitly marked")}.`,
      protectionSummary: `Protected: ${areaNames(protectedAreas.map(({ id }) => id), "no area marked")}. Supporting conditions: ${answers.protectionIds.map((id) => content.protection[id].replace(/[.!?]+$/, "")).join("; ")}.`,
      contextSummary: answers.constraintIds.includes("none") ? "You recorded no specific constraint at present; this does not imply that no condition may become visible later." : `The desired directions sit beside ${answers.constraintIds.map((id) => content.constraint[id]).join(" ")}`,
    },
    directionMap: {
      lanes: result.directionMap.lanes.map((lane) => ({ ...lane, title: lane.id === "protect" ? "Protect" : lane.id === "move-toward" ? "Move toward / change form" : lane.id === "reduce" ? "Reduce" : "Maintain / keep open", description: lane.id === "protect" ? "Should not be displaced casually by change." : lane.id === "move-toward" ? "Should receive more room or another form." : lane.id === "reduce" ? "Should take up less room or pressure." : "Should remain similar or intentionally unsettled." })),
      constraintLabels: answers.constraintIds.filter((id) => id !== "none").map((id) => content.constraint[id]),
      tradeoffLabel: content.tradeoff[answers.tradeoffStance!],
      sourceSignals: areas.map((area) => ({ areaTitle: area.title, labels: area.sourceLabels })),
    },
    insights,
    actionPaths,
    closingOrientation: {
      headline: "An orientation to take with you, not a finished plan.",
      orientation: actionPaths[0] ? `If you want to continue, you could begin with “${actionPaths[0].title}” because you selected this path yourself. The other paths remain equal alternatives.` : "You do not need to derive an action from this reflection yet.",
      questions: [protectedAreas[0] ? `How would you recognise that ${protectedAreas[0].title} remains protected in a next step?` : "What needs to remain sustainable in a next step?", open[0] ? `What information would create useful clarity around ${open[0].title} without ending openness too early?` : "What small observation could confirm or change your direction?", "When would you like to revisit this snapshot, and what may remain unresolved until then?"],
      evidence: visionEvidence(result.closingOrientation.evidence),
    },
  };
}
