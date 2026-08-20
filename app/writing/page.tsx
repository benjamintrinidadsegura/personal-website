import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterCta } from "@/components/newsletter/newsletter-cta";
import { getWritingDictionary, localizeWritingTopic, writingTaxonomies } from "@/data/i18n/writing";
import { getGlobalDictionary } from "@/data/i18n/global";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import { getPublishedWriting } from "@/lib/writing/queries";
import { localeDetails } from "@/lib/i18n/config";
import type { WritingLanguage } from "@/types/writing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getWritingDictionary(locale).page;
  return createLocalizedMetadata({ locale, pathname: "/writing", title: "Writing | bts.online", description: copy.description });
}

export default async function WritingPage() {
  const [articles, locale] = await Promise.all([getPublishedWriting(), getLocale()]);
  const copy = getWritingDictionary(locale).page;
  const globalCopy = getGlobalDictionary(locale);
  const dateFormatter = new Intl.DateTimeFormat(localeDetails[locale].htmlLang, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
  const taxonomy = writingTaxonomies[locale];
  const [featured, ...latest] = articles;
  const sourceLang = (language: WritingLanguage) => language === locale ? undefined : language;

  return (
    <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(circle_at_74%_18%,rgba(53,208,229,0.15),transparent_28rem),radial-gradient(circle_at_18%_44%,rgba(255,122,0,0.06),transparent_22rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400"><Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link> / <span aria-current="page" className="text-[#35d0e5]">Writing</span></nav>
        <header className="grid min-h-[58svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div><p className="text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">{copy.eyebrow}</p><h1 className="mt-7 whitespace-pre-line text-[clamp(3.7rem,11vw,9rem)] font-black leading-[0.84] tracking-[-0.06em] text-white">{copy.title}</h1></div>
          <p className="border-l border-[#ff9a3d] pl-7 text-xl font-bold leading-9 text-slate-200">{copy.introduction}</p>
        </header>
        {featured ? (
          <section aria-labelledby="featured-writing-title" className="border-b border-white/15 py-20 sm:py-28">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.featured}</p>
            <Link href={localizeHref(`/writing/${featured.slug}`, locale)} className="group mt-8 grid gap-8 border border-white/10 bg-white/[0.02] p-7 transition hover:border-[#35d0e5]/50 sm:p-10 lg:grid-cols-[1fr_0.35fr]">
              <div><div lang={localeDetails[locale].htmlLang} className="flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.16em] text-[#35d0e5]"><span>{taxonomy.contentTypes[featured.contentType]}</span><span aria-hidden="true">·</span><span>{featured.language.toUpperCase()}</span><span aria-hidden="true">·</span><span>{featured.topics.map((topic) => localizeWritingTopic(topic, locale)).join(" · ")}</span></div><div lang={sourceLang(featured.language)}><h2 id="featured-writing-title" className="mt-7 break-words text-4xl font-black leading-tight text-white sm:text-6xl">{featured.title}</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{featured.excerpt}</p></div></div>
              <div className="flex flex-col justify-end border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><time dateTime={featured.publishedAt} className="font-mono text-xs text-slate-500">{dateFormatter.format(new Date(featured.publishedAt))}</time><p className="mt-3 text-sm text-slate-400">{featured.readingMinutes} {copy.readingTime}</p><p className="mt-8 font-black text-[#35d0e5]">{copy.readArticle} →</p></div>
            </Link>
          </section>
        ) : (
          <section aria-labelledby="empty-writing-title" className="border-b border-white/15 py-20"><h2 id="empty-writing-title" className="text-3xl font-black text-white">{copy.firstTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">{copy.firstBody}</p></section>
        )}
        {latest.length ? (
          <section aria-labelledby="latest-writing-title" className="py-20 sm:py-28"><h2 id="latest-writing-title" className="text-4xl font-black text-white sm:text-6xl">{copy.latest}</h2><ol className="mt-12 border-t border-white/15">{latest.map((article) => <li key={article.id}><Link href={localizeHref(`/writing/${article.slug}`, locale)} className="group grid gap-5 border-b border-white/15 py-9 transition hover:bg-white/[0.025] sm:px-4 lg:grid-cols-[0.25fr_1fr_0.3fr] lg:items-center"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-[#35d0e5]">{taxonomy.contentTypes[article.contentType]} · {article.language.toUpperCase()}</p><p className="mt-2 text-sm text-slate-500">{article.topics.map((topic) => localizeWritingTopic(topic, locale)).join(" · ")}</p></div><div lang={sourceLang(article.language)}><h3 className="break-words text-2xl font-black text-white sm:text-3xl">{article.title}</h3><p className="mt-3 max-w-2xl leading-7 text-slate-300">{article.excerpt}</p></div><div className="lg:text-right"><time dateTime={article.publishedAt} className="font-mono text-xs text-slate-500">{dateFormatter.format(new Date(article.publishedAt))}</time><p className="mt-3 text-sm text-slate-400">{article.readingMinutes} {copy.readingTime}</p></div></Link></li>)}</ol></section>
        ) : null}
        <NewsletterCta />
      </div>
    </article>
  );
}
