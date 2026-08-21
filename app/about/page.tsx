import type { Metadata } from "next";
import Link from "next/link";
import { PrivacyVideo } from "@/components/spotlight/privacy-video";
import { getAboutContent, getAboutPageCopy } from "@/data/i18n/about";
import { getHomeCopy } from "@/data/i18n/home";
import { publishedSpotlights } from "@/data/spotlights";
import { siteConfig } from "@/data/site";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocalizedPathname, localizeHref } from "@/lib/i18n/routing";
import type { Locale } from "@/lib/i18n/config";

const aboutUtilityCopy: Record<Locale, { breadcrumb: string; external: string; bookingBoundary: string }> = {
  de: { breadcrumb: "Brotkrümelnavigation", external: "Extern", bookingBoundary: "Booking bleibt geschlossen, solange keine verifizierte öffentliche Termin-URL vorliegt." },
  en: { breadcrumb: "Breadcrumb", external: "External", bookingBoundary: "Booking remains closed until a verified public scheduling URL is available." },
  es: { breadcrumb: "Ruta de navegación", external: "Externo", bookingBoundary: "La reserva permanece cerrada mientras no exista un enlace público verificado." },
  tr: { breadcrumb: "Sayfa yolu", external: "Harici", bookingBoundary: "Doğrulanmış herkese açık bir randevu bağlantısı bulunana kadar rezervasyon kapalı kalır." },
  pl: { breadcrumb: "Okruszki nawigacyjne", external: "Zewnętrzne", bookingBoundary: "Rezerwacja pozostaje zamknięta, dopóki nie będzie zweryfikowanego publicznego linku." },
  el: { breadcrumb: "Διαδρομή πλοήγησης", external: "Εξωτερικό", bookingBoundary: "Η κράτηση παραμένει κλειστή μέχρι να υπάρχει επαληθευμένος δημόσιος σύνδεσμος." },
  ru: { breadcrumb: "Навигационная цепочка", external: "Внешний ресурс", bookingBoundary: "Запись остаётся закрытой, пока не появится проверенная публичная ссылка." },
};
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getAboutPageCopy(locale);
  return {
    ...createLocalizedMetadata({ locale, pathname: "/about", title: copy.title, description: copy.description, type: "profile" }),
    keywords: [
    "Benjamin Trinidad Segura",
    "GOATRECRUTAINER",
    "RateCom",
    "Recruiting",
    "Talent Acquisition",
    "Product Thinking",
    "Human Context",
    ],
  };
}

const personProfiles = siteConfig.socialLinks.filter(({ context }) => context === siteConfig.name);
const goatProfiles = siteConfig.socialLinks.filter(({ context }) => context === "GOATRECRUTAINER");
const pathAccents = ["text-[#ff9a3d]", "text-[#35d0e5]", "text-[#b8a5ff]", "text-[#77e5b5]"] as const;

