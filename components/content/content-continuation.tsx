import { ContextualLinks } from "@/components/content/contextual-links";
import type { ContentReference } from "@/data/contextual-journeys";
import { getContextualReferences, resolveContextualDestinations } from "@/lib/contextual-journeys";
import type { Locale } from "@/lib/i18n/config";
import { getPublishedWritingBySlug } from "@/lib/writing/queries";
import type { PublicWritingArticle } from "@/types/writing";

/** Server-only continuation: at most three curated reads, streamed independently of the article. */
export async function ContentContinuation({ source, locale, article }: { source: ContentReference; locale: Locale; article?: PublicWritingArticle }) {
  const references = getContextualReferences(source);
  if (!references.length || (source.kind === "writing" && article?.slug !== source.slug)) return null;
  const writingSlugs = [...new Set(references.flatMap(({ to }) => to.kind === "writing" && (source.kind !== "writing" || to.slug !== source.slug) ? [to.slug] : []))].slice(0, 3);
  const related = await Promise.all(writingSlugs.map((slug) => getPublishedWritingBySlug(slug, locale)));
  const articles = [...(article ? [article] : []), ...related.filter((value): value is PublicWritingArticle => value !== null)];
  return <ContextualLinks locale={locale} destinations={resolveContextualDestinations(source, references, locale, articles)} />;
}
