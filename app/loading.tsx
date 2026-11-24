import { getLocale } from "@/lib/i18n/server";
import { getErrorDictionary } from "@/data/i18n/errors";

export default async function Loading() {
  const locale = await getLocale();
  // Keep the existing first-viewport reserve in the streamed markup itself.
  // A missing/late global CSS guard must not paint the footer inside that viewport.
  return <div role="status" data-navigation-loading style={{ minHeight: "100svh" }} className="mx-auto flex max-w-[90rem] items-center px-5 pt-20 font-mono text-sm text-slate-400 sm:px-8"><span className="mr-3 inline-block h-2 w-2 rounded-full bg-[#35d0e5] motion-safe:animate-pulse" aria-hidden="true" />{getErrorDictionary(locale).loading}</div>;
}
