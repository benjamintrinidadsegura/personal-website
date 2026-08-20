"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useDiscovery } from "@/components/discovery/discovery-context";
import { DiscoveryResults } from "@/components/discovery/discovery-results";
import { useLocale } from "@/components/i18n/locale-context";
import { getDiscoveryUiCopy, getGuidedDiscoveryPrompts } from "@/data/i18n/discovery";
import { acquireScrollLock } from "@/lib/scroll-lock";

function isCurrentLocation(targetHref: string) {
  const target = new URL(targetHref, window.location.href);

  return target.origin === window.location.origin
    && target.pathname === window.location.pathname
    && target.search === window.location.search
    && target.hash === window.location.hash;
}

export function DiscoveryEngine({ onOpen }: { onOpen?: () => void }) {
  const locale = useLocale();
  const copy = getDiscoveryUiCopy(locale);
  const prompts = getGuidedDiscoveryPrompts(locale);
  const pathname = usePathname();
  const {
    query,
    setQuery,
    matches,
    groups,
    overlayOpen: open,
    setOverlayOpen,
    navigationPending,
    beginCanvasNavigation,
    settleCanvasNavigation,
    clearDiscovery,
  } = useDiscovery();
  const instanceId = useId().replace(/:/gu, "");
  const listboxId = `${instanceId}-discovery-results`;
  const descriptionId = `${instanceId}-discovery-description`;
  const [activeId, setActiveId] = useState<string | null>(null);
  const discoveryRoot = useRef<HTMLDivElement>(null);
  const desktopInput = useRef<HTMLInputElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);
  const resultsPanel = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const overlayNavigation = useRef<{ id: number; targetHref: string } | null>(null);

  const selectableItems = useMemo(
    () => matches.filter(({ item }) => Boolean(item.href)).map(({ item }) => item),
    [matches],
  );

  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      const input = window.matchMedia("(min-width: 1024px)").matches ? desktopInput.current : mobileInput.current;
      input?.focus();
    });
  }, []);

  const openDiscovery = useCallback((trigger?: HTMLElement | null) => {
    if (trigger) returnFocus.current = trigger;
    onOpen?.();
    setOverlayOpen(true);
    focusInput();
  }, [focusInput, onOpen, setOverlayOpen]);

  const dismissDiscovery = useCallback((restoreFocus = false) => {
    setOverlayOpen(false);
    setActiveId(null);
    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const previousTarget = returnFocus.current;
          const fallbackTarget = window.matchMedia("(min-width: 1024px)").matches ? desktopInput.current : mobileTrigger.current;
          const focusTarget = previousTarget?.isConnected && previousTarget.getClientRects().length > 0
            ? previousTarget
            : fallbackTarget;

          focusTarget?.focus();
        });
      });
    }
  }, [setOverlayOpen]);

  const resetDiscovery = useCallback((restoreFocus = true) => {
    clearDiscovery();
    dismissDiscovery(restoreFocus);
  }, [clearDiscovery, dismissDiscovery]);

  const beginOverlayNavigation = useCallback((targetHref: string) => {
    const id = beginCanvasNavigation(targetHref);
    overlayNavigation.current = { id, targetHref };
    return id;
  }, [beginCanvasNavigation]);

  const settleOverlayNavigation = useCallback((targetHref: string, handoffId: number) => {
    settleCanvasNavigation(targetHref, handoffId);

    const navigation = overlayNavigation.current;
    if (!navigation || navigation.id !== handoffId || navigation.targetHref !== targetHref) return;

    overlayNavigation.current = null;
    if (isCurrentLocation(targetHref)) dismissDiscovery(false);
  }, [dismissDiscovery, settleCanvasNavigation]);

  useLayoutEffect(() => {
    const navigation = overlayNavigation.current;
    if (!navigation) return;

    if (isCurrentLocation(navigation.targetHref)) {
      settleCanvasNavigation(navigation.targetHref, navigation.id);
      overlayNavigation.current = null;
      dismissDiscovery(false);
      return;
    }

    if (!navigationPending) overlayNavigation.current = null;
  }, [dismissDiscovery, navigationPending, pathname, settleCanvasNavigation]);

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
    const releaseScrollLock = acquireScrollLock();

    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        resetDiscovery(true);
        return;
      }
      if (event.key !== "Tab") return;

      const input = window.matchMedia("(min-width: 1024px)").matches ? desktopInput.current : mobileInput.current;
      if (!input) return;
      const promptButtons = [...(resultsPanel.current?.querySelectorAll<HTMLElement>("[data-guided-discovery-prompt]") ?? [])];
      const options = [...(resultsPanel.current?.querySelectorAll<HTMLElement>('a[role="option"][href]') ?? [])];
      const focusable = [input, ...promptButtons, ...options];
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
      releaseScrollLock();
      document.removeEventListener("keydown", handleModalKeyDown);
    };
  }, [open, resetDiscovery]);

  useEffect(() => {
    if (open || !query.trim()) return;

    const handleCanvasEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      resetDiscovery(true);
    };

    document.addEventListener("keydown", handleCanvasEscape);
    return () => document.removeEventListener("keydown", handleCanvasEscape);
  }, [open, query, resetDiscovery]);

  useEffect(() => {
    if (!open) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (discoveryRoot.current?.contains(event.target as Node)) return;
      dismissDiscovery(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [dismissDiscovery, open]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
    if (selectableItems.length === 0) return;
    event.preventDefault();

    const activeIndex = selectableItems.findIndex(({ id }) => id === activeId);
    if (event.key === "ArrowDown") {
      const nextIndex = activeIndex < selectableItems.length - 1 ? activeIndex + 1 : 0;
      setActiveId(selectableItems[nextIndex].id);
      return;
    }
    if (event.key === "ArrowUp") {
      const nextIndex = activeIndex > 0 ? activeIndex - 1 : selectableItems.length - 1;
      setActiveId(selectableItems[nextIndex].id);
      return;
    }

    const selected = selectableItems[activeIndex >= 0 ? activeIndex : 0];
    document.getElementById(`discovery-option-${selected.id}`)?.click();
  };

  const applyGuidedPrompt = useCallback((promptQuery: string) => {
    setQuery(promptQuery);
    setActiveId(null);
    focusInput();
  }, [focusInput, setQuery]);

  const inputProps = {
    type: "search" as const,
    value: query,
    role: "combobox",
    "aria-label": copy.searchLabel,
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
    <div ref={discoveryRoot} className="shrink-0 lg:w-full">
      <div className="relative hidden lg:block lg:w-full">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">⌕</span>
        <input
          {...inputProps}
          ref={desktopInput}
          placeholder={copy.placeholder}
          onClick={(event) => openDiscovery(event.currentTarget)}
          className="h-10 w-full rounded-full border border-white/15 bg-white/[0.035] pl-9 pr-14 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/25 focus:border-[#35d0e5]/60 focus:bg-[#071824] focus:ring-2 focus:ring-[#35d0e5]/15"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">⌘/Ctrl K</kbd>
      </div>

      <button
        ref={mobileTrigger}
        type="button"
        className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:border-[#35d0e5]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5] lg:hidden"
        aria-label={copy.open}
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={(event) => openDiscovery(event.currentTarget)}
      >
        <span aria-hidden="true" className="text-xl">⌕</span>
      </button>

      {open && (
        <div ref={resultsPanel} className="fixed inset-x-3 top-24 z-10 mx-auto flex max-h-[calc(100svh-7rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#071824]/98 shadow-2xl sm:inset-x-6 lg:top-24">
            <div className="shrink-0 border-b border-white/10 p-3 lg:hidden">
              <input
                {...inputProps}
                ref={mobileInput}
                placeholder={copy.placeholder}
                className="h-12 w-full rounded-xl border border-white/15 bg-[#04111b] px-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-[#35d0e5]/60 focus:ring-2 focus:ring-[#35d0e5]/15"
              />
            </div>
            <p id={descriptionId} className="sr-only">{copy.description}</p>
            <div id={listboxId} role="listbox" aria-label={copy.resultsLabel} className="min-h-0 flex-1 overflow-hidden">
              {matches.length > 0 && (
                <DiscoveryResults
                  groups={groups}
                  activeId={activeId}
                  onActivate={setActiveId}
                  onBeginNavigation={beginOverlayNavigation}
                  onSettleNavigation={settleOverlayNavigation}
                />
              )}
            </div>
            {!query.trim() ? (
              <div className="min-h-0 shrink overflow-y-auto px-5 py-7 text-center sm:px-6 sm:py-9">
                <p className="text-lg font-black text-white">{copy.discoverTitle}</p>
                <p className="mt-2 text-sm text-slate-400">{copy.discoverDescription}</p>
                <div className="mx-auto mt-6 grid max-w-xl gap-2 text-left sm:grid-cols-2" role="group" aria-label={copy.examples}>
                  {prompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      data-guided-discovery-prompt
                      onClick={() => applyGuidedPrompt(prompt.query)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        applyGuidedPrompt(prompt.query);
                      }}
                      className="min-h-11 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-[#35d0e5]/35 hover:bg-[#35d0e5]/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : matches.length === 0 ? (
              <div className="shrink-0 px-6 py-12 text-center" role="status">
                <p className="text-lg font-black text-white">{copy.noResults}</p>
                <p className="mt-2 text-sm text-slate-400">{copy.noResultsFor(query)}</p>
              </div>
            ) : null}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/10 px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-slate-500">
              <span aria-live="polite">{query.trim() ? copy.count(matches.length) : copy.startTyping}</span>
              <span>{copy.shortcuts}</span>
            </div>
          </div>
      )}
    </div>
  );
}
