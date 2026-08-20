import type { Locale } from "@/lib/i18n/config";
import type {
  AuthoritySource,
  CapacityEffect,
  CurrentEmphasis,
  DesiredDirection,
  EntanglementStatus,
  ExperimentMode,
  LifeAlignmentSectionId,
  LifeAlignmentSnapshotGroupId,
  LifeAreaDefinition,
  LifeConstraintId,
  TradeoffStatus,
} from "@/types/life-alignment";
import type {
  PartnerActionPathId,
  PartnerCertainty,
  PartnerConstraint,
  PartnerDesiredDirection,
  PartnerDifferenceStance,
  PartnerDimensionDefinition,
  PartnerExperience,
  PartnerExpectationClarity,
  PartnerFindingCategory,
  PartnerImportance,
} from "@/types/life-alignment-partner";
import type {
  LifeVisionAreaId,
  LifeVisionConstraintId,
  LifeVisionEmphasis,
  LifeVisionExplorationMode,
  LifeVisionHorizon,
  LifeVisionProtectionId,
  LifeVisionSectionId,
  LifeVisionSource,
  LifeVisionTradeoffStance,
} from "@/types/life-alignment-life-vision";

import * as selfDe from "@/data/life-alignment";
import * as partnerDe from "@/data/life-alignment-partner";
import * as visionDe from "@/data/life-alignment-life-vision";
import { buildAddedPartnerContent, buildAddedSelfContent, buildAddedVisionContent, isAddedLifeLocale } from "@/data/i18n/life-alignment-extra";

