import Link from "next/link";
import { CommunityNav } from "./community-nav";
import { ReachDashboard } from "./reach-dashboard";
import { EchoCards } from "@/components/echowall/echo-cards";
import { communityCopy } from "@/data/i18n/community";
import { getEchoDictionary } from "@/data/i18n/echowall";
import { getLocalizedPublishedSpotlights } from "@/data/i18n/people";
import { reachCopy } from "@/data/i18n/reach-dashboard";
import { createWorldMapConnections } from "@/data/world-map";
import { getReachShapes } from "@/lib/analytics/reach-geometry";
import type { ReachDataset } from "@/lib/analytics/reach-periods";
import type { EchoFeed } from "@/lib/echowall/public-feed";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import { createWorldMapGeometry } from "@/lib/world-map-geometry";

export function CommunityOverview({ locale, feed, dataset, demo = false, participation = false }: {
  locale: Locale; feed: EchoFeed; dataset: ReachDataset; demo?: boolean; participation?: boolean;
}) {
  const copy = communityCopy[locale];
  const connections = createWorldMapConnections(getLocalizedPublishedSpotlights(locale));
  const map = createWorldMapGeometry(connections);
  const href = (path: string) => localizeHref(path, locale);
  const echoEntry = demo ? "/community-review?view=echo" : "/echowall";
  return <article className="community-page min-h-svh px-4 pb-20 pt-24 sm:px-7 sm:pt-28">
    <div className="community-wrap">
      <header>
        <p className="community-kicker">BTSHQ / {copy.community}</p>
        <h1 className="community-heading community-overview-heading mt-2">{reachCopy[locale][0]}</h1>
        <p className="mt-2 text-base text-slate-300">{copy.intro}</p>
      </header>
      <CommunityNav locale={locale} current="/community" />
      <ReachDashboard locale={locale} shapes={getReachShapes(Object.values(dataset).some((period) => period.status === "available"))} dataset={dataset} embedded demo={demo}>
        <section className="my-5 border-t border-[#355568] pt-5" aria-labelledby="community-voices">
          <h2 id="community-voices" className="mb-3 text-2xl font-bold">{copy.voices}</h2>
          {feed.echoes.length ? <EchoCards echoes={feed.echoes.slice(0, 2)} locale={locale} />
            : <p className="community-panel p-4">{feed.status === "unavailable" ? getEchoDictionary(locale).page.unavailableTitle : copy.emptyEcho}</p>}
          <Link className="community-action mt-3" href={href(participation ? echoEntry + "#leave-an-echo" : echoEntry)}>
            {participation ? copy.contribute : copy.openWall} →
          </Link>
        </section>
      </ReachDashboard>
      <section className="community-panel mt-6 grid items-center gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:p-5" aria-labelledby="community-connections">
        <div>
          <h2 id="community-connections" className="text-2xl font-bold">{copy.relationships}</h2>
          <p className="mt-2 text-[#a2deea]">{new Intl.NumberFormat(locale).format(connections.reduce((total, entry) => total + entry.relationships.length, 0))} · {copy.connections}</p>
          <Link className="community-action mt-4" href={href("/world")}>{copy.openMap} →</Link>
        </div>
        <svg className="community-connection-preview" viewBox={`0 0 ${map.width} ${map.height}`} aria-hidden="true">
          <path d={map.landPath} className="community-connection-land" />
          <path d={map.borderPath} className="community-connection-borders" />
          {map.connections.map(({ id, point }) => <g key={id}><circle cx={point.x} cy={point.y} r="12" fill="#54dcee" opacity=".22" /><circle cx={point.x} cy={point.y} r="4" fill="#bef8ff" /></g>)}
        </svg>
      </section>
    </div>
  </article>;
}
