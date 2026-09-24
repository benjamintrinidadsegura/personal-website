import type {
  MoneyDimension,
  MoneyIntervention,
  MoneyMeaningId,
  MoneyProfileFamily,
  MoneyStressResponseId,
  MoneyTensionDefinition,
} from "@/types/money-profile";

export const moneyDimensions = [
  { id: "security-orientation", label: "Security Orientation", definition: "How strongly money represents safety, protection, stability and peace.", potentialStrength: "Preparation and resilience.", potentialTradeOff: "Holding back money even when using it would be reasonable or meaningful." },
  { id: "freedom-orientation", label: "Freedom Orientation", definition: "How strongly money represents choice, independence, autonomy and optionality.", potentialStrength: "Protecting options and room to change direction.", potentialTradeOff: "Rejecting useful structure when it feels restrictive." },
  { id: "present-enjoyment", label: "Present Enjoyment", definition: "How readily money becomes experience, comfort, hobbies, connection and life now.", potentialStrength: "Letting money serve life in the present.", potentialTradeOff: "Current use can crowd out future priorities when repeated evidence supports that tension." },
  { id: "future-orientation", label: "Future Orientation", definition: "How strongly future needs, obligations, goals and options influence current choices.", potentialStrength: "Connecting present decisions to future possibilities.", potentialTradeOff: "The present can become permanently secondary." },
  { id: "planning-structure", label: "Planning & Structure", definition: "Use of categories, pots, routines, overview and planning.", potentialStrength: "Clear routines and fewer surprises.", potentialTradeOff: "A system can become too detailed or hard to maintain." },
  { id: "financial-avoidance", label: "Financial Avoidance", definition: "Creating distance from checking, deciding or financial admin when it feels uncomfortable.", potentialStrength: "Distance can keep money from dominating identity.", potentialTradeOff: "Short-term relief can increase uncertainty later." },
  { id: "control-need", label: "Control Need", definition: "Regulating financial uncertainty through checking, precision, monitoring and predictability.", potentialStrength: "Reliable overview and early awareness.", potentialTradeOff: "More checking without more security." },
  { id: "spending-impulsivity", label: "Spending Impulsivity", definition: "How short the distance becomes between wanting and buying.", potentialStrength: "Spontaneity and responsiveness.", potentialTradeOff: "Short-term reaction can override deliberate priorities when regret repeats." },
  { id: "risk-comfort", label: "Risk Comfort", definition: "Comfort with financial uncertainty in work, commitments, purchases and buffers.", potentialStrength: "Ability to act without complete certainty.", potentialTradeOff: "Important downside may receive too little attention." },
  { id: "status-symbolism", label: "Status & Symbolism", definition: "The role of money and possessions in identity, expression, quality, belonging and recognition.", potentialStrength: "Intentional expression and appreciation of quality.", potentialTradeOff: "External signals can compete with personally meaningful value when evidence supports it." },
  { id: "financial-self-efficacy", label: "Financial Self-Efficacy", definition: "Belief that meaningful financial influence is possible when circumstances are not where the person wants them to be.", potentialStrength: "Practical agency and willingness to take a next step.", potentialTradeOff: "Agency can be confused with control over constraints that are genuinely external." },
  { id: "money-stress-reactivity", label: "Money Stress Reactivity", definition: "How financial behavior shifts when money feels tight, uncertain, threatening or overwhelming.", potentialStrength: "Protective responses can mobilize attention or action.", potentialTradeOff: "A useful short-term response can overfire or reduce access to normal strengths." },
] as const satisfies readonly MoneyDimension[];

export const moneyMeaningLabels: Readonly<Record<MoneyMeaningId, string>> = {
  safety: "Safety",
  freedom: "Freedom",
  possibility: "Possibility",
  enjoyment: "Enjoyment",
  responsibility: "Responsibility",
  control: "Control",
  success: "Success",
  belonging: "Belonging",
  "care-for-others": "Care for others",
  peace: "Peace",
  status: "Status",
  choice: "Choice",
};

export const moneyStressResponseLabels: Readonly<Record<MoneyStressResponseId, string>> = {
  avoid: "Avoid",
  control: "Control",
  restrict: "Restrict",
  "soothe-spend": "Soothe / Spend",
  freeze: "Freeze",
  act: "Act",
};

