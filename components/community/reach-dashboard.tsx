"use client";

import { useState } from "react";
import Link from "next/link";
import { communityCopy } from "@/data/i18n/community";
import { reachContinentNames, reachCopy } from "@/data/i18n/reach-dashboard";
import { regionByCountryCode } from "@/data/reach-country-codes";
import type { ReachShape } from "@/lib/analytics/reach-geometry";
import { reachColorIndex, reachColors, reachPeriods, reachThresholds, type ReachDataset, type ReachPeriod } from "@/lib/analytics/reach-periods";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";

const continents = ["150", "021", "142", "005", "002", "009"];

function CountryFlag({ code }: { code: string }) {
  return <svg className="reach-flag" viewBox="0 0 4 3" aria-hidden="true">
    <use href={`/images/community/country-flags.svg#${code}`} />
  </svg>;
}

export function ReachDashboard({ locale, shapes, dataset, preview = false, demo = false }: {
  locale: Locale; shapes: ReachShape[]; dataset: ReachDataset; preview?: boolean; demo?: boolean;
}) {
  const [period, setPeriod] = useState<ReachPeriod>("since");
  const [selected, setSelected] = useState<string>();
  const [hovered, setHovered] = useState<string>();
  const [tabStop, setTabStop] = useState<string>();
  const [title, since, recent, views, countries, regions, mapTitle, top, growth, progress, all, updated, low, high,
    unpublished, disclosure, empty, inactive, unavailable, partial, sample, daily] = reachCopy[locale];
  const result = dataset[period];
  const data = result.status === "available" ? result : null;
  const rows = data?.countries ?? [];
  const counts = new Map(rows.map(({ countryCode, pageViews }) => [countryCode, pageViews]));
  const number = new Intl.NumberFormat(locale);
  const geography = new Intl.DisplayNames([locale], { type: "region" });
  const countryName = (code: string) => geography.of(code) ?? code;
  const stamp = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const formatDate = (value: string) => stamp.format(new Date(value));
  const mapped = new Set(shapes.flatMap((shape) => shape.countryCode ? [shape.countryCode] : []));
  const mapOrder = rows.filter((row) => mapped.has(row.countryCode)).map((row) => row.countryCode);
  const keyTarget = tabStop && mapOrder.includes(tabStop) ? tabStop : mapOrder[0];
  const active = hovered ?? selected;
  const perContinent = continents.map((code, index) => ({
    label: reachContinentNames[locale][index],
    code, count: rows.filter((row) => regionByCountryCode[row.countryCode] === code).length,
  }));
  const maxProgress = Math.max(1, ...perContinent.map(({ count }) => count));
  const series = data?.growth ?? [];
  const maxSeries = Math.max(1, ...series.map((point) => point.pageViews));
  const chartLine = series.map(({ pageViews }, i) => `${8 + i / Math.max(1, series.length - 1) * 584},${108 - pageViews / maxSeries * 96}`).join(" ");
  const metrics = [[views, data?.displayedViews], [countries, data?.countries.length], [regions, data && perContinent.filter(({ count }) => count).length]];
  const rank = (limit?: number) => <ol className={limit ? "reach-ranking reach-ranking-bars" : "reach-ranking"}>
    {rows.slice(0, limit).map(({ countryCode, pageViews }) => <li key={countryCode}>
      <button type="button" aria-pressed={selected === countryCode} onClick={() => setSelected(countryCode)}>
        <span aria-hidden="true"><CountryFlag code={countryCode} /></span><span>{countryName(countryCode)}</span><strong>{number.format(pageViews)}</strong>
        {limit && <span className="reach-rank-track" aria-hidden="true"><i style={{ inlineSize: `${100 * pageViews / Math.max(1, rows[0]?.pageViews ?? 1)}%` }} /></span>}
      </button>
    </li>)}
  </ol>;
  return <div data-reach-dashboard data-period={period} data-reach-preview={preview}>
    {demo && <p className="community-kicker mb-4">{sample}</p>}
    {!preview && <>
      <h1 className="community-heading mb-4">{title}</h1>
      <div className="flex flex-wrap gap-2" role="group" aria-label={communityCopy[locale].reach}>
        {reachPeriods.map((key) => <button key={key} type="button" className="reach-period" aria-pressed={key === period} onClick={() => {
          setPeriod(key);
          setSelected(undefined);
          setHovered(undefined);
          setTabStop(undefined);
        }}>{key === "since" ? since : recent}</button>)}
      </div>
    </>}
    {data && <p className="mt-4 text-sm text-slate-300">{formatDate(data.from)} – {formatDate(data.to)} · {updated} <time dateTime={data.updated}>{formatDate(data.updated)}</time>
      {data.coverage === "partial" && <> · {partial}</>}</p>}
    {!preview && data && <dl className="reach-metrics">{metrics.map(([label, count]) => <div key={label} className="community-panel p-4">
      <dt>{label}</dt><dd>{number.format(Number(count))}</dd>
    </div>)}</dl>}
    <div className={preview || !data ? "mt-4" : "reach-primary"}>
      <section className="community-panel p-4 sm:p-5" aria-labelledby="reach-map-title">
        <h2 id="reach-map-title" className="text-xl font-bold">{mapTitle}</h2>
        <div className="reach-map-stage mt-3">
          <svg viewBox="0 0 960 465" role="group" aria-label={mapTitle}>
            {shapes.map((shape) => {
              const code = shape.countryCode;
              const count = code ? counts.get(code) : undefined;
              return <path key={shape.id} d={shape.path} fill={reachColors[reachColorIndex(count)]}
                data-country={code} data-selected={!!code && selected === code} data-hovered={!!code && hovered === code}
                aria-label={code && data && !preview ? `${countryName(code)}: ${count === undefined ? unpublished : number.format(count)}` : undefined}
                aria-hidden={!code || !data || preview}
                role={code && data && !preview ? "button" : undefined}
                tabIndex={code && data && !preview ? (code === keyTarget ? 0 : -1) : undefined}
                aria-pressed={code && data && !preview ? selected === code : undefined}
                onPointerEnter={code && data && !preview ? () => setHovered(code) : undefined}
                onPointerLeave={code && data && !preview ? () => setHovered(undefined) : undefined}
                onClick={code && data && !preview ? () => { setSelected(code); setTabStop(code); } : undefined}
                onKeyDown={code && data && !preview ? (event) => {
                  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(code); }
                  const offset = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
                  if (offset && mapOrder.length) {
                    event.preventDefault();
                    const next = mapOrder[(mapOrder.indexOf(code) + offset + mapOrder.length) % mapOrder.length];
                    setTabStop(next);
                    event.currentTarget.ownerSVGElement?.querySelector<SVGElement>(`[data-country="${next}"]`)?.focus();
                  }
                } : undefined} />;
            })}
          </svg>
          {active && <p className="reach-selection" role="status"><CountryFlag code={active} /> {countryName(active)} · {counts.has(active) ? `${number.format(counts.get(active)!)} · ${views}` : unpublished}</p>}
        </div>
        {data ? <><div className="reach-legend" aria-label={views}>
          <span>{low}</span>{reachColors.map((color, i) => <span className="reach-swatch" key={color}>
            <span aria-hidden="true" style={{ backgroundColor: color }} />
            {i === 0 ? "—" : i === reachThresholds.length ? `${number.format(reachThresholds[i - 1])}+` : `${number.format(reachThresholds[i - 1])}–${number.format(reachThresholds[i] - 1)}`}
          </span>)}<span>{high}</span>
        </div><p className="text-sm text-slate-300">{disclosure}</p></>
          : <p role="status" className="mt-4 text-slate-300">{result.status === "unavailable" && result.reason === "inactive" ? inactive :
            result.status === "unavailable" && result.reason === "suppressed" ? empty : unavailable}</p>}
        {preview && data && <dl className="reach-metrics">{metrics.map(([label, count]) => <div key={label}>
          <dt className="text-sm">{label}</dt><dd>{number.format(Number(count))}</dd>
        </div>)}</dl>}
        {preview && <Link className="community-action mt-4" href={localizeHref("/global-reach", locale)}>{communityCopy[locale].fullReach} →</Link>}
      </section>
      {!preview && data && <section className="community-panel p-4 sm:p-5"><h2 className="text-xl font-bold">{top}</h2>{rank(5)}</section>}
    </div>
    {!preview && data && <>
      <div className="reach-secondary">
        <section className="community-panel p-4 sm:p-5">
          <h2 className="text-xl font-bold">{growth}</h2>
          {data.growth.length ? <>
            <div className="reach-chart" aria-hidden="true">
              <svg viewBox="0 0 600 120" preserveAspectRatio="none">
                <path d="M8 36H592 M8 72H592 M8 108H592" stroke="#375569" strokeDasharray="4 6" />
                <polygon points={`8,108 ${chartLine} 592,108`} fill="#215066" fillOpacity=".55" />
                <polyline points={chartLine} fill="none" stroke="#8bd9e9" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <details className="mt-3"><summary>{daily}</summary><dl>{data.growth.map(({ day, pageViews }) => <div className="flex justify-between gap-3" key={day}><dt>{formatDate(day)}</dt><dd>{number.format(pageViews)}</dd></div>)}</dl></details>
          </> : <p className="mt-3 text-slate-300">{unavailable}</p>}
        </section>
        <section className="community-panel p-4 sm:p-5">
          <h2 className="text-xl font-bold">{progress}</h2>
          <dl className="mt-3 grid gap-2">{perContinent.filter(({ count }) => count > 0).map(({ code, count, label }) => <div key={code} className="reach-progress">
            <dt>{label}</dt><dd><span aria-hidden="true" style={{ inlineSize: `${100 * count / maxProgress}%` }} /><strong>{number.format(count)}</strong></dd>
          </div>)}</dl>
        </section>
      </div>
      <section className="community-panel mt-4 p-4 sm:p-5" data-country-ranking>
        <h2 className="text-xl font-bold">{all}</h2>{rank()}
      </section>
    </>}
  </div>;
}
