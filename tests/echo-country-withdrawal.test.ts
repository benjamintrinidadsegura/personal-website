import assert from "node:assert/strict";
import test from "node:test";
import { loadSource } from "./helpers/load-source";
import { isAllowedRequestOrigin } from "../lib/echowall/security";

const origin = "https://btshq.online";
const echoId = "146c80da-ff72-4d39-84f3-fd86b048b664";

test("flag withdrawal uses the existing origin and MFA boundary and only the single-echo RPC", async () => {
  const calls: unknown[] = [];
  let allowed = true;
  let currentOrigin = origin;
  let outcome: unknown = true;
  const actions = loadSource<typeof import("../app/admin/echowall/actions")>("app/admin/echowall/actions.ts", {
    "next/cache": {
      updateTag: () => assert.fail("This action must not change moderation"),
      revalidatePath: (path: string) => calls.push(path),
    },
    "next/headers": { headers: async () => new Headers({ host: "btshq.online", origin: currentOrigin }) },
    "@/lib/echowall/security": { isAllowedRequestOrigin },
    "@/lib/admin/authorization": {
      verifyAdminAuthorization: async (requiresMfa: boolean) => {
        assert.equal(requiresMfa, true);
        return allowed ? { supabase: { rpc: async (name: string, args: unknown) => {
          calls.push([name, args]);
          return { data: outcome, error: null };
        } } } : null;
      },
    },
  }, { process: { env: { SITE_URL: origin } } });

  currentOrigin = "https://other.invalid";
  assert.deepEqual(await actions.withdrawEchoPublicCountry(echoId), { status: "unavailable" });
  currentOrigin = origin;
  allowed = false;
  assert.deepEqual(await actions.withdrawEchoPublicCountry(echoId), { status: "unavailable" });
  allowed = true;
  assert.deepEqual(await actions.withdrawEchoPublicCountry("invalid"), { status: "unavailable" });
  assert.deepEqual(calls, []);
  assert.deepEqual(await actions.withdrawEchoPublicCountry(echoId), { status: "removed" });
  assert.deepEqual(calls, [["withdraw_echo_public_country", { p_echo_id: echoId }], "/echowall", "/community"]);
  calls.length = 0;
  outcome = false;
  assert.deepEqual(await actions.withdrawEchoPublicCountry(echoId), { status: "absent" });
  assert.deepEqual(calls, [["withdraw_echo_public_country", { p_echo_id: echoId }]]);
});
