export type ProjectStatus = "Active" | "Active / Growing" | "Concept" | "In Development" | "Rebuild" | "Digital HQ";

export interface ProjectArea {
  title: string;
  description?: string;
  href?: string;
  status?: "Available" | "In development" | "Coming soon";
}

export type SpotlightStatus = "planned" | "draft" | "published";
export type SpotlightFormat = "Career Spotlight" | "Service Spotlight" | "Spotlight Conversation";
export type PublicRelationshipType =
  | "interviewed"
  | "partner"
  | "worked-with"
  | "recommended"
  | "advertising-partner";

export interface SpotlightChapter {
  title: string;
  summary?: string;
  timestamp?: string;
  seconds?: number;
}

export interface SpotlightPerson {
  id: string;
  slug: string;
  fullName: string;
  displayName: string;
  format: SpotlightFormat;
  role: string;
  organization?: string;
  professionalContext: string;
  shortIntroduction: string;
  editorialIntroduction: string[];
  teaser: string;
  status: SpotlightStatus;
  title: string;
  subtitle: string;
  editionLabel?: string;
  cover?: { src: string; alt: string };
  location?: { city?: string; region?: string; country: string; context: "origin" | "based-in" };
  industries: string[];
  expertise: string[];
  language: "de" | "en";
  video?: { youtubeId: string; url: string; title: string; duration: string };
  spotifyUrl?: string;
  publishedAt?: string;
  guidingAnswer?: string;
  featuredStatement?: string;
  chapters: SpotlightChapter[];
  sections: Array<{ title: string; body: string[] }>;
  takeaways: string[];
  externalLinks?: Array<{ label: string; url: string }>;
  discovery: { tags: string[]; keywords: string[] };
  worldMap: {
    ready: boolean;
    relationshipTypes: PublicRelationshipType[];
    interviewStatus: "published" | "unpublished";
  };
  seo: { title: string; description: string };
}

export type SpotlightPulseSource = Pick<
  SpotlightPerson,
  "slug" | "status" | "title" | "teaser" | "publishedAt" | "format"
>;

export interface ProjectMedia {
  type: "image" | "video";
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ProjectUpdate {
  title: string;
  summary: string;
  date?: string;
  status?: string;
  href?: string;
}

export interface Project {
  slug: string;
  name: string;
  longName?: string;
  positioning?: string;
  claim?: string;
  monogram: string;
  pitch: string;
  description: string;
  status: ProjectStatus;
  category: string;
  accent: string;
  pattern: "grid" | "rays" | "dots" | "orbit" | "network" | "signal";
  featured?: boolean;
  vision: string;
  problem: string;
  goal: string;
  currentState: string;
  nextSteps: string | string[];
  plannedElements?: string[];
  values?: string[];
  areas?: ProjectArea[];
  services?: string[];
  industries?: string[];
  region?: string;
  media?: ProjectMedia[];
  updates?: ProjectUpdate[];
  mediaNote?: string;
  contactCta?: string;
  externalUrl?: string;
  externalLabel?: string;
}

export interface NowItem {
  label: "Building" | "Developing" | "Rebuilding" | "Exploring";
  text: string;
  accent: "cyan" | "orange";
}

export type HqPulseKind = "ecosystem" | "project" | "tool" | "content";
export type HqPulseOrigin = "canonical" | "editorial";
export type HqPulseVisibility = "public" | "unpublished" | "internal";

export interface HqPulseItem {
  id: string;
  kind: HqPulseKind;
  type: string;
  title: string;
  teaser: string;
  href: string;
  ctaLabel: string;
  date?: string;
  source?: string;
  status?: string;
}

export interface HqPulseCandidate extends HqPulseItem {
  identity: string;
  origin: HqPulseOrigin;
  visibility: HqPulseVisibility;
  sequence?: number;
}

export interface HqPulseUpdate extends HqPulseCandidate {
  origin: "editorial";
  sequence: number;
}

export interface WritingEntry {
  title: string;
  excerpt: string;
  category: string;
  state: "Coming to bts.online";
}

export interface InterviewFormat {
  title: "Career Spotlight" | "Service Spotlight" | "Personal Conversations";
  description: string;
  focus: string;
}

export interface Value {
  title: string;
  description: string;
}

export interface SocialLink {
  label: "TikTok" | "Instagram" | "YouTube" | "LinkedIn";
  url: string;
  context: string;
}
