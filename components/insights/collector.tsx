"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/routing";
import { insightsChoiceEvent, insightsOptInKey, lifecycleSignals, type InsightEvent, type InsightTarget } from "@/lib/insights/contract";

export function insightsAllowed() {
  try { return sessionStorage.getItem(insightsOptInKey) === "yes" && navigator.doNotTrack !== "1" && !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl; } catch { return false; }
}
export function setInsightsConsent(allowed: boolean) {
  try { if (allowed) sessionStorage.setItem(insightsOptInKey, "yes"); else sessionStorage.removeItem(insightsOptInKey); window.dispatchEvent(new Event(insightsChoiceEvent)); return true; } catch { return false; }
}
function eligible() { return insightsAllowed() && !location.search && document.visibilityState === "visible"; }
type Pending = { body: string; attempts: number; pending: boolean; complete: boolean; task?: Promise<void> };
function send(event: Pending, alive: () => boolean): Promise<void> {
  if (event.task) return event.task.then(() => {
    if (!event.complete && event.attempts < 3 && alive() && eligible()) return send(event, alive);
  });
  if (event.complete || event.attempts >= 3 || !alive() || !eligible()) return Promise.resolve();
  event.pending = true;
  // Start in a microtask so a replaced effect can await the original request and
  // resume its remaining budget, instead of losing a view behind a pending latch.
  event.task = Promise.resolve().then(async () => {
    while (event.attempts < 3 && alive() && eligible()) {
      event.attempts++;
      try {
        const response = await fetch("/api/insights/event", { method: "POST", body: event.body,
          headers: { "content-type": "text/plain;charset=UTF-8", "x-btshq-insights-consent": "v1" },
          credentials: "omit", referrerPolicy: "origin", redirect: "error", keepalive: true });
        if (response.status < 500) { event.complete = true; return; }
      } catch { /* Measurement failure never blocks the product. Same identity on retry. */ }
      if (event.attempts < 3) await new Promise((resolve) => setTimeout(resolve, 250 * event.attempts));
    }
  }).finally(() => { event.pending = false; event.task = undefined; });
  return event.task;
}
function pending(name: InsightEvent, contentId: string): Pending {
  return { body: JSON.stringify({ name, contentId, eventId: crypto.randomUUID(), at: new Date().toISOString() }), attempts: 0, pending: false, complete: false };
}

/** One ledger per current navigation; never a visitor/session history. */
export function InsightView({ enabled, name, contentId }: { enabled: boolean; name: InsightEvent; contentId: string }) {
  const path = usePathname(), search = useSearchParams().toString();
  const ledger = useRef<{ key: string; event: Pending } | null>(null);
  useEffect(() => {
    if (!enabled || !path) return;
    let alive = true;
    const key = path + ":" + name + ":" + contentId;
    if (ledger.current?.key !== key) ledger.current = null;
    const record = () => {
      if (location.pathname !== path || !eligible()) return;
      if (!ledger.current) ledger.current = { key, event: pending(name, contentId) };
      void send(ledger.current.event, () => alive);
    };
    record(); window.addEventListener(insightsChoiceEvent, record); document.addEventListener("visibilitychange", record);
    return () => { alive = false; window.removeEventListener(insightsChoiceEvent, record); document.removeEventListener("visibilitychange", record); };
  }, [enabled, path, search, name, contentId]);
  return null;
}

export function InsightsCollector({ targets, lifecycleOnly = false }: { targets: InsightTarget[]; lifecycleOnly?: boolean }) {
  const path = usePathname(), search = useSearchParams().toString();
  const target = targets.find((item) => item.href === path);
  const section = useRef<{ key: string; event: Pending } | null>(null);
  const lifecycle = useRef<{ path: string | null; complete: boolean }>({ path: null, complete: false });
  useEffect(() => {
    let alive = true;
    if (lifecycle.current.path !== path) lifecycle.current = { path, complete: false };
    const inFlight = new Set<Pending>();
    const product = (event: Event) => {
      if (!target?.lifecycle || !eligible() || location.pathname !== path) return;
      const detail: unknown = (event as CustomEvent).detail;
      if (!detail || typeof detail !== "object" || Object.keys(detail).join() !== "name") return;
      const value = (detail as { name: unknown }).name;
      if (typeof value !== "string") return;
      const signal = lifecycleSignals[value];
      if (!signal || signal.path !== stripLocalePrefix(path!)) return;
      if (signal.name === "tool_complete" && lifecycle.current.complete) return;
      if (signal.name === "tool_start") lifecycle.current.complete = false;
      else lifecycle.current.complete = true;
      if (inFlight.size >= 3) return;
      const request = pending(signal.name, target.id); inFlight.add(request);
      void send(request, () => alive).finally(() => inFlight.delete(request));
    };
    const opened = () => {
      if (lifecycleOnly || !eligible() || location.pathname !== path) return;
      const current = targets.find((item) => item.href === path + location.hash);
      if (!current || !location.hash) return;
      const key = path + location.hash;
      if (section.current?.key !== key) section.current = { key, event: pending("public_content_open", current.id) };
      void send(section.current.event, () => alive);
    };
    if (section.current && !section.current.key.startsWith(path + "#")) section.current = null;
    opened();
    window.addEventListener("hashchange", opened); window.addEventListener(insightsChoiceEvent, opened); window.addEventListener("bts:product-event", product);
    return () => { alive = false; window.removeEventListener("hashchange", opened); window.removeEventListener(insightsChoiceEvent, opened); window.removeEventListener("bts:product-event", product); };
  }, [path, search, target, targets, lifecycleOnly]);
  return target && !lifecycleOnly ? <InsightView enabled name={target.event} contentId={target.id} /> : null;
}
