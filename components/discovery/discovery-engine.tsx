"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { DiscoveryResults } from "@/components/discovery/discovery-results";
import { discoveryIndex } from "@/data/discovery-index";
import { discoverItems, groupDiscoveryItems } from "@/lib/discovery";

export function DiscoveryEngine({ onOpen }: { onOpen?: () => void }) {
  const router = useRouter();
  const instanceId = useId().replace(/:/gu, "");
  const listboxId = `${instanceId}-discovery-results`;
  const descriptionId = `${instanceId}-discovery-description`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const desktopInput = useRef<HTMLInputElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);
  const resultsPanel = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const matches = useMemo(() => discoverItems(discoveryIndex, query), [query]);
  const groups = useMemo(() => groupDiscoveryItems(matches), [matches]);
  const navigableItems = useMemo(() => matches.map(({ item }) => item).filter((item) => item.href), [matches]);

  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      const input = window.matchMedia("(min-width: 1024px)").matches ? desktopInput.current : mobileInput.current;
      input?.focus();
    });
  }, []);

  const openDiscovery = useCallback((trigger?: HTMLElement | null) => {
    if (trigger) returnFocus.current = trigger;
    onOpen?.();
    setOpen(true);
    focusInput();
  }, [focusInput, onOpen]);

  const closeDiscovery = useCallback((restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    setActiveId(null);
    if (restoreFocus) window.requestAnimationFrame(() => returnFocus.current?.focus());
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("en-US") === "k") {
        event.preventDefault();
        openDiscovery(document.activeElement as HTMLElement | null);
      }
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [openDiscovery]);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    if (!("mobileMenuScrollLock" in body.dataset) && !("discoveryScrollLock" in body.dataset)) {
      body.dataset.scrollLockPreviousOverflow = body.style.overflow;
    }
    body.dataset.discoveryScrollLock = "true";
    body.style.overflow = "hidden";

    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDiscovery();
        return;
      }
      if (event.key !== "Tab") return;

      const input = window.matchMedia("(min-width: 1024px)").matches ? desktopInput.current : mobileInput.current;
      if (!input) return;
      const links = [...(resultsPanel.current?.querySelectorAll<HTMLElement>("a[href]") ?? [])];
      const focusable = [input, ...links];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement as HTMLElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement as HTMLElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleModalKeyDown);
    return () => {
      delete body.dataset.discoveryScrollLock;
      if (!("mobileMenuScrollLock" in body.dataset)) {
        body.style.overflow = body.dataset.scrollLockPreviousOverflow ?? "";
        delete body.dataset.scrollLockPreviousOverflow;
      }
      document.removeEventListener("keydown", handleModalKeyDown);
    };
  }, [closeDiscovery, open]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
    if (navigableItems.length === 0) return;
    event.preventDefault();

    const activeIndex = navigableItems.findIndex(({ id }) => id === activeId);
    if (event.key === "ArrowDown") {
      const nextIndex = activeIndex < navigableItems.length - 1 ? activeIndex + 1 : 0;
      setActiveId(navigableItems[nextIndex].id);
      return;
    }
    if (event.key === "ArrowUp") {
      const nextIndex = activeIndex > 0 ? activeIndex - 1 : navigableItems.length - 1;
      setActiveId(navigableItems[nextIndex].id);
      return;
    }

    const selected = navigableItems[activeIndex >= 0 ? activeIndex : 0];
    if (selected.href) {
      closeDiscovery(false);
      router.push(selected.href);
    }
  };

  const inputProps = {
    type: "search" as const,
    value: query,
    role: "combobox",
    "aria-label": "Inhalte entdecken",
    "aria-expanded": open,
    "aria-controls": listboxId,
    "aria-describedby": descriptionId,
    "aria-haspopup": "listbox" as const,
    "aria-autocomplete": "list" as const,
    "aria-activedescendant": activeId ? `discovery-option-${activeId}` : undefined,
    autoComplete: "off",
    spellCheck: false,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setActiveId(null);
      if (!open) openDiscovery(event.currentTarget);
    },
    onKeyDown: handleInputKeyDown,
  };

  return (
    <div className="shrink-0 lg:w-full">
      <div className="relative hidden lg:block lg:w-full">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">⌕</span>
        <input
          {...inputProps}
          ref={desktopInput}
          placeholder="Discover the HQ"
          onClick={(event) => openDiscovery(event.currentTarget)}
          className="h-10 w-full rounded-full border border-white/15 bg-white/[0.035] pl-9 pr-14 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/25 focus:border-[#35d0e5]/60 focus:bg-[#071824] focus:ring-2 focus:ring-[#35d0e5]/15"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">⌘/Ctrl K</kbd>
      </div>

      <button
        type="button"
        className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:border-[#35d0e5]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5] lg:hidden"
        aria-label="Discovery öffnen"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={(event) => openDiscovery(event.currentTarget)}
      >
        <span aria-hidden="true" className="text-xl">⌕</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-20 z-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onPointerDown={() => closeDiscovery()} />
          <div ref={resultsPanel} className="fixed inset-x-3 top-24 z-10 mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-[#071824]/98 shadow-2xl sm:inset-x-6 lg:top-24">
            <div className="border-b border-white/10 p-3 lg:hidden">
              <input
                {...inputProps}
                ref={mobileInput}
                placeholder="Was möchtest du entdecken?"
                className="h-12 w-full rounded-xl border border-white/15 bg-[#04111b] px-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-[#35d0e5]/60 focus:ring-2 focus:ring-[#35d0e5]/15"
              />
            </div>
            <p id={descriptionId} className="sr-only">Vorschläge erscheinen während der Eingabe. Mit den Pfeiltasten auswählen und mit Enter öffnen.</p>
            <div id={listboxId} role="listbox" aria-label="Discovery-Ergebnisse">
              {matches.length > 0 && (
                <DiscoveryResults groups={groups} activeId={activeId} onActivate={setActiveId} onSelect={() => closeDiscovery(false)} />
              )}
            </div>
            {!query.trim() ? (
              <div className="px-6 py-12 text-center">
                <p className="text-lg font-black text-white">Discover the Digital HQ</p>
                <p className="mt-2 text-sm text-slate-400">Projekte, Insights, Tools, Menschen und Seiten entdecken.</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="px-6 py-12 text-center" role="status">
                <p className="text-lg font-black text-white">Keine Treffer</p>
                <p className="mt-2 text-sm text-slate-400">Für „{query}“ wurde noch nichts Passendes gefunden.</p>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-slate-500">
              <span aria-live="polite">{query.trim() ? `${matches.length} Treffer` : "Eingabe ab 1 Zeichen"}</span>
              <span>↑↓ Navigate · Enter Open · Esc Close</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
