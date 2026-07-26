"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const navigation = [
  { label: "Home", href: "/#home" },
  { label: "Now", href: "/#now" },
  { label: "Pulse", href: "/#pulse" },
  { label: "Building", href: "/#building" },
  { label: "Writing", href: "/#writing" },
  { label: "Interviews", href: "/#interviews" },
  { label: "EchoWall", href: "/echowall" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLElement>(null);

  const closeMenu = () => {
    setOpen(false);
    window.requestAnimationFrame(() => menuButton.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = mobileMenu.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#04111b]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[90rem] items-center justify-between px-5 sm:px-8">
        <Link href="/#home" className="flex items-center gap-3 text-lg font-black tracking-tight" aria-label="bts.online – Startseite">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#35d0e5]/40 text-[10px] tracking-widest text-[#35d0e5]">BTS</span>
          <span>Digital HQ</span>
        </Link>
        <nav aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => <li key={item.href}><Link className="rounded-full px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white xl:px-3 xl:text-sm" href={item.href}>{item.label}</Link></li>)}
          </ul>
        </nav>
        <button ref={menuButton} type="button" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white lg:hidden" aria-controls="mobile-navigation" aria-expanded={open} aria-label={open ? "Menü schließen" : "Menü öffnen"} onClick={() => open ? closeMenu() : setOpen(true)}>
          <span aria-hidden="true" className="text-xl leading-none">{open ? "×" : "≡"}</span>
        </button>
      </div>
      <nav ref={mobileMenu} id="mobile-navigation" aria-label="Mobile Navigation" hidden={!open} className="h-[calc(100svh-5rem)] border-t border-white/10 bg-[#04111b] px-5 py-6 lg:hidden">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">Navigate the HQ</p>
        <ul className="grid gap-1">
          {navigation.map((item, index) => <li key={item.href}><Link className="flex items-center gap-4 rounded-xl px-4 py-3 text-xl font-bold text-slate-200 hover:bg-white/5" href={item.href} onClick={closeMenu}><span className="font-mono text-xs text-slate-500">0{index + 1}</span>{item.label}</Link></li>)}
        </ul>
      </nav>
    </header>
  );
}
