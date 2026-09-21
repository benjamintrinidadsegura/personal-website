import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(new URL("../supabase/migrations/20260919000000_life_alignment_relationship_engine.sql", import.meta.url), "utf8").toLowerCase();
const runtimeFixSql = readFileSync(new URL("../supabase/migrations/20260919010000_life_alignment_relationship_runtime_fix.sql", import.meta.url), "utf8").toLowerCase();

test("relationship migration is additive, typed, versioned and round-compatible", () => {
  for (const name of [
    "alignment_sessions", "alignment_rounds", "alignment_participants", "alignment_invites", "alignment_answers",
    "alignment_agreement_sets", "alignment_agreement_items", "alignment_agreement_acknowledgements", "alignment_rate_limits",
  ]) assert.match(sql, new RegExp(`create table public\\.${name}`));
  assert.match(sql, /unique \(session_id, round_number\)/);
  assert.match(sql, /module_version text not null/);
  assert.match(sql, /question_set_version text not null/);
  assert.match(sql, /interpretation_version text not null/);
  assert.match(sql, /primary key \(round_id, participant_id, question_id\)/);
  assert.doesNotMatch(sql, /drop table|truncate|alter table auth\.|delete from auth\./);
  assert.equal((sql.match(/pg_catalog\.strpos\(/g) ?? []).length, 4);
  assert.doesNotMatch(sql, /pg_catalog\.position\(/);
});

test("relationship runtime repair replaces only answer persistence with supported fail-closed JSON validation", () => {
  assert.match(runtimeFixSql, /create or replace function public\.save_alignment_answers/);
  assert.match(runtimeFixSql, /pg_catalog\.jsonb_typeof\(p_answers\) <> 'object'/);
  assert.match(runtimeFixSql, /select count\(\*\) from pg_catalog\.jsonb_each\(p_answers\)/);
  assert.doesNotMatch(runtimeFixSql, /jsonb_object_length/);
  assert.match(runtimeFixSql, /security definer/);
  assert.match(runtimeFixSql, /set search_path = pg_catalog, pg_temp/);
  assert.match(runtimeFixSql, /revoke all on function public\.save_alignment_answers\(uuid, text, uuid, jsonb, boolean\) from public, anon, authenticated/);
  assert.match(runtimeFixSql, /grant execute on function public\.save_alignment_answers\(uuid, text, uuid, jsonb, boolean\) to service_role/);
  assert.doesNotMatch(runtimeFixSql, /create table|drop table|truncate|alter table/);
});

test("every relationship table has forced RLS and no direct public or authenticated grants", () => {
  const tables = [
    "alignment_sessions", "alignment_rounds", "alignment_participants", "alignment_invites", "alignment_answers",
    "alignment_agreement_sets", "alignment_agreement_items", "alignment_agreement_acknowledgements", "alignment_rate_limits",
  ];
  for (const name of tables) {
    assert.match(sql, new RegExp(`alter table public\\.${name} enable row level security`));
    assert.match(sql, new RegExp(`alter table public\\.${name} force row level security`));
  }
  assert.match(sql, /from public, anon, authenticated, service_role/);
  assert.doesNotMatch(sql, /grant (?:select|insert|update|delete|all) on table public\.alignment_/);
});

test("invite and participant capabilities persist only as unique 64-character hashes", () => {
  assert.match(sql, /token_hash text not null unique/);
  assert.match(sql, /capability_hash text unique/);
  assert.match(sql, /token_hash ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(sql, /capability_hash ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.doesNotMatch(sql, /invite_token text|participant_token text|raw_token|plaintext_token/);
  assert.match(sql, /expires_at <= created_at \+ interval '7 days 5 minutes'/);
});

test("database constraints enforce a two-person V1.1 session without blocking future rounds", () => {
  assert.match(sql, /alignment_participant_role as enum \('initiator', 'invitee'\)/);
  assert.match(sql, /unique \(session_id, role\)/);
  assert.match(sql, /role = 'initiator' and user_id is not null and capability_hash is null/);
  assert.match(sql, /role = 'invitee' and user_id is null/);
  assert.match(sql, /module_id in \('partner', 'friendship', 'founder'\)/);
  assert.match(sql, /round_number between 1 and 1000/);
});

test("invite join and result unlock transitions use locks and fail closed", () => {
  assert.match(sql, /where token_hash = p_token_hash for update/);
  assert.match(sql, /status <> 'active'[\s\S]*alignment_participant_already_joined/);
  assert.match(sql, /expires_at <= pg_catalog\.clock_timestamp\(\)[\s\S]*alignment_expired_invite/);
  assert.match(sql, /select \* into v_round[\s\S]*for update/);
  assert.match(sql, /exists \(select 1 from public\.alignment_participants where session_id = p_session_id and status <> 'completed'\)/);
  assert.match(sql, /alignment_result_not_unlocked/);
});

test("session DTO selects own answers and never returns counterpart answer rows", () => {
  const viewStart = sql.indexOf("create function public.get_alignment_session_view");
  const viewEnd = sql.indexOf("create function public.revoke_alignment_invite", viewStart);
  const view = sql.slice(viewStart, viewEnd);
  assert.match(view, /answer\.participant_id = v_viewer\.id/);
  assert.match(view, /'counterpartstatus'/);
  assert.match(view, /'sharedresultavailable'/);
  assert.match(view, /'sharedresult', v_round\.shared_result/);
  assert.doesNotMatch(view, /answer\.participant_id = v_counterpart\.id|counterpartanswers|rawanswers/);
});

test("agreement RPCs enforce 1–5 concise items, optimistic revision and acknowledgement reset", () => {
  assert.match(sql, /jsonb_array_length\(p_items\) not between 1 and 5/);
  assert.match(sql, /char_length\(v_item\.body\) not between 3 and 240/);
  assert.match(sql, /v_set\.revision <> p_expected_revision/);
  assert.match(sql, /delete from public\.alignment_agreement_acknowledgements/);
  assert.match(sql, /when v_ack_count = 2 then 'finalized'/);
});

test("participant deletion is authority-bound, clears answers and stops at finalized shared history", () => {
  const start = sql.indexOf("create function public.delete_alignment_participation");
  const boundary = sql.slice(start);
  assert.match(boundary, /role = 'invitee' and capability_hash = p_capability_hash for update/);
  assert.match(boundary, /shared_result is not null[\s\S]*alignment_finalized_deletion_policy_required/);
  assert.match(boundary, /delete from public\.alignment_answers/);
  assert.match(boundary, /capability_hash = null/);
  assert.match(boundary, /status = 'withdrawn'/);
});

test("all mutation and read RPCs are service-only security-definer boundaries", () => {
  const names = [
    "create_alignment_session", "get_alignment_invite_landing", "join_alignment_invite", "save_alignment_answers",
    "get_alignment_round_answers_for_result", "store_alignment_shared_result", "get_alignment_session_view",
    "revoke_alignment_invite", "save_alignment_agreement", "acknowledge_alignment_agreement", "delete_alignment_participation", "list_alignment_sessions", "consume_alignment_rate_limit",
  ];
  for (const name of names) {
    assert.match(sql, new RegExp(`create function public\\.${name}`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}`));
  }
  assert.ok((sql.match(/security definer/g) ?? []).length >= names.length);
  assert.ok((sql.match(/set search_path = pg_catalog, pg_temp/g) ?? []).length >= names.length);
});

test("initiator dashboard returns coarse status only and remains account-bound", () => {
  const start = sql.indexOf("create function public.list_alignment_sessions");
  const dashboard = sql.slice(start);
  assert.match(dashboard, /session\.initiator_user_id = p_actor_user_id/);
  assert.match(dashboard, /counterpart_status/);
  assert.match(dashboard, /shared_result_available/);
  assert.match(dashboard, /agreement_status/);
  assert.doesNotMatch(dashboard, /alignment_answers|answer_value|ownanswers|counterpartanswers/);
  assert.match(dashboard, /revoke all on function public\.list_alignment_sessions\(uuid\) from public, anon, authenticated/);
});

test("repository-native server-side abuse controls are atomic, privacy-safe and cover prioritized actions", () => {
  const start = sql.indexOf("create function public.consume_alignment_rate_limit");
  const rateLimit = sql.slice(start);
  assert.match(sql, /create table public\.alignment_rate_limits/);
  assert.match(rateLimit, /pg_advisory_xact_lock/);
  assert.match(rateLimit, /created_at > v_now - interval '15 minutes'/);
  assert.match(rateLimit, /created_at > v_now - interval '24 hours'/);
  assert.match(rateLimit, /alignment_rate_limited/);
  for (const action of ["invite-validate", "create-session", "join", "save-answers", "revoke", "agreement", "delete-participation"])
    assert.match(rateLimit, new RegExp(`'${action}'`));
  assert.doesNotMatch(rateLimit, /ip_address|raw_ip|invite_token/);
});
