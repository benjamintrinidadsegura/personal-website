import { projects } from "@/data/projects";
import { getLocalizedPublishedSpotlights } from "@/data/i18n/people";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import type { LabItem } from "@/lib/experience-lab/search";

/** Lab-only adapter. Writing examples are demos, never a substitute for a publication query. */
export function createLabCatalog(locale: Locale): readonly LabItem[] {
  const german = locale === "de";
  const language = german ? "de" : "en";
  const project = projects.find(item => item.slug === "goatrecrutainer");
  const person = getLocalizedPublishedSpotlights(locale).find(item => item.slug === "evgeny-vinokurov");
  const catalog: LabItem[] = [];
  if (project) catalog.push({
    id: "goatrecrutainer", kind: "project", source: "public", title: project.name,
    summary: project.description, topics: ["recruiting", "career", "community"],
    keywords: ["storytelling", "hiring", "karriere", "personal brand"],
    href: localizeHref("/projects/" + project.slug, locale), language: "de",
  });
  catalog.push(
    {
      id: "world-map", kind: "world", source: "public", title: "World Map",
      summary: german ? "Veröffentlichte Geschichten und belegte öffentliche Verbindungen an ihren Orten entdecken." : "Explore published stories and verified public connections through their places.",
      topics: ["people", "community", "map"], keywords: ["geography", "geografie", "interviews", "connections"],
      href: localizeHref("/world", locale), language,
    },
    {
      id: "personal-advantage", kind: "tool", source: "public", title: "Personal Advantage",
      summary: german ? "Die persönliche Kombination aus Denkweise, Fähigkeiten und Erfahrungen erkunden." : "Explore your combination of how you think, what you can do and what you have experienced.",
      topics: ["career", "reflection"], keywords: ["strengths", "starken", "skills", "assessment", "tools"],
      href: localizeHref("/tools/personal-advantage", locale), language,
    },
  );
  if (person) catalog.push({
    id: person.id, kind: "person", source: "public", title: person.fullName,
    summary: person.teaser, topics: ["people", "career"], keywords: ["interview", "tanz", "dance", "consulting", "neuanfang"],
    href: localizeHref("/people/" + person.slug, locale), language: person.language,
    ...(person.cover ? { image: person.cover } : {}),
  });
  catalog.push(
    {
      id: "echo-wall", kind: "community", source: "public", title: "EchoWall",
      summary: german ? "Ein Gedanke, eine Reaktion, eine Nachricht. Ein moderierter Ort für Stimmen aus der Community." : "A thought, a reaction, a message. A moderated place for community voices.",
      topics: ["community", "people"], keywords: ["feedback", "contribute", "beitrag", "voices", "austausch"],
      href: localizeHref("/echowall", locale), language,
    },
    {
      id: "relationship", kind: "tool", source: "public", title: "Life Alignment · Partner",
      summary: german ? "Eigene Erwartungen und Bedürfnisse in Beziehungen reflektieren." : "Reflect on your expectations and needs in relationships.",
      topics: ["relationships", "reflection"], keywords: ["partner", "couple", "paar", "beziehung", "expectations", "erwartungen", "tools"],
      href: localizeHref("/life-alignment/partner", locale), language,
    },
    {
      id: "career", kind: "tool", source: "public", title: "Life Alignment · Career",
      summary: german ? "Was passt zu dir, zu deiner Arbeit und deinem nächsten beruflichen Schritt?" : "What fits you, your work and the next step in your career?",
      topics: ["career", "reflection"], keywords: ["work", "arbeit", "beruf", "decisions", "entscheidung", "tools"],
      href: localizeHref("/life-alignment/career", locale), language,
    },
    {
      id: "writing", kind: "writing", source: "public", title: "Writing",
      summary: german ? "Der öffentliche Zugang zu veröffentlichten Essays und Gedanken auf BTSHQ." : "The public home of published essays and thoughts on BTSHQ.",
      topics: ["writing"], keywords: ["lesen", "reading", "gedanken", "articles"],
      href: localizeHref("/writing", locale), language,
    },
    {
      id: "ai-notes-demo", kind: "writing", source: "demo",
      title: german ? "Mit KI denken, ohne das Denken abzugeben" : "Thinking with AI, without giving thinking away",
      summary: german ? "Ein Demo-Exposé über künstliche Intelligenz, menschliches Urteil und die Fragen, die wir selbst stellen müssen." : "A demo outline about artificial intelligence, human judgement and the questions we still need to ask ourselves.",
      topics: ["ai", "writing"], keywords: ["ki", "kunstliche intelligenz", "judgement", "human", "denken"],
      language,
    },
    {
      id: "gaming-demo", kind: "idea", source: "demo",
      title: german ? "Zwischen zwei Spielständen" : "Between save points",
      summary: german ? "Ein Demo-Konzept für Gespräche darüber, was Spiele über Zusammenarbeit, Neugier und Entscheidungen erzählen." : "A demo concept for conversations about what games reveal about collaboration, curiosity and decisions.",
      topics: ["gaming", "community"], keywords: ["spiele", "cooperation", "zusammenarbeit", "play", "ideen"],
      language,
    },
    {
      id: "career-ai-demo", kind: "idea", source: "demo",
      title: german ? "Der menschliche Teil im KI-Recruiting" : "The human part of AI recruiting",
      summary: german ? "Eine Demo-Fragestellung zur Rolle von KI bei Recruiting und beruflichen Entscheidungen." : "A demo question about the role of AI in recruiting and career decisions.",
      topics: ["ai", "recruiting", "career"], keywords: ["ki", "hiring", "ethik", "ethics", "future", "zukunft"],
      language,
    },
  );
  return catalog;
}
