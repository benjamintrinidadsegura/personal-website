import { communityCopy } from "@/data/i18n/community";
import type { Locale } from "@/lib/i18n/config";
import type { PublicEcho } from "@/types/echowall";
import { EchoAvatar } from "./echo-avatar";
import { EchoReaction } from "./echo-reaction";

export function EchoCards({ echoes, locale, interactive = false }: { echoes: PublicEcho[]; locale: Locale; interactive?: boolean }) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const localeNames = new Intl.DisplayNames(locale, { type: "language" });
  return <ol className="community-echo-grid">
    {echoes.map((echo) => <li key={echo.id} className="community-panel p-4">
      <article className="flex h-full flex-col" data-echo-card>
        <header className="flex flex-wrap items-center gap-2">
          <EchoAvatar name={echo.displayName} /><h3 className="font-bold [overflow-wrap:anywhere]">{echo.displayName}</h3>
          <time dateTime={echo.publishedAt} className="ml-auto text-sm text-slate-300">{date.format(new Date(echo.publishedAt))}</time>
          {echo.language && <abbr title={localeNames.of(echo.language)}>{echo.language.toUpperCase()}</abbr>}
        </header>
        <p className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere]" lang={echo.language}>{echo.message}</p>
        {echo.reply && <div className="echo-founder-reply mt-3 rounded-lg bg-[#19374a] p-3 [overflow-wrap:anywhere]">
          <h4 className="text-sm font-bold text-[#a2deea]">{communityCopy[locale].founder}</h4>
          <p className="mt-1 whitespace-pre-wrap">{echo.reply}</p>
        </div>}
        {echo.likes !== undefined && <div className="mt-auto pt-3">
          <EchoReaction echo={echo} locale={locale} interactive={interactive} />
        </div>}
      </article>
    </li>)}
  </ol>;
}
