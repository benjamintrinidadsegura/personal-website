import { careerSpotlightConfig, careerSpotlights } from "@/data/career-spotlights";
import { discoveryDimensionsByItemId } from "@/data/discovery-curation";
import { findYourNextStep, nextStepJourneys } from "@/data/find-your-next-step";
import { hqPulseItems } from "@/data/hq-pulse";
import { interviewFormats } from "@/data/interviews";
import { projects } from "@/data/projects";
import { writingEntries } from "@/data/writing";
import type { ProjectArea, ProjectStatus } from "@/types/content";
import type { DiscoveryItem, DiscoveryStatus } from "@/types/discovery";
import type { PublicWritingSummary } from "@/types/writing";

function projectStatus(status: ProjectStatus): DiscoveryStatus {
  if (status === "Active" || status === "Active / Growing" || status === "Digital HQ") return "Live";
  if (status === "In Development" || status === "Rebuild") return "In Development";
  return "Coming Soon";
}

function areaStatus(status: ProjectArea["status"]): DiscoveryStatus {
  if (status === "Available") return "Live";
  if (status === "In development") return "In Development";
  return "Coming Soon";
}

const projectItems: DiscoveryItem[] = projects.flatMap((project) => {
  const projectItem: DiscoveryItem = {
    id: `project-${project.slug}`,
    group: "Projects",
    title: project.name,
    description: project.description,
    category: project.category,
    tags: [project.pitch, project.longName, project.positioning].filter((value): value is string => Boolean(value)),
    keywords: [
      project.vision,
      project.goal,
      ...(project.services ?? []),
      ...(project.industries ?? []),
      ...(project.plannedElements ?? []),
    ],
    status: projectStatus(project.status),
    href: `/projects/${project.slug}`,
  };

  const areaItems: DiscoveryItem[] = (project.areas ?? []).map((area) => ({
    id: `project-${project.slug}-area-${area.title.toLocaleLowerCase("de-DE").replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "")}`,
    group: "Projects",
    title: area.title,
    description: area.description ?? `Ein Bereich von ${project.name}.`,
    category: project.name,
    tags: [project.category, "Format"],
    keywords: [],
    status: areaStatus(area.status),
    ...(area.href ? { href: area.href } : {}),
  }));

  return [projectItem, ...areaItems];
});

const pulseItems: DiscoveryItem[] = hqPulseItems.map((item) => ({
  id: `pulse-${item.id}`,
  group: "Insights",
  title: item.title,
  description: item.teaser,
  category: item.type,
  tags: [item.source, item.status].filter((value): value is string => Boolean(value)),
  keywords: ["HQ Pulse", "Update"],
  status: item.status === "Published" || item.status === "Available" || item.status === "Active / Growing"
    ? "Live"
    : "In Development",
  href: item.href,
}));

const writingItems: DiscoveryItem[] = writingEntries.map((entry, index) => ({
  id: `writing-${index + 1}`,
  group: "Insights",
  title: entry.title,
  description: entry.excerpt,
  category: entry.category,
  tags: ["Writing", "Field Notes"],
  keywords: ["Artikel", "Gedanken"],
  status: "Coming Soon",
}));

const interviewDestinations: Record<(typeof interviewFormats)[number]["title"], Pick<DiscoveryItem, "status" | "href">> = {
  "Career Spotlight": { status: "Live", href: "/goatrecrutainer/career-spotlight" },
  "Service Spotlight": { status: "In Development" },
  "Personal Conversations": { status: "Coming Soon" },
};

const interviewItems: DiscoveryItem[] = interviewFormats.map((format) => ({
  id: `interview-${format.title.toLocaleLowerCase("de-DE").replace(/\s+/gu, "-")}`,
  group: "Insights",
  title: format.title,
  description: format.description,
  category: "Interview",
  tags: format.focus.split(" · "),
  keywords: ["Gespräch", "Story", "GOATRECRUTAINER"],
  ...interviewDestinations[format.title],
}));

const peopleItems: DiscoveryItem[] = careerSpotlights
  .filter(({ status }) => status === "published")
  .map((spotlight) => ({
    id: `person-${spotlight.slug}`,
    group: "People",
    title: spotlight.name,
    description: spotlight.teaser,
    category: "Career Spotlight",
    tags: [spotlight.professionalContext, ...careerSpotlightConfig.topics],
    keywords: [spotlight.title, spotlight.subtitle, "Interview"].filter((value): value is string => Boolean(value)),
    status: "Live",
    href: `/goatrecrutainer/career-spotlight/${spotlight.slug}`,
  }));

