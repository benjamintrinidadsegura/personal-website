import type { Metadata } from "next";
import Link from "next/link";
import { PrivacyVideo } from "@/components/spotlight/privacy-video";
import {
  aboutPositioning,
  aboutProjectEvidence,
  ownerStories,
  redThreadExamples,
  values,
} from "@/data/about";
import { nowItems } from "@/data/now";
import { publishedSpotlights } from "@/data/spotlights";
import { siteConfig } from "@/data/site";

const title = "Benjamin Trinidad Segura — About & Work | bts.online";
const description =
  "Benjamin Trinidad Segura verbindet Recruiting, Talent Acquisition, Storytelling und Product Thinking, um fehlenden menschlichen Kontext sichtbar zu machen.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Benjamin Trinidad Segura",
    "GOATRECRUTAINER",
    "RateCom",
    "Recruiting",
    "Talent Acquisition",
    "Product Thinking",
    "Human Context",
  ],
  alternates: { canonical: "/about" },
  openGraph: {
    type: "profile",
    locale: "de_DE",
    url: "/about",
    siteName: "bts.online",
    title,
    description,
    images: [{ url: "/og.png", width: 1732, height: 909, alt: "Benjamin Trinidad Segura — bts.online Digital HQ" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

const personProfiles = siteConfig.socialLinks.filter(({ context }) => context === siteConfig.name);
const goatProfiles = siteConfig.socialLinks.filter(({ context }) => context === "GOATRECRUTAINER");
const goatProject = aboutProjectEvidence.find(({ name }) => name === "GOATRECRUTAINER");
const ratecomProject = aboutProjectEvidence.find(({ name }) => name === "RateCom");

const profileJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": "https://bts.online/about#profile",
      url: "https://bts.online/about",
      name: title,
      description,
      inLanguage: "de",
      mainEntity: { "@id": "https://bts.online/about#benjamin" },
      relatedLink: [
        goatProject?.externalUrl,
        ratecomProject?.externalUrl,
        "https://bts.online/people",
        "https://bts.online/writing",
        "https://bts.online/find-your-next-step",
        "https://bts.online/life-alignment",
      ].filter(Boolean),
    },
    {
      "@type": "Person",
      "@id": "https://bts.online/about#benjamin",
      name: aboutPositioning.name,
      url: "https://bts.online/about",
      description: aboutPositioning.explanation,
      sameAs: personProfiles.map(({ url }) => url),
      knowsAbout: [...aboutPositioning.fields],
      subjectOf: ownerStories.map((story) => ({
        "@type": "VideoObject",
        name: story.video.title,
        url: story.video.url,
        uploadDate: story.publishedAt,
      })),
    },
    {
      "@type": "Brand",
      "@id": "https://bts.online/about#goatrecrutainer",
      name: "GOATRECRUTAINER",
      url: goatProject?.externalUrl,
      sameAs: goatProfiles.map(({ url }) => url),
    },
  ],
};

const internalPaths = [
  { label: "Projects", note: "Produkte, Plattformen und Konzepte", href: "/#building", accent: "text-[#ff9a3d]" },
  { label: "People / Spotlight", note: "Gespräche hinter Rollen und Lebensläufen", href: "/people", accent: "text-[#35d0e5]" },
  { label: "Writing", note: "Field Notes, Essays und Gedanken", href: "/writing", accent: "text-[#b8a5ff]" },
  { label: "Tools", note: "FYNS und Life Alignment ausprobieren", href: "/find-your-next-step", accent: "text-[#77e5b5]" },
] as const;

