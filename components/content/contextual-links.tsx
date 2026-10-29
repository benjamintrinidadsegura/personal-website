import Link from "next/link";
import { contextualCopy } from "@/data/i18n/contextual-journeys";
import type { ContextualDestination } from "@/lib/contextual-journeys";
import type { Locale } from "@/lib/i18n/config";

export function ContextualLinks({ destinations, locale }: { destinations: readonly ContextualDestination[]; locale: Locale }) {
  if (!destinations.length) return null;
  const copy = contextualCopy[locale];
  return (
    <section id="contextual-continuation" aria-labelledby="contextual-continuation-title" className="border-t border-white/15 py-14 sm:py-20">
      <h2 id="contextual-continuation-title" className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl">{copy.title}</h2>
      <ul className={`mt-8 grid gap-x-10 sm:grid-cols-2 ${destinations.length > 2 ? "lg:grid-cols-3" : ""}`}>
        {destinations.map((destination) => (
          <li key={destination.href} className="min-w-0 border-t border-white/10">
            <Link prefetch={false} href={destination.href} className="group block h-full min-h-11 py-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">
              <span className="font-mono text-xs text-slate-400">{copy.kinds[destination.kind]}</span>
              <h3 lang={destination.language} className="mt-3 break-words text-xl font-bold leading-snug text-white group-hover:text-[#35d0e5]">{destination.title}<span aria-hidden="true"> ↗</span></h3>
              <p className="mt-3 max-w-[40ch] text-sm leading-6 text-slate-400">{copy.reasons[destination.reason]}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
