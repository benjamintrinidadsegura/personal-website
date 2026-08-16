import Link from "next/link";
import { siteConfig } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#02080d] px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div><Link href="/#home" className="text-xl font-black text-white">bts.online</Link><p className="mt-2 text-sm text-slate-500">The Digital HQ of {siteConfig.name}</p><nav aria-label="Footer" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm"><Link href="/#contact" className="text-slate-300 hover:text-[#35d0e5]">Contact &amp; Social</Link><Link href="/newsletter" className="text-slate-300 hover:text-[#35d0e5]">Newsletter</Link><Link href="/privacy" className="text-slate-400 hover:text-white">Privacy</Link></nav></div>
        <div className="text-left sm:text-right"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Stories. Careers. Communities.</p><p className="mt-2 text-xs text-slate-600">© {new Date().getFullYear()} · Always evolving</p></div>
      </div>
    </footer>
  );
}
