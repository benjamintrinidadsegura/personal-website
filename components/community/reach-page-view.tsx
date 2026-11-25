"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createPublicPageViewAllowlist } from "@/lib/analytics/public-page-view";
import { reachDiagnostic } from "@/lib/analytics/reach-diagnostics";

const paths = createPublicPageViewAllowlist();
const optInKey = "btshq-reach-opt-in";
export const reachChoiceEvent = "btshq-reach-choice";
export function getReachOptIn() {
  try { return sessionStorage.getItem(optInKey) === "yes"; } catch { return false; }
}
export function setReachOptIn(allowed: boolean) {
  try {
    if (allowed) sessionStorage.setItem(optInKey, "yes"); else sessionStorage.removeItem(optInKey);
    window.dispatchEvent(new Event(reachChoiceEvent));
    return true;
  } catch { return false; }
}

export function ReachPageView() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const navigation = useRef<{ path: string; body: string; attempts: number; complete: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let pending = false;
    const eligible = () => {
      if (!getReachOptIn()) { reachDiagnostic("consent_absent"); return false; }
      if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) {
        reachDiagnostic("privacy_signal"); return false;
      }
      if (!pathname || !paths.has(pathname) || window.location.pathname !== pathname || window.location.search) {
        reachDiagnostic("route_excluded"); return false;
      }
      if (document.visibilityState !== "visible") { reachDiagnostic("not_visible"); return false; }
      // Fragment anchors are neither eligibility input nor transmitted data.
      // /community#global-reach is the same public page, not an extra page view.
      return true;
    };
    if (navigation.current?.path !== pathname) navigation.current = null;
    async function countVisibleView() {
      if (!eligible() || pending || navigation.current?.complete || (navigation.current?.attempts ?? 0) >= 3) return;
      if (!navigation.current) navigation.current = { path: pathname!, body: JSON.stringify({
        pathname, eventId: crypto.randomUUID(), at: new Date().toISOString(),
      }), attempts: 0, complete: false };
      const event = navigation.current;
      pending = true;
      try { while (event.attempts < 3 && !cancelled && eligible()) {
        event.attempts++;
        try {
          const result = await fetch("/api/reach/view", {
            method: "POST", body: event.body, credentials: "omit", referrerPolicy: "origin",
            headers: { "content-type": "text/plain;charset=UTF-8", "x-btshq-reach-consent": "v1" },
            keepalive: true, redirect: "error",
          });
          if (result.status === 204) { event.complete = true; break; }
          reachDiagnostic("request_failed");
          if (result.status < 500) { event.complete = true; break; }
        } catch { reachDiagnostic("request_failed"); }
        if (event.attempts < 3) await new Promise((resolve) => setTimeout(resolve, 250 * event.attempts));
      } } finally { pending = false; }
    }
    void countVisibleView();
    document.addEventListener("visibilitychange", countVisibleView);
    window.addEventListener(reachChoiceEvent, countVisibleView);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", countVisibleView); window.removeEventListener(reachChoiceEvent, countVisibleView); };
  }, [pathname, search]);
  return null;
}
