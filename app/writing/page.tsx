import type { Metadata } from "next";
import Link from "next/link";
import "./editorial.css";

import { NewsletterCta } from "@/components/newsletter/newsletter-cta";
import { ShareFormatSignal } from "@/components/writing/share/share-format-signal";
import { WritingRetryButton } from "@/components/writing/writing-retry-button";
import { getWritingDictionary, localizeWritingTopic, writingTaxonomies } from "@/data/i18n/writing";
import { getWritingShareDictionary } from "@/data/i18n/writing-share";
import { getGlobalDictionary } from "@/data/i18n/global";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import { getPublishedWritingResult } from "@/lib/writing/queries";
import { localeDetails } from "@/lib/i18n/config";
import type { WritingLanguage } from "@/types/writing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getWritingDictionary(locale).page;
  return createLocalizedMetadata({ locale, pathname: "/writing", title: "Writing | btshq.online", description: copy.description });
}

export default async function WritingPage() {
  const locale = await getLocale();
  const result = await getPublishedWritingResult(locale, { consumer: "writing_index" });
  const articles = result.data;
  const copy = getWritingDictionary(locale).page;
  const shareCopy = getWritingShareDictionary(locale);
  const globalCopy = getGlobalDictionary(locale);
  const dateFormatter = new Intl.DateTimeFormat(localeDetails[locale].htmlLang, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
  const taxonomy = writingTaxonomies[locale];
  const [featured, ...latest] = articles;
  const sourceLang = (language: WritingLanguage) => language === locale ? undefined : language;

  return (
    <article className="writing-editorial section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(circle_at_74%_18%,rgba(53,208,229,0.15),transparent_28rem),radial-gradient(circle_at_18%_44%,rgba(255,122,0,0.06),transparent_22rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400"><Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link> / <span aria-current="page" className="text-[#35d0e5]">Writing</span></nav>
        <header className="writing-index-hero grid items-center gap-8 border-b border-white/15 py-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div><p className="text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">{copy.eyebrow}</p><h1 className="mt-7 whitespace-pre-line text-[clamp(3.7rem,11vw,9rem)] font-black leading-[0.84] tracking-[-0.06em] text-white">{copy.title}</h1></div>
          <p className="border-l border-[#ff9a3d] pl-7 text-xl font-bold leading-9 text-slate-200">{copy.introduction}</p>
        </header>
        {result.status === "unavailable" ? (
          <section role="status" aria-labelledby="unavailable-writing-title" data-writing-index-unavailable className="border-b border-white/15 py-20">
            <h2 id="unavailable-writing-title" className="text-3xl font-black text-white">{copy.unavailableTitle}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">{copy.unavailableBody}</p>
            <WritingRetryButton locale={locale} />
          </section>
        ) : featured ? (
          <section aria-labelledby="featured-writing-title" className="border-b border-white/15 py-20 sm:py-28">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.featured}</p>
            <Link href={localizeHref(`/writing/${featured.slug}`, locale)} className="writing-index-featured group mt-8 grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div>
                <div lang={localeDetails[locale].htmlLang} className="writing-editorial-taxonomy">
                  <span className="writing-editorial-chip">{taxonomy.contentTypes[featured.contentType]}</span>
                  <span className="writing-editorial-language">{featured.language.toUpperCase()}</span>
                  <span className="writing-editorial-topics">{featured.topics.map((topic) => localizeWritingTopic(topic, locale)).join(" · ")}</span>
                </div>
                <div lang={sourceLang(featured.language)}>
                  <h2 id="featured-writing-title" className="writing-editorial-feature-title">{featured.title}</h2>
                  <p className="writing-editorial-feature-excerpt">{featured.excerpt}</p>
                </div>
                <p className="writing-editorial-cta writing-editorial-cta-featured">{copy.readArticle} <span aria-hidden="true">↗</span></p>
              </div>
              <div className="writing-editorial-feature-aside">
                <div className="writing-editorial-meta">
                  <time dateTime={featured.publishedAt}>{dateFormatter.format(new Date(featured.publishedAt))}</time>
                  <p>{featured.readingMinutes} {copy.readingTime}</p>
                </div>
                <ShareFormatSignal copy={shareCopy} detailed />
              </div>
            </Link>
          </section>
        ) : (
          <section aria-labelledby="empty-writing-title" className="border-b border-white/15 py-20"><h2 id="empty-writing-title" className="text-3xl font-black text-white">{copy.firstTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">{copy.firstBody}</p></section>
        )}
        {latest.length ? (
          <section aria-labelledby="latest-writing-title" className="py-20 sm:py-28">
            <div className="writing-editorial-section-heading"><h2 id="latest-writing-title" className="text-4xl font-black sm:text-6xl">{copy.latest}</h2><span aria-hidden="true" /></div>
            <ol data-writing-index-mosaic className="writing-index-list mt-12 grid gap-4 lg:grid-cols-2">
              {latest.map((article, index) => (
                <li key={article.id}>
                  <Link href={localizeHref(`/writing/${article.slug}`, locale)} className="writing-index-row group flex h-full flex-col p-6 sm:p-8">
                    <div className="writing-editorial-taxonomy">
                      <span className="writing-editorial-chip">{taxonomy.contentTypes[article.contentType]}</span>
                      <span className="writing-editorial-language">{article.language.toUpperCase()}</span>
                      <span className="writing-editorial-topics">{article.topics.map((topic) => localizeWritingTopic(topic, locale)).join(" · ")}</span>
                    </div>
                    <div lang={sourceLang(article.language)} className="writing-editorial-card-copy"><h3 className={`break-words font-bold ${index % 3 === 0 ? "text-3xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}>{article.title}</h3><p>{article.excerpt}</p></div>
                    <div className="writing-editorial-card-footer"><div className="writing-editorial-meta"><time dateTime={article.publishedAt}>{dateFormatter.format(new Date(article.publishedAt))}</time><p>{article.readingMinutes} {copy.readingTime}</p></div><p className="writing-editorial-cta">{copy.readArticle} <span aria-hidden="true">↗</span></p></div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <NewsletterCta />
      </div>
    </article>
  );
}
