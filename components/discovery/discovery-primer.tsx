import Link from "next/link";

import { getDiscoverySurface, type DiscoverySurfaceId } from "@/data/search-discovery";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";

export function DiscoveryPrimer({ locale, surface }: { locale: Locale; surface: DiscoverySurfaceId }) {
  const { copy } = getDiscoverySurface(surface, locale);
  return (
    <section id="direct-answer" aria-labelledby="direct-answer-title" className="grid gap-10 border-b border-white/15 py-20 lg:grid-cols-[1fr_.62fr]">
      <div>
        <h2 id="direct-answer-title" className="max-w-4xl text-4xl font-black leading-tight text-white sm:text-6xl">{copy.question}</h2>
        <p className="mt-7 max-w-4xl text-lg leading-8 text-slate-300">{copy.answer}</p>
        <p className="mt-7 max-w-4xl border-l-2 border-[#ff9a3d] pl-5 text-sm leading-6 text-slate-400">{copy.boundary}</p>
      </div>
      <aside className="border-l border-white/15 pl-6">
        <h3 className="text-xl font-black text-white">{copy.relatedTitle}</h3>
        <ul className="mt-5 space-y-3">
          {copy.related.map((item) => (
            <li key={item.href}>
              <Link href={localizeHref(item.href, locale)} className="inline-flex min-h-11 items-center font-bold text-[#35d0e5] hover:text-white">{item.label} →</Link>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
