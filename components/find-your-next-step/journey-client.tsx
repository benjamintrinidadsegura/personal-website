"use client";

import dynamic from "next/dynamic";

const CareerExplorationJourney = dynamic(() => import("@/components/find-your-next-step/career-exploration-journey").then(({ CareerExplorationJourney }) => CareerExplorationJourney));
const IdeaJourney = dynamic(() => import("@/components/find-your-next-step/idea-journey").then(({ IdeaJourney }) => IdeaJourney));
const ProblemJourney = dynamic(() => import("@/components/find-your-next-step/problem-journey").then(({ ProblemJourney }) => ProblemJourney));
const SelfReflectionJourney = dynamic(() => import("@/components/find-your-next-step/self-reflection-journey").then(({ SelfReflectionJourney }) => SelfReflectionJourney));

type InteractiveJourney = "self" | "career" | "problem" | "idea";

export function FynsJourneyClient({ journey }: { journey: InteractiveJourney }) {
  if (journey === "self") return <SelfReflectionJourney />;
  if (journey === "career") return <CareerExplorationJourney />;
  if (journey === "problem") return <ProblemJourney />;
  return <IdeaJourney />;
}