const findYourNextStepItems: DiscoveryItem[] = [
  {
    id: findYourNextStep.id,
    group: "Tools",
    title: findYourNextStep.name,
    description: findYourNextStep.introduction,
    category: findYourNextStep.discovery.category,
    tags: [...findYourNextStep.discovery.tags],
    keywords: [...findYourNextStep.discovery.keywords],
    status: findYourNextStep.status,
    href: findYourNextStep.href,
  },
  ...nextStepJourneys.map((journey): DiscoveryItem => ({
    id: journey.id,
    group: "Tools",
    title: journey.discovery.title ?? journey.title,
    description: journey.description,
    category: journey.discovery.category,
    tags: [...journey.discovery.tags],
    keywords: [...journey.discovery.keywords],
    status: journey.status,
    href: journey.href,
  })),
];

const toolItems: DiscoveryItem[] = [
  ...findYourNextStepItems,
  {
    id: "tool-echowall",
    group: "Tools",
    title: "EchoWall",
    description: "Eine moderierte Community-Wand für Gedanken, Feedback, Reaktionen und Nachrichten.",
    category: "Community Tool",
    tags: ["Community", "Feedback", "Signals"],
    keywords: ["Echo", "Nachricht", "Wall"],
    status: "Beta",
    href: "/echowall",
  },
];

const pageItems: DiscoveryItem[] = [
  { id: "page-home", group: "Pages", title: "Digital HQ", description: "Das zentrale Zuhause von Benjamin Trinidad Segura.", category: "Page", tags: ["Home", "bts.online"], keywords: ["Startseite", "Übersicht"], status: "Live", href: "/#home" },
  { id: "page-now", group: "Pages", title: "Now", description: "Aktuelle Projekte, Entwicklungen und Themen im Fokus.", category: "Page", tags: ["Aktuell", "Building"], keywords: ["Developing", "Rebuilding", "Exploring"], status: "Live", href: "/#now" },
  { id: "page-projects", group: "Pages", title: "Currently Building", description: "Alle Projekte und Ideen des wachsenden Ökosystems.", category: "Page", tags: ["Projects", "Portfolio"], keywords: ["Building", "Projekte"], status: "Live", href: "/#building" },
  { id: "page-writing", group: "Pages", title: "Writing", description: "Field Notes über Arbeit, Identität, Mut und Entwicklung.", category: "Page", tags: ["Insights", "Artikel"], keywords: ["Texte", "Magazin"], status: "Live", href: "/writing" },
  { id: "page-interviews", group: "Pages", title: "Interviews", description: "Gespräche über Herkunft, Arbeit, Wendepunkte und Potenzial.", category: "Page", tags: ["Insights", "Human Archive"], keywords: ["Gespräche", "Menschen"], status: "Live", href: "/#interviews" },
  { id: "page-pulse", group: "Pages", title: "HQ Pulse", description: "Aktuelle Stories, Formate und Projektupdates.", category: "Page", tags: ["Insights", "Updates"], keywords: ["Aktuell", "Pulse"], status: "Live", href: "/#pulse" },
  { id: "page-about", group: "Pages", title: "About Benjamin", description: "Die Person, Haltung und Prinzipien hinter dem Digital HQ.", category: "Page", tags: ["Benjamin Trinidad Segura", "About"], keywords: ["Person", "Werte"], status: "Live", href: "/#about" },
  { id: "page-contact", group: "Pages", title: "Contact", description: "Kontakt für Recruiting, Interviews, Kooperationen und Ideen.", category: "Page", tags: ["Partners", "Kontakt"], keywords: ["Collaborations", "Recruiting"], status: "Live", href: "/#contact" },
  { id: "page-career-spotlight", group: "Pages", title: "Career Spotlight Archive", description: careerSpotlightConfig.description, category: "Page", tags: [...careerSpotlightConfig.topics], keywords: ["GOATRECRUTAINER", "Interviews"], status: "Live", href: "/goatrecrutainer/career-spotlight" },
];

const baseDiscoveryIndex: DiscoveryItem[] = [
  ...projectItems,
  ...pulseItems,
  ...writingItems,
  ...interviewItems,
  ...peopleItems,
  ...toolItems,
  ...pageItems,
];

export const discoveryIndex: DiscoveryItem[] = baseDiscoveryIndex.map((item) => {
  const dimensions = discoveryDimensionsByItemId[item.id];
  return dimensions ? { ...item, dimensions } : item;
});

export function createPublishedWritingDiscoveryItems(articles: PublicWritingSummary[]): DiscoveryItem[] {
  return articles.map((article) => ({
    id: `writing-${article.id}`,
    group: "Insights",
    title: article.title,
    description: article.excerpt,
    category: article.contentType === "essay" ? "Writing / Essay" : "Writing / Note",
    tags: ["Writing", ...article.topics],
    keywords: [article.deck, "Artikel", "Gedanken"].filter(Boolean),
    status: "Live",
    href: `/writing/${article.slug}`,
  }));
}