const selfEn = {
  lifeAlignment: {
    ...selfDe.lifeAlignment,
    eyebrow: "Human Context · Life Alignment",
    title: "How well does your life today fit what matters right now?",
    description: "A private snapshot of life areas, attention, energy, desired directions and real constraints — without a life score or a ready-made answer.",
    duration: "5 sections · usually 22–24 decisions · about 8–12 minutes",
    privacy: "Your answers stay entirely in the current page state. They are not stored, transmitted or linked to your BTS Account, even when you are signed in.",
    authority: "You keep the authority to interpret the result. It only organises what you explicitly selected, and you may change or reject it.",
    discovery: {
      category: "Life Alignment Tool",
      tags: ["Life areas", "Direction", "Priorities", "Energy", "Attention"],
      keywords: ["Align my life", "Life balance", "What matters to me", "My current life", "Desired change"],
    },
  },
  sections: [
    { id: "areas", title: "What matters right now?", description: "Relevant life areas and today's priorities." },
    { id: "reality", title: "What does today look like?", description: "Attention and the effect on your capacity." },
    { id: "direction", title: "What may change?", description: "More, less, similar, different or still unclear." },
    { id: "context", title: "What constrains or supports you?", description: "Real conditions and conscious trade-offs." },
    { id: "focus", title: "What would you like to explore?", description: "Your interpretation and one small next experiment." },
  ] as const satisfies readonly { id: LifeAlignmentSectionId; title: string; description: string }[],
  areas: [
    { id: "work", title: "Work and contribution", description: "Paid work, education, projects and the sense that you are contributing something." },
    { id: "close-relationships", title: "Close relationships and family", description: "Closeness, partnership, family and important personal bonds.", highStakes: true },
    { id: "community", title: "Friendships and community", description: "Friendships, belonging, neighbourhood and community involvement." },
    { id: "wellbeing", title: "Health and wellbeing", description: "Physical and emotional wellbeing, without medical assessment.", highStakes: true },
    { id: "rest-play", title: "Rest and room to play", description: "Rest, joy, free time, ease and recovery." },
    { id: "security", title: "Financial and practical security", description: "Income, obligations, predictability and material foundations.", highStakes: true },
    { id: "growth-creativity", title: "Learning, creativity and growth", description: "Curiosity, expression, skills and personal development." },
    { id: "home-environment", title: "Home and surroundings", description: "Housing, everyday life, places and the conditions around you.", highStakes: true },
  ] as const satisfies readonly LifeAreaDefinition[],
  currentEmphasis: {
    little: { label: "Gets relatively little space", description: "This area currently receives little time or attention." },
    workable: { label: "Has a workable amount of space", description: "Its current share feels broadly appropriate." },
    "a-lot": { label: "Takes up a lot of space", description: "This area currently uses a large share of your capacity." },
    unclear: { label: "Still hard to assess", description: "The current distribution is not yet clear to you." },
  } satisfies Readonly<Record<CurrentEmphasis, { label: string; description: string }>>,
  capacity: {
    supportive: { label: "Tends to support me", description: "This area provides stability, energy or helpful direction." },
    mixed: { label: "Feels mixed", description: "Supportive and demanding aspects exist at the same time." },
    draining: { label: "Tends to cost capacity", description: "This area currently demands more energy or attention." },
    unclear: { label: "Still unclear", description: "Its effect is difficult to assess right now." },
  } satisfies Readonly<Record<CapacityEffect, { label: string; description: string }>>,
  direction: {
    less: { label: "Less", description: "This area may take up less space or create less pressure." },
    keep: { label: "Continue similarly", description: "Its current direction may broadly remain as it is." },
    more: { label: "More", description: "This area may receive more space or attention." },
    different: { label: "Different", description: "Not necessarily more or less, but in another form." },
    uncertain: { label: "Still uncertain", description: "Your desired direction remains open." },
  } satisfies Readonly<Record<DesiredDirection, { label: string; description: string }>>,
  constraints: {
    "time-attention": "Time and attention are tightly limited right now.",
    "energy-capacity": "My available energy or resilience is limited.",
    "care-responsibility": "Care, relationships or responsibility for others create a real boundary.",
    "income-commitment": "Income, ongoing costs or financial commitments need to remain sustainable.",
    "location-access": "Location, housing, mobility or access limit the possibilities.",
    "formal-obligation": "Contracts, rules or other formal obligations are currently binding.",
    "external-dependency": "Other people or institutions have a substantial say.",
    uncertain: "I am not yet sure which constraint matters most.",
    none: "I do not want to record a specific constraint right now.",
  } satisfies Readonly<Record<LifeConstraintId, string>>,
  tradeoffs: {
    "explore-change": "I want to explore carefully whether a small change is possible.",
    "accepted-now": "For now, this tension is a conscious and acceptable trade-off for me.",
    "currently-fixed": "I want change, but cannot reasonably shift this boundary right now.",
    uncertain: "I am not yet sure how I relate to this tension.",
  } satisfies Readonly<Record<TradeoffStatus, string>>,
  authority: {
    intrinsic: "I want this direction myself.",
    social: "People around me strongly influence this direction.",
    inherited: "I learned that I should want or do this.",
    "constraint-driven": "My current situation pushes me in this direction.",
    uncertain: "I am not yet sure whether this direction is truly mine.",
  } satisfies Readonly<Record<AuthoritySource, string>>,
  entanglement: {
    current: "There is a specific present-day condition behind it.",
    historical: "An older expectation, experience or former self-image is more central.",
    both: "Present conditions and older influences are both active.",
    unsure: "I cannot reliably distinguish that right now.",
    "not-applicable": "This question does not fit my current focus.",
  } satisfies Readonly<Record<EntanglementStatus, string>>,
  experiments: {
    observe: { label: "Observe one situation deliberately", action: "Notice two specific moments when this area gains or loses space.", observe: "What genuinely supports you, and what costs more capacity than expected?" },
    protect: { label: "Protect a small amount of space", action: "Protect one small, realistic window for what you want to make possible in this area.", observe: "Does that limited space change your energy, clarity or pressure?" },
    conversation: { label: "Have an exploratory conversation", action: "Have a calm conversation to understand a perspective or condition better, without demanding an immediate decision.", observe: "Which possibility or boundary becomes more concrete afterwards?" },
    fact: { label: "Clarify one open condition", action: "Clarify exactly one piece of information, rule or practical requirement that affects your room to move.", observe: "Is the assumed boundary now clearer, smaller, larger or still uncertain?" },
    reversible: { label: "Test a small reversible change", action: "Change one small, low-risk part of today's routine once, and keep it easy to reverse.", observe: "Does the alternative feel more helpful, or does the test reveal an important trade-off?" },
    pause: { label: "Change nothing yet", action: "Take the snapshot with you for now and decide later whether any experiment would be useful.", observe: "Which statement still matters after you have had some distance?" },
  } satisfies Readonly<Record<ExperimentMode, { label: string; action: string; observe: string }>>,
  scene: {
    ...selfDe.lifeAlignmentScene,
    eyebrow: "Life Alignment · One possible situation",
    title: "Different areas of life may be visible at the same time.",
    description: "The recurring figures look at everyday life, relationships, work and rest in one shared scene. They are not personality types and represent neither you nor your result.",
    alt: "Four adults in a warm studio look at scenes and notes about work, relationships, rest and home.",
  },
  snapshot: {
    support: { label: "Supports you today", description: "Areas you described as supportive and appropriate in their current direction." },
    change: { label: "Wants movement", description: "Areas with desired change, capacity tension or a conscious trade-off." },
    open: { label: "Remains open", description: "Areas where space, effect or desired direction do not need to be clear yet." },
    steady: { label: "Can stay as it is for now", description: "Areas without a clear signal of support, tension or openness." },
  } satisfies Readonly<Record<LifeAlignmentSnapshotGroupId, { label: string; description: string }>>,
  depth: {
    evidenceLabel: "Why am I seeing this?",
    pathsBoundary: "These paths are possibilities, not a ranking or a recommendation for a major life decision. You can change, combine or consciously reject any path.",
    toolsBoundary: "The small tools use only your answers. They store nothing and are intended to support observation or conversation — not to measure your life.",
  },
};

