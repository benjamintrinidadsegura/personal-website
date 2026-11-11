import type { Metadata } from "next";
import Link from "next/link";

import { EchoForm } from "@/components/echowall/echo-form";
import { EchoList } from "@/components/echowall/echo-list";
import { issueEchoFormToken } from "@/app/echowall/actions";
import { getApprovedEchoes } from "@/lib/echowall/queries";
import { livingWorldCopy } from "@/data/i18n/living-world";
import { echoCountryOptions } from "@/lib/echowall/countries";
import { getEchoDictionary } from "@/data/i18n/echowall";
import { getGlobalDictionary } from "@/data/i18n/global";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/echowall", title: "EchoWall | btshq.online", description: getEchoDictionary(locale).page.description });
}

export const dynamic = "force-dynamic";

export default async function EchoWallPage() {
  const [echoResult, formToken, locale] = await Promise.all([
    getApprovedEchoes(50, true),
    issueEchoFormToken(),
    getLocale(),
  ]);
  const copy = getEchoDictionary(locale).page;
  const globalCopy = getGlobalDictionary(locale);
  const [firstTitle, secondTitle] = copy.title.split("\n");

  return (
    <article className="living-world living-echo relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href={localizeHref("/", locale)} className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">Digital HQ</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#35d0e5]">EchoWall</li>
          </ol>
        </nav>

        <header className="living-echo-intro grid items-center gap-9 border-b border-white/15 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">{copy.eyebrow}</p>
            <h1 className="living-title mt-7 text-[clamp(3rem,8vw,7.4rem)] tracking-[-0.055em]">{firstTitle}<br />{secondTitle}</h1>
            <p className="mt-6 max-w-3xl text-xl leading-snug text-white sm:text-2xl">{copy.intro}</p>
            <a className="living-link mt-5" href="#leave-an-echo">{copy.formTitle}<span aria-hidden="true">↓</span></a>
          </div>
          <aside className="living-panel p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.moderationLabel}</p>
            <p className="mt-6 text-2xl font-black leading-snug text-white sm:text-3xl">{copy.moderationTitle}</p>
            <p className="mt-6 leading-7 text-slate-400">{copy.moderationBody}</p>
          </aside>
        </header>

        <section aria-labelledby="public-wall-title" className="border-b border-white/15 py-20 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.38fr_1fr]">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.wallLabel}</p>
            <div><h2 id="public-wall-title" className="text-4xl font-black text-white sm:text-6xl">{copy.wallTitle}</h2><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{copy.wallBody}</p></div>
          </div>

          {echoResult.status === "data" ? (
            <div className="mt-14"><EchoList echoes={echoResult.echoes} /></div>
          ) : echoResult.status === "empty" ? (
            <div className="living-panel mt-9 p-7 sm:p-10">
              <h3 className="text-3xl font-black text-white">{copy.emptyTitle}</h3>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{copy.emptyBody}</p>
              <a href="#leave-an-echo" className="mt-7 inline-flex min-h-11 items-center rounded-full border border-[#35d0e5]/50 px-5 py-3 font-black text-white transition hover:border-[#35d0e5] hover:text-[#35d0e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">{copy.first} <span aria-hidden="true" className="ml-2">↓</span></a>
            </div>
          ) : (
            <div className="living-panel mt-9 p-7 sm:p-10" role="status">
              <h3 className="text-3xl font-black text-white">{copy.unavailableTitle}</h3>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{formToken ? copy.unavailableBody : getEchoDictionary(locale).form.unavailableBody}</p>
            </div>
          )}
        </section>

        <section id="leave-an-echo" aria-labelledby="form-title" className="scroll-mt-24 border-b border-white/15 py-20 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.38fr_1fr]">
            <div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.signalLabel}</p><p className="mt-5 max-w-xs leading-7 text-slate-400">{copy.signalAside}</p></div>
            <div>
              <h2 id="form-title" className="text-4xl font-black text-white sm:text-6xl">{copy.formTitle}</h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{copy.formBody}</p>
              <div className="living-panel mt-9 p-5 sm:p-8">
                <EchoForm formToken={formToken} copy={getEchoDictionary(locale).form}
                  countryOptions={echoResult.countryContextAvailable && formToken ? echoCountryOptions(locale) : undefined}
                  countryCopy={livingWorldCopy[locale]} />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="privacy-note-title" className="grid gap-8 border-b border-white/15 py-14 lg:grid-cols-[0.38fr_1fr]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.privacyLabel}</p>
          <div><h2 id="privacy-note-title" className="text-2xl font-black text-white">{copy.privacyTitle}</h2><p className="mt-4 max-w-3xl leading-7 text-slate-300">{copy.privacyBody}</p></div>
        </section>

        <div className="mt-12 flex flex-wrap gap-x-6">
          <Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 font-bold text-slate-200 transition hover:border-[#35d0e5]/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">← {copy.back}</Link>
        </div>
      </div>
    </article>
  );
}
