import type { AdvantageSignal, AdvantageSignalDomain } from "@/types/personal-advantage";

function signal(
  id: string,
  domain: AdvantageSignalDomain,
  label: string,
  definition: string,
  contexts: readonly string[],
  overusePatterns: readonly string[],
  possibleMultipliers: readonly string[],
  tensions: readonly string[] = [],
): AdvantageSignal {
  return { id, domain, label, definition, contexts, overusePatterns, possibleMultipliers, tensions };
}

export const advantageSignals: readonly AdvantageSignal[] = [
  signal("pattern-recognition", "sensemaking", "Pattern Recognition", "Notices recurring structures, similarities and anomalies across situations.", ["messy information", "diagnosis", "strategy"], ["seeing a pattern before enough evidence exists"], ["domain depth", "evidence discipline"], ["detail-sensitivity"]),
  signal("systems-thinking", "sensemaking", "Systems Thinking", "Understands dependencies, incentives and second-order effects rather than isolated parts.", ["complex systems", "cross-functional work", "product architecture"], ["building a larger system than the problem needs"], ["simplification", "closing ability"], ["execution-speed"]),
  signal("analytical-decomposition", "sensemaking", "Analytical Decomposition", "Breaks an unclear problem into testable, workable parts.", ["debugging", "planning", "investigation"], ["fragmenting a problem that needs a whole-system view"], ["systems thinking", "decision velocity"]),
  signal("abstraction", "sensemaking", "Abstraction", "Extracts a reusable principle from specific examples.", ["model building", "strategy", "teaching"], ["moving away from lived detail too early"], ["concrete examples", "domain depth"]),
  signal("detail-sensitivity", "sensemaking", "Detail Sensitivity", "Detects small mismatches, omissions and quality differences that others may pass over.", ["quality assurance", "craft", "review"], ["spending disproportionate time on low-impact details"], ["prioritization", "stopping rules"], ["execution-speed"]),
  signal("simplification", "sensemaking", "Simplification", "Finds the shortest accurate explanation or path through complexity.", ["communication", "product design", "decision support"], ["removing nuance that actually matters"], ["domain depth", "listening depth"]),
  signal("perspective-shifting", "sensemaking", "Perspective Shifting", "Can deliberately inspect the same situation from different positions.", ["negotiation", "design", "conflict"], ["carrying too many perspectives to decide"], ["decision velocity", "boundaries"]),
  signal("ambiguity-sensemaking", "sensemaking", "Sensemaking Under Ambiguity", "Builds a usable mental model while important information is still missing.", ["new territory", "strategy", "change"], ["mistaking a provisional model for settled truth"], ["experimentation", "risk detection"]),

  signal("curiosity-drive", "exploration", "Curiosity Drive", "Moves toward unanswered questions without needing an immediate external reward.", ["discovery", "research", "new domains"], ["opening more loops than can be closed"], ["curation", "stopping rules"], ["closing-ability"]),
  signal("rapid-learning", "exploration", "Rapid Learning", "Becomes usefully oriented in unfamiliar territory with relatively few anchors.", ["new tools", "career changes", "cross-domain work"], ["moving on before knowledge becomes durable"], ["repetition", "domain depth"]),
  signal("depth-seeking", "exploration", "Depth Seeking", "Keeps investigating until the mechanism and important nuance make sense.", ["research", "expert work", "complex decisions"], ["research continuing after it can change the decision"], ["decision velocity", "time boxes"], ["execution-speed"]),
  signal("cross-domain-transfer", "exploration", "Cross-domain Transfer", "Carries a useful principle from one field into another without copying its surface form.", ["innovation", "teaching", "bridge work"], ["forcing an analogy beyond where it holds"], ["domain depth", "experimentation"]),
  signal("experimentation", "exploration", "Experimentation", "Learns by testing a bounded version and observing what happens.", ["uncertainty", "product development", "behavior change"], ["running tests without extracting learning"], ["measurement", "process discipline"]),
  signal("question-quality", "exploration", "Question Quality", "Changes the quality of inquiry by asking what is missing, assumed or actually at stake.", ["discovery", "coaching", "strategy"], ["using questions to postpone a necessary decision"], ["listening depth", "decision velocity"]),

  signal("idea-generation", "creation", "Idea Generation", "Produces multiple plausible directions, concepts or solutions quickly.", ["0→1 work", "brainstorming", "problem solving"], ["too many live directions"], ["curation", "closing ability"], ["closing-ability"]),
  signal("creative-recombination", "creation", "Creative Recombination", "Turns existing pieces into a configuration that creates new value.", ["innovation", "product design", "storytelling"], ["novelty without a real need"], ["human understanding", "outcome evidence"]),
  signal("reframing", "creation", "Reframing", "Changes the frame so a stuck problem becomes workable in a different way.", ["strategy", "conflict", "communication"], ["reframing away an uncomfortable fact"], ["evidence", "listening depth"]),
  signal("possibility-detection", "creation", "Possibility Detection", "Sees viable openings and future versions before they are obvious.", ["opportunity discovery", "product work", "partnerships"], ["scope expansion and opportunity overload"], ["curation", "risk detection"], ["process-discipline"]),
  signal("narrative-thinking", "creation", "Narrative Thinking", "Organizes facts and events into meaning, sequence and memorable human context.", ["communication", "positioning", "change"], ["favoring a compelling story over contradictory evidence"], ["evidence discipline", "precision"]),
  signal("worldbuilding", "creation", "Worldbuilding", "Imagines a coherent environment in which many elements reinforce a larger experience.", ["experience design", "brand systems", "fiction"], ["designing an ecosystem before the first useful part"], ["operationalization", "stopping rules"]),
  signal("taste-curation", "creation", "Taste / Curation", "Selects what deserves attention and rejects merely adequate or interchangeable options.", ["creative direction", "editing", "product quality"], ["perfectionism or unexplained preference"], ["clear criteria", "shipping cadence"]),

  signal("human-pattern-recognition", "human-understanding", "Human Pattern Recognition", "Notices recurring behavior, motivation and group dynamics without treating people as types.", ["teams", "discovery", "relationships"], ["inferring more than the person actually expressed"], ["listening depth", "evidence discipline"]),
  signal("empathic-perspective", "human-understanding", "Empathic Perspective Taking", "Can model how a situation may feel or look from another person's position.", ["design", "support", "conflict"], ["absorbing responsibility for every perspective"], ["boundaries", "decision velocity"]),
  signal("needs-detection", "human-understanding", "Needs Detection", "Distinguishes the stated request from the underlying need that would make the situation better.", ["advice", "product discovery", "care"], ["solving an inferred need without checking it"], ["clarifying questions", "consent"]),
  signal("trust-building", "human-understanding", "Trust Building", "Creates enough safety, reliability and respect for honest exchange.", ["advising", "leadership", "relationships"], ["becoming the default container for too much"], ["boundaries", "relationship maintenance"]),
  signal("listening-depth", "human-understanding", "Listening Depth", "Tracks content, omissions and meaning without rushing to perform an answer.", ["interviews", "conflict", "coaching"], ["delaying action when a decision is already clear"], ["synthesis", "decision velocity"]),
  signal("emotional-translation", "human-understanding", "Emotional Translation", "Makes emotional or interpersonal context understandable in practical language.", ["teams", "relationships", "storytelling"], ["speaking for someone who should speak for themselves"], ["permission", "communication clarity"]),

  signal("connecting-people", "social-leverage", "Connecting People", "Recognizes when an introduction could create mutual value and makes it usefully.", ["communities", "partnerships", "hiring"], ["introductions without consent or relevance"], ["network access", "follow-through"]),
  signal("relationship-maintenance", "social-leverage", "Relationship Maintenance", "Keeps useful human connections alive through dependable attention over time.", ["communities", "partnerships", "long projects"], ["maintaining relationships from obligation"], ["boundaries", "systems"]),
  signal("communication-clarity", "social-leverage", "Communication Clarity", "Makes the important point understandable to the actual audience.", ["teaching", "leadership", "sales"], ["compressing before people share the same context"], ["listening depth", "examples"]),
  signal("persuasion", "social-leverage", "Persuasion", "Helps another person reconsider a position through relevance, evidence and framing.", ["sales", "leadership", "advocacy"], ["optimizing for agreement rather than informed choice"], ["trust building", "evidence"]),
  signal("facilitation", "social-leverage", "Facilitation", "Creates a process in which a group can think, decide or coordinate better.", ["workshops", "teams", "conflict"], ["owning the group's process indefinitely"], ["delegation", "decision rights"]),
  signal("conflict-navigation", "social-leverage", "Conflict Navigation", "Keeps disagreement workable while surfacing what must actually be resolved.", ["teams", "partnerships", "negotiation"], ["mediating when a firm boundary is needed"], ["decision authority", "boundaries"]),
  signal("community-instinct", "social-leverage", "Community Instinct", "Notices what helps people feel connected, useful and able to participate.", ["communities", "events", "products"], ["designing for belonging without enough operational support"], ["relationship maintenance", "process discipline"]),

  signal("initiative", "execution", "Initiative", "Starts useful movement without waiting for perfect assignment or permission.", ["0→1 work", "broken processes", "opportunities"], ["taking ownership that belongs elsewhere"], ["alignment", "boundaries"]),
  signal("decision-velocity", "execution", "Decision Velocity", "Makes proportionate decisions with the available evidence and revises when needed.", ["ambiguity", "leadership", "time pressure"], ["moving before affected people or critical evidence are included"], ["risk detection", "feedback"]),
  signal("execution-speed", "execution", "Execution Speed", "Turns a clear direction into visible progress quickly.", ["iteration", "deadlines", "response"], ["quality debt or skipped learning"], ["precision", "review"], ["precision"]),
  signal("persistence", "execution", "Persistence", "Keeps applying effort through friction when the outcome still merits it.", ["long projects", "craft", "change"], ["continuing after the goal no longer deserves the cost"], ["review points", "curation"]),
  signal("operationalization", "execution", "Operationalization", "Turns an idea into roles, steps, tools and repeatable delivery.", ["products", "operations", "programmes"], ["process before learning what works"], ["experimentation", "simplification"]),
  signal("ownership", "execution", "Ownership", "Holds responsibility for an outcome rather than only a task boundary.", ["delivery", "leadership", "recovery"], ["carrying outcomes that require shared ownership"], ["delegation", "clear roles"]),
  signal("resourcefulness", "execution", "Resourcefulness", "Finds a workable path with the people, tools and constraints actually available.", ["constraints", "startups", "unexpected problems"], ["normalizing chronic under-resourcing"], ["access", "sustainable systems"]),
  signal("closing-ability", "execution", "Closing Ability", "Reduces remaining ambiguity and brings a piece of work to a usable finish.", ["shipping", "decisions", "handoffs"], ["closing before enough has been learned"], ["quality sensitivity", "feedback"], ["idea-generation"]),

  signal("precision", "precision", "Precision", "Produces accurate work where small errors materially matter.", ["engineering", "finance", "craft"], ["precision applied where approximation is sufficient"], ["prioritization", "automation"], ["execution-speed"]),
  signal("consistency", "precision", "Consistency", "Reproduces a dependable standard over time, not only in bursts.", ["operations", "practice", "service"], ["maintaining a standard after its purpose changes"], ["process improvement", "recovery"]),
  signal("quality-sensitivity", "precision", "Quality Sensitivity", "Recognizes the difference between technically complete and genuinely well resolved.", ["design", "editing", "service"], ["moving the finish line indefinitely"], ["definition of done", "time boxes"]),
  signal("risk-detection", "precision", "Risk Detection", "Sees failure modes, missing safeguards and consequences before they become incidents.", ["security", "planning", "quality"], ["making low-probability risks dominate every decision"], ["reversibility", "decision velocity"]),
  signal("process-discipline", "precision", "Process Discipline", "Uses repeatable checks and boundaries so quality does not depend on memory alone.", ["compliance", "operations", "engineering"], ["protecting the process after it stops serving the outcome"], ["continuous improvement", "simplification"]),

  signal("improvisation", "adaptability", "Improvisation", "Creates a workable response when the expected plan or resources disappear.", ["incidents", "live situations", "constraints"], ["relying on rescue instead of fixing the system"], ["process discipline", "recovery"]),
  signal("adaptability", "adaptability", "Adaptability", "Changes approach when the environment or evidence changes without losing the goal.", ["change", "new teams", "uncertain work"], ["changing direction so often that learning cannot compound"], ["stable principles", "reflection"]),
  signal("calm-under-pressure", "adaptability", "Calm Under Pressure", "Keeps enough cognitive and social capacity to act when stakes or pace rise.", ["incidents", "negotiation", "deadlines"], ["appearing fine while recovery is deferred"], ["recovery capacity", "support"]),
  signal("uncertainty-tolerance", "adaptability", "Uncertainty Tolerance", "Can keep moving while an answer remains provisional or unknowable.", ["innovation", "transition", "research"], ["under-specifying decisions that need clarity"], ["checkpoints", "risk detection"]),
  signal("recovery-capacity", "adaptability", "Recovery Capacity", "Returns to useful functioning after intense effort, change or setbacks.", ["long horizons", "high-pressure work", "competition"], ["treating recovery as repair for avoidable overload"], ["boundaries", "sustainable rhythm"]),

  signal("domain-depth", "leverage-assets", "Domain Depth", "Possesses usable, repeated knowledge in a field rather than surface familiarity.", ["specialist work", "judgment", "teaching"], ["assuming one domain's rules transfer unchanged"], ["cross-domain breadth", "communication"]),
  signal("cross-domain-breadth", "leverage-assets", "Cross-domain Breadth", "Has meaningful exposure to several fields, roles or worlds.", ["translation", "innovation", "coordination"], ["breadth without enough depth to be dependable"], ["domain depth", "curation"]),
  signal("network-access", "leverage-assets", "Network Access", "Can reach trusted people, communities or expertise relevant to a situation.", ["opportunities", "problem solving", "distribution"], ["confusing access with relationship or merit"], ["trust building", "connecting people"]),
  signal("cultural-language-access", "leverage-assets", "Cultural / Language Access", "Can participate meaningfully across languages, cultures or communities.", ["translation", "international work", "community"], ["speaking as an authority for a community"], ["listening", "humility"]),
  signal("audience-distribution", "leverage-assets", "Audience / Distribution", "Can reliably place a useful message or opportunity in front of relevant people.", ["publishing", "sales", "community"], ["optimizing reach before value or trust"], ["domain depth", "quality"]),
  signal("technical-leverage", "leverage-assets", "Tool / Technical Leverage", "Uses technology to extend speed, quality or what is possible at all.", ["automation", "creation", "analysis"], ["automating an unclear or harmful process"], ["process understanding", "human judgment"]),
] as const;

export const advantageSignalById = new Map(advantageSignals.map((item) => [item.id, item]));

export const advantageSignalDomainsCopy: Readonly<Record<AdvantageSignalDomain, { label: string; description: string }>> = {
  sensemaking: { label: "Sensemaking & Cognition", description: "How complexity becomes a usable mental model." },
  exploration: { label: "Exploration & Learning", description: "How unfamiliar territory becomes knowledge." },
  creation: { label: "Creation & Recombination", description: "How possibilities become distinct ideas and experiences." },
  "human-understanding": { label: "Human Understanding", description: "How people, needs and meaning enter the picture." },
  "social-leverage": { label: "Social Leverage", description: "How communication and relationships create movement." },
  execution: { label: "Execution & Agency", description: "How intention becomes action and completion." },
  precision: { label: "Precision & Reliability", description: "How dependable quality and safeguards are maintained." },
  adaptability: { label: "Adaptability & Pressure", description: "How useful action continues while conditions change." },
  "leverage-assets": { label: "Leverage Assets", description: "What experience, access and tools make possible." },
};
