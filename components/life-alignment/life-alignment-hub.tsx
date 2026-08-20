"use client";
import { lifeUiValue } from "@/data/i18n/life-alignment-ui";
import type { CSSProperties } from "react";
import Link from "next/link";
import { LifeAlignmentContext } from "@/components/life-alignment/life-alignment-context";
import type { AvailableLifeAlignmentModule } from "@/data/life-alignment-modules";
import { getLifeAlignmentHubContent } from "@/data/i18n/life-alignment-modules";
import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";
const moduleAccents = {
    self: "#f5b971",
    partner: "#74d8c8",
    "life-vision": "#b9a5ff",
} as const;
function ActiveModuleCard({ module, index, href, locale }: {
    module: AvailableLifeAlignmentModule;
    index: number;
    href: string;
    locale: Locale;
}) {
    const accent = moduleAccents[module.id as keyof typeof moduleAccents] ?? "#f5b971";
    return (<li>
      <Link href={href} aria-label={`${lifeUiValue(locale, "Open", "öffnen")} ${module.title}`} style={{
            "--module-accent": accent,
            background: `linear-gradient(145deg, ${accent}16, rgba(255,255,255,0.012) 58%)`,
        } as CSSProperties} className="group relative flex h-full min-h-[30rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 p-6 transition-[border-color,transform] motion-safe:duration-300 motion-safe:hover:-translate-y-1 motion-reduce:transform-none hover:border-[var(--module-accent)]/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--module-accent)] sm:p-8">
        <span aria-hidden="true" className="absolute -right-5 -top-10 font-mono text-[9rem] font-black leading-none text-[var(--module-accent)] opacity-[0.055]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="relative flex flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--module-accent)]">{module.mode}</p>
            <span className="rounded-full border border-[var(--module-accent)]/35 bg-[var(--module-accent)]/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--module-accent)]">
              {module.statusLabel}
            </span>
          </div>

          <h2 className="mt-14 text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">{module.title}</h2>
          <p className="mt-5 flex-1 text-base leading-7 text-slate-300">{module.purpose}</p>

          <dl className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-sm leading-6">
            <div>
              <dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{lifeUiValue(locale, "For whom", "Für wen")}</dt>
              <dd className="mt-1 text-slate-200">{module.audience}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{lifeUiValue(locale, "Privacy", "Privatsphäre")}</dt>
              <dd className="mt-1 text-slate-200">{module.privacy}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{lifeUiValue(locale, "Scope", "Umfang")}</dt>
              <dd className="mt-1 text-slate-200">{module.duration}</dd>
            </div>
          </dl>

          <span className="mt-8 inline-flex min-h-11 items-center font-mono text-xs font-black uppercase tracking-[0.18em] text-[var(--module-accent)]">
            {lifeUiValue(locale, "Open perspective", "Perspektive öffnen")} <span aria-hidden="true" className="ml-2 transition-transform motion-safe:group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Link>
    </li>);
}
export function LifeAlignmentHub() {
    const locale = useLocale();
    const localizeHref = useLocalizedHref();
    const { hub: lifeAlignmentHub, available: availableLifeAlignmentModules, future: futureLifeAlignmentModules } = getLifeAlignmentHubContent(locale);
    return (<article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[58rem] bg-[radial-gradient(circle_at_82%_12%,rgba(245,185,113,0.15),transparent_28rem),radial-gradient(circle_at_15%_34%,rgba(116,216,200,0.08),transparent_24rem),radial-gradient(circle_at_58%_60%,rgba(185,165,255,0.07),transparent_24rem)]"/>

      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label={lifeUiValue(locale, "Breadcrumb", "Brotkrümelnavigation")} className="font-mono text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href={localizeHref("/")} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#f5b971]">Life Alignment</li>
          </ol>
        </nav>

        <header className="grid min-h-[66svh] items-center gap-14 border-b border-white/15 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-[#f5b971]">{lifeAlignmentHub.eyebrow}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Modular V1 · Beta</span>
            </div>
            <h1 className="mt-7 text-[clamp(3.6rem,9vw,8rem)] font-black leading-[0.86] tracking-[-0.06em] text-white">
              Life<br />Alignment.
            </h1>
            <p className="mt-8 max-w-3xl text-2xl font-black leading-tight text-white sm:text-4xl">{lifeAlignmentHub.title}</p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{lifeAlignmentHub.description}</p>
          </div>

          <aside aria-labelledby="life-modes-title" className="border-l border-[#f5b971] pl-7 sm:pl-9">
            <p id="life-modes-title" className="font-mono text-xs uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Three perspectives", "Drei Blickrichtungen")}</p>
            <ol className="mt-7 grid gap-5">
              {availableLifeAlignmentModules.map((module, index) => (<li key={module.id} className="grid grid-cols-[2rem_1fr] gap-4 border-b border-white/10 pb-5">
                  <span aria-hidden="true" className="font-mono text-xs text-slate-600">0{index + 1}</span>
                  <div>
                    <p className="font-black text-white">{module.mode}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{module.shortTitle}</p>
                  </div>
                </li>))}
            </ol>
          </aside>
        </header>

        <div className="border-b border-white/15 py-12 sm:py-16">
          <LifeAlignmentContext priority/>
        </div>

        <section aria-labelledby="life-active-title" className="border-b border-white/15 py-20 sm:py-28">
          <div className="grid gap-6 lg:grid-cols-[0.36fr_1fr] lg:gap-12">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">ME · WE · WHERE I AM GOING</p>
            <div>
              <h2 id="life-active-title" className="text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">{lifeUiValue(locale, "Choose the perspective that fits your question.", "Wähle die Perspektive, die zu deiner Frage passt.")}</h2>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{lifeUiValue(locale, "The three modules share a stance, but not the same questions or results.", "Die drei Module teilen eine Haltung, aber nicht dieselben Fragen oder Ergebnisse.")}</p>
            </div>
          </div>

          <ol className="mt-14 grid gap-6 lg:grid-cols-3">
            {availableLifeAlignmentModules.map((module, index) => <ActiveModuleCard key={module.id} module={module} index={index} href={localizeHref(module.href)} locale={locale}/>)}
          </ol>
        </section>

        <section aria-labelledby="life-future-title" className="border-b border-white/15 py-20 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.44fr_1fr] lg:gap-14">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-slate-500">{lifeUiValue(locale, "Part of the product family", "Teil der Produktfamilie")}</p>
              <h2 id="life-future-title" className="mt-5 text-3xl font-black text-white sm:text-5xl">{lifeUiValue(locale, "More contexts will follow later.", "Weitere Kontexte kommen später.")}</h2>
              <p className="mt-5 max-w-xl leading-7 text-slate-400">{lifeUiValue(locale, "These perspectives are part of the committed direction for Life Alignment. Their journeys are intentionally not available in V1.", "Diese Perspektiven gehören zur verbindlichen Richtung von Life Alignment. Ihre Journeys sind in V1 bewusst noch nicht verfügbar.")}</p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2" aria-label={lifeUiValue(locale, "Future Life Alignment modules", "Spätere Life-Alignment-Module")}>
              {futureLifeAlignmentModules.map((module) => (<li key={module.id} className="rounded-2xl border border-dashed border-white/15 bg-[#061521]/45 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-slate-200">{module.title}</h3>
                    <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{module.statusLabel}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{module.purpose}</p>
                </li>))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="life-principle-title" className="grid gap-10 py-20 lg:grid-cols-[0.36fr_1fr] sm:py-24">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#f5b971]">{lifeUiValue(locale, "Shared stance", "Gemeinsame Haltung")}</p>
          <div>
            <h2 id="life-principle-title" className="text-3xl font-black text-white sm:text-5xl">{lifeUiValue(locale, "Understand, don't measure.", "Verstehen statt vermessen.")}</h2>
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">{lifeAlignmentHub.principle}</p>
            <ul className="mt-9 grid gap-3 sm:grid-cols-3">
              {(lifeUiValue(locale, ["No life or compatibility score", "No diagnosis or correct answer", "Answers remain in the current local page state"], ["Kein Life- oder Kompatibilitätsscore", "Keine Diagnose oder richtige Antwort", "Antworten bleiben im jeweiligen lokalen Seitenzustand"])).map((principle) => <li key={principle} className="border-l border-[#f5b971]/55 px-5 py-3 font-bold leading-6 text-slate-200">{principle}</li>)}
            </ul>
          </div>
        </section>
      </div>
    </article>);
}
