"use client";

import Link from "next/link";
import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
import { getGlobalDictionary } from "@/data/i18n/global";

export function Footer() {
  const locale = useLocale();
  const href = useLocalizedHref();
  const copy = getGlobalDictionary(locale);
  return (
    <footer className="border-t border-white/10 bg-[#02080d] px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div><Link href={href("/#home")} className="text-xl font-black text-white">bts.online</Link><p className="mt-2 text-sm text-slate-500">{copy.footer.owner}</p><nav aria-label={copy.footerNavigation} className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm"><Link href={href("/world")} className="text-slate-300 hover:text-[#35d0e5]">{copy.nav.worldMap}</Link><Link href={href("/#contact")} className="text-slate-300 hover:text-[#35d0e5]">{copy.footer.contact}</Link><Link href={href("/newsletter")} className="text-slate-300 hover:text-[#35d0e5]">Newsletter</Link><Link href={href("/privacy")} className="text-slate-400 hover:text-white">{copy.footer.privacy}</Link></nav></div>
        <div className="text-left sm:text-right"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.footer.signal}</p><p className="mt-2 text-xs text-slate-600">© {new Date().getFullYear()} · {copy.footer.evolving}</p></div>
      </div>
    </footer>
  );
}
