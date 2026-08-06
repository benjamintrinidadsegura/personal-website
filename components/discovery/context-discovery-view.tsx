"use client";

import Link from "next/link";
import { useRef } from "react";

import { useDiscovery } from "@/components/discovery/discovery-context";
import { DiscoveryExplanation } from "@/components/discovery/discovery-explanation";
import { DiscoveryNavigationStatus, isUnmodifiedPrimaryClick } from "@/components/discovery/discovery-results";
import type { DiscoveryMatch, DiscoveryStatus } from "@/types/discovery";

interface StatusStyles {
  badge: string;
  topMatch: string;
  card: string;
  interactive: string;
}

const statusStyles: Record<DiscoveryStatus, StatusStyles> = {
  Live: {
    badge: "border-emerald-300/30 text-emerald-200",
    topMatch: "border-emerald-300/25 bg-[linear-gradient(135deg,rgba(110,231,183,0.09),rgba(255,255,255,0.025)_55%,rgba(53,208,229,0.04))]",
    card: "border-emerald-300/20 bg-emerald-300/[0.025]",
    interactive: "hover:border-emerald-300/45 hover:bg-emerald-300/[0.055] focus-visible:border-emerald-300/55 focus-visible:outline-emerald-300/70",
  },
  Beta: {
    badge: "border-cyan-300/40 text-cyan-200",
    topMatch: "border-cyan-300/30 bg-[linear-gradient(135deg,rgba(53,208,229,0.11),rgba(255,255,255,0.025)_55%,rgba(34,211,238,0.045))]",
    card: "border-cyan-300/25 bg-cyan-300/[0.03]",
    interactive: "hover:border-cyan-300/50 hover:bg-cyan-300/[0.06] focus-visible:border-cyan-300/60 focus-visible:outline-cyan-300/75",
  },
  "In Development": {
    badge: "border-amber-300/35 text-amber-200",
    topMatch: "border-amber-300/25 bg-[linear-gradient(135deg,rgba(251,191,36,0.085),rgba(255,255,255,0.025)_55%,rgba(255,122,0,0.05))]",
    card: "border-amber-300/20 bg-amber-300/[0.025]",
    interactive: "hover:border-amber-300/45 hover:bg-amber-300/[0.055] focus-visible:border-amber-300/55 focus-visible:outline-amber-300/70",
  },
  "Coming Soon": {
    badge: "border-violet-300/25 text-violet-200/80",
    topMatch: "border-violet-300/20 bg-[linear-gradient(135deg,rgba(196,181,253,0.075),rgba(255,255,255,0.02)_55%,rgba(100,116,139,0.04))]",
    card: "border-violet-300/15 bg-violet-300/[0.02]",
    interactive: "hover:border-violet-300/35 hover:bg-violet-300/[0.045] focus-visible:border-violet-300/45 focus-visible:outline-violet-300/60",
  },
};

interface NavigationHandoffProps {
  beginNavigation: (targetHref: string) => number;
  settleNavigation: (targetHref: string, handoffId: number) => void;
}

function StatusBadge({ status }: { status: DiscoveryStatus }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${statusStyles[status].badge}`}>
      {status}
    </span>
  );
}

function TopMatch({ match, beginNavigation, settleNavigation }: { match: DiscoveryMatch } & NavigationHandoffProps) {
  const { item } = match;
  const styles = statusStyles[item.status];
  const handoffIdRef = useRef<number | null>(null);
  const layoutClasses = `relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-9 ${styles.topMatch}`;
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#35d0e5]">Top Match</span>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{item.group} / {item.category}</p>
          <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.035em] text-white sm:text-5xl">{item.title}</h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">{item.description}</p>
          <DiscoveryExplanation reasons={match.reasons} maxReasons={2} />
        </div>
        {item.href ? (
          <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#35d0e5]/35 px-5 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#73e3f1] transition-colors group-hover:border-[#35d0e5]/65 group-hover:bg-[#35d0e5]/10">
            Detailseite öffnen →
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Noch nicht verfügbar</span>
        )}
      </div>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        data-top-match-id={item.id}
        aria-label={`${item.title}, Top Match, ${item.status}`}
        onClick={(event) => {
          if (!isUnmodifiedPrimaryClick(event)) return;
          handoffIdRef.current = beginNavigation(item.href as string);
        }}
        className={`${layoutClasses} group block outline-none transition-[border-color,box-shadow] hover:border-white/30 focus-visible:ring-2 focus-visible:ring-[#35d0e5]`}
      >
        <DiscoveryNavigationStatus targetHref={item.href} handoffIdRef={handoffIdRef} onSettle={settleNavigation} />
        {content}
      </Link>
    );
  }

  return (
    <article
      data-top-match-id={item.id}
      aria-label={`${item.title}, Top Match, ${item.status}`}
      className={layoutClasses}
    >
      {content}
    </article>
  );
}

