import { globalReachCopy } from "@/data/i18n/global-reach";
import { getCountryReach, validateCountryReach } from "@/lib/analytics/country-reach";
import type { Locale } from "@/lib/i18n/config";

/** Server-rendered. An import requires explicit owner approval; no live source is connected. */
export function GlobalReach({ locale }: { locale: Locale }) {
  const reach = getCountryReach();
  return <GlobalReachView locale={locale} snapshot={reach.status === "available" ? reach.snapshot : undefined} />;
}

/** Shared with controlled local fixtures. Validation is repeated at the presentation boundary. */
export function GlobalReachView({ locale, snapshot, now }: { locale: Locale; snapshot?: unknown; now?: number }) {
  const copy = globalReachCopy[locale];
  const result = validateCountryReach(snapshot, now);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const number = new Intl.NumberFormat(locale);
  return (
    <section id="country-reach" aria-labelledby="country-reach-title" className="living-panel min-w-0 p-6 sm:p-8">
      <h2 id="country-reach-title" className="text-3xl text-white">{copy.title}</h2>
      <p className="mt-3 leading-7 text-slate-300">{copy.help}</p>
      {result.status === "unavailable" ? <p className="mt-4 text-slate-300">{copy.unavailable}</p> : (
        <>
          <p className="mt-4 text-sm leading-6 text-slate-300">{copy.period}: <time dateTime={result.snapshot.periodStart}>{date.format(new Date(result.snapshot.periodStart))}</time> – <time dateTime={result.snapshot.periodEnd}>{date.format(new Date(result.snapshot.periodEnd))}</time></p>
          <dl className="mt-4 divide-y divide-white/15">
            {[...result.snapshot.countries].sort((a, b) => a.countryCode.localeCompare(b.countryCode)).map(({ countryCode, pageViews }) => (
              <div key={countryCode} className="flex items-baseline justify-between gap-4 py-2 text-slate-100">
                <dt>{names.of(countryCode)}</dt><dd className="shrink-0">{number.format(pageViews)} <span className="sr-only">{copy.unit}</span></dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-6 text-slate-300">{copy.source}</p>
          <p className="text-sm leading-6 text-slate-300">{copy.updated}: <time dateTime={result.snapshot.retrievedAt}>{updated.format(new Date(result.snapshot.retrievedAt))}</time></p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{copy.privacy}</p>
          {result.snapshot.geography === "partial" && <p className="text-sm leading-6 text-slate-300">{copy.partial}</p>}
        </>
      )}
    </section>
  );
}