export const moneyProfileFamilies = [
  { id: "protector", label: "The Protector", dimensionIds: ["security-orientation", "future-orientation"], meaningIds: ["safety", "peace", "responsibility"], strength: "You tend to protect stability and prepare for what may come.", tradeOff: "Future protection can sometimes crowd out reasonable present use.", helpfulDirection: "A self-defined safety target can make room for intentional use beyond it." },
  { id: "freedom-seeker", label: "The Freedom Seeker", dimensionIds: ["freedom-orientation", "risk-comfort"], meaningIds: ["freedom", "choice", "possibility"], strength: "You use money to protect options, autonomy and room to change direction.", tradeOff: "Short-term freedom can quietly consume future freedom, while rigid systems may be abandoned.", helpfulDirection: "Automate essentials while keeping genuinely discretionary choices flexible." },
  { id: "builder", label: "The Builder", dimensionIds: ["future-orientation", "financial-self-efficacy"], meaningIds: ["possibility", "success", "responsibility"], strength: "You connect current decisions with progress toward something meaningful.", tradeOff: "Life can become permanently framed as the building phase.", helpfulDirection: "Use visible milestones while preserving intentional present use." },
  { id: "optimizer", label: "The Optimizer", dimensionIds: ["planning-structure", "control-need"], meaningIds: ["control", "responsibility", "peace"], strength: "You create overview, reliable routines and fewer surprises.", tradeOff: "Tracking and optimizing can consume attention without improving the outcome.", helpfulDirection: "Simplify and automate decisions that do not deserve repeated attention." },
  { id: "enjoyer", label: "The Enjoyer", dimensionIds: ["present-enjoyment"], meaningIds: ["enjoyment", "belonging", "care-for-others"], strength: "You let money serve experience, comfort, expression and life now.", tradeOff: "Only where evidence supports it, spontaneous wants may override future intentions.", helpfulDirection: "Protect enjoyment and future options with separate, simple boundaries." },
  { id: "distance-keeper", label: "The Distance Keeper", dimensionIds: ["financial-avoidance"], meaningIds: ["peace"], strength: "Money and status may occupy less of your identity and attention.", tradeOff: "Distance can let small uncertainties become larger ones.", helpfulDirection: "Use short, predictable contact with money instead of permanent vigilance." },
  { id: "balancer", label: "The Balancer", dimensionIds: ["security-orientation", "freedom-orientation", "present-enjoyment", "future-orientation", "planning-structure"], meaningIds: ["safety", "freedom", "enjoyment", "responsibility"], strength: "You tend to combine present and future needs with pragmatic flexibility.", tradeOff: "When many priorities stay valid, one meaningful long-term decision can remain vague.", helpfulDirection: "Make one priority visible at a time without turning balance into a score." },
] as const satisfies readonly MoneyProfileFamily[];

export const moneyTensionDefinitions = [
  { id: "security-present", dimensionIds: ["security-orientation", "present-enjoyment"], insight: "You may want to protect tomorrow without cancelling today.", tradeOff: "Security can make present use feel risky even when enjoyment is important.", helpfulStructures: ["fun-money-pot", "permission-to-spend"] },
  { id: "freedom-structure", dimensionIds: ["freedom-orientation", "planning-structure"], insight: "Structure may work best when it protects freedom rather than restricting it.", tradeOff: "Too little structure can reduce future options; too much can make the system hard to maintain.", helpfulStructures: ["automatic-future-money", "fixed-cost-separation"] },
  { id: "freedom-control", dimensionIds: ["freedom-orientation", "control-need"], insight: "The desire for options can collide with tighter control under uncertainty.", tradeOff: "Control may protect choice in the short term while making every decision feel pre-decided.", helpfulStructures: ["reduce-money-decisions", "fixed-cost-separation"] },
  { id: "planning-avoidance", dimensionIds: ["planning-structure", "financial-avoidance"], insight: "You may not lack financial structure; you may lose access to it under stress.", tradeOff: "A larger system can create more avoidance precisely when support is needed.", helpfulStructures: ["ten-minute-money-check", "first-small-action"] },
  { id: "enjoyment-impulsivity", dimensionIds: ["present-enjoyment", "spending-impulsivity"], insight: "Intentional enjoyment and short-term reaction are different patterns.", tradeOff: "When regret repeats, a fast decision can override the enjoyment you actually value.", helpfulStructures: ["purchase-pause", "friction-for-impulse"] },
  { id: "security-control", dimensionIds: ["security-orientation", "control-need"], insight: "Your need for safety can create excellent overview.", tradeOff: "It can also become more checking without more security.", helpfulStructures: ["ten-minute-money-check", "reduce-money-decisions"] },
  { id: "future-low-efficacy", dimensionIds: ["future-orientation", "financial-self-efficacy"], insight: "The future may matter even when current actions do not feel powerful enough.", tradeOff: "Large abstract goals can intensify distance or overwhelm.", helpfulStructures: ["one-visible-goal", "first-small-action"] },
  { id: "status-present", dimensionIds: ["status-symbolism", "present-enjoyment"], insight: "Money may support expression, quality, belonging or recognition.", tradeOff: "The useful question is whether those choices still feel personally meaningful afterward.", helpfulStructures: ["purchase-pause", "fun-money-pot"] },
] as const satisfies readonly MoneyTensionDefinition[];