export default async function AboutPage() {
  const locale = await getLocale();
  const copy = getAboutPageCopy(locale);
  const { positioning, projectEvidence, ownerStories, redThreadExamples, values } = getAboutContent(locale);
  const now = getHomeCopy(locale).now;
  const utilityCopy = aboutUtilityCopy[locale];
  const goatProject = projectEvidence.find(({ name }) => name === "GOATRECRUTAINER");
  const ratecomProject = projectEvidence.find(({ name }) => name === "RateCom");
  const canonicalPath = getLocalizedPathname("/about", locale);
  const canonical = `https://bts.online${canonicalPath}`;
  const personEntityId = "https://bts.online/about#benjamin";
  const brandEntityId = "https://bts.online/#goatrecrutainer";
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage", "@id": `${canonical}#profile`, url: canonical,
        name: copy.title, description: copy.description, inLanguage: locale,
        mainEntity: { "@id": personEntityId },
        relatedLink: [goatProject?.externalUrl, ratecomProject?.externalUrl, ...["/people", "/writing", "/find-your-next-step", "/life-alignment"].map((path) => `https://bts.online${getLocalizedPathname(path, locale)}`)].filter(Boolean),
      },
      {
        "@type": "Person", "@id": personEntityId, name: positioning.name, url: "https://bts.online/about",
        description: positioning.explanation, sameAs: personProfiles.map(({ url }) => url),
        knowsAbout: [...positioning.fields], subjectOf: ownerStories.map((story) => ({
          "@type": "VideoObject", name: story.video.title, url: story.video.url,
          uploadDate: story.publishedAt, inLanguage: story.sourceLanguage,
        })),
      },
      { "@type": "Brand", "@id": brandEntityId, name: "GOATRECRUTAINER", url: goatProject?.externalUrl, sameAs: goatProfiles.map(({ url }) => url) },
      {
        "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Digital HQ", item: "https://bts.online/" },
          { "@type": "ListItem", position: 2, name: copy.breadcrumb, item: canonical },
        ],
      },
    ],
  };
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
        <nav aria-label={utilityCopy.breadcrumb} className="font-mono text-xs text-slate-400">
          <ol className="flex items-center gap-2">
            <li><Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#35d0e5]">{copy.breadcrumb}</li>
          </ol>
        </nav>

        <header className="grid min-h-[78svh] grid-cols-1 items-center gap-14 border-b border-white/15 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">{copy.heroEyebrow}</p>
            <h1 className="mt-7 text-[clamp(3.45rem,9vw,8.4rem)] font-black leading-[0.84] tracking-[-0.065em] text-white">
              {copy.heroLineOne}<br /><span className="text-[#35d0e5]">{copy.heroLineTwo}</span>
            </h1>
          </div>
          <div className="border-l-2 border-[#ff7a00] pl-7 sm:pl-9">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.primaryPositioning}</p>
            <p className="mt-6 text-2xl font-black leading-snug text-white sm:text-4xl">{positioning.primary}</p>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">{positioning.explanation}</p>
            <ul aria-label={copy.fieldsLabel} className="mt-8 flex flex-wrap gap-x-4 gap-y-2">
              {positioning.fields.map((field) => <li key={field} className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{field}</li>)}
            </ul>
          </div>
        </header>

        <section aria-labelledby="red-thread-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[0.34fr_1fr] lg:gap-14">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.redThread}</p>
            <div>
              <h2 id="red-thread-title" className="max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-7xl">{copy.redThreadTitle}</h2>
              <div className="mt-8 max-w-4xl space-y-5 text-lg leading-8 text-slate-300">
                {copy.redThreadParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </div>
          </div>

          <ol className="mt-16 border-t border-white/15">
            {redThreadExamples.map((example, index) => (
              <li key={example.signal} className="grid min-w-0 grid-cols-1 gap-6 border-b border-white/10 py-9 sm:px-5 lg:grid-cols-[0.12fr_0.52fr_0.86fr_0.7fr] lg:items-start">
                <span className="font-mono text-xs text-slate-600">0{index + 1}</span>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{copy.signal}</p><p className="mt-3 text-xl font-black text-white">{example.signal}</p></div>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff9a3d]">{copy.missing}</p><p className="mt-3 leading-7 text-slate-300">{example.missing}</p></div>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#35d0e5]">{copy.change}</p><p className="mt-3 font-bold leading-7 text-white">{example.change}</p><Link href={localizeHref(example.href, locale)} className="mt-4 inline-flex min-h-11 items-center font-bold text-[#35d0e5] hover:text-white">{example.linkLabel} →</Link></div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="thinking-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-[0.42fr_1fr]">
            <div className="min-w-0">
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">{copy.thinking}</p>
              <h2 id="thinking-title" className="mt-5 [overflow-wrap:anywhere] text-4xl font-black leading-none tracking-[-0.04em] text-white sm:text-6xl">{copy.thinkingTitle}</h2>
              <p className="mt-7 max-w-lg leading-7 text-slate-400">{copy.thinkingDescription}</p>
            </div>
            <ol className="min-w-0 border-l border-t border-white/10 sm:grid sm:grid-cols-2">
              {values.map((value, index) => (
                <li key={value.title} className={`min-h-72 border-b border-r border-white/10 p-7 sm:p-9 ${index === 1 || index === 2 ? "bg-white/[0.02]" : ""}`}>
                  <span className="font-mono text-xs text-[#ff9a3d]">{copy.principle} 0{index + 1}</span>
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
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.journey}</p>
              <h2 id="journey-title" className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl">{copy.journeyTitle}</h2>
            </div>
            <div className="space-y-7 text-lg leading-9 text-slate-300">
              {copy.journeyParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <aside className="border-l-2 border-[#35d0e5] bg-[#35d0e5]/[0.045] p-6 sm:p-8">
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#35d0e5]">{copy.temporalHonesty}</p>
                <p className="mt-4 text-xl font-black leading-8 text-white">{copy.temporalNote}</p>
              </aside>
            </div>
          </div>
        </section>

        <section aria-labelledby="work-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[0.34fr_1fr] lg:gap-14">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">{copy.work}</p>
            <div><h2 id="work-title" className="[overflow-wrap:anywhere] text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">{copy.workTitle}</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">{copy.workDescription}</p></div>
          </div>

          <ol className="mt-16 border-y border-white/15">
            {projectEvidence.map((project, index) => (
              <li key={project.name} className="grid min-w-0 grid-cols-1 gap-8 border-b border-white/10 py-11 last:border-b-0 lg:grid-cols-[0.16fr_0.45fr_1fr] lg:px-5">
                <div><span className="font-mono text-4xl font-black text-white/10">{String(index + 1).padStart(2, "0")}</span></div>
                <div className="min-w-0"><h3 className="[overflow-wrap:anywhere] text-3xl font-black tracking-[-0.035em] text-white">{project.name}</h3><p className="mt-3 inline-flex rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">{project.status}</p></div>
                <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">{copy.humanProblem}</p><p className="mt-3 leading-7 text-slate-300">{project.problem}</p></div>
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#35d0e5]">{copy.changePursued}</p><p className="mt-3 font-bold leading-7 text-white">{project.change}</p><p className="mt-3 text-sm leading-6 text-slate-500">{project.connection}</p></div>
                  <div className="flex flex-wrap gap-4 md:col-span-2">
                    <Link href={localizeHref(project.href, locale)} className="inline-flex min-h-11 items-center font-black text-[#35d0e5] hover:text-white">{copy.openProject} →</Link>
                    {project.externalUrl ? <a href={project.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-bold text-slate-400 hover:text-white">{copy.publicWebsite} ↗</a> : null}
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
                <p aria-label={`${publishedSpotlights.length} ${copy.publishedConversations}`} className="text-[clamp(6rem,17vw,13rem)] font-black leading-none tracking-[-0.08em] text-white">{String(publishedSpotlights.length).padStart(2, "0")}</p>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">{copy.publishedConversations}</p>
              </div>
            </div>
            <div className="border-t border-white/10 p-8 sm:p-12 lg:border-l lg:border-t-0">
              <h2 id="people-connection-title" className="[overflow-wrap:anywhere] text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl">{copy.peopleTitle}</h2>
              <p className="mt-7 text-lg leading-8 text-slate-300">{copy.peopleDescription}</p>
              <p className="mt-6 border-l-2 border-[#ff7a00] pl-5 font-bold leading-7 text-white">{copy.peopleQuestion}</p>
              <Link href={localizeHref("/people", locale)} className="mt-9 inline-flex min-h-12 items-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]">{copy.peopleCta} →</Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="sources-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-8 border-b border-white/15 pb-12 lg:grid-cols-[0.34fr_1fr]">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.sources}</p>
            <div><h2 id="sources-title" className="text-4xl font-black text-white sm:text-6xl">{copy.sourcesTitle}</h2><p className="mt-5 max-w-3xl leading-7 text-slate-400">{copy.sourcesDescription}</p></div>
          </div>

          <div className="space-y-24 pt-16">
            {ownerStories.map((story, index) => (
              <section key={story.id} aria-labelledby={`${story.id}-title`} className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[0.34fr_1fr]">
                <div>
                  <p className={`font-mono text-xs font-black uppercase tracking-[0.2em] ${index === 0 ? "text-[#ff9a3d]" : "text-[#35d0e5]"}`}>{story.label}</p>
                  <p className="mt-5 text-sm leading-6 text-slate-500">{copy.sourceOrder} / 0{index + 1}</p>
                  {"originalTitle" in story ? <p className="mt-5 text-sm leading-6 text-slate-500">{copy.originalVideoTitle}:<br /><span lang="de">{story.originalTitle}</span></p> : null}
                </div>
                <div>
                  <h3 id={`${story.id}-title`} className="[overflow-wrap:anywhere] text-4xl font-black leading-tight text-white sm:text-6xl">{story.title}</h3>
                  <p className="mt-7 max-w-3xl text-xl font-bold leading-8 text-slate-200">{story.description}</p>
                  <div className="mt-7 max-w-[74ch] space-y-5 leading-8 text-slate-400">{story.context.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                  {"disclaimer" in story ? <aside aria-label={copy.perspectiveBoundary} className="mt-8 border-l-2 border-[#ff7a00] bg-[#ff7a00]/[0.05] p-6"><p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff9a3d]">{copy.perspectiveBoundary}</p><p className="mt-4 font-bold leading-7 text-white">{story.disclaimer}</p></aside> : null}
                  <div className="mt-10" lang={story.sourceLanguage}><PrivacyVideo {...story.video} /></div>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section aria-labelledby="currently-title" className="border-b border-white/15 py-20 sm:py-24">
          <div className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[0.34fr_1fr]">
            <div><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">{copy.currently}</p><h2 id="currently-title" className="mt-5 text-4xl font-black text-white sm:text-6xl">{copy.currentSignal}</h2><p className="mt-5 max-w-sm leading-7 text-slate-400">{copy.currentDescription}</p></div>
            <ol className="grid min-w-0 grid-cols-1 border-l border-t border-white/10 sm:grid-cols-2">
              {now.items.map((item, index) => <li key={item} className="min-h-48 border-b border-r border-white/10 p-6 sm:p-8"><span className="font-mono text-xs text-slate-600">0{index + 1}</span><p className={`mt-8 font-mono text-xs font-black uppercase tracking-[0.2em] ${index % 2 === 0 ? "text-[#35d0e5]" : "text-[#ff9a3d]"}`}>{now.labels[index]}</p><p className="mt-4 text-xl font-black leading-7 text-white">{item}</p></li>)}
            </ol>
          </div>
        </section>

        <section aria-labelledby="explore-title" className="py-20 sm:py-28">
          <div className="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-[1fr_0.72fr]">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.paths}</p>
              <h2 id="explore-title" className="mt-5 max-w-4xl [overflow-wrap:anywhere] text-5xl font-black leading-[0.94] tracking-[-0.045em] text-white sm:text-7xl">{copy.pathsTitle}</h2>
              <nav aria-label={copy.paths} className="mt-12 grid min-w-0 grid-cols-1 border-l border-t border-white/10 sm:grid-cols-2">
                {copy.pathItems.map((path, index) => <Link key={path.label} href={localizeHref(path.href, locale)} className="group min-h-40 border-b border-r border-white/10 p-6 transition hover:bg-white/[0.025]"><span className={`font-mono text-xs font-black uppercase tracking-[0.18em] ${pathAccents[index]}`}>{path.label}</span><span className="mt-6 block font-bold leading-7 text-slate-300">{path.note}</span><span aria-hidden="true" className="mt-4 block text-white transition-transform group-hover:translate-x-1">→</span></Link>)}
              </nav>
            </div>
            <aside aria-labelledby="connect-title" className="rounded-[2rem] border border-white/10 bg-[#071824]/75 p-7 sm:p-9">
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#35d0e5]">{copy.contactEyebrow} / Verified profiles</p>
              <h3 id="connect-title" className="mt-5 [overflow-wrap:anywhere] text-3xl font-black text-white">Benjamin & GOATRECRUTAINER</h3>
              <ul className="mt-8 grid min-w-0 grid-cols-1 gap-3">
                {siteConfig.socialLinks.map((social) => <li key={social.label}><a href={social.url} target="_blank" rel="noopener noreferrer" className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-white/10 px-5 py-3 transition hover:border-[#35d0e5]/60 focus-visible:outline-[#35d0e5]"><span><strong className="block text-white">{social.label}</strong><span className="mt-1 block text-xs text-slate-500">{social.context}</span></span><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#35d0e5]">{utilityCopy.external} ↗</span></a></li>)}
              </ul>
              <div className="mt-8 grid min-w-0 grid-cols-1 gap-3">
                <a href={goatProject?.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#ff9a3d]/50 px-5 py-3 text-center font-black text-white hover:border-[#ff9a3d]">GOATRECRUTAINER ↗</a>
                <a href={ratecomProject?.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-5 py-3 text-center font-black text-white hover:border-[#35d0e5]">RateCom ↗</a>
                <Link href={localizeHref("/#contact", locale)} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#35d0e5] px-5 py-3 text-center font-black text-[#041018] hover:bg-[#73e3f1]">{copy.contactCta}</Link>
              </div>
              <p className="mt-6 text-sm leading-6 text-slate-500">{utilityCopy.bookingBoundary}</p>
            </aside>
          </div>
        </section>
      </div>
    </article>
  );
}
