"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiscoveryEngine } from "@/components/discovery/discovery-engine";

type NavigationLink = {
  label: string;
  href: string;
};

type NavigationItem = NavigationLink & {
  children?: NavigationLink[];
};

const navigation: NavigationItem[] = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  {
    label: "Projects",
    href: "/#building",
    children: [
      { label: "All projects", href: "/#building" },
      { label: "GOATRECRUTAINER", href: "/projects/goatrecrutainer" },
    ],
  },
  {
    label: "Insights",
    href: "/#pulse",
    children: [
      { label: "Pulse", href: "/#pulse" },
      { label: "Writing", href: "/#writing" },
      { label: "Interviews", href: "/#interviews" },
    ],
  },
  {
    label: "Tools",
    href: "/echowall",
    children: [{ label: "EchoWall", href: "/echowall" }],
  },
  { label: "Partners", href: "/#contact" },
  { label: "Contact", href: "/#contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLElement>(null);
  const desktopNavigation = useRef<HTMLElement>(null);
  const dropdownButtons = useRef<Record<string, HTMLButtonElement | null>>({});

  const closeMenu = () => {
    setOpen(false);
    window.requestAnimationFrame(() => menuButton.current?.focus());
  };

  const closeDropdown = useCallback((returnFocus = false) => {
    const activeDropdown = openDropdown;
    setOpenDropdown(null);
    if (returnFocus && activeDropdown) {
      window.requestAnimationFrame(() => dropdownButtons.current[activeDropdown]?.focus());
    }
  }, [openDropdown]);

  const handleDiscoveryOpen = useCallback(() => {
    setOpen(false);
    setOpenDropdown(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    if (!("mobileMenuScrollLock" in body.dataset) && !("discoveryScrollLock" in body.dataset)) {
      body.dataset.scrollLockPreviousOverflow = body.style.overflow;
    }
    body.dataset.mobileMenuScrollLock = "true";
    body.style.overflow = "hidden";
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
      delete body.dataset.mobileMenuScrollLock;
      if (!("discoveryScrollLock" in body.dataset)) {
        body.style.overflow = body.dataset.scrollLockPreviousOverflow ?? "";
        delete body.dataset.scrollLockPreviousOverflow;
      }
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!openDropdown) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!desktopNavigation.current?.contains(event.target as Node)) closeDropdown();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDropdown(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDropdown, openDropdown]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#04111b]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[90rem] items-center gap-2 px-5 sm:px-8 lg:grid lg:grid-cols-[auto_minmax(11rem,20rem)_auto] lg:gap-3 xl:gap-6">
        <Link href="/#home" className="mr-auto flex shrink-0 items-center gap-3 text-lg font-black tracking-tight lg:mr-0" aria-label="bts.online – Startseite">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#35d0e5]/40 text-[10px] tracking-widest text-[#35d0e5]">BTS</span>
          <span>Digital HQ</span>
        </Link>
        <DiscoveryEngine onOpen={handleDiscoveryOpen} />
        <nav ref={desktopNavigation} aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.label} className="relative">
                {item.children ? (
                  <>
                    <button
                      ref={(node) => { dropdownButtons.current[item.label] = node; }}
                      type="button"
                      className="flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5] xl:px-3 xl:text-sm"
                      aria-expanded={openDropdown === item.label}
                      aria-controls={`desktop-${item.label.toLowerCase()}-menu`}
                      onClick={() => setOpenDropdown((current) => current === item.label ? null : item.label)}
                      onKeyDown={(event) => {
                        if (event.key !== "ArrowDown") return;
                        event.preventDefault();
                        setOpenDropdown(item.label);
                        window.requestAnimationFrame(() => {
                          document.querySelector<HTMLElement>(`#desktop-${item.label.toLowerCase()}-menu a`)?.focus();
                        });
                      }}
                    >
                      {item.label}
                      <span aria-hidden="true" className={`text-[10px] transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}>⌄</span>
                    </button>
                    <ul
                      id={`desktop-${item.label.toLowerCase()}-menu`}
                      hidden={openDropdown !== item.label}
                      className="absolute left-0 top-full mt-2 min-w-52 rounded-2xl border border-white/10 bg-[#071824]/95 p-2 shadow-2xl backdrop-blur-xl"
                    >
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#35d0e5]"
                            href={child.href}
                            onClick={() => closeDropdown()}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link className="rounded-full px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5] xl:px-3 xl:text-sm" href={item.href} onClick={() => closeDropdown()}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <button ref={menuButton} type="button" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5] lg:hidden" aria-controls="mobile-navigation" aria-expanded={open} aria-label={open ? "Menü schließen" : "Menü öffnen"} onClick={() => open ? closeMenu() : setOpen(true)}>
          <span aria-hidden="true" className="text-xl leading-none">{open ? "×" : "≡"}</span>
        </button>
      </div>
      <nav ref={mobileMenu} id="mobile-navigation" aria-label="Mobile Navigation" hidden={!open} className="h-[calc(100svh-5rem)] overflow-y-auto border-t border-white/10 bg-[#04111b] px-5 py-6 lg:hidden">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">Navigate the HQ</p>
        <ul className="grid gap-2">
          {navigation.map((item, index) => (
            <li key={item.label} className="border-b border-white/10 pb-2 last:border-0">
              {item.children ? (
                <div className="rounded-2xl bg-white/[0.025] p-2">
                  <p className="flex min-h-11 items-center gap-4 px-3 text-lg font-bold text-white">
                    <span className="font-mono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                    {item.label}
                  </p>
                  <ul className="ml-8 grid gap-1 border-l border-[#35d0e5]/30 pl-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link className="flex min-h-11 items-center rounded-xl px-3 py-2 font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#35d0e5]" href={child.href} onClick={closeMenu}>{child.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link className="flex min-h-12 items-center gap-4 rounded-xl px-4 py-3 text-lg font-bold text-slate-200 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#35d0e5]" href={item.href} onClick={closeMenu}>
                  <span className="font-mono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
