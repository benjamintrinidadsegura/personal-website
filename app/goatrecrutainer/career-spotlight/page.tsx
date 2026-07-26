import type { Metadata } from "next";
import Link from "next/link";
import { careerSpotlightConfig, careerSpotlights } from "@/data/career-spotlights";

const description = "Menschen, Karrierewege und die Geschichten hinter Lebensläufen. Career Spotlight erzählt von Entscheidungen, Wendepunkten, Entwicklung und dem Potenzial hinter beruflichen Wegen.";

export const metadata: Metadata = {
  title: "Career Spotlight | GOATRECRUTAINER",
  description,
  alternates: { canonical: "/goatrecrutainer/career-spotlight" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/goatrecrutainer/career-spotlight",
    siteName: "bts.online",
    title: "Career Spotlight | GOATRECRUTAINER",
    description,
    images: [{ url: "/og.png", width: 1732, height: 909, alt: "Benjamin Trinidad Segura – Digital HQ" }],
  },
  twitter: { card: "summary_large_image", title: "Career Spotlight | GOATRECRUTAINER", description, images: ["/og.png"] },
};

export default function CareerSpotlightPage() {
  const publishedSpotlights = careerSpotlights.filter((entry) => entry.status === "published");

  return (
    <article className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[46rem] bg-[radial-gradient(circle_at_72%_24%,rgba(53,208,229,0.14),transparent_24rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2"><li><Link href="/#building" className="hover:text-white">Digital HQ</Link></li><li aria-hidden="true">/</li><li><Link href="/projects/goatrecrutainer" className="hover:text-white">GOATRECRUTAINER</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="text-[#35d0e5]">Career Spotlight</li></ol>
        </nav>

        <header className="grid min-h-[72svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div><p className="text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">GOATRECRUTAINER / Format 01</p><h1 className="mt-7 text-[clamp(3.2rem,9vw,8rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">Career<br />Spotlight</h1><p className="mt-8 max-w-3xl text-xl font-black leading-snug text-white sm:text-3xl">{careerSpotlightConfig.description}</p></div>
          <aside className="border-l border-[#35d0e5] pl-7"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Editorial premise</p><p className="mt-6 text-2xl font-black leading-snug text-white sm:text-3xl">{careerSpotlightConfig.introduction}</p><p className="mt-6 leading-7 text-slate-400">Entscheidungen, Wendepunkte, Rückschläge, Chancen und Erfahrungen erzählen, was zwischen den Stationen eines Lebenslaufs liegt.</p></aside>
        </header>

        <section aria-labelledby="why-title" className="grid gap-10 border-b border-white/15 py-20 lg:grid-cols-[0.4fr_1fr]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Why it exists</p>
          <div><h2 id="why-title" className="max-w-4xl text-4xl font-black leading-tight text-white sm:text-6xl">A résumé is a record. A story reveals the person.</h2><p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">Klassische Lebensläufe zeigen Positionen und Zeiträume. Sie zeigen jedoch selten, woher ein Mensch kommt, welche Erfahrungen ihn geprägt haben, welche Risiken hinter Entscheidungen standen und welches Potenzial auf dem Papier unsichtbar bleibt.</p></div>
        </section>

        <section aria-labelledby="question-title" className="border-b border-white/15 py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">The recurring question</p>
          <h2 id="question-title" className="mt-8 max-w-6xl text-[clamp(2.25rem,6vw,5.4rem)] font-black leading-[1.02] tracking-[-0.035em] text-white">„{careerSpotlightConfig.guidingQuestion}“</h2>
        </section>

        <section aria-labelledby="topics-title" className="border-b border-white/15 py-20">
          <div className="grid gap-8 lg:grid-cols-[0.4fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Editorial lens</p><h2 id="topics-title" className="text-4xl font-black text-white sm:text-5xl">What the conversations explore.</h2></div>
          <ol className="mt-12 grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">{careerSpotlightConfig.topics.map((topic, index) => <li key={topic} className="min-h-44 border-b border-r border-white/10 p-7"><span className="font-mono text-xs text-[#35d0e5]">0{index + 1}</span><p className="mt-9 text-2xl font-black text-white">{topic}</p></li>)}</ol>
        </section>

        <section aria-labelledby="archive-title" className="py-20">
          <div className="grid gap-8 lg:grid-cols-[0.4fr_1fr]"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Interview archive / {publishedSpotlights.length.toString().padStart(2, "0")}</p><div><h2 id="archive-title" className="text-4xl font-black text-white sm:text-5xl">Stories behind the résumés.</h2>{publishedSpotlights.length === 0 ? <div className="mt-10 border-l-2 border-[#35d0e5] bg-white/[0.025] p-7 sm:p-9"><p className="text-2xl font-black text-white">First stories coming soon.</p><p className="mt-4 max-w-2xl leading-7 text-slate-300">Die ersten Gespräche und Geschichten werden gerade vorbereitet. Hier entsteht ein wachsendes Archiv über Karrierewege, Wendepunkte und die Menschen hinter Lebensläufen.</p></div> : <div className="mt-10 grid border-l border-t border-white/10 md:grid-cols-2">{publishedSpotlights.map((spotlight) => <Link key={spotlight.slug} href={`/goatrecrutainer/career-spotlight/${spotlight.slug}`} className="group relative block border-b border-r border-white/10 bg-white/[0.015] p-7 transition duration-300 hover:bg-[#35d0e5]/[0.06] focus-visible:bg-[#35d0e5]/[0.06] sm:p-9"><article className="flex min-h-80 flex-col"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-xs uppercase tracking-[0.18em] text-[#35d0e5]">Career Spotlight</p>{spotlight.editionLabel && <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#ff9a3d]">{spotlight.editionLabel}</p>}</div><h3 className="mt-9 text-3xl font-black text-white sm:text-4xl">{spotlight.name}</h3><p className="mt-3 font-bold text-slate-200">{spotlight.professionalContext}</p><p className="mt-6 max-w-xl leading-7 text-slate-400">{spotlight.teaser}</p><p className="mt-auto pt-10 font-black text-white transition group-hover:text-[#35d0e5]">Read the story <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span></p></article></Link>)}</div>}</div></div>
        </section>

        <section aria-labelledby="story-title" className="border-y border-white/15 bg-[linear-gradient(120deg,rgba(53,208,229,0.1),rgba(255,122,0,0.045))] px-6 py-14 sm:px-10 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Open invitation</p><h2 id="story-title" className="mt-6 text-4xl font-black text-white sm:text-6xl">Tell your story</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Für Menschen mit ungewöhnlichen, besonderen oder lehrreichen Karrierewegen — und mit Geschichten, die hinter einem klassischen Lebenslauf oft unsichtbar bleiben.</p><Link href="/#contact" className="mt-9 inline-flex rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]">Get in touch <span aria-hidden="true" className="ml-2">↗</span></Link>
        </section>

        <div className="mt-12 flex flex-wrap gap-4"><Link href="/projects/goatrecrutainer" className="rounded-full border border-white/15 px-5 py-3 font-bold text-slate-200 hover:border-[#35d0e5]/50">← GOATRECRUTAINER</Link><Link href="/#building" className="rounded-full border border-white/15 px-5 py-3 font-bold text-slate-200 hover:border-[#35d0e5]/50">Digital HQ</Link></div>
      </div>
    </article>
  );
}
