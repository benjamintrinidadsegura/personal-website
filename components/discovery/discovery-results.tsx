"use client";

import Link, { useLinkStatus } from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type MutableRefObject } from "react";

import { DiscoveryExplanation } from "@/components/discovery/discovery-explanation";
import type { DiscoveryGroup, DiscoveryMatch, DiscoveryStatus } from "@/types/discovery";

const statusClasses: Record<DiscoveryStatus, string> = {
  Live: "border-emerald-300/30 text-emerald-200",
  Beta: "border-[#35d0e5]/40 text-[#73e3f1]",
  "In Development": "border-[#ff9a3d]/40 text-[#ffb36d]",
  "Coming Soon": "border-white/15 text-slate-400",
};

const scrollAffordanceHeight = 48;

export function isUnmodifiedPrimaryClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0
    && !event.defaultPrevented
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey;
}

export function DiscoveryNavigationStatus({
  targetHref,
  handoffIdRef,
  onSettle,
}: {
  targetHref: string;
  handoffIdRef: MutableRefObject<number | null>;
  onSettle: (targetHref: string, handoffId: number) => void;
}) {
  const { pending } = useLinkStatus();
  const observedPending = useRef(false);

  useEffect(() => {
    if (pending) {
      observedPending.current = true;
      return;
    }

    if (!observedPending.current) return;
    observedPending.current = false;

    const navigationId = handoffIdRef.current;
    handoffIdRef.current = null;
    if (navigationId !== null) onSettle(targetHref, navigationId);
  }, [handoffIdRef, onSettle, pending, targetHref]);

  return null;
}

interface DiscoveryResultsProps {
  groups: Map<DiscoveryGroup, DiscoveryMatch[]>;
  activeId: string | null;
  onActivate: (id: string) => void;
  onBeginNavigation: (targetHref: string) => number;
  onSettleNavigation: (targetHref: string, handoffId: number) => void;
}

function DiscoveryResultOption({
  match,
  activeId,
  onActivate,
  onBeginNavigation,
  onSettleNavigation,
}: {
  match: DiscoveryMatch;
  activeId: string | null;
  onActivate: (id: string) => void;
  onBeginNavigation: DiscoveryResultsProps["onBeginNavigation"];
  onSettleNavigation: DiscoveryResultsProps["onSettleNavigation"];
}) {
  const { item } = match;
  const optionId = `discovery-option-${item.id}`;
  const handoffIdRef = useRef<number | null>(null);
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-white">{item.title}</span>
          <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${statusClasses[item.status]}`}>
            {item.status}
          </span>
        </div>
        <p className="mt-1 line-clamp-1 text-sm leading-5 text-slate-400 sm:line-clamp-2">{item.description}</p>
        <DiscoveryExplanation reasons={match.reasons} maxReasons={1} compact />
      </div>
      {item.href ? (
        <span aria-hidden="true" className="shrink-0 text-slate-500">→</span>
      ) : (
        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">Noch nicht verfügbar</span>
      )}
    </>
  );

  if (item.href) {
    return (
      <Link
        id={optionId}
        href={item.href}
        role="option"
        aria-selected={activeId === item.id}
        onMouseEnter={() => onActivate(item.id)}
        onFocus={() => onActivate(item.id)}
        onClick={(event) => {
          if (!isUnmodifiedPrimaryClick(event)) return;
          handoffIdRef.current = onBeginNavigation(item.href as string);
        }}
        className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition focus:outline-none ${activeId === item.id ? "bg-[#35d0e5]/10 ring-1 ring-inset ring-[#35d0e5]/45" : "hover:bg-white/5"}`}
      >
        <DiscoveryNavigationStatus targetHref={item.href} handoffIdRef={handoffIdRef} onSettle={onSettleNavigation} />
        {content}
      </Link>
    );
  }

  return (
    <div
      id={optionId}
      role="option"
      aria-disabled="true"
      aria-selected="false"
      className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left"
    >
      {content}
    </div>
  );
}

export function DiscoveryResults({ groups, activeId, onActivate, onBeginNavigation, onSettleNavigation }: DiscoveryResultsProps) {
  const scrollArea = useRef<HTMLDivElement>(null);
  const scrollContent = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = scrollArea.current;
    if (!element) return;

    setCanScrollDown(element.scrollHeight - element.scrollTop - element.clientHeight > 1);
  }, []);

  useLayoutEffect(() => {
    const element = scrollArea.current;
    if (!element) return;

    element.scrollTop = 0;
    const frame = window.requestAnimationFrame(updateScrollState);
    return () => window.cancelAnimationFrame(frame);
  }, [groups, updateScrollState]);

  useLayoutEffect(() => {
    const element = scrollArea.current;
    if (!element || !activeId) return;

    const activeOption = document.getElementById(`discovery-option-${activeId}`);
    if (!activeOption || !element.contains(activeOption)) return;

    const scrollRect = element.getBoundingClientRect();
    const optionRect = activeOption.getBoundingClientRect();
    const visibleBottom = scrollRect.bottom - scrollAffordanceHeight;

    if (optionRect.top < scrollRect.top) {
      element.scrollTop += optionRect.top - scrollRect.top;
    } else if (optionRect.bottom > visibleBottom) {
      element.scrollTop += optionRect.bottom - visibleBottom;
    }

    const frame = window.requestAnimationFrame(updateScrollState);
    return () => window.cancelAnimationFrame(frame);
  }, [activeId, updateScrollState]);

  useEffect(() => {
    const element = scrollArea.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(element);
    if (scrollContent.current) observer.observe(scrollContent.current);
    return () => observer.disconnect();
  }, [updateScrollState]);

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={scrollArea}
        data-discovery-results-scroll
        data-has-more-results={canScrollDown || undefined}
        onScroll={updateScrollState}
        className="h-full max-h-[min(52svh,22rem)] overflow-y-scroll overscroll-contain [scrollbar-color:rgba(115,227,241,0.45)_rgba(255,255,255,0.06)] [scrollbar-gutter:stable] [scrollbar-width:thin] lg:max-h-[min(58svh,26rem)]"
      >
        <div ref={scrollContent} className="p-2 pb-12 sm:p-3 sm:pb-12">
          {[...groups].map(([group, matches]) => {
            const headingId = `discovery-group-${group.toLocaleLowerCase("en-US")}`;

            return (
              <section key={group} role="group" aria-labelledby={headingId} className="not-first:mt-2">
                <h2 id={headingId} className="px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#35d0e5]">
                  {group}
                </h2>
                <div className="grid gap-1">
                  {matches.map((match) => {
                    return (
                      <DiscoveryResultOption
                        key={match.item.id}
                        match={match}
                        activeId={activeId}
                        onActivate={onActivate}
                        onBeginNavigation={onBeginNavigation}
                        onSettleNavigation={onSettleNavigation}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {canScrollDown && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t from-[#071824] via-[#071824]/90 to-transparent pb-2">
          <span className="rounded-full border border-white/10 bg-[#071824]/95 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400 shadow-lg">
            Weitere Ergebnisse – scrollen
          </span>
        </div>
      )}
    </div>
  );
}