const partnerEn = {
  module: {
    ...partnerDe.partnerModule,
    eyebrow: "Life Alignment · For two people",
    title: "Two perspectives — first independently, then visible together.",
    description: "A qualitative view of relationship experiences, expectations and current conditions. Not a compatibility test, and not a verdict on who is right.",
    duration: "Two perspectives · about 15–20 minutes",
    privacy: "All answers stay in this page's memory. There is no account, invitation, transmission or storage. Reloading ends the session.",
  },
  scene: {
    ...partnerDe.partnerScene,
    eyebrow: "Human Context · Two independent perspectives",
    title: "Reflect separately first, then look together.",
    description: "The recurring figures represent two equally valid perspectives. They do not stand for you, do not reproduce answers and do not imply which side is right.",
    alt: "Two people reflect separately at a shared table before turning towards their perspectives together.",
  },
  sections: [
    { id: "dimensions", title: "Choose topics" },
    { id: "experience", title: "Experience today" },
    { id: "expectations", title: "Direction and context" },
    { id: "review", title: "Review and release" },
  ],
  dimensions: [
    { id: "connection", title: "Closeness and connection", description: "Emotional closeness, attention and the feeling of being connected.", examples: ["listening to each other deliberately after a demanding day", "maintaining connection across distance or different routines", "showing affection in a way the other person can receive"] },
    { id: "communication", title: "Communication", description: "How information, feelings, needs and difficult topics are shared.", examples: ["communicating a change of plan in good time", "raising a misunderstanding without demanding an immediate solution", "clarifying different rhythms around messages and replies"] },
    { id: "reliability", title: "Reliability", description: "Agreements, availability and confidence that commitments will hold.", examples: ["keeping a commitment or renegotiating it early", "being realistically available during a demanding week", "clearly naming what the other person can rely on"] },
    { id: "shared-time", title: "Time together", description: "How much time, and what kind of time, is spent together deliberately.", examples: ["distinguishing everyday time from deliberately planned time", "finding shared moments despite shift work, distance or care work", "deciding when being together or recovering alone would help more"] },
    { id: "autonomy", title: "Autonomy and personal space", description: "Personal space, individual interests and decisions within the relationship.", examples: ["protecting time for individual friendships or interests", "deciding what to inform each other about, coordinate or decide alone", "needing space without questioning the relationship itself"] },
    { id: "responsibilities", title: "Everyday responsibilities", description: "Tasks, care, mental load and practical responsibilities.", examples: ["making appointments, household work or organisation visible", "planning care for children, relatives, animals or health", "temporarily redistributing tasks when capacity differs"] },
    { id: "finances", title: "Money and financial agreements", description: "Spending, security, responsibility and transparency around money.", examples: ["agreeing clearly on shared and separate spending", "handling unequal incomes or financial commitments", "discussing a larger expense or need for security"], sensitive: true },
    { id: "physical-intimacy", title: "Physical closeness and intimacy", description: "Physical affection, boundaries and wishes — without assumptions about what should be right.", examples: ["agreeing explicitly on forms of physical closeness instead of assuming", "respecting no, maybe or not-today without pressure", "discussing different wishes without treating consent as owed"], sensitive: true },
  ] as const satisfies readonly PartnerDimensionDefinition[],
  experience: {
    "less-than-needed": "Less than I currently need", workable: "Broadly workable for me", "more-than-needed": "More than I currently need", mixed: "Mixed or situational", unclear: "Still unclear",
  } satisfies Readonly<Record<PartnerExperience, string>>,
  direction: {
    less: "Less", similar: "Continue similarly", more: "More", different: "Different", open: "Still open",
  } satisfies Readonly<Record<PartnerDesiredDirection, string>>,
  importance: { important: "Important to me", somewhat: "Somewhat important", "not-central": "Not central right now" } satisfies Readonly<Record<PartnerImportance, string>>,
  certainty: { clear: "Fairly clear", unsure: "Still uncertain" } satisfies Readonly<Record<PartnerCertainty, string>>,
  expectation: {
    "current-confirmed": "Currently discussed and mutually confirmed", assumed: "Mostly assumed, not currently confirmed", "discussed-before-current-unclear": "Discussed before, but the current status is unclear", "currently-unclear": "Currently unclear between us", "intentionally-open": "Intentionally left open",
  } satisfies Readonly<Record<PartnerExpectationClarity, string>>,
  difference: { discuss: "I would like to discuss a possible difference", acceptable: "A difference could be acceptable", uncertain: "I am not yet sure" } satisfies Readonly<Record<PartnerDifferenceStance, string>>,
  constraint: { none: "No specific constraint recorded", capacity: "Time or energy is limited", practical: "Practical or financial conditions limit us", external: "Other responsibilities or people are involved", unclear: "The constraint is still unclear" } satisfies Readonly<Record<PartnerConstraint, string>>,
  findingLabels: {
    "shared-ground": "Shared ground", "different-expectations": "Different expectations", "direction-difference": "Different desired directions", uncertainty: "Open information", "accepted-difference": "A difference may remain", "present-constraint": "A current constraint", "worth-discussing": "Worth clarifying voluntarily", "not-assessed-by-both": "Not assessed by both",
  } satisfies Readonly<Record<PartnerFindingCategory, string>>,
  pathCopy: {
    "clarify-expectation": { title: "Clarify an expectation", approach: "Take turns describing what each person concretely expects, then check what has actually been agreed together.", tradeoffs: "Greater clarity may resolve a comfortable ambiguity; it does not require agreement.", reversibility: "The conversation gathers information and makes no permanent decision.", whatCouldBeLearned: "Whether you truly expect different things or are using different examples and words." },
    conversation: { title: "Offer a calm conversation", approach: "Choose a topic only if both people want to talk. Give both perspectives equal space and first check whether you understood each other.", tradeoffs: "A conversation needs time, voluntary participation and enough safety; pausing or saying no is a complete response.", reversibility: "You can leave the topic open after a limited conversation or stop at any time.", whatCouldBeLearned: "Which experience, concern or hope sits behind each view, without requiring immediate agreement." },
    "practical-arrangement": { title: "Negotiate a practical agreement", approach: "Translate a different expectation into one small, observable everyday agreement.", tradeoffs: "A concrete rule creates clarity but may initially feel unnatural or restrictive.", reversibility: "Agree on a short review point and an easy return to the previous arrangement.", whatCouldBeLearned: "Whether a concrete form helps both people and which unintended costs it creates." },
    boundary: { title: "Make a boundary clearer", approach: "Name what each person can offer, what they cannot, and how the boundary can be recognised in everyday life.", tradeoffs: "A clear boundary may disappoint and may also reduce pressure or unspoken expectations.", reversibility: "The wording can be adjusted together when new information appears; the current boundary applies until then.", whatCouldBeLearned: "Which tension comes from ambiguity and which remains even with a clear boundary." },
    "gather-information": { title: "Gather missing information", approach: "Clarify one open fact or ask for a concrete example before evaluating a difference.", tradeoffs: "This delays a solution but protects you from treating assumptions as facts.", reversibility: "Gathering information changes no agreement.", whatCouldBeLearned: "Which assumption is confirmed, which changes, and which question remains open." },
    "reversible-change": { title: "Try a small change", approach: "Test one small alternative for a limited period and separately notice what it makes easier or harder.", tradeoffs: "A test can create short-term effort and need not help both people equally.", reversibility: "Agree on duration, stop signal and a return option before starting.", whatCouldBeLearned: "How the change affects closeness, pressure, capacity and practical routines for both people." },
    "accept-difference": { title: "Consciously leave a difference in place", approach: "Name the difference as known and check which mutual consideration is still needed.", tradeoffs: "Acceptance reduces pressure to solve, but must not override boundaries or missing consent.", reversibility: "You can reopen the assessment if effects or circumstances change.", whatCouldBeLearned: "Whether the difference is workable with clear consideration or still creates one-sided costs." },
    "leave-open": { title: "Leave the topic open for now", approach: "Record what remains open and how you would recognise that a later conversation might help.", tradeoffs: "A pause protects capacity but leaves the underlying uncertainty in place.", reversibility: "Leaving something open is explicitly not a final decision.", whatCouldBeLearned: "Whether distance creates clarity and which signal might mark a useful time to return." },
    "external-support": { title: "Consider appropriate outside support", approach: "Consider together what kind of neutral or professional support could fit the topic and your safety.", tradeoffs: "Support costs time, money or effort and does not replace either person's consent.", reversibility: "An initial information session does not commit you to continue. This tool recommends no specific provider.", whatCouldBeLearned: "Which conversation conditions or professional perspectives are missing and what kind of support might fit." },
  } satisfies Readonly<Record<PartnerActionPathId, { title: string; approach: string; tradeoffs: string; reversibility: string; whatCouldBeLearned: string }>>,
  disclaimer: "This comparison organises only the answers both of you explicitly released. It does not measure compatibility, diagnose anyone or decide which perspective is right. Where there is fear, control, violence or a lack of safety, a joint conversation is not automatically the right next step.",
};

