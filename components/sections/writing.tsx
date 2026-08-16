import Link from "next/link";
import { writingEntries } from "@/data/writing";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getPublishedWriting } from "@/lib/writing/queries";
import type { PublicWritingSummary } from "@/types/writing";

export async function Writing({ publishedWriting }: { publishedWriting?: readonly PublicWritingSummary[] }) {
  const published = (publishedWriting ?? await getPublishedWriting()).slice(0, 3);
  return (
    <section id="writing" aria-labelledby="writing-title" className="border-t border-white/10 bg-[#081a28] px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div id="writing-title"><SectionHeading eyebrow="Writing / Field Notes" title="Thoughts worth keeping, questions worth sharing." description="Ein digitales Magazin für Gedanken über Arbeit, Identität, Mut und die Geschichten, die wir über uns selbst erzählen." /></div>
        <div className="mt-16 border-t border-white/15">
          {(published.length ? published : writingEntries).map((entry, index) => {
            const isPublished = "slug" in entry;
            const content = <article className="group grid gap-5 border-b border-white/15 py-9 transition hover:bg-white/[0.025] sm:px-4 lg:grid-cols-[5rem_0.65fr_1.1fr_0.45fr] lg:items-center">
              <span className="font-mono text-sm text-[#35d0e5]">0{index + 1}</span>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff9a3d]">{isPublished ? `${entry.contentType} · ${entry.topics.join(" · ")}` : entry.category}</p>
              <div><h3 className="text-2xl font-black text-white sm:text-3xl">{entry.title}</h3><p className="mt-3 max-w-2xl leading-7 text-slate-300">{entry.excerpt}</p></div>
              <div className="lg:text-right"><span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{isPublished ? `${entry.readingMinutes} Min. Lesezeit` : entry.state}</span><p className="mt-3 font-bold text-[#35d0e5]">{isPublished ? "Read article" : "Preview"} <span aria-hidden="true">→</span></p></div>
            </article>;
            return isPublished ? <Link key={entry.id} href={`/writing/${entry.slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]">{content}</Link> : <div key={entry.title}>{content}</div>;
          })}
        </div>
        <Link href="/writing" className="mt-10 inline-flex min-h-11 items-center rounded-full border border-white/20 px-6 font-black text-white transition hover:border-[#35d0e5]">Explore Writing →</Link>
      </Reveal>
    </section>
  );
}
