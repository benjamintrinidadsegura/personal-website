import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/writing/article-body";
import { NewsletterCta } from "@/components/newsletter/newsletter-cta";
import { Discussion } from "@/components/writing/comments/discussion";
import { WritingDocument } from "@/components/writing/writing-document";
import { getWritingDictionary, localizeWritingTopic, writingTaxonomies } from "@/data/i18n/writing";
import { getWritingTranslationSlug } from "@/data/writing-localization";
import { siteConfig } from "@/data/site";
import { getWritingDiscussionPageData } from "@/lib/comments/queries";
import { localeDetails, locales } from "@/lib/i18n/config";
import { getLocalizedPathname, localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import { getPublishedWritingBySlug } from "@/lib/writing/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [article, locale] = await Promise.all([getPublishedWritingBySlug((await params).slug), getLocale()]);
  if (!article) return {};
  const sourceLocale = article.language;
  const canonical = getLocalizedPathname(`/writing/${article.slug}`, sourceLocale);
  const title = `${article.title} | Writing`;
  const languages: Record<string, string> = {
    [sourceLocale]: canonical,
    "x-default": canonical,
  };
  for (const targetLocale of locales) {
    const translationSlug = getWritingTranslationSlug(article.slug, targetLocale);
    if (translationSlug) languages[targetLocale] = getLocalizedPathname(`/writing/${translationSlug}`, targetLocale);
  }
  return {
    title,
    description: article.excerpt,
    alternates: { canonical, languages },
    openGraph: { type: "article", locale: localeDetails[sourceLocale].openGraphLocale, url: canonical, siteName: "bts.online", title, description: article.excerpt, publishedTime: article.publishedAt, authors: [siteConfig.name], images: [{ url: "/og.png", width: 1732, height: 909, alt: "Benjamin Trinidad Segura — Digital HQ" }] },
    twitter: { card: "summary_large_image", title, description: article.excerpt, images: ["/og.png"] },
    other: { "content-language": article.language, "ui-language": locale },
  };
}

export default async function WritingArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const [article, locale] = await Promise.all([getPublishedWritingBySlug((await params).slug), getLocale()]);
  if (!article) notFound();
  const { discussion, participation } = await getWritingDiscussionPageData(article.id);
  const copy = getWritingDictionary(locale).article;
  const dateFormatter = new Intl.DateTimeFormat(localeDetails[locale].htmlLang, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
  const sourceDiffers = article.language !== locale;
  const translationSlug = getWritingTranslationSlug(article.slug, locale);
  const taxonomy = writingTaxonomies[locale];

  return (
    <article className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[58rem] bg-[radial-gradient(circle_at_72%_15%,rgba(53,208,229,0.16),transparent_30rem),radial-gradient(circle_at_18%_42%,rgba(255,122,0,0.07),transparent_22rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label={copy.breadcrumb} className="font-mono text-xs text-slate-400"><ol className="flex flex-wrap items-center gap-2"><li><Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link></li><li aria-hidden="true">/</li><li><Link href={localizeHref("/writing", locale)} className="inline-flex min-h-11 items-center hover:text-white">Writing</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="max-w-full truncate text-[#35d0e5]" lang={sourceDiffers ? article.language : undefined}>{article.title}</li></ol></nav>
        {sourceDiffers ? <aside role="note" className="mt-8 border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.035] p-5 text-sm leading-6 text-slate-300"><p>{copy.sourceNotice}</p>{translationSlug ? <Link href={localizeHref(`/writing/${translationSlug}`, locale)} className="mt-3 inline-flex font-black text-[#35d0e5]">{copy.availableIn} {localeDetails[locale].languageName} →</Link> : null}</aside> : null}
        <div lang={sourceDiffers ? article.language : undefined}>
          <header className="border-b border-white/15 py-16 sm:py-24"><div lang={localeDetails[locale].htmlLang} className="flex flex-wrap gap-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#35d0e5]"><span>{taxonomy.contentTypes[article.contentType]}</span><span aria-hidden="true">&middot;</span><span>{article.language.toUpperCase()}</span><span aria-hidden="true">&middot;</span><span>{article.topics.map((topic) => localizeWritingTopic(topic, locale)).join(" / ")}</span></div><h1 className="mt-8 max-w-6xl break-words text-[clamp(3rem,8vw,7.6rem)] font-black leading-[0.92] tracking-[-0.055em] text-white">{article.title}</h1>{article.deck ? <p className="mt-10 max-w-5xl text-xl font-bold leading-8 text-slate-200 sm:text-3xl sm:leading-snug">{article.deck}</p> : null}<div lang={localeDetails[locale].htmlLang} className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-l-2 border-[#ff9a3d] pl-6 text-sm text-slate-400"><p><span className="font-bold text-white">{siteConfig.name}</span></p><time dateTime={article.publishedAt}>{dateFormatter.format(new Date(article.publishedAt))}</time><p>{article.readingMinutes} {copy.minRead}</p></div></header>
          <section aria-label={copy.contentLabel} className="mx-auto max-w-[72ch] py-16 sm:py-24">{article.bodyJson ? <WritingDocument document={article.bodyJson} /> : <ArticleBody body={article.body} />}</section>
        </div>
        <NewsletterCta />
        <Discussion articleId={article.id} discussion={discussion} participation={participation} />
        <footer className="border-t border-white/15 py-14"><Link href={localizeHref("/writing", locale)} className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 font-bold text-slate-200 hover:border-[#35d0e5]/50">{copy.back}</Link></footer>
      </div>
    </article>
  );
}
