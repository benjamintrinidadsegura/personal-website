# ADR 0001: Life Alignment Relationship Engine V1.1

**Status:** Accepted
**Date:** 2026-09-19
**Scope:** BTS.ONLINE Life Alignment

## Context

Life Alignment V1 shipped Self, a local shared-device Partner comparison, and Life Vision. The post-V1 backlog deliberately required a separate product and privacy review before cross-device invitations, account-owned private sessions, saved answers, or repeated rounds could be introduced.

The Relationship Engine V1.1 product batch supplied that review and explicitly authorized Partner, Friendship, and Founder modules with two modes: an unstored Solo Reflection and a private two-person Invite Session. The batch fixes the product invariant `INDEPENDENT FIRST → SHARED AFTERWARDS → UNDERSTAND → TALK → ACT → AGREE` and prohibits compatibility scores, diagnosis, success prediction, AI inference, public result sharing, remote database mutation, and new vendors.

## Decision

- Extend the existing Life Alignment product; do not replace its accepted Self, Life Vision, print, localization, account, or shared-device Partner behavior.
- Use one typed, versioned, deterministic relationship-module registry and comparison engine for Partner, Friendship, and Founder. Module questions, sections, dimensions, scenario context, and action resources remain module-specific.
- Keep Solo Reflection in current page memory only. It does not fabricate a counterpart and does not require an account.
- Require the initiator of an Invite Session to use BTS Account. A guest may join without an account after explicit participation consent.
- Use a first-class session/round/participant/invite/answer/result/agreement data model. A round records module, question-set, and interpretation versions so future repeated rounds do not rewrite historical meaning.
- Use a seven-day, 256-bit random invitation capability. Persist only a purpose-bound keyed hash. On acceptance, issue a separate opaque guest participant capability in a secure, HTTP-only, same-site cookie; the invite secret does not become an indefinite result credential.
- Keep authorization server-side. Before both participants complete, a participant-facing DTO may expose only the viewer's own answers and the counterpart's coarse lifecycle state. After both complete, both participants receive the same deterministic derived result; counterpart raw answers remain private by default.
- Make Agreements optional, limited to one through five concise items, revisioned, and finalized only after acknowledgements from both participants. Editing resets acknowledgements. Agreements are personal shared notes, not legal contracts.
- Allow an invited participant to withdraw and delete their participation before shared finalization. Do not silently rewrite finalized shared history; whole-session and post-finalization joint-ownership deletion remain later decisions.
- Keep private invite/session/result routes out of the sitemap and apply noindex, no-store, and no-referrer controls. Do not log answers, agreement text, participant identity, tokens, or private URLs.
- Introduce persistence through one forward-only local Supabase migration with deny-by-default forced RLS and narrowly granted service-role RPCs. The migration is not applied to DEV or Production in this batch.

## Consequences

- Invite/session E2E remains blocked until the reviewed migration is separately approved and applied to an isolated environment. Repository-local domain, contract, authorization, migration-source, and UI validation remain possible without remote mutation.
- Incomplete session cleanup has a documented retention need but no new scheduler in V1.1. This is an operational follow-up; invite secrets still become unusable after seven days.
- Guest-to-account claiming, email delivery, reminders, timeline/trend UI, multi-person comparison, AI reflection, and post-finalization joint deletion remain out of scope.
- The previous local Partner shared-device experience remains available as an explicitly labelled legacy/private local flow.
