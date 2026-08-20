"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PENDING_ATTRIBUTE = "data-navigation-pending";
const FALLBACK_TIMEOUT_MS = 10_000;
const MINIMUM_VISIBLE_MS = 160;
const CACHED_ROUTE_SETTLE_MS = 180;

let fallbackTimer: number | undefined;
let settleTimer: number | undefined;
let feedbackStartedAt = 0;
let loadingBoundaryObserved = false;

export type NavigationFeedbackIntent = {
  currentHref: string;
  targetHref: string;
  button: number;
  defaultPrevented: boolean;
  modified: boolean;
  target: string;
  download: boolean;
};

export function shouldStartNavigationFeedback(intent: NavigationFeedbackIntent): boolean {
  if (intent.defaultPrevented || intent.button !== 0 || intent.modified || intent.download) return false;
  if (intent.target && intent.target !== "_self") return false;

  try {
    const current = new URL(intent.currentHref);
    const target = new URL(intent.targetHref, current);
    if (target.origin !== current.origin || !["http:", "https:"].includes(target.protocol)) return false;

    // Same-document and hash-only navigation must keep native browser behavior.
    return target.pathname !== current.pathname || target.search !== current.search;
  } catch {
    return false;
  }
}

export function stopNavigationFeedback() {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute(PENDING_ATTRIBUTE);
  if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
  if (settleTimer !== undefined) window.clearTimeout(settleTimer);
  fallbackTimer = undefined;
  settleTimer = undefined;
  loadingBoundaryObserved = false;
}

function stopNavigationFeedbackAfterMinimum() {
  const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (performance.now() - feedbackStartedAt));
  if (settleTimer !== undefined) window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(stopNavigationFeedback, remaining);
}

export function startNavigationFeedback() {
  if (typeof document === "undefined") return;
  feedbackStartedAt = performance.now();
  loadingBoundaryObserved = false;
  document.documentElement.setAttribute(PENDING_ATTRIBUTE, "true");
  if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
  fallbackTimer = window.setTimeout(stopNavigationFeedback, FALLBACK_TIMEOUT_MS);
}

function NavigationFeedbackEvents() {
  const pathname = usePathname();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!loadingBoundaryObserved && !document.querySelector("[data-navigation-loading]")) {
        stopNavigationFeedbackAfterMinimum();
      }
    }, CACHED_ROUTE_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) return;
      const link = eventTarget.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.getAttribute("aria-disabled") === "true") return;

      if (shouldStartNavigationFeedback({
        currentHref: window.location.href,
        targetHref: link.href,
        button: event.button,
        defaultPrevented: event.defaultPrevented,
        modified: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
        target: link.target,
        download: link.hasAttribute("download"),
      })) {
        startNavigationFeedback();
        // React handlers run after this capture listener. If one deliberately
        // cancels the click, remove the optimistic feedback in the same turn.
        window.queueMicrotask(() => {
          if (event.defaultPrevented) stopNavigationFeedback();
        });
      }
    };
    const handleHistoryNavigation = () => startNavigationFeedback();
    const handlePageShow = () => stopNavigationFeedback();
    const main = document.getElementById("main-content");
    const observer = new MutationObserver(() => {
      if (!document.documentElement.hasAttribute(PENDING_ATTRIBUTE)) return;
      if (document.querySelector("[data-navigation-loading]")) {
        loadingBoundaryObserved = true;
      } else if (loadingBoundaryObserved) {
        stopNavigationFeedbackAfterMinimum();
      }
    });

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handleHistoryNavigation);
    window.addEventListener("pageshow", handlePageShow);
    if (main) observer.observe(main, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handleHistoryNavigation);
      window.removeEventListener("pageshow", handlePageShow);
      observer.disconnect();
      stopNavigationFeedback();
    };
  }, []);

  return null;
}

export function NavigationFeedback() {
  return (
    <>
      <div className="navigation-feedback" aria-hidden="true" />
      <NavigationFeedbackEvents />
    </>
  );
}
