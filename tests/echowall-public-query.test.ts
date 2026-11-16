import assert from "node:assert/strict";
import test from "node:test";
import { isEchoCountry } from "../lib/echowall/countries";
import { isPublicEchoReady } from "../lib/public-content-hygiene";
import { echoCategories, type PublicEchoQueryResult } from "../types/echowall";
import { loadSource } from "./helpers/load-source";

type Row = Record<string, unknown>;
const approved: Row = { id: "isolated-approved", display_name: "Local reader", message: "A local controlled message.", category: "thought", approved_at: "2026-11-16T00:00:00Z", status: "approved", country_code: "DE", include_in_community_map: true, email: "never-public@example.test", network_hash: "never-public" };

function reader(flag = true) {
  let rows: Row[] = [approved];
  let error: unknown = null;
  let thrown = false;
  const calls: { columns: string; limit?: number }[] = [];
  let cacheContract: unknown;
  const client = { from(table: string) {
    assert.equal(table, "echoes");
    return { select(columns: string) {
      const call: { columns: string; limit?: number } = { columns }; calls.push(call);
      const query = {
        eq(column: string, value: string) { assert.equal(column, "status"); assert.equal(value, "approved"); return query; },
        not(column: string, op: string, value: unknown) { assert.deepEqual([column, op, value], ["approved_at", "is", null]); return query; },
        order(column: string, options: unknown) { assert.equal(column, "approved_at"); assert.deepEqual(options, { ascending: false }); return query; },
        limit(limit: number) { call.limit = limit; return query; },
        async overrideTypes() {
          if (thrown) throw new Error("private upstream text must not escape");
          const selected = rows.filter((row) => row.status === "approved" && row.approved_at !== null)
            .map((row) => Object.fromEntries(columns.split(",").map((key) => [key.trim(), row[key.trim()]])));
          return { data: error ? null : selected, error };
        },
      }; return query;
    } };
  } };
  const api = loadSource<{ getApprovedEchoes: (limit: number, country?: boolean) => Promise<PublicEchoQueryResult> }>("lib/echowall/queries.ts", {
    "server-only": {},
    "next/cache": { unstable_cache: (fn: unknown, keys: unknown, options: unknown) => { cacheContract = { keys, options }; return fn; } },
    "@/lib/echowall/country-configuration": { isEchoCountryContextEnabled: () => flag },
    "@/lib/echowall/countries": { isEchoCountry },
    "@/lib/public-content-hygiene": { isPublicEchoReady },
    "@/lib/supabase/server": { getSupabaseServerClient: () => client },
    "@/types/echowall": { echoCategories },
  });
  return { read: api.getApprovedEchoes, calls, cacheContract, setRows: (value: Row[]) => { rows = value; }, setFailure: (value: unknown, exception = false) => { error = value; thrown = exception; } };
}

test("approved echo projection excludes private columns, pending/rejected/hidden/deleted and invalid or synthetic records", async () => {
  const query = reader();
  query.setRows([approved, ...["pending", "rejected", "hidden", "deleted"].map((status) => ({ ...approved, id: status, status })),
    { ...approved, id: "invalid-date", approved_at: "not-a-date" }, { ...approved, id: "synthetic", display_name: "Synthetic" },
    { ...approved, id: "invalid-category", category: "private" }]);
  const result = await query.read(999, true);
  assert.equal(result.status, "data");
  assert.deepEqual(result.echoes.map(({ id }) => id), ["isolated-approved"]);
  assert.equal(result.echoes[0].countryCode, "DE");
  assert.doesNotMatch(JSON.stringify(result), /never-public|network_hash|email/u);
  assert.equal(query.calls[0].limit, 50);
});

test("genuine empty, unavailable, exception and subsequent recovery remain distinct", async () => {
  const query = reader();
  query.setRows([]); assert.equal((await query.read(50, true)).status, "empty");
  query.setFailure({ code: "safe-test-error" }); assert.deepEqual(await query.read(50, true), { status: "unavailable", echoes: [] });
  query.setFailure(null, true); assert.deepEqual(await query.read(50), { status: "unavailable", echoes: [] });
  query.setFailure(null); query.setRows([approved]); assert.equal((await query.read(50, true)).status, "data");
  assert.deepEqual(query.cacheContract, { keys: ["approved-echoes"], options: { revalidate: 300, tags: ["approved-echoes"] } });
});

test("moderation and deletion remove country eligibility on the next invalidated public read", async () => {
  const query = reader();
  assert.equal((await query.read(50, true)).echoes.length, 1);
  for (const status of ["hidden", "rejected", "deleted", "pending"]) {
    query.setRows([{ ...approved, status }]); assert.equal((await query.read(50, true)).status, "empty");
  }
  query.setRows([{ ...approved, approved_at: null }]); assert.equal((await query.read(50, true)).status, "empty");
});

test("feature off retains the legacy schema and home preview never requests country declarations", async () => {
  const query = reader(false);
  const result = await query.read(3, true);
  assert.equal(result.countryContextAvailable, false); assert.equal(result.echoes[0].countryCode, undefined);
  assert.doesNotMatch(query.calls[0].columns, /country|email|hash/u);
  const enabled = reader(true); await enabled.read(3);
  assert.doesNotMatch(enabled.calls[0].columns, /country/u);
});
