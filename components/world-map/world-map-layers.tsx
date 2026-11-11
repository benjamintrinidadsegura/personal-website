import Link from "next/link";

import { livingWorldCopy } from "@/data/i18n/living-world";
import { echoCountryName, summarizeEchoCountries } from "@/lib/echowall/countries";
import { isEchoCountryContextEnabled } from "@/lib/echowall/country-configuration";
import { getApprovedEchoes } from "@/lib/echowall/queries";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";

export async function WorldMapLayers({ locale }: { locale: Locale }) {
  const copy = livingWorldCopy[locale];
  const result = isEchoCountryContextEnabled() ? await getApprovedEchoes(50, true) : null;
  const countries = summarizeEchoCountries(result?.echoes ?? [])
    .map(({ countryCode, contributions }) => ({ label: echoCountryName(countryCode, locale), contributions }))
    .sort((first, second) => first.label.localeCompare(second.label, locale));
  const number = new Intl.NumberFormat(locale);

  return (
    <div className="grid gap-4 pb-12 md:grid-cols-2">
      <section id="echo-country-community" aria-labelledby="echo-country-title" className="living-panel p-6 sm:p-8">
        <h2 id="echo-country-title" className="text-3xl text-white">{copy.communityTitle}</h2>
        <p className="mt-3 leading-7 text-slate-300">{copy.communityHelp}</p>
        {countries.length ? (
          <dl className="mt-4 divide-y divide-white/15">
            {countries.map(({ label, contributions }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2 text-slate-100">
                <dt>{label}</dt><dd>{number.format(contributions)}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="living-muted mt-4">{copy.communityUnavailable}</p>}
        <Link href={localizeHref("/echowall#leave-an-echo", locale)} className="living-link mt-3">
          EchoWall<span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section id="country-reach" aria-labelledby="country-reach-title" className="living-panel p-6 sm:p-8">
        <h2 id="country-reach-title" className="text-3xl text-white">{copy.reachTitle}</h2>
        <p className="mt-3 leading-7 text-slate-300">{copy.reachHelp}</p>
        <p className="living-muted mt-4">{copy.reachUnavailable}</p>
      </section>
    </div>
  );
}
