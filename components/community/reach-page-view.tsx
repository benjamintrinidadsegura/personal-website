"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createPublicPageViewAllowlist } from "@/lib/analytics/public-page-view";

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
  const navigation = useRef<{ path: string; body: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let pending = false;
    const eligible = () => pathname && paths.has(pathname) && window.location.pathname === pathname
      && !window.location.search && !window.location.hash && document.visibilityState === "visible"
      && navigator.doNotTrack !== "1" && !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
      && getReachOptIn();
    if (navigation.current?.path !== pathname) navigation.current = null;
    async function countVisibleView() {
      if (!eligible() || pending) return;
      if (!navigation.current) navigation.current = { path: pathname!, body: JSON.stringify({
        pathname, eventId: crypto.randomUUID(), at: new Date().toISOString(),
      }) };
      pending = true;
      for (let attempt = 0; attempt < 3 && !cancelled && eligible(); attempt++) {
        try {
          const result = await fetch("/api/reach/view", {
            method: "POST", body: navigation.current.body, credentials: "omit", referrerPolicy: "origin",
            headers: { "content-type": "text/plain;charset=UTF-8", "x-btshq-reach-consent": "v1" },
            keepalive: true, redirect: "error",
          });
          if (result.status < 500) break;
        } catch { /* Retry the same event, never count it twice. */ }
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
    void countVisibleView();
    document.addEventListener("visibilitychange", countVisibleView);
    window.addEventListener(reachChoiceEvent, countVisibleView);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", countVisibleView); window.removeEventListener(reachChoiceEvent, countVisibleView); };
  }, [pathname]);
  return null;
}