const visionEn = {
  lifeVision: {
    ...visionDe.lifeVision,
    eyebrow: "Life Alignment · For me",
    title: "What direction should your life take — and what should not get lost along the way?",
    description: "A qualitative reflection on desired directions, protected priorities, real constraints and several possible paths. Not a finished life plan.",
    duration: "6 sections · about 10–14 minutes",
    privacy: "Your answers stay only in the current page state. They are neither stored nor transmitted or linked to an account.",
    authority: "You decide what your answers mean. The result describes relationships between your selections, not an ideal life or the one right path.",
  },
  sections: [
    { id: "frame", title: "Future frame", description: "Time horizon and relevant life areas." },
    { id: "direction", title: "Desired direction", description: "More, less, similar, different or intentionally open." },
    { id: "protect", title: "What should remain protected", description: "Priorities and conditions that should not be optimised away." },
    { id: "context", title: "Human Context", description: "Where your desired directions come from, in your own view." },
    { id: "constraints", title: "Constraints and trade-offs", description: "Real conditions and potentially competing directions." },
    { id: "paths", title: "Possible paths", description: "Which forms of exploration could fit you at all." },
  ] as const satisfies readonly { id: LifeVisionSectionId; title: string; description: string }[],
  areas: [
    { id: "work-contribution", title: "Work and contribution", description: "Paid work, learning, projects and contribution to society." },
    { id: "relationships", title: "Close relationships", description: "Partnership, family and other dependable bonds." },
    { id: "community", title: "Friendship and community", description: "Belonging, friendships and shared involvement." },
    { id: "wellbeing", title: "Health and wellbeing", description: "Physical and emotional wellbeing, without medical assessment." },
    { id: "rest-play", title: "Rest and room to play", description: "Rest, joy, free time and recovery." },
    { id: "security", title: "Practical security", description: "Financial foundations, predictability and a sustainable everyday life." },
    { id: "learning-creativity", title: "Learning and creativity", description: "Curiosity, skills, expression and growth." },
    { id: "home-place", title: "Home and place", description: "Housing, surroundings, mobility and connection to a place." },
  ] as const satisfies readonly { id: LifeVisionAreaId; title: string; description: string }[],
  horizon: {
    "one-two-years": { label: "The next 1–2 years", description: "Close enough for concrete conditions, far enough for visible change." },
    "three-five-years": { label: "The next 3–5 years", description: "A medium-term view with room for several steps." },
    "open-horizon": { label: "An intentionally open horizon", description: "Direction matters more than a particular date." },
  } satisfies Readonly<Record<LifeVisionHorizon, { label: string; description: string }>>,
  emphasis: {
    less: { label: "Less", description: "This area may take up less space or create less pressure." },
    similar: { label: "Similar", description: "Its current importance may broadly remain." },
    more: { label: "More", description: "This area may receive more space and attention." },
    different: { label: "Different", description: "Not only more or less, but in another form." },
    uncertain: { label: "Still uncertain", description: "You do not want to set the direction yet." },
    "intentionally-open": { label: "Intentionally open", description: "You want to preserve possibilities instead of setting a goal now." },
  } satisfies Readonly<Record<LifeVisionEmphasis, { label: string; description: string }>>,
  protection: {
    "health-capacity": "My health and capacity must remain sustainable.", "close-relationships": "Close relationships should not be displaced casually.", "financial-floor": "A reliable financial foundation must remain intact.", "time-autonomy": "I want to protect a minimum of time and autonomy.", belonging: "Belonging and dependable community matter.", integrity: "The direction should remain consistent with my values and boundaries.", rest: "Rest and recovery must not become residual time.", curiosity: "Curiosity and room to learn should remain possible.",
  } satisfies Readonly<Record<LifeVisionProtectionId, string>>,
  source: {
    intrinsic: "I genuinely want this direction myself.", social: "My current environment influences this direction.", inherited: "Older expectations or learned ideas influence this direction.", "constraint-driven": "Current conditions push me towards this direction.", uncertain: "I am not yet sure where this direction comes from.",
  } satisfies Readonly<Record<LifeVisionSource, string>>,
  constraint: {
    time: "Time and attention are limited.", energy: "Energy or resilience are limited.", care: "Care and responsibility for others create a real boundary.", money: "Income, costs or financial obligations need to remain sustainable.", "place-access": "Place, housing, mobility or access limit the options.", commitment: "Contracts, commitments or formal requirements are binding.", "other-people": "Other people's decisions or needs are materially involved.", "missing-information": "Important information is still missing.", none: "I do not want to record a specific constraint right now.",
  } satisfies Readonly<Record<LifeVisionConstraintId, string>>,
  tradeoff: {
    explore: "I want to explore the tension without resolving it immediately.", "accept-for-now": "I consciously accept this trade-off for now.", "protect-both": "I want to look for a form that protects both directions.", uncertain: "I am not yet sure how I relate to this trade-off.", "no-current-tension": "I do not currently experience these directions as being in tension.",
  } satisfies Readonly<Record<LifeVisionTradeoffStance, string>>,
  exploration: {
    "direct-change": { title: "Change something directly", description: "Shift one small part of the current situation." }, "reduce-load": { title: "Reduce load", description: "Recover room or capacity within the current constraints." }, "gather-information": { title: "Gather missing information", description: "Replace assumptions with concrete conditions and facts." }, conversation: { title: "Have a conversation", description: "Clarify expectations, possibilities or dependencies with the people involved." }, boundary: { title: "Change a boundary", description: "Renegotiate a commitment, habit or expectation." }, "build-capacity": { title: "Build capacity first", description: "Strengthen practical, time-related or financial foundations." }, "explore-alternatives": { title: "Explore alternatives", description: "Consider several possibilities without deciding yet." }, "accept-for-now": { title: "Consciously accept a trade-off", description: "Avoid solving everything at once and revisit the choice later." }, "reversible-experiment": { title: "Run a reversible experiment", description: "Test a limited change and observe its effect." }, "external-support": { title: "Consider appropriate support", description: "Consider whether a suitable professional or trusted person could help." },
  } satisfies Readonly<Record<LifeVisionExplorationMode, { title: string; description: string }>>,
  scene: {
    ...visionDe.lifeVisionScene,
    eyebrow: "Life Vision · One possible view of the future",
    title: "Several directions and open possibilities may exist side by side.",
    description: "The recurring figures consider possible paths, protected priorities and real conditions. They are not personality types and represent neither you nor your result.",
    alt: "Four adults consider different paths in a warm evening landscape, while familiar objects suggest relationships, work, rest and home.",
  },
  disclaimer: "Life Vision is a qualitative self-reflection, not medical, psychological, legal or financial advice. It knows only the answers you selected here, not your whole life. For far-reaching decisions, check concrete risks and conditions with appropriately qualified professionals.",
};

