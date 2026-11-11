import type { EchoCategory, PublicEcho } from "@/types/echowall";
import { getLocale } from "@/lib/i18n/server";
import { getEchoDictionary } from "@/data/i18n/echowall";
import { localeDetails } from "@/lib/i18n/config";
import { echoCountryName } from "@/lib/echowall/countries";

type EchoListProps = {
  echoes: PublicEcho[];
  variant?: "full" | "preview";
};

export async function EchoList({ echoes, variant = "full" }: EchoListProps) {
  const locale = await getLocale();
  const categoryLabels: Record<EchoCategory, string> = getEchoDictionary(locale).form.categories;
  const dateFormatter = new Intl.DateTimeFormat(localeDetails[locale].htmlLang, {
    day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin",
  });
  const preview = variant === "preview";
  return (
    <ol className={preview ? "grid border-l border-t border-white/10 lg:grid-cols-2" : "living-echo-list"}>
      {echoes.map((echo) => (
        <li key={echo.id} className={preview ? "border-b border-r border-white/10 bg-white/[0.018] p-6 sm:p-8" : "living-panel p-6 sm:p-8"}>
          <article className={preview ? "flex min-h-64 flex-col" : "flex h-full flex-col"}>
            {echo.category ? <p className="living-meta text-xs font-bold">{categoryLabels[echo.category]}</p> : null}
            <blockquote className={preview ? "mt-6 line-clamp-4 break-words text-xl font-bold leading-8 text-white [overflow-wrap:anywhere]" : "living-echo-message"}>
              <p>{echo.message}</p>
            </blockquote>
            <footer className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="font-bold text-slate-200">{echo.displayName}</p>
                {echo.countryCode ? <p className="living-muted mt-1 text-sm">{echoCountryName(echo.countryCode, locale)}</p> : null}
              </div>
              <time dateTime={echo.publishedAt} className="living-muted text-xs text-slate-400">
                {dateFormatter.format(new Date(echo.publishedAt))}
              </time>
            </footer>
          </article>
        </li>
      ))}
    </ol>
  );
}
