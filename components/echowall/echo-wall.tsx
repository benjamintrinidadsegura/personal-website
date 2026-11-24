import Link from "next/link";
import { CommunityNav } from "@/components/community/community-nav";
import { communityCopy } from "@/data/i18n/community";
import { getEchoDictionary } from "@/data/i18n/echowall";
import { livingWorldCopy } from "@/data/i18n/living-world";
import { echoCountryOptions } from "@/lib/echowall/countries";

import { echoFeedUrl, echoPageSize, parseEchoFeed } from "@/lib/echowall/feed";
import type { EchoFeed } from "@/lib/echowall/public-feed";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import { EchoForm } from "./echo-form";
import { EchoCards } from "./echo-cards";

export function EchoWall({ locale, feed, query, formToken, countryReady = false, demo = false, pathname }: {
  locale: Locale; feed: EchoFeed; query: ReturnType<typeof parseEchoFeed>; formToken: string | null;
  demo?: boolean; pathname?: string; countryReady?: boolean;
}) {
  const copy = communityCopy[locale];
  const echoCopy = getEchoDictionary(locale);
  const href = pathname ?? localizeHref("/echowall", locale);
  const fmt = new Intl.NumberFormat(locale);
  const url = (patch: Partial<typeof query>) => {
    const destination = echoFeedUrl(href, { ...query, ...patch });
    return demo ? destination + (destination.includes("?") ? "&" : "?") + "view=echo" : destination;
  };
  return <article className="community-page min-h-svh px-4 pb-20 pt-24 sm:px-7 sm:pt-28">
    <div className="community-wrap max-w-[65rem]">
      <CommunityNav locale={locale} current="/echowall" />
      {demo && <p className="community-kicker mb-3">{copy.demo}</p>}
      <header className="mb-5">
        <h1 className="community-heading">{copy.contribute}</h1>
        <p className="mt-2 text-base text-slate-300">{echoCopy.page.intro}</p>
      </header>
      <section id="leave-an-echo" aria-label={copy.contribute} className="community-panel echo-composer scroll-mt-24 p-4 sm:p-5">
        <p className="mb-4 text-sm text-slate-200">{echoCopy.page.moderationBody}</p>
        <EchoForm formToken={formToken} copy={echoCopy.form} optionalLabel={copy.details}
          countryOptions={formToken && countryReady ? echoCountryOptions(locale) : undefined}
          countryCopy={livingWorldCopy[locale]} />
      </section>
      <section id="public-wall" aria-labelledby="public-wall-title" className="mt-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="public-wall-title" className="text-xl font-bold text-[#b0e8f4]">
            {feed.status === "ready" ? `${fmt.format(feed.published)} · ${copy.published}` : copy.voices}
          </h2>
          {feed.status === "ready" && feed.reactions && <nav aria-label={copy.published} className="flex flex-wrap gap-2">
            <Link className="reach-period" aria-current={!query.popular ? "true" : undefined} href={url({ popular: false, page: 1 })}>{copy.newest}</Link>
            <Link className="reach-period" aria-current={query.popular ? "true" : undefined} href={url({ popular: true, page: 1 })}>{copy.popular}</Link>
          </nav>}
        </div>
        {feed.status === "ready" && <form method="get" action={href} className="echo-search my-4" role="search">
          {demo && <input type="hidden" name="view" value="echo" />}{query.popular && feed.reactions && <input type="hidden" name="sort" value="popular" />}
          <div className="grid min-w-0 flex-1 gap-1">
            <label htmlFor="echo-search" className="text-sm">{copy.searchName}</label>
            <input id="echo-search" className="community-input" name="q" maxLength={40} type="search" defaultValue={query.keyword} />
          </div>
          <button type="submit" className="community-action">{copy.search}</button>
          {query.keyword && <Link className="reach-period inline-flex items-center" href={url({ keyword: "", page: 1 })}>{copy.reset}</Link>}
        </form>}
        {feed.status === "ready" && query.keyword && <p className="mb-3 text-sm text-slate-300" role="status">{copy.results} · {fmt.format(feed.matched)}</p>}
        {feed.echoes.length > 0 ? <EchoCards echoes={feed.echoes} locale={locale} interactive={feed.status === "ready" && feed.reactions} />
          : <p className="community-panel p-4" role="status">{feed.status === "unavailable" ? echoCopy.page.unavailableTitle :
            query.keyword ? `${copy.results} · ${fmt.format(0)}` : copy.emptyEcho}</p>}
        {feed.status === "ready" && (query.page > 1 || feed.matched > echoPageSize) && <nav className="mt-5 flex flex-wrap gap-3" aria-label={copy.published}>
          {query.page > 1 && <Link className="reach-period" href={url({ page: query.page - 1 })}>{copy.previous}</Link>}
          {query.page * echoPageSize < feed.matched && <Link className="reach-period" href={url({ page: query.page + 1 })}>{copy.next}</Link>}
        </nav>}
      </section>
      <section className="mt-8 border-t border-[#355568] pt-5">
        <h2 className="font-bold">{echoCopy.page.privacyTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">{echoCopy.page.privacyBody}</p>
      </section>
    </div>
  </article>;
}
