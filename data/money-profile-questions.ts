import type {
  MoneyDimensionEffect,
  MoneyDimensionId,
  MoneyMeaningId,
  MoneyQuestion,
  MoneyQuestionOption,
  MoneyStressResponseId,
} from "@/types/money-profile";

const effect = (dimensionId: MoneyDimensionId, strength = 1, direction: "support" | "contradict" = "support"): MoneyDimensionEffect => ({ dimensionId, strength, direction });
const option = (
  id: string,
  label: string,
  config: {
    effects?: readonly MoneyDimensionEffect[];
    meanings?: readonly MoneyMeaningId[];
    stressResponses?: readonly MoneyStressResponseId[];
    frictions?: readonly string[];
    tags?: readonly string[];
  } = {},
): MoneyQuestionOption => ({ id, label, ...config });

export const moneyQuestions: readonly MoneyQuestion[] = [
  {
    id: "m1", chapter: 1, title: "Complete the sentence", prompt: "Having enough money would mainly give me…", instruction: "Pick up to three.", type: "multi", maxSelections: 3, evidenceClass: "self-perception", options: [
      option("security", "Security.", { effects: [effect("security-orientation", 2)], meanings: ["safety"] }),
      option("freedom", "Freedom.", { effects: [effect("freedom-orientation", 2)], meanings: ["freedom"] }),
      option("choices", "More choices.", { effects: [effect("freedom-orientation")], meanings: ["choice", "possibility"] }),
      option("peace", "Peace of mind.", { effects: [effect("security-orientation")], meanings: ["peace"] }),
      option("experiences", "More experiences.", { effects: [effect("present-enjoyment")], meanings: ["enjoyment"] }),
      option("care", "The ability to care for people I love.", { meanings: ["care-for-others", "responsibility"] }),
      option("doing-well", "Proof that I'm doing well.", { effects: [effect("status-symbolism")], meanings: ["success", "status"] }),
      option("control", "Control over my life.", { effects: [effect("control-need")], meanings: ["control"] }),
      option("build", "The ability to build something.", { effects: [effect("future-orientation")], meanings: ["possibility"] }),
      option("comfort", "Comfort.", { effects: [effect("present-enjoyment")], meanings: ["enjoyment", "peace"] }),
      option("not-sure", "I'm honestly not sure."),
    ],
  },
  {
    id: "m2", chapter: 1, title: "Money disappearing", prompt: "Which loss would feel worst?", type: "single", evidenceClass: "scenario-evidence", options: [
      option("buffer", "Losing my safety buffer.", { effects: [effect("security-orientation", 2)], meanings: ["safety"] }),
      option("choice", "Losing the freedom to make my own choices.", { effects: [effect("freedom-orientation", 2)], meanings: ["freedom", "choice"] }),
      option("experiences", "Having to give up experiences I care about.", { effects: [effect("present-enjoyment", 2)], meanings: ["enjoyment"] }),
      option("behind", "Feeling that I'm falling behind.", { effects: [effect("status-symbolism")], meanings: ["success", "belonging"] }),
      option("obligations", "Not being able to meet my obligations.", { effects: [effect("future-orientation")], meanings: ["responsibility"] }),
      option("depend", "Having to depend financially on someone else.", { effects: [effect("freedom-orientation", 2)], meanings: ["freedom"] }),
    ],
  },
  {
    id: "m3", chapter: 1, title: "What feels rich?", prompt: "Which version of ‘having enough’ feels most appealing?", type: "single", evidenceClass: "scenario-evidence", options: [
      option("stable", "Knowing unexpected costs won't destabilize me.", { effects: [effect("security-orientation", 2)], meanings: ["safety", "peace"] }),
      option("say-no", "Being able to say no to work or situations I don't want.", { effects: [effect("freedom-orientation", 2)], meanings: ["freedom", "choice"] }),
      option("enjoy", "Being able to enjoy life without checking every expense.", { effects: [effect("present-enjoyment"), effect("control-need", 1, "contradict")], meanings: ["enjoyment", "peace"] }),
      option("grow", "Watching something meaningful grow over time.", { effects: [effect("future-orientation", 2)], meanings: ["possibility"] }),
      option("experiences", "Owning fewer things but having more experiences.", { effects: [effect("present-enjoyment")], meanings: ["enjoyment"] }),
      option("quality", "Having high-quality things I genuinely value.", { effects: [effect("status-symbolism")], meanings: ["enjoyment"] }),
      option("not-think", "Not having to think about money very often.", { effects: [effect("financial-avoidance")], meanings: ["peace"] }),
    ],
  },
  {
    id: "m4", chapter: 1, title: "Money emotion", prompt: "When you think about money in general, which feeling appears most easily?", instruction: "Pick up to two. This is context, not a diagnosis.", type: "multi", maxSelections: 2, evidenceClass: "self-perception", options: [
      option("calm", "Calm", { effects: [effect("money-stress-reactivity", 1, "contradict")], meanings: ["peace"] }),
      option("possibility", "Possibility", { effects: [effect("financial-self-efficacy")], meanings: ["possibility"] }),
      option("motivation", "Motivation", { effects: [effect("future-orientation"), effect("financial-self-efficacy")], meanings: ["success"] }),
      option("responsibility", "Responsibility", { meanings: ["responsibility"] }),
      option("pressure", "Pressure", { effects: [effect("money-stress-reactivity", 2)] }),
      option("uncertainty", "Uncertainty", { effects: [effect("money-stress-reactivity"), effect("risk-comfort", 1, "contradict")] }),
      option("guilt", "Guilt", { frictions: ["spending-guilt"] }),
      option("excitement", "Excitement", { effects: [effect("present-enjoyment")] }),
      option("control", "Control", { effects: [effect("control-need")], meanings: ["control"] }),
      option("distance", "Distance / I'd rather not think about it.", { effects: [effect("financial-avoidance", 2)] }),
    ],
  },
  {
    id: "m5", chapter: 1, title: "Enough", prompt: "Which statement is closer?", type: "single", evidenceClass: "self-perception", options: [
      option("safer", "Having more money usually means feeling safer.", { effects: [effect("security-orientation", 2)], meanings: ["safety"] }),
      option("options", "Having more money usually means having more options.", { effects: [effect("freedom-orientation", 2)], meanings: ["freedom", "choice"] }),
      option("now", "Having more money mostly matters because of what I can do with it now.", { effects: [effect("present-enjoyment", 2)], meanings: ["enjoyment"] }),
      option("enough", "Beyond a certain point, more money doesn't change much for me.", { effects: [effect("status-symbolism", 1, "contradict")] }),
      option("unknown", "I don't really know what ‘enough’ would mean for me."),
    ],
  },
  {
    id: "m6", chapter: 2, title: "Unexpected €500", prompt: "Imagine €500 arrives unexpectedly and it isn't already needed for something. What are you most likely to do first?", instruction: "A hypothetical scenario—not a question about your actual finances.", type: "single", evidenceClass: "scenario-evidence", options: [
      option("protect", "Move most of it somewhere I won't casually spend it.", { effects: [effect("security-orientation"), effect("future-orientation")] }),
      option("split", "Use some now and save some.", { effects: [effect("present-enjoyment"), effect("future-orientation")] }),
      option("wanted", "Think of something I've wanted for a while.", { effects: [effect("present-enjoyment")] }),
      option("wait", "Leave it untouched until I decide deliberately.", { effects: [effect("control-need"), effect("spending-impulsivity", 1, "contradict")] }),
      option("goal", "Put it toward a longer-term goal.", { effects: [effect("future-orientation", 2)] }),
      option("depends", "It depends completely on my current situation.", { tags: ["context-dependent"] }),
    ],
  },
  {
    id: "m7", chapter: 2, title: "Unplanned purchase", prompt: "You see something you really want but hadn't planned to buy. What usually happens?", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("buy", "I buy it if I can technically afford it.", { effects: [effect("spending-impulsivity", 2), effect("present-enjoyment")] }),
      option("wait", "I wait and see whether I still want it later.", { effects: [effect("spending-impulsivity", 2, "contradict")] }),
      option("check-purpose", "I check what else that money was meant for.", { effects: [effect("planning-structure"), effect("future-orientation")] }),
      option("talk-out", "I often talk myself out of it even when I could comfortably buy it.", { effects: [effect("security-orientation"), effect("present-enjoyment", 1, "contradict")], frictions: ["spending-guilt"] }),
      option("type", "It depends on whether it's an experience or an object.", { tags: ["context-dependent"] }),
    ],
  },
  {
    id: "m8", chapter: 2, title: "Regret", prompt: "Which happens more often?", type: "single", evidenceClass: "repeated-friction", options: [
      option("spending", "I regret spending money I could have kept.", { effects: [effect("security-orientation")], frictions: ["purchase-regret"] }),
      option("not-enjoying", "I regret not enjoying money when I had the chance.", { effects: [effect("present-enjoyment")], frictions: ["over-restriction"] }),
      option("both", "Both, depending on the situation.", { frictions: ["purchase-regret", "over-restriction"], tags: ["context-dependent"] }),
      option("neither", "Neither happens often.", { tags: ["low-regret"] }),
    ],
  },
  {
    id: "m9", chapter: 2, title: "Experiences vs possessions", prompt: "If both cost the same, which usually feels easier to justify?", type: "single", evidenceClass: "scenario-evidence", options: [
      option("experience", "A memorable experience.", { effects: [effect("present-enjoyment")], meanings: ["enjoyment"] }),
      option("useful", "Something useful that lasts.", { effects: [effect("future-orientation")] }),
      option("quality", "Something beautiful or high quality I want to own.", { effects: [effect("status-symbolism")], meanings: ["enjoyment"] }),
      option("save", "Saving the money.", { effects: [effect("security-orientation"), effect("future-orientation")] }),
      option("context", "Completely context-dependent.", { tags: ["context-dependent"] }),
    ],
  },
  {
    id: "m10", chapter: 2, title: "Fun money", prompt: "Money spent purely for enjoyment usually feels…", type: "single", evidenceClass: "self-perception", options: [
      option("easy", "Easy and worthwhile.", { effects: [effect("present-enjoyment", 2)], meanings: ["enjoyment"] }),
      option("planned", "Good if I planned for it.", { effects: [effect("present-enjoyment"), effect("planning-structure")] }),
      option("questionable", "Good in the moment, questionable afterward.", { effects: [effect("present-enjoyment"), effect("spending-impulsivity")], frictions: ["purchase-regret"] }),
      option("hard", "Hard to justify even when I can afford it.", { effects: [effect("security-orientation")], frictions: ["spending-guilt", "over-restriction"] }),
      option("security", "Highly dependent on how financially secure I feel.", { effects: [effect("security-orientation"), effect("money-stress-reactivity")], tags: ["context-dependent"] }),
    ],
  },
  {
    id: "m11", chapter: 2, title: "Small purchases", prompt: "Which sounds most like you?", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("add-up", "Small purchases barely register individually, but they can add up.", { effects: [effect("spending-impulsivity")], frictions: ["small-spending-adds-up"] }),
      option("notice", "I notice small purchases quickly.", { effects: [effect("control-need")] }),
      option("large", "I think much more about large purchases than small ones.", { effects: [effect("planning-structure")] }),
      option("track", "I track almost everything.", { effects: [effect("control-need", 2), effect("planning-structure")] }),
      option("unknown", "I don't really know where smaller amounts go.", { effects: [effect("financial-avoidance")], frictions: ["unclear-overview"] }),
    ],
  },
  {
    id: "m12", chapter: 2, title: "Spending for others", prompt: "Spending money on other people is usually…", type: "single", evidenceClass: "self-perception", options: [
      option("easier", "Easier than spending it on myself.", { meanings: ["care-for-others"], frictions: ["self-spending-guilt"] }),
      option("same", "About the same.", { meanings: ["care-for-others", "enjoyment"] }),
      option("harder", "Harder than spending it on myself."),
      option("purpose", "One of the main things money is for.", { meanings: ["care-for-others", "responsibility"] }),
      option("context", "Very context-dependent.", { tags: ["context-dependent"] }),
    ],
  },
  {
    id: "m13", chapter: 3, title: "Looking at your finances", prompt: "How does checking your financial situation usually feel?", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("reassuring", "Reassuring.", { effects: [effect("control-need"), effect("financial-self-efficacy")] }),
      option("neutral", "Useful but emotionally neutral.", { effects: [effect("planning-structure")] }),
      option("uncomfortable", "Slightly uncomfortable, but I do it.", { effects: [effect("financial-avoidance"), effect("financial-self-efficacy")] }),
      option("postpone", "Stressful enough that I sometimes postpone it.", { effects: [effect("financial-avoidance", 2), effect("money-stress-reactivity")], frictions: ["avoidance"] }),
      option("frequent", "I tend to check very frequently.", { effects: [effect("control-need", 2)], frictions: ["control-overload"] }),
      option("forced", "I mostly check when something forces me to.", { effects: [effect("financial-avoidance", 2)], frictions: ["avoidance"] }),
    ],
  },
  {
    id: "m14", chapter: 3, title: "Upcoming bills", prompt: "You know several bills or obligations are coming. What do you naturally do?", type: "single", evidenceClass: "scenario-evidence", options: [
      option("separate", "Make sure the money is separated or available beforehand.", { effects: [effect("planning-structure", 2), effect("security-orientation")] }),
      option("mental", "Keep a mental overview.", { effects: [effect("planning-structure")] }),
      option("track", "Write or track them somewhere.", { effects: [effect("planning-structure", 2)] }),
      option("arrives", "Deal with each one when it arrives.", { effects: [effect("future-orientation", 1, "contradict")] }),
      option("avoid", "Sometimes avoid thinking about them until necessary.", { effects: [effect("financial-avoidance", 2)], frictions: ["avoidance"] }),
    ],
  },
  {
    id: "m15", chapter: 3, title: "Money system", prompt: "Which best describes your current style?", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("clear", "I like clear categories, pots or budgets.", { effects: [effect("planning-structure", 2), effect("control-need")] }),
      option("loose", "I keep a loose structure and adjust.", { effects: [effect("planning-structure"), effect("freedom-orientation")] }),
      option("informal", "I mostly know what's going on without a formal system.", { effects: [effect("planning-structure")] }),
      option("drops", "I've tried systems but rarely keep them going.", { effects: [effect("planning-structure"), effect("financial-avoidance")], frictions: ["system-drops", "consistency-gap"] }),
      option("none", "I don't currently have much of a system.", { effects: [effect("planning-structure", 1, "contradict")], frictions: ["unclear-overview"] }),
    ],
  },
  {
    id: "m16", chapter: 3, title: "Surprise expense", prompt: "An unexpected necessary expense appears. Your first reaction is closest to…", type: "single", evidenceClass: "scenario-evidence", options: [
      option("pot", "Okay, which pot or buffer covers this?", { effects: [effect("security-orientation"), effect("planning-structure", 2)] }),
      option("change", "What do I need to change this month?", { effects: [effect("planning-structure"), effect("financial-self-efficacy")] }),
      option("uncertainty", "This is exactly why I hate financial uncertainty.", { effects: [effect("control-need"), effect("money-stress-reactivity")], frictions: ["unexpected-costs"] }),
      option("figure", "I'll figure it out somehow.", { effects: [effect("financial-self-efficacy"), effect("risk-comfort")] }),
      option("distance", "I don't want to deal with this right now.", { effects: [effect("financial-avoidance", 2), effect("money-stress-reactivity")], frictions: ["avoidance", "unexpected-costs"] }),
    ],
  },
  {
    id: "m17", chapter: 3, title: "Control", prompt: "Which feels more uncomfortable?", type: "single", evidenceClass: "scenario-evidence", options: [
      option("not-knowing", "Not knowing exactly where my money is going.", { effects: [effect("control-need", 2)] }),
      option("restricted", "Knowing exactly where it is going but feeling too restricted by the plan.", { effects: [effect("freedom-orientation", 2), effect("control-need", 1, "contradict")], frictions: ["system-overload"] }),
    ],
  },
  {
    id: "m18", chapter: 3, title: "Budget reaction", prompt: "The word ‘budget’ feels most like…", type: "single", evidenceClass: "self-perception", options: [
      option("freedom", "Freedom because I know what I can safely use.", { effects: [effect("freedom-orientation"), effect("planning-structure")], meanings: ["freedom"] }),
      option("safety", "Safety because things are accounted for.", { effects: [effect("security-orientation"), effect("planning-structure")], meanings: ["safety"] }),
      option("restriction", "Restriction.", { effects: [effect("freedom-orientation"), effect("planning-structure", 1, "contradict")], frictions: ["system-overload"] }),
      option("difficult", "Something useful in theory but difficult to maintain.", { effects: [effect("planning-structure")], frictions: ["system-drops", "consistency-gap"] }),
      option("avoid", "Something I mostly avoid.", { effects: [effect("financial-avoidance", 2)], frictions: ["avoidance"] }),
      option("neutral", "Just a neutral tool.", { effects: [effect("planning-structure")] }),
    ],
  },
  {
    id: "m19", chapter: 3, title: "Bad financial news", prompt: "You suspect there may be a financial problem. What are you most likely to do?", type: "single", evidenceClass: "scenario-evidence", options: [
      option("immediately", "Check immediately.", { effects: [effect("control-need")], stressResponses: ["control"] }),
      option("time", "Set aside time to understand it properly.", { effects: [effect("planning-structure"), effect("financial-self-efficacy")], stressResponses: ["act"] }),
      option("ask", "Ask someone or look for information.", { effects: [effect("financial-self-efficacy")], stressResponses: ["act"], tags: ["help-seeking"] }),
      option("delay", "Put it off for a while because knowing feels stressful.", { effects: [effect("financial-avoidance", 2), effect("money-stress-reactivity")], stressResponses: ["avoid"], frictions: ["avoidance"] }),
      option("worst", "Start mentally preparing for the worst before I even know the facts.", { effects: [effect("security-orientation"), effect("money-stress-reactivity", 2)], stressResponses: ["control"] }),
    ],
  },
  {
    id: "m20", chapter: 4, title: "Future you", prompt: "When making a money decision, how present is ‘future you’?", type: "single", evidenceClass: "self-perception", options: [
      option("very", "Very present. I automatically think ahead.", { effects: [effect("future-orientation", 2)] }),
      option("large", "Present for larger decisions, not everyday ones.", { effects: [effect("future-orientation")] }),
      option("should", "I know I should think ahead more than I actually do.", { effects: [effect("future-orientation")], frictions: ["future-intention", "consistency-gap"] }),
      option("now", "I mostly optimize for what matters now.", { effects: [effect("present-enjoyment", 2), effect("future-orientation", 1, "contradict")] }),
      option("stress", "It depends heavily on how stressed I am.", { effects: [effect("money-stress-reactivity")], tags: ["context-dependent"] }),
    ],
  },
  {
    id: "m21", chapter: 4, title: "Saving without a purpose", prompt: "Saving money without a specific goal feels…", type: "single", evidenceClass: "self-perception", options: [
      option("satisfying", "Satisfying by itself.", { effects: [effect("security-orientation")], meanings: ["safety"] }),
      option("options", "Useful because it creates options.", { effects: [effect("freedom-orientation"), effect("future-orientation")], meanings: ["freedom", "choice"] }),
      option("reason", "Difficult; I need a concrete reason.", { effects: [effect("future-orientation")], frictions: ["abstract-future"] }),
      option("now", "Like money that could be improving life now.", { effects: [effect("present-enjoyment", 2)] }),
      option("excessive", "Reassuring but sometimes excessive.", { effects: [effect("security-orientation", 2)], frictions: ["over-restriction"] }),
    ],
  },
  {
    id: "m22", chapter: 4, title: "Long-term goal", prompt: "A financial goal several years away tends to…", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("motivate", "Motivate me.", { effects: [effect("future-orientation", 2), effect("financial-self-efficacy")] }),
      option("progress", "Work if I can see progress.", { effects: [effect("future-orientation"), effect("planning-structure")], frictions: ["needs-visible-progress"] }),
      option("abstract", "Feel too abstract to influence everyday behavior.", { effects: [effect("future-orientation")], frictions: ["abstract-future", "goal-loses-relevance"] }),
      option("near", "Get pushed aside by nearer needs or wants.", { effects: [effect("present-enjoyment")], frictions: ["goal-loses-relevance", "consistency-gap"] }),
      option("anxious", "Make me anxious because it feels large.", { effects: [effect("money-stress-reactivity")], frictions: ["overwhelm", "abstract-future"] }),
    ],
  },
  {
    id: "m23", chapter: 4, title: "Automatic saving", prompt: "If money automatically moved toward a goal before you could spend it, that would feel…", type: "single", evidenceClass: "scenario-evidence", options: [
      option("ideal", "Ideal.", { effects: [effect("planning-structure"), effect("future-orientation")], tags: ["automation-fit"] }),
      option("flexible", "Useful as long as I retain flexibility.", { effects: [effect("freedom-orientation"), effect("future-orientation")], tags: ["automation-fit"] }),
      option("restrictive", "Restrictive.", { effects: [effect("freedom-orientation")], tags: ["automation-bad-fit"] }),
      option("relieving", "Relieving because I wouldn't have to decide repeatedly.", { effects: [effect("planning-structure")], tags: ["automation-fit", "decision-fatigue"] }),
      option("available", "Risky because I prefer keeping everything available.", { effects: [effect("security-orientation")], tags: ["automation-bad-fit", "limited-flexibility"] }),
    ],
  },
  {
    id: "m24", chapter: 4, title: "Today vs tomorrow", prompt: "Which mistake would bother you more?", instruction: "Use this forced choice as tension evidence—not a moral ranking.", type: "single", evidenceClass: "scenario-evidence", options: [
      option("today", "Sacrificing too much of today for a future that isn't guaranteed.", { effects: [effect("present-enjoyment"), effect("risk-comfort")] }),
      option("future", "Sacrificing too much of the future for things I wanted today.", { effects: [effect("future-orientation"), effect("security-orientation")] }),
    ],
  },
  {
    id: "m25", chapter: 4, title: "Financial goals", prompt: "Which kind of goal motivates you most?", type: "single", evidenceClass: "self-perception", options: [
      option("buffer", "A safety buffer.", { effects: [effect("security-orientation")], meanings: ["safety"] }),
      option("obligation", "Freedom from a specific obligation.", { effects: [effect("freedom-orientation")], meanings: ["freedom"] }),
      option("experience", "A major experience.", { effects: [effect("present-enjoyment")], meanings: ["enjoyment"] }),
      option("build", "Building something over time.", { effects: [effect("future-orientation")], meanings: ["possibility"] }),
      option("meaningful", "Buying something meaningful.", { effects: [effect("status-symbolism")], meanings: ["enjoyment"] }),
      option("options", "More general independence or options.", { effects: [effect("freedom-orientation")], meanings: ["choice"] }),
      option("systems", "Goals don't motivate me much; systems or routines work better.", { effects: [effect("planning-structure")], tags: ["goals-not-motivating"] }),
    ],
  },
  {
    id: "m26", chapter: 5, title: "First stress response", prompt: "When money feels tight or uncertain, what tends to happen first?", instruction: "This is about a shift under pressure—not who you are all the time.", type: "single", evidenceClass: "stress-evidence", options: [
      option("check", "I check everything more often.", { effects: [effect("control-need"), effect("money-stress-reactivity")], stressResponses: ["control"], frictions: ["control-overload"] }),
      option("cut", "I cut spending quickly.", { effects: [effect("security-orientation"), effect("money-stress-reactivity")], stressResponses: ["restrict"], frictions: ["over-restriction"] }),
      option("avoid", "I avoid looking because it increases the stress.", { effects: [effect("financial-avoidance"), effect("money-stress-reactivity")], stressResponses: ["avoid"], frictions: ["avoidance"] }),
      option("solve", "I start solving the problem immediately.", { effects: [effect("financial-self-efficacy"), effect("money-stress-reactivity")], stressResponses: ["act"] }),
      option("freeze", "I freeze and struggle to decide.", { effects: [effect("money-stress-reactivity", 2)], stressResponses: ["freeze"], frictions: ["freeze", "overwhelm"] }),
      option("spend", "I sometimes spend for short-term relief.", { effects: [effect("spending-impulsivity"), effect("money-stress-reactivity")], stressResponses: ["soothe-spend"], frictions: ["stress-spending"] }),
      option("help", "I reach out for information or help.", { effects: [effect("financial-self-efficacy"), effect("money-stress-reactivity")], stressResponses: ["act"], tags: ["help-seeking"] }),
      option("depends", "It depends.", { effects: [effect("money-stress-reactivity")], tags: ["context-dependent"] }),
    ],
  },
  {
    id: "m27", chapter: 5, title: "Control escalation", prompt: "Under financial stress, do you become more controlling about money?", type: "scale", evidenceClass: "stress-evidence", options: [
      option("much", "Much more", { effects: [effect("control-need", 2), effect("money-stress-reactivity")], stressResponses: ["control"], frictions: ["control-overload"] }),
      option("little", "A little more", { effects: [effect("control-need"), effect("money-stress-reactivity")], stressResponses: ["control"] }),
      option("same", "No real change", { effects: [effect("money-stress-reactivity", 1, "contradict")] }),
      option("less", "Less organized", { effects: [effect("planning-structure", 1, "contradict"), effect("money-stress-reactivity")], stressResponses: ["freeze"] }),
      option("unsure", "Not sure"),
    ],
  },
  {
    id: "m28", chapter: 5, title: "Avoidance escalation", prompt: "Have you ever delayed opening, checking or dealing with something financial because you expected it to feel bad?", type: "scale", evidenceClass: "behavioral-evidence", options: [
      option("repeatedly", "Repeatedly", { effects: [effect("financial-avoidance", 3), effect("money-stress-reactivity")], stressResponses: ["avoid"], frictions: ["avoidance"] }),
      option("sometimes", "Sometimes", { effects: [effect("financial-avoidance", 2)], stressResponses: ["avoid"], frictions: ["avoidance"] }),
      option("rarely", "Rarely", { effects: [effect("financial-avoidance", 1)] }),
      option("never", "Never / almost never", { effects: [effect("financial-avoidance", 2, "contradict")] }),
    ],
  },
  {
    id: "m29", chapter: 5, title: "Restriction", prompt: "When money feels uncertain, how likely are you to cut even enjoyable or useful spending?", type: "scale", evidenceClass: "stress-evidence", options: [
      option("very", "Very likely", { effects: [effect("security-orientation"), effect("money-stress-reactivity")], stressResponses: ["restrict"], frictions: ["over-restriction"] }),
      option("somewhat", "Somewhat likely", { effects: [effect("money-stress-reactivity")], stressResponses: ["restrict"] }),
      option("necessary", "Only if necessary", { effects: [effect("financial-self-efficacy")] }),
      option("not", "Not particularly likely", { effects: [effect("present-enjoyment")], stressResponses: ["restrict"] }),
    ],
  },
  {
    id: "m30", chapter: 5, title: "Stress spending", prompt: "Have you ever spent money partly because buying or doing something made a stressful moment feel better?", type: "scale", evidenceClass: "stress-evidence", options: [
      option("repeatedly", "Repeatedly", { effects: [effect("spending-impulsivity", 2), effect("money-stress-reactivity")], stressResponses: ["soothe-spend"], frictions: ["stress-spending", "purchase-regret"] }),
      option("sometimes", "Sometimes", { effects: [effect("spending-impulsivity"), effect("money-stress-reactivity")], stressResponses: ["soothe-spend"], frictions: ["stress-spending"] }),
      option("rarely", "Rarely", { effects: [effect("spending-impulsivity", 1)] }),
      option("never", "Never / not that I've noticed", { effects: [effect("spending-impulsivity", 2, "contradict")] }),
    ],
  },
  {
    id: "m31", chapter: 5, title: "Freeze", prompt: "When several financial decisions pile up at once…", type: "single", evidenceClass: "stress-evidence", options: [
      option("prioritize", "I prioritize them and work through them.", { effects: [effect("planning-structure"), effect("financial-self-efficacy")], stressResponses: ["act"] }),
      option("easiest", "I handle the easiest one first.", { effects: [effect("financial-self-efficacy")], stressResponses: ["act"] }),
      option("overwhelmed", "I can become overwhelmed and postpone several.", { effects: [effect("financial-avoidance"), effect("money-stress-reactivity")], stressResponses: ["freeze", "avoid"], frictions: ["freeze", "overwhelm"] }),
      option("sequence", "I want someone or something to give me a clear sequence.", { effects: [effect("planning-structure"), effect("financial-self-efficacy", 1, "contradict")], stressResponses: ["freeze"], frictions: ["unclear-next-step"] }),
      option("focus", "I become extremely focused and handle everything immediately.", { effects: [effect("control-need"), effect("financial-self-efficacy")], stressResponses: ["act", "control"], frictions: ["control-overload"] }),
    ],
  },
  {
    id: "m32", chapter: 5, title: "Recovery", prompt: "What most often helps you feel financially ‘back in control’?", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("numbers", "Seeing the actual numbers.", { effects: [effect("control-need"), effect("planning-structure")], tags: ["recovery-overview"] }),
      option("plan", "Having a concrete plan.", { effects: [effect("planning-structure", 2)], tags: ["recovery-plan"] }),
      option("covered", "Knowing upcoming obligations are covered.", { effects: [effect("security-orientation")], tags: ["recovery-safety"] }),
      option("buffer", "Having more available cash or buffer.", { effects: [effect("security-orientation", 2)], tags: ["recovery-safety"] }),
      option("talk", "Talking it through with someone.", { tags: ["help-seeking", "recovery-help"] }),
      option("action", "Taking one small action.", { effects: [effect("financial-self-efficacy")], tags: ["recovery-small-action"] }),
      option("time", "Time or emotional distance.", { effects: [effect("financial-avoidance")], tags: ["recovery-distance"] }),
    ],
  },
  {
    id: "m33", chapter: 6, title: "Month-end pattern", prompt: "Which pattern has happened more than once?", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("more", "I had more left than expected.", { effects: [effect("security-orientation"), effect("future-orientation")] }),
      option("expected", "I roughly landed where I expected.", { effects: [effect("planning-structure"), effect("financial-self-efficacy")] }),
      option("small", "Small spending added up more than expected.", { effects: [effect("spending-impulsivity")], frictions: ["small-spending-adds-up", "consistency-gap"] }),
      option("big", "One or two bigger decisions changed the month.", { effects: [effect("spending-impulsivity")], frictions: ["large-decision-impact"] }),
      option("late", "I avoided checking until late.", { effects: [effect("financial-avoidance", 2)], frictions: ["avoidance"] }),
      option("varies", "My situation varies too much for a typical month.", { tags: ["context-dependent", "variable-situation"] }),
    ],
  },
  {
    id: "m34", chapter: 6, title: "Plans surviving reality", prompt: "When you make a financial plan, what usually happens?", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("closely", "I follow it closely.", { effects: [effect("planning-structure", 2), effect("control-need")] }),
      option("flex", "I follow the important parts and flex the rest.", { effects: [effect("planning-structure", 2), effect("freedom-orientation")] }),
      option("unexpected", "It works until something unexpected happens.", { effects: [effect("planning-structure"), effect("money-stress-reactivity")], frictions: ["unexpected-costs", "system-drops"] }),
      option("stop", "I start with good intentions but stop tracking it.", { effects: [effect("planning-structure"), effect("financial-avoidance")], frictions: ["system-drops", "consistency-gap"] }),
      option("rarely", "I rarely make explicit plans.", { effects: [effect("planning-structure", 2, "contradict")] }),
    ],
  },
  {
    id: "m35", chapter: 6, title: "Purchase pause", prompt: "When you want something unplanned, how often do you still want it 24 hours later?", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("always", "Almost always.", { tags: ["stable-desire"] }),
      option("often", "Often.", { tags: ["stable-desire"] }),
      option("half", "About half the time.", { tags: ["desire-sometimes-fades"] }),
      option("less", "Often much less.", { effects: [effect("spending-impulsivity")], tags: ["desire-fades"] }),
      option("unknown", "I've never really noticed."),
    ],
  },
  {
    id: "m36", chapter: 6, title: "Repeated money friction", prompt: "Which problem repeats most often, if any?", instruction: "Pick up to two.", type: "multi", maxSelections: 2, evidenceClass: "repeated-friction", options: [
      option("spending", "Spending more than intended", { effects: [effect("spending-impulsivity", 2)], frictions: ["spending-more-than-intended", "purchase-regret"] }),
      option("admin", "Avoiding financial admin", { effects: [effect("financial-avoidance", 2)], frictions: ["avoidance"] }),
      option("saving-no-enjoy", "Saving without enjoying money", { effects: [effect("security-orientation"), effect("present-enjoyment", 1, "contradict")], frictions: ["over-restriction"] }),
      option("saving", "Difficulty saving consistently", { effects: [effect("future-orientation")], frictions: ["consistency-gap", "future-intention"] }),
      option("guilt", "Feeling guilty about reasonable spending", { frictions: ["spending-guilt", "over-restriction"] }),
      option("unexpected", "Unexpected costs destabilizing plans", { effects: [effect("security-orientation")], frictions: ["unexpected-costs"] }),
      option("checking", "Too much time thinking or checking", { effects: [effect("control-need", 2)], frictions: ["control-overload"] }),
      option("long-term", "Long-term goals losing relevance", { effects: [effect("future-orientation")], frictions: ["goal-loses-relevance", "abstract-future"] }),
      option("others", "Disagreement with others about money", { meanings: ["belonging", "care-for-others"], frictions: ["money-disagreement"] }),
      option("start", "Not knowing where to start", { effects: [effect("financial-self-efficacy", 1, "contradict")], frictions: ["unclear-next-step", "overwhelm"] }),
      option("none", "None repeatedly", { tags: ["no-repeated-friction"] }),
      option("something", "Something else", { frictions: ["other-friction"] }),
    ],
  },
  {
    id: "m37", chapter: 6, title: "Self-efficacy", prompt: "When your financial situation isn't where you want it to be, which feels closest?", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("step", "I usually believe I can improve it step by step.", { effects: [effect("financial-self-efficacy", 2)] }),
      option("consistency", "I know what to do but struggle to do it consistently.", { effects: [effect("financial-self-efficacy")], frictions: ["consistency-gap"] }),
      option("difference", "I often don't know what would make the biggest difference.", { effects: [effect("financial-self-efficacy", 1, "contradict")], frictions: ["unclear-next-step"] }),
      option("overwhelming", "It can feel too overwhelming to influence much.", { effects: [effect("financial-self-efficacy", 2, "contradict"), effect("money-stress-reactivity")], frictions: ["overwhelm"] }),
      option("limited", "My options genuinely feel limited right now.", { effects: [effect("financial-self-efficacy", 1, "contradict")], frictions: ["severe-constraint"], tags: ["real-constraint"] }),
    ],
  },
  {
    id: "m38", chapter: 6, title: "Learning money", prompt: "When you don't understand something financial…", type: "single", evidenceClass: "behavioral-evidence", options: [
      option("research", "I research until I understand enough.", { effects: [effect("financial-self-efficacy", 2)], stressResponses: ["act"] }),
      option("ask", "I ask someone I trust.", { effects: [effect("financial-self-efficacy")], tags: ["help-seeking"] }),
      option("simple", "I want a simple explanation and next step.", { frictions: ["unclear-next-step"], tags: ["simple-support"] }),
      option("postpone", "I sometimes postpone it because financial information feels overwhelming.", { effects: [effect("financial-avoidance"), effect("money-stress-reactivity")], stressResponses: ["avoid"], frictions: ["avoidance", "overwhelm"] }),
      option("hand-off", "I usually hand it off where possible.", { tags: ["help-seeking"] }),
    ],
  },
  {
    id: "m39", chapter: 7, title: "Security vs freedom", prompt: "You seem to care about both security and freedom. When they conflict, which usually wins?", type: "single", evidenceClass: "scenario-evidence", condition: { allDimensions: ["security-orientation", "freedom-orientation"] }, options: [
      option("security", "Security.", { effects: [effect("security-orientation", 2)] }),
      option("freedom", "Freedom.", { effects: [effect("freedom-orientation", 2)] }),
      option("stakes", "Depends on the stakes.", { tags: ["context-dependent"] }),
      option("tension", "That's exactly the tension I struggle with.", { frictions: ["security-freedom-tension"] }),
    ],
  },
  {
    id: "m40", chapter: 7, title: "Enjoyment vs future", prompt: "You seem to value both enjoying money now and protecting future options. Which is harder for you?", type: "single", evidenceClass: "scenario-evidence", condition: { allDimensions: ["present-enjoyment", "future-orientation"] }, options: [
      option("guilt", "Letting myself enjoy money without guilt.", { frictions: ["spending-guilt", "over-restriction"] }),
      option("protect", "Protecting future money when something tempting appears now.", { effects: [effect("spending-impulsivity")], frictions: ["consistency-gap"] }),
      option("neither", "Neither is especially difficult.", { tags: ["no-repeated-friction"] }),
      option("stress", "It changes under stress.", { effects: [effect("money-stress-reactivity")], tags: ["context-dependent"] }),
    ],
  },
  {
    id: "m41", chapter: 7, title: "Structure vs avoidance", prompt: "You seem to value financial structure, but may lose access to it when money feels stressful. Does that sound familiar?", instruction: "A calibration prompt, not a diagnosis.", type: "scale", evidenceClass: "repeated-friction", condition: { allDimensions: ["planning-structure", "financial-avoidance"] }, options: [
      option("very", "Very", { effects: [effect("planning-structure"), effect("financial-avoidance", 2)], frictions: ["planning-avoidance-tension"] }),
      option("sometimes", "Sometimes", { effects: [effect("planning-structure"), effect("financial-avoidance")], frictions: ["planning-avoidance-tension"] }),
      option("not", "Not really", { effects: [effect("financial-avoidance", 1, "contradict")] }),
    ],
  },
  {
    id: "m42", chapter: 7, title: "Profile calibration", prompt: "How well do the strongest pattern hypotheses fit?", instruction: "Two or three short hypotheses are generated from existing evidence. Calibration can refine a close interpretation, never manufacture evidence.", type: "calibration", evidenceClass: "self-perception", options: [
      option("very-true", "Very true"),
      option("partly", "Partly"),
      option("not-really", "Not really"),
    ],
  },
];

export const moneyQuestionById = new Map(moneyQuestions.map((question) => [question.id, question]));
export const moneyCoreQuestionIds = moneyQuestions.map(({ id }) => id);
