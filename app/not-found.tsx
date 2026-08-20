import Link from "next/link";

import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import { getErrorDictionary } from "@/data/i18n/errors";

export default async function NotFound() {
  const locale = await getLocale();
  const copy = getErrorDictionary(locale);
  return (
    <section className="flex min-h-[75svh] items-center px-5 pb-20 pt-32 sm:px-8" aria-labelledby="not-found-title">
      <div className="mx-auto w-full max-w-4xl border-l-2 border-[#ff9a3d] pl-7 sm:pl-10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.25em] text-[#ff9a3d]">404 / {copy.notFound}</p>
        <h1 id="not-found-title" className="mt-5 text-5xl font-black text-white sm:text-7xl">{copy.missingTitle}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{copy.missingBody}</p>
        <Link href={localizeHref("/", locale)} className="mt-8 inline-flex min-h-12 items-center rounded-full border border-[#35d0e5]/50 px-6 font-black text-[#35d0e5]">{copy.home} →</Link>
      </div>
    </section>
  );
}
