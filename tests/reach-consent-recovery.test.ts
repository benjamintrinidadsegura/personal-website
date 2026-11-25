import assert from "node:assert/strict";
import test from "node:test";
import { webcrypto } from "node:crypto";
import { loadSource } from "./helpers/load-source";

test("diagnostics have fixed fields, no visitor data and bounded per-outcome sampling", () => {
  let now = 100000;
  const logs: string[] = [];
  const { reachDiagnostic } = loadSource<typeof import("../lib/analytics/reach-diagnostics")>("lib/analytics/reach-diagnostics.ts", {}, {
    Date: { now: () => now }, console: { info: (value: string) => logs.push(value) },
  });
  for (let i = 0; i < 1000; i++) reachDiagnostic("rpc_succeeded");
  reachDiagnostic("country_unavailable");
  assert.deepEqual(logs.map((entry) => JSON.parse(entry)), [
    { event: "btshq_reach", outcome: "rpc_succeeded" }, { event: "btshq_reach", outcome: "country_unavailable" },
  ]);
  now += 60000;
  reachDiagnostic("rpc_succeeded");
  assert.equal(logs.length, 3);
});

test("interrupted retry resumes with the original identity after opt-in, without exceeding three attempts", async () => {
  let allowed = true;
  let effect: (() => (() => void)) | undefined;
  let completeRequest: ((response: Response) => void) | undefined;
  const requests: string[] = [];
  const window = Object.assign(new EventTarget(), { location: { pathname: "/community", search: "", hash: "#global-reach" } });
  const document = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const api = loadSource<typeof import("../components/community/reach-page-view")>("components/community/reach-page-view.tsx", {
    react: { useRef: () => ({ current: null }), useEffect: (callback: () => (() => void)) => { effect = callback; } },
    "next/navigation": { usePathname: () => "/community", useSearchParams: () => new URLSearchParams() },
    "@/lib/analytics/reach-diagnostics": { reachDiagnostic: () => {} },
    "@/lib/analytics/public-page-view": { createPublicPageViewAllowlist: () => new Set(["/community"]) },
  }, {
    window, document, navigator: { doNotTrack: "0", globalPrivacyControl: false }, crypto: webcrypto, Event,
    sessionStorage: { getItem: () => allowed ? "yes" : null, setItem: () => { allowed = true; }, removeItem: () => { allowed = false; } },
    setTimeout: (fn: () => void) => { fn(); },
    fetch: (_url: string, args: { body: string }) => {
      requests.push(args.body);
      return new Promise<Response>((resolve) => { completeRequest = resolve; });
    },
  });
  const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
  api.ReachPageView(); const cleanup = effect!(); await settle();
  assert.equal(requests.length, 1);
  api.setReachOptIn(false); completeRequest!(new Response(null, { status: 503 })); await settle();
  assert.equal(requests.length, 1, "opt-out prevents automatic retry");
  api.setReachOptIn(true); await settle();
  assert.equal(requests.length, 2, "interrupted request must not leave pending stuck");
  completeRequest!(new Response(null, { status: 503 })); await settle();
  assert.equal(requests.length, 3);
  completeRequest!(new Response(null, { status: 503 })); await settle();
  window.dispatchEvent(new Event("btshq-reach-choice")); document.dispatchEvent(new Event("visibilitychange")); await settle();
  assert.equal(requests.length, 3, "retry budget remains bounded");
  assert.equal(new Set(requests).size, 1, "all attempts retain the same replay UUID and timestamp");
  cleanup();
});
