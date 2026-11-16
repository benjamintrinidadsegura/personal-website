import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import type { ComponentProps, ReactElement } from "react";
import * as runtime from "react/jsx-runtime";
import { hookHarness } from "./helpers/hook-harness";
import { loadSource } from "./helpers/load-source";
import { getEchoDictionary } from "../data/i18n/echowall";
import { locales } from "../lib/i18n/config";
import type { EchoForm } from "../components/echowall/echo-form";
import type { EchoActionState } from "../types/echowall";

type Element = ReactElement<Record<string, unknown>>;
function all(node: unknown): Element[] {
  if (Array.isArray(node)) return node.flatMap(all);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const el = node as Element;
  return [el, ...all(el.props.children)];
}

for (const locale of locales) for (const failure of ["transport", "expired"] as const) test(`${locale}: ${failure} retains controlled draft, announces failure and allows a deliberate retry`, async () => {
  const h = hookHarness();
  let calls = 0;
  let release: (() => void) | undefined;
  let pending: Promise<void> | undefined;
  const api = loadSource<{ EchoForm: typeof EchoForm }>("components/echowall/echo-form.tsx", {
    react: { ...h.hooks, startTransition: (fn: () => void) => fn(),
      useActionState(reducer: (state: EchoActionState, data: FormData) => Promise<EchoActionState>, initial: EchoActionState) {
        const [state, setState] = h.hooks.useState(initial);
        return [state, (data: FormData) => { pending = reducer(state, data).then(setState); }, false];
      } },
    "react/jsx-runtime": runtime,
    "@/app/echowall/actions": { submitEchoAction: async () => {
      calls++;
      if (calls === 1) { await new Promise<void>((resolve) => { release = resolve; });
        if (failure === "expired") return { ok: false, code: "INVALID_FORM_TOKEN" };
        throw new Error("private transport detail"); }
      return { ok: true, deletionReference: "LOCAL-REFERENCE" };
    }, issueEchoFormToken: async () => "renewed-local-token" },
    "@/components/i18n/locale-context": { useLocalizedHref: () => (path: string) => path },
  }, { FormData: class { constructor() { return new FormData(); } } });
  const props: ComponentProps<typeof EchoForm> = { formToken: "local-test-only", copy: getEchoDictionary(locale).form };
  const render = () => h.render(() => api.EchoForm(props));
  let tree = render();
  for (const [name, value] of [["displayName", "Local reader"], ["message", "Local recovery message"], ["email", "local@example.test"]]) {
    const field = all(tree).find((el) => el.props.name === name)!;
    (field.props.onChange as (e: unknown) => void)({ target: { value } });
  }
  tree = render();
  const submit = tree.props.onSubmit as (e: unknown) => void;
  const event = { preventDefault() {}, currentTarget: {} };
  submit(event); submit(event);
  assert.equal(calls, 1, "rapid double-submit is blocked before the pending render");
  release!(); await pending;
  tree = render();
  assert.equal(all(tree).find((el) => el.props.name === "message")?.props.value, "Local recovery message");
  assert.equal(all(tree).find((el) => el.props.name === "email")?.props.value, "local@example.test");
  assert.ok(all(tree).some((el) => el.props["aria-live"] === "polite" && el.props.children === props.copy.errors[failure === "expired" ? "INVALID_FORM_TOKEN" : "SERVICE_UNAVAILABLE"]));
  assert.equal(all(tree).find((el) => el.props.name === "formToken")?.props.value, failure === "expired" ? "renewed-local-token" : "local-test-only");
  assert.doesNotMatch(JSON.stringify(tree), /private transport detail|LOCAL-REFERENCE/);
  (tree.props.onSubmit as (e: unknown) => void)(event); await pending;
  tree = render();
  assert.equal(calls, 2);
  assert.ok(all(tree).some((el) => el.props.children === "LOCAL-REFERENCE"));
  h.unmount();
});

test("public reads cannot enter a persistent cache and explicitly bypass the fetch cache", () => {
  const source = readFileSync("lib/echowall/queries.ts", "utf8");
  assert.doesNotMatch(source, /unstable_cache|revalidate:\s*300/);
  let delegated: RequestInit | undefined;
  let options: { fetch: typeof fetch } | undefined;
  loadSource("lib/echowall/queries.ts", {
    "server-only": {}, react: { cache: (fn: () => unknown) => { void fn(); return fn; } },
    "@/lib/echowall/country-configuration": { isEchoCountryContextEnabled: () => false },
    "@/lib/echowall/countries": { isEchoCountry: () => false },
    "@/lib/public-content-hygiene": { isPublicEchoReady: () => true },
    "@/types/echowall": { echoCategories: [] },
    "@/lib/supabase/server": { getSupabaseServerClient: (value: typeof options) => { options = value; throw new Error("stop before I/O"); } },
  }, { fetch: async (_input: unknown, init: RequestInit) => { delegated = init; return new Response(); } });
  assert.ok(options?.fetch);
  void options.fetch("http://127.0.0.1", { method: "GET", cache: "force-cache", signal: AbortSignal.abort() });
  assert.equal(delegated?.cache, "no-store");
  assert.equal(delegated?.method, "GET");
  assert.ok(delegated?.signal?.aborted);
});
