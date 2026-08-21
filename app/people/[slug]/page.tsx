import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrivacyVideo } from "@/components/spotlight/privacy-video";
import { getLocalizedPublishedSpotlight, getLocalizedRelatedSpotlights, getPeopleCopy } from "@/data/i18n/people";
import { getPublishedSpotlight, publishedSpotlights } from "@/data/spotlights";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocalizedPathname, localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

interface SpotlightPageProps { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return publishedSpotlights.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: SpotlightPageProps): Promise<Metadata> {
  const locale = await getLocale();
  const spotlight = getLocalizedPublishedSpotlight((await params).slug, locale);
  if (!spotlight) return {};
  const metadata = createLocalizedMetadata({ locale, pathname: `/people/${spotlight.slug}`, title: spotlight.seo.title, description: spotlight.seo.description });
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: spotlight.publishedAt, images: [{ url: spotlight.cover?.src ?? "/og.png", alt: spotlight.cover?.alt ?? `${spotlight.fullName} – People / Spotlight` }] }, twitter: { ...metadata.twitter, images: [spotlight.cover?.src ?? "/og.png"] } };
}

export default async function SpotlightPage({ params }: SpotlightPageProps) {
  const locale = await getLocale();
  const slug = (await params).slug;
  const spotlight = getLocalizedPublishedSpotlight(slug, locale);
  const sourceSpotlight = getPublishedSpotlight(slug);
  if (!spotlight) notFound();
  const copy = getPeopleCopy(locale);
  const related = getLocalizedRelatedSpotlights(spotlight, locale);
  const canonical = `https://bts.online${getLocalizedPathname(`/people/${spotlight.slug}`, locale)}`;
  const personEntityId = `https://bts.online/people/${spotlight.slug}#person`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${canonical}#profile`,
        url: canonical,
        name: spotlight.seo.title,
        description: spotlight.seo.description,
        datePublished: spotlight.publishedAt,
        inLanguage: locale,
        mainEntity: { "@id": personEntityId },
      },
      {
        "@type": "Person",
        "@id": personEntityId,
        name: spotlight.fullName,
        alternateName: spotlight.displayName !== spotlight.fullName ? spotlight.displayName : undefined,
        jobTitle: spotlight.role,
        knowsAbout: spotlight.expertise,
      },
      spotlight.video && {
        "@type": "VideoObject",
        "@id": `https://bts.online/people/${spotlight.slug}#video`,
        name: spotlight.video.title,
        description: sourceSpotlight?.teaser ?? spotlight.teaser,
        uploadDate: spotlight.publishedAt,
        embedUrl: `https://www.youtube-nocookie.com/embed/${spotlight.video.youtubeId}`,
        contentUrl: spotlight.video.url,
        inLanguage: spotlight.language,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Digital HQ", item: "https://bts.online/" },
          { "@type": "ListItem", position: 2, name: "People", item: `https://bts.online${getLocalizedPathname("/people", locale)}` },
          { "@type": "ListItem", position: 3, name: spotlight.fullName, item: canonical },
        ],
      },
    ].filter(Boolean),
  };

  return (
    <article className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</gu, "\\u003c") }} />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[68rem] bg-[radial-gradient(circle_at_76%_14%,rgba(53,208,229,0.16),transparent_31rem),radial-gradient(circle_at_12%_42%,rgba(255,122,0,0.08),transparent_24rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label={copy.breadcrumbAria} className="font-mono text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2"><li><Link href={localizeHref("/", locale)} className="hover:text-white">Digital HQ</Link></li><li aria-hidden="true">/</li><li><Link href={localizeHref("/people", locale)} className="hover:text-white">People</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="text-[#35d0e5]">{spotlight.fullName}</li></ol>
        </nav>

        <header className="border-b border-white/15 py-16 sm:py-24">
          <div className="grid min-w-0 grid-cols-1 items-end gap-12 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">{spotlight.format} <span className="text-slate-600">/</span> {spotlight.editionLabel}</p>
              <h1 className="mt-8 max-w-6xl break-words [overflow-wrap:anywhere] text-[clamp(2.4rem,8vw,7.5rem)] font-black leading-[0.9] tracking-[-0.055em] text-white">{spotlight.title}</h1>
            </div>
            <aside className="border-l-2 border-[#ff7a00] pl-6 sm:pl-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff9a3d]">{copy.who}</p>
              <p className="mt-5 text-3xl font-black text-white">{spotlight.fullName}</p>
              {spotlight.displayName !== spotlight.fullName && <p className="mt-2 text-sm font-bold text-[#35d0e5]">{copy.publicName}: {spotlight.displayName}</p>}
              <p className="mt-4 leading-7 text-slate-300">{spotlight.professionalContext}</p>
              <ul className="mt-6 flex flex-wrap gap-2">{spotlight.expertise.slice(0, 5).map((topic) => <li key={topic} className="rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">{topic}</li>)}</ul>
            </aside>
          </div>
          <p className="mt-12 max-w-5xl text-xl font-bold leading-relaxed text-slate-200 sm:text-3xl">{spotlight.subtitle}</p>
        </header>

        {spotlight.cover && <figure className="border-b border-white/15 py-16 sm:py-24"><div className="overflow-hidden border border-white/10 bg-[#031426]"><Image src={spotlight.cover.src} alt={spotlight.cover.alt} width={1280} height={720} priority sizes="(max-width: 1440px) 100vw, 1440px" className="h-auto w-full" /></div></figure>}

        <section aria-labelledby="conversation-title" className="grid min-w-0 grid-cols-1 gap-10 border-b border-white/15 py-20 lg:grid-cols-[0.35fr_1fr]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.why}</p>
          <div><h2 id="conversation-title" className="[overflow-wrap:anywhere] text-4xl font-black leading-tight text-white sm:text-6xl">{spotlight.shortIntroduction}</h2><div className="mt-9 max-w-[72ch] space-y-6 text-lg leading-8 text-slate-300">{spotlight.editorialIntroduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div>
        </section>

        {spotlight.video && <section aria-labelledby="video-title" className="border-b border-white/15 py-20 sm:py-28"><div className="mb-10 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[0.35fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.fullConversation}</p><div><h2 id="video-title" className="text-4xl font-black text-white sm:text-6xl">{copy.fullConversationTitle}</h2><p className="mt-5 max-w-3xl leading-7 text-slate-400">{copy.videoPrivacy}</p></div></div><div lang={spotlight.language}><PrivacyVideo {...spotlight.video} /></div></section>}

        <section id="chapter-index" aria-labelledby="chapters-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[0.35fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.inConversation} / {spotlight.chapters.length.toString().padStart(2, "0")}</p><div><h2 id="chapters-title" className="text-4xl font-black text-white sm:text-6xl">{copy.chapterTitle}</h2><p className="mt-5 max-w-3xl leading-7 text-slate-400">{spotlight.chapters.some(({ timestamp }) => timestamp) ? copy.chaptersVerified : copy.chaptersUnavailable}</p></div></div>
          <ol className="mt-14 grid min-w-0 grid-cols-1 border-l border-t border-white/10 md:grid-cols-2">
            {spotlight.chapters.map((chapter, index) => {
              const content = <><span className="font-mono text-xs text-[#ff9a3d]">{chapter.timestamp ?? String(index + 1).padStart(2, "0")}</span><h3 className="mt-7 [overflow-wrap:anywhere] text-2xl font-black leading-snug text-white">{chapter.title}</h3>{chapter.summary && <p className="mt-4 leading-7 text-slate-400">{chapter.summary}</p>}{chapter.seconds !== undefined && <span className="mt-6 block text-sm font-black text-[#35d0e5]">{copy.openYoutube} ↗</span>}</>;
              return <li key={`${chapter.timestamp}-${chapter.title}`} lang={spotlight.language} className="border-b border-r border-white/10">{spotlight.video && chapter.seconds !== undefined ? <a href={`${spotlight.video.url}&t=${chapter.seconds}s`} target="_blank" rel="noopener noreferrer" className="block h-full min-h-52 p-7 transition hover:bg-[#35d0e5]/[0.05] sm:p-9">{content}<span className="sr-only"> ({copy.externalLink})</span></a> : <div className="min-h-52 p-7 sm:p-9">{content}</div>}</li>;
            })}
          </ol>
        </section>

        {spotlight.featuredStatement && <aside aria-label={copy.editorialInsight} className="border-b border-white/15 py-20 sm:py-32"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.editorialInsight}</p><p className="mt-9 max-w-6xl [overflow-wrap:anywhere] text-[clamp(2.2rem,5.5vw,5.4rem)] font-black leading-[1.04] tracking-[-0.04em] text-white">{spotlight.featuredStatement}</p><p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{copy.editorialNotQuote}</p></aside>}

        <section aria-labelledby="deep-dive-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[0.35fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.deeperContext}</p><h2 id="deep-dive-title" className="text-4xl font-black text-white sm:text-6xl">{copy.deeperTitle}</h2></div>
          <div className="mt-14 border-t border-white/15">{spotlight.sections.map((section, index) => <section key={section.title} className="grid min-w-0 grid-cols-1 gap-7 border-b border-white/10 py-10 lg:grid-cols-[0.35fr_1fr] lg:py-14"><p className="font-mono text-3xl font-black text-white/20">{String(index + 1).padStart(2, "0")}</p><div><h3 className="[overflow-wrap:anywhere] text-3xl font-black text-white sm:text-4xl">{section.title}</h3><div className="mt-6 max-w-[72ch] space-y-5 text-lg leading-8 text-slate-300">{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></section>)}</div>
        </section>

        <section aria-labelledby="takeaways-title" className="border-b border-white/15 py-20 sm:py-28"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.takeaways}</p><h2 id="takeaways-title" className="mt-6 text-4xl font-black text-white sm:text-6xl">{copy.keyIdeas}</h2><ol className="mt-12 grid min-w-0 grid-cols-1 border-l border-t border-white/10 md:grid-cols-2">{spotlight.takeaways.map((takeaway, index) => <li key={takeaway} className="min-h-48 border-b border-r border-white/10 p-7 sm:p-9"><span className="font-mono text-xs text-[#35d0e5]">{String(index + 1).padStart(2, "0")}</span><p className="mt-7 [overflow-wrap:anywhere] text-xl font-black leading-snug text-white sm:text-2xl">{takeaway}</p></li>)}</ol><p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{copy.editorialSummary}</p></section>

        {(spotlight.externalLinks?.length || spotlight.spotifyUrl) && <section aria-labelledby="links-title" className="grid min-w-0 grid-cols-1 gap-8 border-b border-white/15 py-16 lg:grid-cols-[0.35fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.links}</p><div><h2 id="links-title" className="text-3xl font-black text-white">{copy.linksTitle}</h2><div className="mt-7 flex flex-wrap gap-3">{spotlight.externalLinks?.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-5 py-3 font-bold text-white hover:border-[#35d0e5]">{link.label} ↗</a>)}{spotlight.spotifyUrl && <a href={spotlight.spotifyUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-5 py-3 font-bold text-white hover:border-[#ff9a3d]">{copy.spotify} ↗</a>}</div></div></section>}

        <section aria-labelledby="related-title" className="py-20"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.related}</p><h2 id="related-title" className="mt-5 text-4xl font-black text-white sm:text-5xl">{copy.relatedTitle}</h2></div><Link href={localizeHref("/people", locale)} className="font-black text-[#35d0e5]">{copy.all} →</Link></div><div className="mt-10 grid min-w-0 grid-cols-1 border-l border-t border-white/10 lg:grid-cols-3">{related.map((person) => <Link key={person.id} href={localizeHref(`/people/${person.slug}`, locale)} className="group border-b border-r border-white/10 p-7 transition hover:bg-white/[0.025]"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#35d0e5]">{person.format}</p><h3 className="mt-7 text-2xl font-black text-white">{person.fullName}</h3><p className="mt-3 leading-7 text-slate-400">{person.shortIntroduction}</p><p className="mt-7 font-black text-white group-hover:text-[#ff9a3d]">{copy.openConversation} →</p></Link>)}</div></section>
      </div>
    </article>
  );
}
