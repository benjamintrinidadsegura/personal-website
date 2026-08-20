"use client";

import { getErrorDictionary } from "@/data/i18n/errors";
import { defaultLocale, localeDetails, localeRegistry } from "@/lib/i18n/config";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const documentLanguage = typeof document === "undefined" ? defaultLocale : document.documentElement.lang.toLocaleLowerCase("en-US");
  const locale = localeRegistry.find(({ code, htmlLang }) => documentLanguage === code || documentLanguage === htmlLang.toLocaleLowerCase("en-US"))?.code ?? defaultLocale;
  const copy = getErrorDictionary(locale);
  return (
    <html lang={localeDetails[locale].htmlLang}>
      <body className="min-h-svh bg-[#02080d] px-5 py-20 text-white">
        <main className="mx-auto max-w-3xl border-l-2 border-[#ff9a3d] pl-7">
          <h1 className="text-4xl font-black">{copy.globalTitle}</h1>
          <p className="mt-5 text-slate-300">{copy.globalBody}</p>
          <button type="button" onClick={reset} className="mt-8 min-h-12 rounded-full bg-[#35d0e5] px-7 font-black text-[#041018]">{copy.retry}</button>
        </main>
      </body>
    </html>
  );
}