function ResultCard({ match, beginNavigation, settleNavigation, featured = false }: { match: DiscoveryMatch; featured?: boolean } & NavigationHandoffProps) {
  const { item } = match;
  const styles = statusStyles[item.status];
  const handoffIdRef = useRef<number | null>(null);
  const layoutClasses = `flex min-h-64 w-full flex-col rounded-2xl border p-5 text-left ${styles.card} ${featured ? "xl:col-span-2 xl:min-h-72 xl:p-7" : ""}`;
  const content = (
    <>
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">{item.category}</span>
        <StatusBadge status={item.status} />
      </div>
      <h3 className={`mt-5 text-xl font-black tracking-tight text-white ${featured ? "xl:text-3xl" : ""}`}>{item.title}</h3>
      <p className={`mt-3 line-clamp-3 text-sm leading-6 text-slate-400 ${featured ? "xl:line-clamp-4 xl:max-w-2xl xl:text-base xl:leading-7" : ""}`}>{item.description}</p>
      <DiscoveryExplanation reasons={match.reasons} maxReasons={2} />
      <span className={`mt-auto pt-6 font-mono text-[10px] uppercase tracking-[0.18em] ${item.href ? "text-slate-300 group-hover:text-white group-focus-visible:text-white" : "text-slate-500"}`}>
        {item.href ? "Ergebnis öffnen →" : "Noch nicht verfügbar"}
      </span>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={(event) => {
          if (!isUnmodifiedPrimaryClick(event)) return;
          handoffIdRef.current = beginNavigation(item.href as string);
        }}
        data-discovery-item-id={item.id}
        data-featured-result={featured || undefined}
        className={`${layoutClasses} group motion-safe:transition-[transform,background-color,border-color] motion-safe:duration-[180ms] motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:focus-visible:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 ${styles.interactive}`}
      >
        <DiscoveryNavigationStatus targetHref={item.href} handoffIdRef={handoffIdRef} onSettle={settleNavigation} />
        {content}
      </Link>
    );
  }

  return (
    <article
      data-discovery-item-id={item.id}
      data-featured-result={featured || undefined}
      className={layoutClasses}
    >
      {content}
    </article>
  );
}

export function ContextDiscoveryView() {
  const { query, matches, adaptiveView, navigationPending, beginCanvasNavigation, settleCanvasNavigation } = useDiscovery();

  return (
    <div data-navigation-pending={navigationPending || undefined} className="mx-auto w-full max-w-[90rem] px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-4 border-l border-[#35d0e5]/40 pl-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[#35d0e5]">Context Canvas / Discovery View</p>
          <h1 id="context-discovery-title" className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Dein aktueller Kontext: <span className="text-[#73e3f1]">„{query.trim()}“</span>
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-400">Die Oberfläche reagiert auf dein Signal – ruhig, kuratiert und auf Basis der bestehenden Discovery.</p>
      </div>

      {matches.length === 0 ? (
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.025] px-6 py-9 sm:px-9" role="status">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-[#ff9a3d]">Noch kein passendes Signal</p>
          <h2 className="mt-3 text-2xl font-black text-white">Für „{query.trim()}“ ist aktuell nichts Passendes kuratiert.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Versuche einen Begriff aus Projekten, Insights, Tools, Menschen oder Seiten. Dein Suchbegriff bleibt dabei vollständig unter deiner Kontrolle.</p>
        </div>
      ) : (
        <div className="mt-10">
          {adaptiveView.topMatch && (
            <TopMatch
              match={adaptiveView.topMatch}
              beginNavigation={beginCanvasNavigation}
              settleNavigation={settleCanvasNavigation}
            />
          )}

          {adaptiveView.groups.length > 0 && (
            <div className="mt-12 grid gap-12">
              {adaptiveView.groups.map(({ group, matches: groupMatches, remainingCount }) => {
                const hasFeaturedResult = groupMatches.length >= 3;
                const gridColumns = groupMatches.length === 4 ? "xl:grid-cols-5" : "xl:grid-cols-4";
                const totalResults = groupMatches.length + remainingCount;

                return (
                  <section key={group} aria-labelledby={`context-group-${group.toLocaleLowerCase("en-US")}`}>
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <h2 id={`context-group-${group.toLocaleLowerCase("en-US")}`} className="font-mono text-lg font-black uppercase tracking-[0.12em] text-white sm:text-xl">{group}</h2>
                      <span className="shrink-0 rounded-full border border-white/15 bg-white/[0.035] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-slate-300 sm:text-xs">
                        {totalResults} Treffer
                      </span>
                    </div>
                    <div className={`grid gap-4 sm:grid-cols-2 ${gridColumns}`}>
                      {groupMatches.map((match, index) => (
                        <ResultCard
                          key={match.item.id}
                          match={match}
                          beginNavigation={beginCanvasNavigation}
                          settleNavigation={settleCanvasNavigation}
                          featured={hasFeaturedResult && index === 0}
                        />
                      ))}
                    </div>
                    {remainingCount > 0 && (
                      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">+ {remainingCount} weitere Treffer</p>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