export const moneyInterventions = [
  { id: "automatic-future-money", label: "Automatic Future Money", concept: "Move a user-chosen amount automatically toward a chosen future goal before discretionary decisions begin.", helpsWith: ["future-intention", "consistency-gap"], badFitFor: ["severe-restriction", "limited-flexibility"], stressFit: ["act"], effort: "medium", whyItMayHelp: "It turns a repeated decision into one chosen rule without prescribing an amount or percentage." },
  { id: "fun-money-pot", label: "Fun-Money Pot", concept: "Define money that is explicitly allowed to be used for enjoyment.", helpsWith: ["spending-guilt", "over-restriction", "present-enjoyment"], badFitFor: ["severe-constraint"], stressFit: ["restrict", "control"], effort: "low", whyItMayHelp: "It protects intentional enjoyment without asking every purchase to win the same internal debate." },
  { id: "purchase-pause", label: "24-Hour Purchase Pause", concept: "Above a threshold chosen by the user, wait approximately 24 hours before deciding on an unplanned purchase.", helpsWith: ["impulsivity", "purchase-regret", "desire-fades"], badFitFor: ["stable-desire-low-regret"], stressFit: ["soothe-spend"], effort: "low", whyItMayHelp: "A small pause reveals whether the desire remains without banning the purchase." },
  { id: "ten-minute-money-check", label: "10-Minute Money Check", concept: "At a predictable interval, check the current situation, upcoming obligations and one relevant action—then stop.", helpsWith: ["avoidance", "control-overload", "unclear-overview"], badFitFor: ["already-bounded-overview"], stressFit: ["avoid", "control"], effort: "low", whyItMayHelp: "Bounded contact can reduce both permanent distance and permanent monitoring." },
  { id: "fixed-cost-separation", label: "Fixed-Cost Separation", concept: "Make obligations and genuinely discretionary money visibly distinct using user-chosen pots, categories or accounts.", helpsWith: ["unclear-overview", "freedom", "uncertainty"], badFitFor: ["system-overload"], stressFit: ["control", "act"], effort: "medium", whyItMayHelp: "Clarity can protect flexibility without prescribing a provider or product." },
  { id: "one-visible-goal", label: "One Visible Goal", concept: "Make one meaningful future financial goal visible.", helpsWith: ["abstract-future", "goal-loses-relevance", "future-intention"], badFitFor: ["goals-not-motivating"], stressFit: ["act"], effort: "low", whyItMayHelp: "One visible priority can connect everyday choices to a future that otherwise feels abstract." },
  { id: "minimum-viable-buffer", label: "Minimum Viable Buffer", concept: "Define personally what buffer would make small unexpected costs feel manageable.", helpsWith: ["security", "unexpected-costs"], badFitFor: ["severe-constraint"], stressFit: ["restrict", "control"], effort: "medium", whyItMayHelp: "A self-defined target can turn vague safety seeking into a clear boundary without inventing an amount." },
  { id: "permission-to-spend", label: "Permission to Spend", concept: "Define a category where the decision has already been made: this money is allowed to be used.", helpsWith: ["spending-guilt", "over-restriction", "protector"], badFitFor: ["severe-constraint", "impulsivity-with-regret"], stressFit: ["restrict", "control"], effort: "low", whyItMayHelp: "Pre-decided permission can reduce guilt without implying that unaffordable spending is safe." },
  { id: "friction-for-impulse", label: "Friction for Impulse", concept: "Create one deliberate step between wanting and buying, such as a wish list or removing stored payment details.", helpsWith: ["impulsivity", "purchase-regret"], badFitFor: ["low-regret"], stressFit: ["soothe-spend"], effort: "low", whyItMayHelp: "A small step protects the space for a deliberate choice without infantilizing the user." },
  { id: "reduce-money-decisions", label: "Reduce Money Decisions", concept: "Automate or simplify recurring low-value decisions.", helpsWith: ["control-overload", "decision-fatigue", "optimizer"], badFitFor: ["needs-overview-first"], stressFit: ["control", "freeze"], effort: "medium", whyItMayHelp: "Less repeated financial cognition can preserve attention for decisions that actually matter." },
  { id: "first-small-action", label: "First Small Action", concept: "Choose one bounded action: open one bill, check one amount or write down one upcoming obligation.", helpsWith: ["freeze", "avoidance", "overwhelm"], badFitFor: [], stressFit: ["freeze", "avoid"], effort: "low", whyItMayHelp: "One finite action creates movement without demanding a complete financial overhaul." },
  { id: "ask-for-help-earlier", label: "Ask for Help Earlier", concept: "Involve a trusted person, appropriate professional or qualified counselling service before the situation feels unmanageable.", helpsWith: ["low-self-efficacy", "overwhelm", "severe-constraint", "unclear-next-step"], badFitFor: [], stressFit: ["freeze", "avoid"], effort: "low", whyItMayHelp: "The right support can be more useful than adding another self-help system when options feel limited." },
] as const satisfies readonly MoneyIntervention[];

export const moneyChapters = [
  "What money means to you",
  "How you use money",
  "Planning, control & avoidance",
  "Now vs later",
  "Money under stress",
  "What actually happens",
  "Connecting your money patterns",
] as const;

export const moneyDimensionById = new Map(moneyDimensions.map((dimension) => [dimension.id, dimension]));
export const moneyProfileFamilyById = new Map(moneyProfileFamilies.map((family) => [family.id, family]));
export const moneyInterventionById = new Map(moneyInterventions.map((intervention) => [intervention.id, intervention]));
