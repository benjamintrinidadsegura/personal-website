export type NextStepJourneySlug = "self" | "career" | "problem" | "idea";

export type NextStepJourneyStatus = "In Development";

export interface NextStepJourneyDiscoveryCopy {
  title?: string;
  category: string;
  tags: readonly string[];
  keywords: readonly string[];
}

export interface NextStepJourney {
  id: `tool-find-your-next-step-${NextStepJourneySlug}`;
  slug: NextStepJourneySlug;
  href: `/find-your-next-step/${NextStepJourneySlug}`;
  number: "01" | "02" | "03" | "04";
  title: string;
  description: string;
  expectations: readonly string[];
  analysisAreas: readonly string[];
  status: NextStepJourneyStatus;
  accent: string;
  discovery: NextStepJourneyDiscoveryCopy;
  professionalBoundary?: string;
}
