import Image from "next/image";
import Link from "next/link";
import { CommunityNav } from "./community-nav";
import { ReachDashboard } from "./reach-dashboard";
import { EchoCards } from "@/components/echowall/echo-cards";
import { communityCopy } from "@/data/i18n/community";
import { getEchoDictionary } from "@/data/i18n/echowall";
import { getLocalizedPublishedSpotlights } from "@/data/i18n/people";
import { createWorldMapConnections } from "@/data/world-map";
import { getReachShapes } from "@/lib/analytics/reach-geometry";
import type { ReachDataset } from "@/lib/analytics/reach-periods";
import type { EchoFeed } from "@/lib/echowall/public-feed";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";

export function CommunityOverview({ locale, feed, dataset, demo = false }: {
  locale: Locale; feed: EchoFeed; dataset: ReachDataset; demo?: boolean;
}) {
  const copy = communityCopy[locale];
  const connections = createWorldMapConnections(getLocalizedPublishedSpotlights(locale));
  const lead = connections.find(({ entity }) => entity.image)?.entity;
  const href = (path: string) => localizeHref(path, locale);
  return <article className="community-page min-h-svh px-4 pb-20 pt-24 sm:px-7 sm:pt-28">
    <div className="community-wrap">
      <header>
        <p className="community-kicker">BTSHQ / {copy.community}</p>
        <h1 className="community-heading community-overview-heading mt-2">{copy.title}</h1>
        <p className="mt-3 text-lg text-slate-300">{copy.intro}</p>
      </header>
      <CommunityNav locale={locale} current="/community" />

      <ReachDashboard locale={locale} shapes={getReachShapes(dataset.since.status === "available")} dataset={dataset} preview demo={demo} />
      <section className="mt-7 border-t border-[#355568] pt-5" aria-labelledby="community-voices">
        <h2 id="community-voices" className="mb-3 text-2xl font-bold">{copy.voices}</h2>
        {demo && <p className="community-kicker mb-3">{copy.demo}</p>}
        {feed.echoes.length ? <EchoCards echoes={feed.echoes.slice(0, 2)} locale={locale} />
          : <p className="community-panel p-4">{feed.status === "unavailable" ? getEchoDictionary(locale).page.unavailableTitle : copy.emptyEcho}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Link className="community-action" href={href("/echowall#leave-an-echo")}>{copy.contribute} →</Link>
          <Link className="underline underline-offset-4" href={href("/echowall")}>{copy.openWall}</Link>
        </div>
      </section>
      <section className="community-panel mt-7 grid gap-5 p-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:p-5" aria-labelledby="community-connections">
        <div className="self-center">
          <h2 id="community-connections" className="text-2xl font-bold">{copy.relationships}</h2>
          <p className="mt-2 text-[#a2deea]">{new Intl.NumberFormat(locale).format(connections.reduce((total, entry) => total + entry.relationships.length, 0))} · {copy.connections}</p>
          {lead && <p className="mt-2 text-slate-200 [overflow-wrap:anywhere]">{lead.name} · {lead.description}</p>}
          <Link className="community-action mt-4" href={href("/world")}>{copy.openMap} →</Link>
        </div>
        {lead?.image && <Image src={lead.image.src} alt={lead.image.alt} width={640} height={360} sizes="(min-width: 640px) 42vw, 100vw"
          className="max-h-60 w-full rounded-xl object-cover object-[50%_35%]" />}
      </section>
    </div>
  </article>;
}
