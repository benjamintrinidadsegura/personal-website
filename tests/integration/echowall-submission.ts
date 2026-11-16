// Invoked only by scripts/test-echowall-backend.py against its disposable local API.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { processEchoSubmission } from "../../app/echowall/actions";
import { createFormToken } from "../../lib/echowall/security";
import { locales } from "../../lib/i18n/config";
import { loadSource } from "../helpers/load-source";
import { isEchoCountry, summarizeEchoCountries } from "../../lib/echowall/countries";
import { isPublicEchoReady } from "../../lib/public-content-hygiene";
import { echoCategories } from "../../types/echowall";
import type { PublicEchoQueryResult } from "../../types/echowall";

const url = process.env.ECHO_LOCAL_URL!;
assert.match(url, /^http:\/\/127\.0\.0\.1:\d+$/);
assert.equal(process.env.ECHO_DISPOSABLE_TEST, "true");
const client = createClient(url, process.env.ECHO_LOCAL_SERVICE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
const secrets = { siteUrl: "http://localhost:3298", formTokenSecret: "local-form-only", ipHashSecret: "local-hash-only" };
const request = { origin: secrets.siteUrl, host: "localhost:3298", networkIdentifier: "192.0.2.77" };
const raw = () => ({ displayName: "Local reader", message: "An isolated lifecycle contribution.", category: "thought", email: "",
  consent: "true", website: "", formToken: createFormToken(secrets.formTokenSecret, Date.now()-4000) });
let rpcCalls = 0;
const submit = async (s: Parameters<Parameters<typeof processEchoSubmission>[3]>[0]) => {
  rpcCalls++;
  const { data, error } = await client.rpc("submit_echo", { p_display_name: s.displayName, p_message: s.message,
    p_category: s.category, p_email: s.email, p_network_hash: s.networkHash, p_email_hash: s.emailHash,
    p_message_hash: s.messageHash, p_form_token_hash: s.formTokenHash, p_deletion_token_hash: s.deletionTokenHash });
  return { echoId: typeof data === "string" ? data : null, errorCode: error?.message };
};
async function main() {
const recorded = raw();
assert.equal((await processEchoSubmission(recorded, request, secrets, submit)).ok, true);
assert.deepEqual(await processEchoSubmission(recorded, request, secrets, submit), { ok:false, code:"INVALID_FORM_TOKEN" });
assert.deepEqual(await processEchoSubmission(raw(), request, secrets, submit), { ok:false, code:"DUPLICATE" });
for (const locale of locales) {
  for (const change of [{message:""},{message:"x".repeat(501)},{message:"<script>alert(1)</script>"},{consent:"false"}]) {
    const before = rpcCalls;
    const r = await processEchoSubmission({...raw(),...change}, request, secrets, submit, Date.now(), locale);
    assert.ok(!r.ok && r.code==="INVALID_INPUT"); assert.equal(rpcCalls,before);
  }
}
assert.deepEqual(await processEchoSubmission(raw(), request, secrets, async () => { throw new Error("private test detail"); }), {ok:false,code:"SERVICE_UNAVAILABLE"});
const publicReader = loadSource<{getApprovedEchoes:(n:number,country:boolean)=>Promise<PublicEchoQueryResult>}>("lib/echowall/queries.ts", {
  "server-only":{},react:{cache:(fn:unknown)=>fn},
  "@/lib/echowall/country-configuration":{isEchoCountryContextEnabled:()=>true},
  "@/lib/echowall/countries":{isEchoCountry},"@/lib/public-content-hygiene":{isPublicEchoReady},
  "@/types/echowall":{echoCategories},"@/lib/supabase/server":{getSupabaseServerClient:()=>client},
});
const before=await publicReader.getApprovedEchoes(50,true);
assert.equal(before.status,"data");assert.equal(before.echoes.length,3);
assert.deepEqual(summarizeEchoCountries(before.echoes),[{countryCode:"DE",contributions:3}]);
assert.doesNotMatch(JSON.stringify(before),/deletion_token|network_hash|email|actor_id/);
const admin=createClient(url,process.env.ECHO_LOCAL_ADMIN_KEY!,{auth:{persistSession:false}});
const selected=before.echoes[0].id;
assert.equal((await admin.rpc("moderate_echo",{p_echo_id:selected,p_action:"hide",p_expected_status:"approved",p_reason:"Local application read verification"})).error,null);
const after=await publicReader.getApprovedEchoes(50,true);
assert.equal(after.echoes.length,2);assert.deepEqual(summarizeEchoCountries(after.echoes),[]);
assert.equal((await admin.rpc("moderate_echo",{p_echo_id:selected,p_action:"restore",p_expected_status:"hidden",p_reason:null})).error,null);
assert.equal((await publicReader.getApprovedEchoes(50,true)).echoes.length,3);
const unavailable = createClient("http://127.0.0.1:1", "local-only", {auth:{persistSession:false}});
const api = loadSource<{ getApprovedEchoes: (n:number) => Promise<{status:string;echoes:unknown[]}> }>("lib/echowall/queries.ts", {
  "server-only":{}, react:{cache:(fn:unknown)=>fn},
  "@/lib/echowall/country-configuration":{isEchoCountryContextEnabled:()=>false},
  "@/lib/echowall/countries":{isEchoCountry}, "@/lib/public-content-hygiene":{isPublicEchoReady},
  "@/types/echowall":{echoCategories}, "@/lib/supabase/server":{getSupabaseServerClient:()=>unavailable},
});
assert.deepEqual(await api.getApprovedEchoes(50),{status:"unavailable",echoes:[]});
console.log(JSON.stringify({applicationValidation:"PASS",localeCases:28,submissionViaActualSDKAndDatabase:"PASS",publicProjectionAndCountryThreshold:"PASS",hideAndRestoreReads:"PASS",replay:"PASS",duplicate:"PASS",connectionFailure:"PASS",privateErrorRedaction:"PASS",rpcCalls}));
}
void main().catch(() => { console.error("Isolated application/database assertions failed; sensitive details withheld."); process.exitCode=1; });
