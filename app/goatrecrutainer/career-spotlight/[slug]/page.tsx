import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  careerSpotlightConfig,
  careerSpotlights,
  getPublishedCareerSpotlight,
} from "@/data/career-spotlights";

interface CareerSpotlightDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return careerSpotlights
    .filter((entry) => entry.status === "published")
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: CareerSpotlightDetailPageProps): Promise<Metadata> {
  const spotlight = getPublishedCareerSpotlight((await params).slug);
  if (!spotlight) return {};

  const title = spotlight.seo?.title ?? `${spotlight.name} | Career Spotlight`;
  const description = spotlight.seo?.description ?? spotlight.teaser;
  const canonical = `/goatrecrutainer/career-spotlight/${spotlight.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "de_DE",
      url: canonical,
      siteName: "bts.online",
      title,
      description,
      images: [{ url: "/og.png", width: 1732, height: 909, alt: "Benjamin Trinidad Segura – Digital HQ" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default async function CareerSpotlightDetailPage({ params }: CareerSpotlightDetailPageProps) {
  const spotlight = getPublishedCareerSpotlight((await params).slug);
  if (!spotlight) notFound();

  return (
    <article className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[60rem] bg-[radial-gradient(circle_at_72%_18%,rgba(53,208,229,0.15),transparent_30rem),radial-gradient(circle_at_18%_46%,rgba(255,122,0,0.07),transparent_23rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/#building" className="transition hover:text-white">Digital HQ</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/projects/goatrecrutainer" className="transition hover:text-white">GOATRECRUTAINER</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/goatrecrutainer/career-spotlight" className="transition hover:text-white">Career Spotlight</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#35d0e5]">{spotlight.name}</li>
          </ol>
        </nav>

        <header className="border-b border-white/15 py-16 sm:py-24">
          <div className="grid items-end gap-12 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#35d0e5]">Career Spotlight <span className="text-slate-500">/</span> {spotlight.editionLabel}</p>
              <h1 className="mt-8 max-w-6xl text-[clamp(3.1rem,8.2vw,7.8rem)] font-black leading-[0.91] tracking-[-0.055em] text-white">{spotlight.title}</h1>
            </div>
            <div className="border-l-2 border-[#ff7a00] pl-6 sm:pl-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff9a3d]">Interview guest</p>
              <p className="mt-5 text-2xl font-black text-white">{spotlight.name}</p>
              <p className="mt-2 leading-7 text-slate-300">{spotlight.professionalContext}</p>
            </div>
          </div>
          <p className="mt-12 max-w-5xl text-xl font-bold leading-relaxed text-slate-200 sm:text-3xl">{spotlight.subtitle}</p>
        </header>

        {spotlight.cover && (
          <figure className="border-b border-white/15 py-16 sm:py-24">
            <div className="overflow-hidden border border-white/10 bg-[#031426]">
              <Image src={spotlight.cover.src} alt={spotlight.cover.alt} width={1280} height={720} priority sizes="(max-width: 1440px) 100vw, 1440px" className="h-auto w-full" />
            </div>
            <figcaption className="mt-4 font-mono text-xs leading-6 text-slate-500">Career Spotlight — Evgeny Vinokurov, Portrait Teil 1</figcaption>
          </figure>
        )}

        {spotlight.introduction && (
          <section aria-labelledby="introduction-title" className="grid gap-10 border-b border-white/15 py-20 lg:grid-cols-[0.35fr_1fr]">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">The story behind the résumé</p>
            <div>
              <h2 id="introduction-title" className="text-4xl font-black text-white sm:text-6xl">Mehr als sichtbare Stationen.</h2>
              <div className="mt-9 max-w-[70ch] space-y-6 text-lg leading-8 text-slate-300">{spotlight.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            </div>
          </section>
        )}

        <section aria-labelledby="guiding-question-title" className="border-b border-white/15 py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">The recurring question</p>
          <h2 id="guiding-question-title" className="mt-8 max-w-6xl text-[clamp(2.2rem,5.8vw,5.2rem)] font-black leading-[1.03] tracking-[-0.035em] text-white">„{careerSpotlightConfig.guidingQuestion}“</h2>
          {spotlight.guidingAnswer && <div className="mt-12 max-w-[70ch] border-l-2 border-[#35d0e5] pl-6 sm:pl-9"><p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Redaktionell gekürzte Zusammenfassung</p><p className="mt-5 text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">{spotlight.guidingAnswer}</p></div>}
        </section>

        {spotlight.sections && (
          <section aria-labelledby="chapters-title" className="border-b border-white/15 py-20 sm:py-28">
            <div className="grid gap-8 lg:grid-cols-[0.35fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">The portrait / 05 chapters</p><h2 id="chapters-title" className="text-4xl font-black text-white sm:text-6xl">Eine Geschichte in fünf Bewegungen.</h2></div>
            <ol className="mt-16 border-t border-white/15">
              {spotlight.sections.map((section, index) => (
                <li key={section.title} className="grid gap-7 border-b border-white/10 py-12 lg:grid-cols-[0.35fr_1fr] lg:gap-8 lg:py-20">
                  <p className="font-mono text-4xl font-black leading-none tracking-[-0.05em] text-[#ff9a3d] sm:text-5xl">{String(index + 1).padStart(2, "0")}</p>
                  <div><h3 className="text-3xl font-black leading-tight text-white sm:text-5xl">{section.title}</h3><div className="mt-7 max-w-[70ch] space-y-5 text-lg leading-8 text-slate-300">{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {spotlight.featuredStatement && (
          <aside aria-label="Redaktionelle Kernaussage" className="border-b border-white/15 py-20 sm:py-32">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Editorial insight</p>
            <p className="mt-9 max-w-6xl text-[clamp(2.4rem,6vw,5.8rem)] font-black leading-[1.04] tracking-[-0.04em] text-white">{spotlight.featuredStatement}</p>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-slate-500">Redaktionelle Kernaussage aus dem Gespräch</p>
          </aside>
        )}

        {spotlight.questions && (
          <section aria-labelledby="questions-title" className="border-b border-white/15 py-20 sm:py-28">
            <div className="grid gap-8 lg:grid-cols-[0.35fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Selected questions</p><div><h2 id="questions-title" className="text-4xl font-black text-white sm:text-6xl">Im Gespräch.</h2><p className="mt-5 max-w-[70ch] leading-7 text-slate-400">Die Antworten sind redaktionell gekürzte Zusammenfassungen und keine wortwörtliche Transkriptwiedergabe.</p></div></div>
            <dl className="mt-16 border-t border-white/15">{spotlight.questions.map((item, index) => <div key={item.question} className="grid gap-7 border-b border-white/10 py-12 lg:grid-cols-[0.35fr_1fr] lg:py-14"><dt className="text-2xl font-black leading-snug text-white"><span className="mb-4 block font-mono text-xs tracking-[0.16em] text-[#35d0e5]">Question {String(index + 1).padStart(2, "0")}</span>{item.question}</dt><dd className="max-w-[70ch] text-lg leading-8 text-slate-300"><span className="mb-4 block font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Redaktionell gekürzte Zusammenfassung</span>{item.answer}</dd></div>)}</dl>
          </section>
        )}

        {spotlight.takeaways && (
          <section aria-labelledby="takeaways-title" className="border-b border-white/15 py-20 sm:py-28">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Editorial summary</p>
            <h2 id="takeaways-title" className="mt-6 text-4xl font-black text-white sm:text-6xl">Key Takeaways</h2>
            <ol className="mt-12 grid border-l border-t border-white/10 md:grid-cols-2">{spotlight.takeaways.map((takeaway, index) => <li key={takeaway} className="min-h-52 border-b border-r border-white/10 p-7 sm:p-9"><span className="font-mono text-xs text-[#ff9a3d]">{String(index + 1).padStart(2, "0")}</span><p className="mt-8 text-xl font-black leading-snug text-white sm:text-2xl">{takeaway}</p></li>)}</ol>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Redaktionelle Zusammenfassung – keine direkten Zitate</p>
          </section>
        )}

        {(spotlight.youtubeUrl || spotlight.spotifyUrl) && (
          <section aria-labelledby="media-title" className="border-b border-white/15 py-20 sm:py-28">
            <div className="grid gap-10 lg:grid-cols-[0.35fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Watch / Listen</p><div><h2 id="media-title" className="text-4xl font-black text-white sm:text-6xl">Das vollständige Gespräch.</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Das Interview ist auf YouTube und Spotify verfügbar. Beide Links führen zu externen Plattformen und öffnen in einem neuen Tab.</p><div className="mt-10 flex flex-col gap-4 sm:flex-row">{spotlight.youtubeUrl && <a href={spotlight.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]">Interview auf YouTube ansehen <span aria-hidden="true" className="ml-3">↗</span><span className="sr-only"> (externer Link, öffnet in neuem Tab)</span></a>}{spotlight.spotifyUrl && <a href={spotlight.spotifyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between rounded-full border border-white/20 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 hover:border-[#ff9a3d] hover:text-[#ffb16b]">Interview auf Spotify anhören <span aria-hidden="true" className="ml-3">↗</span><span className="sr-only"> (externer Link, öffnet in neuem Tab)</span></a>}</div></div></div>
          </section>
        )}

        <footer className="py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Continue exploring</p>
          <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center"><Link href="/goatrecrutainer/career-spotlight" className="inline-flex rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]">← Back to Career Spotlight</Link><Link href="/projects/goatrecrutainer" className="rounded-full border border-white/15 px-5 py-3 font-bold text-slate-200 transition hover:border-[#35d0e5]/60 hover:text-white">GOATRECRUTAINER</Link><Link href="/#contact" className="rounded-full border border-white/15 px-5 py-3 font-bold text-slate-200 transition hover:border-[#ff9a3d]/70 hover:text-white">Get in touch</Link></div>
        </footer>
      </div>
    </article>
  );
}