export function getSelfAlignmentContent(locale: Locale) {
  const german = {
    lifeAlignment: selfDe.lifeAlignment,
    sections: selfDe.lifeAlignmentSections,
    areas: selfDe.lifeAreas,
    currentEmphasis: selfDe.currentEmphasisOptions,
    capacity: selfDe.capacityEffectOptions,
    direction: selfDe.desiredDirectionOptions,
    constraints: selfDe.lifeConstraintOptions,
    tradeoffs: selfDe.tradeoffOptions,
    authority: selfDe.authoritySourceOptions,
    entanglement: selfDe.entanglementOptions,
    experiments: selfDe.experimentOptions,
    scene: selfDe.lifeAlignmentScene,
    snapshot: selfDe.lifeAlignmentSnapshotCopy,
    depth: selfDe.lifeAlignmentDepthCopy,
  };
  if (isAddedLifeLocale(locale)) return buildAddedSelfContent(locale, selfEn);
  return { de: german, en: selfEn }[locale];
}

export function getPartnerAlignmentContent(locale: Locale) {
  const german = {
    module: partnerDe.partnerModule,
    scene: partnerDe.partnerScene,
    sections: partnerDe.partnerSections,
    dimensions: partnerDe.partnerDimensions,
    experience: partnerDe.partnerExperienceOptions,
    direction: partnerDe.partnerDirectionOptions,
    importance: partnerDe.partnerImportanceOptions,
    certainty: partnerDe.partnerCertaintyOptions,
    expectation: partnerDe.partnerExpectationClarityOptions,
    difference: partnerDe.partnerDifferenceStanceOptions,
    constraint: partnerDe.partnerConstraintOptions,
    findingLabels: partnerDe.partnerFindingLabels,
    pathCopy: partnerDe.partnerPathCopy,
    disclaimer: partnerDe.PARTNER_DISCLAIMER,
  };
  if (isAddedLifeLocale(locale)) return buildAddedPartnerContent(locale, partnerEn);
  return { de: german, en: partnerEn }[locale];
}

export function getLifeVisionContent(locale: Locale) {
  const german = {
    lifeVision: visionDe.lifeVision,
    sections: visionDe.lifeVisionSections,
    areas: visionDe.lifeVisionAreas,
    horizon: visionDe.lifeVisionHorizonOptions,
    emphasis: visionDe.lifeVisionEmphasisOptions,
    protection: visionDe.lifeVisionProtectionOptions,
    source: visionDe.lifeVisionSourceOptions,
    constraint: visionDe.lifeVisionConstraintOptions,
    tradeoff: visionDe.lifeVisionTradeoffOptions,
    exploration: visionDe.lifeVisionExplorationOptions,
    scene: visionDe.lifeVisionScene,
    disclaimer: visionDe.LIFE_VISION_DISCLAIMER,
  };
  if (isAddedLifeLocale(locale)) return buildAddedVisionContent(locale, visionEn);
  return { de: german, en: visionEn }[locale];
}