export default function AboutPage() {
  return (
    <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd).replace(/</gu, "\\u003c") }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[74rem] bg-[radial-gradient(circle_at_78%_12%,rgba(53,208,229,0.17),transparent_31rem),radial-gradient(circle_at_14%_38%,rgba(255,122,0,0.1),transparent_25rem)]"
      />

      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#35d0e5]">About</li>
          </ol>
        </nav>

        <header className="grid min-h-[78svh] grid-cols-1 items-center gap-14 border-b border-white/15 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">About / Benjamin Trinidad Segura</p>
            <h1 className="mt-7 text-[clamp(3.45rem,9vw,8.4rem)] font-black leading-[0.84] tracking-[-0.065em] text-white">
              Make the missing<br /><span className="text-[#35d0e5]">context visible.</span>
            </h1>
          </div>
          <div className="border-l-2 border-[#ff7a00] pl-7 sm:pl-9">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Primary positioning</p>
            <p className="mt-6 text-2xl font-black leading-snug text-white sm:text-4xl">{aboutPositioning.primary}</p>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">{aboutPositioning.explanation}</p>
            <ul aria-label="Arbeitsfelder" className="mt-8 flex flex-wrap gap-x-4 gap-y-2">
              {aboutPositioning.fields.map((field) => <li key={field} className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{field}</li>)}
            </ul>
          </div>
        </header>

        <section aria-labelledby="red-thread-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[0.34fr_1fr] lg:gap-14">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">The red thread</p>
            <div>
              <h2 id="red-thread-title" className="max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-7xl">Die Projekte kamen zuerst. Das Muster wurde später klarer.</h2>
              <div className="mt-8 max-w-4xl space-y-5 text-lg leading-8 text-slate-300">
                <p>Systeme müssen vereinfachen. Schwierig wird es, wenn ein dünnes Signal für den ganzen Menschen gehalten wird: ein Titel für eine Laufbahn, eine Bewertung für eine Erfahrung, eine Auswahl für einen Wunsch.</p>
                <p><strong className="text-white">Human Context</strong> meint das, was eine Entscheidung verändert, sobald es sichtbar wird: Herkunft und Erfahrung, Motive und Unsicherheit, Beziehungen, reale Grenzen und die Bedingungen, unter denen etwas tatsächlich passt.</p>
              </div>
            </div>
          </div>

          <ol className="mt-16 border-t border-white/15">
            {redThreadExamples.map((example, index) => (
              <li key={example.signal} className="grid min-w-0 grid-cols-1 gap-6 border-b border-white/10 py-9 sm:px-5 lg:grid-cols-[0.12fr_0.52fr_0.86fr_0.7fr] lg:items-start">
                <span className="font-mono text-xs text-slate-600">0{index + 1}</span>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">The signal</p><p className="mt-3 text-xl font-black text-white">{example.signal}</p></div>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff9a3d]">What may be missing</p><p className="mt-3 leading-7 text-slate-300">{example.missing}</p></div>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#35d0e5]">The human change</p><p className="mt-3 font-bold leading-7 text-white">{example.change}</p><Link href={example.href} className="mt-4 inline-flex min-h-11 items-center font-bold text-[#35d0e5] hover:text-white">{example.linkLabel} →</Link></div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="thinking-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-[0.42fr_1fr]">
            <div className="min-w-0">
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">How I think</p>
              <h2 id="thinking-title" className="mt-5 [overflow-wrap:anywhere] text-4xl font-black leading-none tracking-[-0.04em] text-white sm:text-6xl">Vier Arbeitsprinzipien. Keine Persönlichkeitswerte.</h2>
              <p className="mt-7 max-w-lg leading-7 text-slate-400">Sie sind aus wiederkehrenden Entscheidungen in den veröffentlichten Formaten und Produkten abgeleitet — nicht als fertige Philosophie rückwirkend über jedes frühere Projekt gelegt.</p>
            </div>
            <ol className="min-w-0 border-l border-t border-white/10 sm:grid sm:grid-cols-2">
              {values.map((value, index) => (
                <li key={value.title} className={`min-h-72 border-b border-r border-white/10 p-7 sm:p-9 ${index === 1 || index === 2 ? "bg-white/[0.02]" : ""}`}>
                  <span className="font-mono text-xs text-[#ff9a3d]">Principle 0{index + 1}</span>
                  <h3 className="mt-10 text-2xl font-black leading-tight text-white sm:text-3xl">{value.title}</h3>
                  <p className="mt-5 leading-7 text-slate-400">{value.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="journey-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-14 lg:grid-cols-[0.52fr_1fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">From recruiting to products</p>
              <h2 id="journey-title" className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl">Nicht vom Jobtitel zur nächsten Schublade.</h2>
            </div>
            <div className="space-y-7 text-lg leading-9 text-slate-300">
              <p>Recruiting und Talent Acquisition bilden einen wichtigen Ausgangspunkt: Kandidat:innen, Unternehmen, Anforderungen, Prozesse und die Frage, warum zwei Seiten wirklich zueinander passen. GOATRECRUTAINER erweitert diese Arbeit um Storytelling, Interviews, Community und die Idee, Menschen eine Bühne zu geben.</p>
              <p>Die späteren digitalen Produkte bearbeiten andere Situationen, stellen aber eine verwandte Frage: <strong className="text-white">Was soll für den Menschen sinnvoll anders werden — und welchen Kontext braucht es dafür?</strong> FYNS ordnet mögliche nächste Schritte. Life Alignment macht heutige Bedingungen und gewünschte Richtung besprechbar. bts.online hält die Beziehungen zwischen diesen Arbeiten sichtbar.</p>
              <aside className="border-l-2 border-[#35d0e5] bg-[#35d0e5]/[0.045] p-6 sm:p-8">
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#35d0e5]">Temporal honesty</p>
                <p className="mt-4 text-xl font-black leading-8 text-white">Das ist eine heutige Synthese aus sichtbarer Arbeit — keine Behauptung, dass jedes Projekt von Anfang an nach einem fertigen „Human Context“-System entworfen wurde.</p>
              </aside>
            </div>
          </div>
        </section>

        <section aria-labelledby="work-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[0.34fr_1fr] lg:gap-14">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">The work as evidence</p>
            <div><h2 id="work-title" className="[overflow-wrap:anywhere] text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">Fünf Arbeiten. Fünf unterschiedliche Kontexte.</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">Nicht als Werbewand, sondern als prüfbare Verbindung zwischen Problem, angestrebter Veränderung und aktuellem Stand.</p></div>
          </div>

          <ol className="mt-16 border-y border-white/15">
            {aboutProjectEvidence.map((project, index) => (
              <li key={project.name} className="grid min-w-0 grid-cols-1 gap-8 border-b border-white/10 py-11 last:border-b-0 lg:grid-cols-[0.16fr_0.45fr_1fr] lg:px-5">
                <div><span className="font-mono text-4xl font-black text-white/10">{String(index + 1).padStart(2, "0")}</span></div>
                <div className="min-w-0"><h3 className="[overflow-wrap:anywhere] text-3xl font-black tracking-[-0.035em] text-white">{project.name}</h3><p className="mt-3 inline-flex rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">{project.status}</p></div>
                <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">Human problem</p><p className="mt-3 leading-7 text-slate-300">{project.problem}</p></div>
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#35d0e5]">Change pursued</p><p className="mt-3 font-bold leading-7 text-white">{project.change}</p><p className="mt-3 text-sm leading-6 text-slate-500">{project.connection}</p></div>
                  <div className="flex flex-wrap gap-4 md:col-span-2">
                    <Link href={project.href} className="inline-flex min-h-11 items-center font-black text-[#35d0e5] hover:text-white">Projektkontext öffnen →</Link>
                    {project.externalUrl ? <a href={project.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-bold text-slate-400 hover:text-white">Öffentliche Website ↗</a> : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="people-connection-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 overflow-hidden rounded-[2rem] border border-white/10 bg-[#071824]/80 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative min-h-80 p-8 sm:p-12 lg:min-h-[34rem]">
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,122,0,0.18),transparent_18rem),radial-gradient(circle_at_78%_72%,rgba(53,208,229,0.16),transparent_20rem)]" />
              <div className="relative flex h-full flex-col justify-between">
                <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">People / Spotlight</p>
                <p aria-label={`${publishedSpotlights.length} veröffentlichte Gespräche`} className="text-[clamp(6rem,17vw,13rem)] font-black leading-none tracking-[-0.08em] text-white">{String(publishedSpotlights.length).padStart(2, "0")}</p>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">veröffentlichte Gespräche · Career + Service</p>
              </div>
            </div>
            <div className="border-t border-white/10 p-8 sm:p-12 lg:border-l lg:border-t-0">
              <h2 id="people-connection-title" className="[overflow-wrap:anywhere] text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl">A title names a role. A conversation reveals a person.</h2>
              <p className="mt-7 text-lg leading-8 text-slate-300">Career Spotlight und Service Spotlight fragen nach Herkunft, Entscheidungen, Arbeit, Ambition und Erfahrung hinter dem sichtbaren Profil. Die Gespräche sind älter als diese heutige Positionierung; rückblickend zeigen sie denselben Impuls: Menschen nicht auf die kürzeste verfügbare Beschreibung zu reduzieren.</p>
              <p className="mt-6 border-l-2 border-[#ff7a00] pl-5 font-bold leading-7 text-white">„Was aus deiner Kindheit muss man wissen, um dich und deinen Lebenslauf zu verstehen?“</p>
              <Link href="/people" className="mt-9 inline-flex min-h-12 items-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]">People / Spotlight entdecken →</Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="sources-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-8 border-b border-white/15 pb-12 lg:grid-cols-[0.34fr_1fr]">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">Source layers</p>
            <div><h2 id="sources-title" className="text-4xl font-black text-white sm:text-6xl">Eigene Worte zuerst. Interpretation danach.</h2><p className="mt-5 max-w-3xl leading-7 text-slate-400">Die beiden Videos haben bewusst unterschiedliches Gewicht: direkte Selbstbeschreibung auf der einen, klar begrenzte AI-assisted Perspektive auf der anderen Seite.</p></div>
          </div>

          <div className="space-y-24 pt-16">
            {ownerStories.map((story, index) => (
              <section key={story.id} aria-labelledby={`${story.id}-title`} className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[0.34fr_1fr]">
                <div>
                  <p className={`font-mono text-xs font-black uppercase tracking-[0.2em] ${index === 0 ? "text-[#ff9a3d]" : "text-[#35d0e5]"}`}>{story.label}</p>
                  <p className="mt-5 text-sm leading-6 text-slate-500">Source order / 0{index + 1}</p>
                  {"originalTitle" in story ? <p className="mt-5 text-sm leading-6 text-slate-500">Original video title:<br />{story.originalTitle}</p> : null}
                </div>
                <div>
                  <h3 id={`${story.id}-title`} className="[overflow-wrap:anywhere] text-4xl font-black leading-tight text-white sm:text-6xl">{story.title}</h3>
                  <p className="mt-7 max-w-3xl text-xl font-bold leading-8 text-slate-200">{story.description}</p>
                  <div className="mt-7 max-w-[74ch] space-y-5 leading-8 text-slate-400">{story.context.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                  {"disclaimer" in story ? <aside aria-label="Einordnung der KI-Perspektive" className="mt-8 border-l-2 border-[#ff7a00] bg-[#ff7a00]/[0.05] p-6"><p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff9a3d]">Perspective boundary</p><p className="mt-4 font-bold leading-7 text-white">{story.disclaimer}</p></aside> : null}
                  <div className="mt-10"><PrivacyVideo {...story.video} /></div>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section aria-labelledby="currently-title" className="border-b border-white/15 py-20 sm:py-24">
          <div className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[0.34fr_1fr]">
            <div><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">Currently</p><h2 id="currently-title" className="mt-5 text-4xl font-black text-white sm:text-6xl">The current signal.</h2><p className="mt-5 max-w-sm leading-7 text-slate-400">Aus derselben kanonischen Now-Quelle wie auf der Startseite — kein zweiter, still veraltender Status.</p></div>
            <ol className="grid min-w-0 grid-cols-1 border-l border-t border-white/10 sm:grid-cols-2">
              {nowItems.map((item, index) => <li key={item.label} className="min-h-48 border-b border-r border-white/10 p-6 sm:p-8"><span className="font-mono text-xs text-slate-600">0{index + 1}</span><p className={`mt-8 font-mono text-xs font-black uppercase tracking-[0.2em] ${item.accent === "cyan" ? "text-[#35d0e5]" : "text-[#ff9a3d]"}`}>{item.label}</p><p className="mt-4 text-xl font-black leading-7 text-white">{item.text}</p></li>)}
            </ol>
          </div>
        </section>

        <section aria-labelledby="explore-title" className="py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-[1fr_0.72fr]">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">Explore the HQ</p>
              <h2 id="explore-title" className="mt-5 max-w-4xl [overflow-wrap:anywhere] text-5xl font-black leading-[0.94] tracking-[-0.045em] text-white sm:text-7xl">Follow the work, not just the bio.</h2>
              <nav aria-label="Bereiche im Digital HQ" className="mt-12 grid min-w-0 grid-cols-1 border-l border-t border-white/10 sm:grid-cols-2">
                {internalPaths.map((path) => <Link key={path.label} href={path.href} className="group min-h-40 border-b border-r border-white/10 p-6 transition hover:bg-white/[0.025]"><span className={`font-mono text-xs font-black uppercase tracking-[0.18em] ${path.accent}`}>{path.label}</span><span className="mt-6 block font-bold leading-7 text-slate-300">{path.note}</span><span aria-hidden="true" className="mt-4 block text-white transition-transform group-hover:translate-x-1">→</span></Link>)}
              </nav>
            </div>
            <aside aria-labelledby="connect-title" className="rounded-[2rem] border border-white/10 bg-[#071824]/75 p-7 sm:p-9">
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#35d0e5]">Connect / Verified profiles</p>
              <h3 id="connect-title" className="mt-5 [overflow-wrap:anywhere] text-3xl font-black text-white">Benjamin & GOATRECRUTAINER</h3>
              <ul className="mt-8 grid min-w-0 grid-cols-1 gap-3">
                {siteConfig.socialLinks.map((social) => <li key={social.label}><a href={social.url} target="_blank" rel="noopener noreferrer" className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-white/10 px-5 py-3 transition hover:border-[#35d0e5]/60 focus-visible:outline-[#35d0e5]"><span><strong className="block text-white">{social.label}</strong><span className="mt-1 block text-xs text-slate-500">{social.context}</span></span><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#35d0e5]">External ↗</span></a></li>)}
              </ul>
              <div className="mt-8 grid min-w-0 grid-cols-1 gap-3">
                <a href={goatProject?.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#ff9a3d]/50 px-5 py-3 text-center font-black text-white hover:border-[#ff9a3d]">GOATRECRUTAINER ↗</a>
                <a href={ratecomProject?.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-5 py-3 text-center font-black text-white hover:border-[#35d0e5]">RateCom ↗</a>
                <Link href="/#contact" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#35d0e5] px-5 py-3 text-center font-black text-[#041018] hover:bg-[#73e3f1]">Kontakt aufnehmen</Link>
              </div>
              <p className="mt-6 text-sm leading-6 text-slate-500">Booking bleibt geschlossen, solange keine verifizierte öffentliche Termin-URL vorliegt.</p>
            </aside>
          </div>
        </section>
      </div>
    </article>
  );
}
