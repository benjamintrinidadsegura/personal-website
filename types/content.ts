export type ProjectStatus = "Active" | "Active / Growing" | "Concept" | "In Development" | "Rebuild" | "Digital HQ";

export interface ProjectArea {
  title: string;
  description?: string;
  href?: string;
  status?: "Available" | "In development" | "Coming soon";
}

export interface CareerSpotlightEntry {
  slug: string;
  name: string;
  professionalContext: string;
  teaser: string;
  status: "planned" | "draft" | "published";
  title?: string;
  subtitle?: string;
  introduction?: string[];
  editionLabel?: string;
  cover?: { src: string; alt: string };
  youtubeUrl?: string;
  spotifyUrl?: string;
  publishedAt?: string;
  guidingAnswer?: string;
  featuredStatement?: string;
  sections?: Array<{ title: string; body: string[] }>;
  questions?: Array<{ question: string; answer: string }>;
  takeaways?: string[];
  seo?: { title: string; description: string };
}

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
}

export interface NowItem {
  label: "Building" | "Developing" | "Rebuilding" | "Exploring";
  text: string;
  accent: "cyan" | "orange";
}

export interface HqPulseItem {
  id: string;
  type: "Career Spotlight" | "Interview" | "Writing" | "YouTube" | "Spotify" | "Projektupdate" | "Formatupdate";
  title: string;
  teaser: string;
  href: string;
  date?: string;
  source?: string;
  status?: string;
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
  label: "LinkedIn" | "YouTube" | "Spotify";
  url: string | null;
  placeholder: boolean;
}
