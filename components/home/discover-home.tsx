import Image from "next/image";
import Link from "next/link";

import { QuoteExperience } from "@/components/quotes/quote-experience";
import { findYourNextStep } from "@/data/find-your-next-step";
import { getAboutContent } from "@/data/i18n/about";
import { discoverCopy } from "@/data/i18n/discover";
import { homeViewsCopy } from "@/data/i18n/home-views";
import { getLocalizedPublishedSpotlights } from "@/data/i18n/people";
import { getWritingDictionary, writingTaxonomies } from "@/data/i18n/writing";
import { createWorldMapConnections } from "@/data/world-map";
import { localeDetails, type Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import type { PublishedWritingReadResult } from "@/lib/writing/queries";

/** Server presentation of the same public snapshot used by Explore; no second content query. */
export function DiscoverHome({ locale, publishedWritingResult, dateKey }: {
  locale: Locale;
  publishedWritingResult: PublishedWritingReadResult;
  dateKey: string;
}) {
  const copy = discoverCopy[locale];
  const writing = getWritingDictionary(locale);
  const article = publishedWritingResult.data[0];
  const about = getAboutContent(locale);
  // The existing adapter admits only published Spotlights with verified public map context.
  const connection = createWorldMapConnections(getLocalizedPublishedSpotlights(locale))[0];
  const paths = [
    { key: "projects", copy: copy.projects, href: "/#building" },
    { key: "writing", copy: copy.writing, href: "/writing" },
    { key: "people", copy: copy.people, href: "/people" },
    { key: "experiences", copy: copy.experiences, href: findYourNextStep.href },
  ];

  return (
    <div className="discover-editorial">
      <section id="discover-featured" aria-labelledby="discover-title" className="discover-featured">
        <header className="discover-section-heading">
          <p className="discover-eyebrow">BTSHQ / Discover</p>
          <h1 id="discover-title">{copy.featured}</h1>
        </header>
        <div className="discover-featured-grid">
          {article ? (
            <article className="discover-writing" data-discover-writing={article.id}>
              <div className="discover-writing-meta">
                <span>{writing.page.featured}</span>
                <span>{writingTaxonomies[locale].contentTypes[article.contentType]}</span>
              </div>
              <Link className="discover-writing-link" href={localizeHref(`/writing/${article.slug}`, article.language)}>
                <h2 lang={article.language}>{article.title}</h2>
                <p className="discover-writing-introduction" lang={article.language}>{article.deck || article.excerpt}</p>
                <span className="discover-text-link">{writing.page.readArticle}<span aria-hidden="true"> ↗</span></span>
              </Link>
              <div className="discover-writing-details">
                <time dateTime={article.publishedAt}>{new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date(article.publishedAt))}</time>
                <span>{article.readingMinutes} {writing.page.readingTime}</span>
                <span lang={article.language}>{localeDetails[article.language].languageName}</span>
              </div>
              {article.translationStatus === "fallback" ? <p className="discover-source-notice">{writing.article.sourceNotice}</p> : null}
            </article>
          ) : (
            <div className="discover-writing discover-writing-empty" data-discover-writing-state={publishedWritingResult.status === "unavailable" ? "unavailable" : "empty"}>
              <p className="discover-eyebrow">Writing</p>
              <div role="status">
                <h2>{publishedWritingResult.status === "unavailable" ? copy.unavailableTitle : copy.emptyTitle}</h2>
                <p className="discover-writing-introduction">{publishedWritingResult.status === "unavailable" ? copy.unavailableBody : copy.emptyBody}</p>
              </div>
              <Link className="discover-text-link" href={localizeHref("/writing", locale)}>{copy.writingLink}<span aria-hidden="true"> ↗</span></Link>
            </div>
          )}
          <div className="discover-daily">
            <QuoteExperience context={{ surface: "daily", dateKey }} variant="daily" presentation="compact" description="" safeSharePath="/" />
          </div>
        </div>
      </section>

      <section id="discover-human" aria-labelledby="discover-human-title" className="discover-human">
        <div>
          <p className="discover-eyebrow">{about.positioning.name}</p>
          <h2 id="discover-human-title">{homeViewsCopy[locale].title}</h2>
        </div>
        <div className="discover-human-copy">
          <p>{homeViewsCopy[locale].introduction}</p>
          <p className="discover-human-principle">{about.positioning.alternative}</p>
          <Link className="discover-text-link" href={localizeHref("/about", locale)}>{copy.aboutLink}<span aria-hidden="true"> ↗</span></Link>
        </div>
      </section>

      <nav id="discover-paths" aria-labelledby="discover-paths-title" className="discover-paths">
        <h2 id="discover-paths-title" className="discover-section-title">{copy.paths}</h2>
        <ol className="discover-path-grid">
          {paths.map((path, index) => (
            <li key={path.key} className={`discover-path discover-path-${path.key}`}>
              <Link href={localizeHref(path.href, locale)}>
                <span className="discover-path-label"><span aria-hidden="true">0{index + 1} / </span>{path.copy[0]}</span>
                <span className="discover-path-title">{path.copy[1]}</span>
                <span className="discover-path-arrow" aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      {connection ? (
        <section id="discover-continue" aria-labelledby="discover-continue-title" className="discover-continue">
          <h2 id="discover-continue-title" className="discover-section-title">{copy.continueTitle}</h2>
          <div className="discover-connection">
            {connection.entity.image ? <Image className="discover-connection-image" src={connection.entity.image.src} alt={connection.entity.image.alt} width={640} height={360} sizes="(min-width: 1000px) 400px, (min-width: 640px) 40vw, 100vw" /> : null}
            <div className="discover-connection-copy">
              <p className="discover-eyebrow">{copy.connection}</p>
              <h3>{connection.entity.name}</h3>
              <p>{connection.entity.description}</p>
              <div className="discover-connection-links">
                <Link className="discover-text-link" href={localizeHref(connection.entity.sourceHref, locale)}>{copy.conversationLink}<span aria-hidden="true"> ↗</span></Link>
                <Link className="discover-text-link" href={localizeHref("/world", locale)}>{copy.mapLink}<span aria-hidden="true"> ↗</span></Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
