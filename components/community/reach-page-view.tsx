"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createPublicPageViewAllowlist } from "@/lib/analytics/public-page-view";

const paths = createPublicPageViewAllowlist();
const optInKey = "btshq-reach-opt-in";

export function getReachOptIn() {
  try {
    return sessionStorage.getItem(optInKey) === "yes";
  } catch {
    return false;
  }
}

export function setReachOptIn(allowed: boolean) {
  try {
    if (allowed) sessionStorage.setItem(optInKey, "yes");
    else sessionStorage.removeItem(optInKey);
    return true;
  } catch {
    return false;
  }
}

export function ReachPageView() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (lastSent.current !== pathname) lastSent.current = null;
    function countVisibleView() {
      if (!pathname || !paths.has(pathname) || window.location.pathname !== pathname || window.location.search
        || document.visibilityState !== "visible" || navigator.doNotTrack === "1"
        || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
        || !getReachOptIn() || lastSent.current === pathname) return;
      lastSent.current = pathname;
      void fetch("/api/reach/view", {
        method: "POST",
        body: pathname,
        credentials: "omit",
        referrerPolicy: "origin",
        keepalive: true,
        redirect: "error",
      }).catch(() => undefined);
    }
    countVisibleView();
    document.addEventListener("visibilitychange", countVisibleView);
    return () => document.removeEventListener("visibilitychange", countVisibleView);
  }, [pathname]);

  return null;
}
