# BTS.ONLINE V1 Backup and Recovery

Status: operational V1 procedure, reviewed 22 August 2026
Restore Owner: **Benjamin Trinidad Segura**

This is the proportionate recovery model for the current small, personal Digital
HQ. It does not claim enterprise availability. Both Supabase DEV and Production
currently use the Free plan in AWS `eu-central-1` (Frankfurt, EU). Supabase's
current Free plan includes neither automatic database backups nor point-in-time
recovery (PITR), so the owner must maintain logical backups while live writes are
accepted.

## 1. Scope

### Repository-backed state

Git history is the recovery source for application code, public editorial
registries, database migrations, schema, policies and documented configuration.
Environment files, secrets and generated build output are deliberately excluded.

### Database-backed state

The logical backup covers the database schema, roles supported by the Supabase
CLI export, and application data needed to recover accounts, comments, EchoWall,
newsletter records if enabled, moderation/audit state and other live records.
Supabase Storage objects are not database rows and require a separate private
object export if Storage is ever used for user content. V1 currently treats that
as a trigger to extend this procedure rather than claiming coverage that does not
exist.

## 2. Cadence and recovery targets

- While public database writes are enabled: create a logical backup weekly.
- Create an additional backup immediately before every migration, schema/policy
  change, material import or other high-risk data operation.
- If no public writes are enabled: verify the procedure monthly and back up before
  the next database change.
- Verify artifact readability and expected non-zero files after every run.
- Target RPO: at most seven days during active V1 use, reduced to the pre-change
  backup for planned high-risk work.
- Target RTO: one business day for a small V1 recovery. This is an internal target,
  not a Supabase guarantee.

## 3. Safe logical backup

Prerequisites: a current supported Supabase CLI, Docker as required by that CLI,
and a database connection string obtained from the correct Supabase project. The
connection string is supplied through a temporary operator environment variable;
it must never be pasted into a command log, committed, or printed.

1. Confirm the intended source project in the Supabase dashboard and record only
   its non-secret project name, environment and UTC backup time.
2. Create a dated directory below repository-local `.bts-backups/`. This path is
   ignored by Git and is never under `public/`, `out/` or another served directory.
3. With the secret connection string available only as `BTS_BACKUP_DB_URL`, run:

   ```powershell
   supabase db dump --db-url "$env:BTS_BACKUP_DB_URL" -f .bts-backups/<timestamp>/roles.sql --role-only
   supabase db dump --db-url "$env:BTS_BACKUP_DB_URL" -f .bts-backups/<timestamp>/schema.sql
   supabase db dump --db-url "$env:BTS_BACKUP_DB_URL" -f .bts-backups/<timestamp>/data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
   ```

4. Check that all three files exist and are non-empty. Review filenames and size,
   not personal rows or secrets, in the operational log.
5. Encrypt the backup set and copy it to private storage separate from both Git and
   the development device. Access is limited to the Restore Owner. Delete the
   unencrypted local working copy after the encrypted copy is verified.
6. Clear `BTS_BACKUP_DB_URL` from the shell. Never store `.env` files, API keys,
   database URLs, raw server logs or secret-management exports beside the dump.

The commands follow Supabase's documented CLI backup sequence. The CLI applies
Supabase-specific filtering; a future material use of Auth customizations or
Storage must be reviewed against the then-current provider restore guidance.

## 4. Safe restore drill

**A restore is destructive. Production restore is prohibited without explicit
operator action and a separately approved incident or change procedure.** Never
run `supabase db reset --linked`, `psql`, or another restore command merely to test
against Production or shared DEV.

Quarterly, and after material schema changes, the Restore Owner should:

1. Provision or select a disposable local Postgres/Supabase target with no shared
   DEV or Production data. Verify its host is loopback/local and its project name
   contains an unmistakable disposable marker.
2. Unset every Production and shared-DEV connection variable. Set a separate
   `BTS_RESTORE_TARGET_URL` only after independently checking the target twice.
3. Restore the roles/schema/data files using the current official Supabase restore
   sequence and `psql --single-transaction --variable ON_ERROR_STOP=1`.
4. Run non-destructive integrity checks: expected schemas/tables exist, row counts
   are plausible, representative relationships resolve, RLS/policies are present,
   and no outbound email/webhook is enabled.
5. Record only date, backup identifier, disposable target, checks and outcome. Do
   not record secrets or personal row content.
6. Destroy only the verified disposable target after the result is recorded.

For this release pass, the procedure and command model were checked against current
official Supabase documentation and repository tests. **No live restore was
executed**, because using Production or important shared DEV would create
disproportionate risk and no approved disposable target was supplied.

## 5. Recovery decision

During an incident, Benjamin Trinidad Segura owns triage and restore approval. Stop
risky writes, preserve evidence without copying personal content into tickets,
identify the last verified backup, and decide whether recovery uses Git/migrations,
a logical restore into a new isolated target, or provider assistance. Validate the
recovered target before any traffic switch. Never overwrite the only surviving
copy and never retry an uncertain mutation against Production.

## 6. Escalation triggers

Reassess this model and move to automated encrypted backups and/or a paid plan with
appropriate provider backup/PITR when user volume or write rate grows materially,
bts.online becomes commercially critical, recovery targets become shorter than the
manual cadence, regulated/business/customer-critical data is introduced, or one
person can no longer operate the procedure reliably.

## 7. Provider references verified for this procedure

- Supabase CLI reference: `supabase db dump` schema, role and data exports.
- Supabase “Backup and Restore using the CLI”: the three-file dump and isolated
  restore sequence.
- Supabase pricing/production checklist: Free plan has no automatic backups or
  PITR and downloadable provider backups are not available for active Free projects.

Provider documentation can change. Recheck it before every live recovery event.
