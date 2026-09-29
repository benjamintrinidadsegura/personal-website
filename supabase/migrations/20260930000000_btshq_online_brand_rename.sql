begin;

alter table public.bts_account_profiles
  add constraint bts_account_profiles_display_name_btshq_reserved_check
    check (lower(display_name) <> 'btshq.online');

create or replace function public.set_bts_account_display_name(
  p_actor_user_id uuid,
  p_display_name text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_display_name text;
begin
  if p_actor_user_id is null
    or p_display_name is null
    or char_length(p_display_name) not between 2 and 40
    or p_display_name <> btrim(p_display_name)
    or position('  ' in p_display_name) > 0
    or position(chr(9) in p_display_name) > 0
    or position(chr(10) in p_display_name) > 0
    or position(chr(13) in p_display_name) > 0
    or p_display_name ~ U&'[\0001-\0008\000B\000C\000E-\001F\007F-\009F\061C\200E\200F\202A-\202E\2066-\2069]'
    or lower(p_display_name) in (
      'guest', 'author', 'admin', 'administrator', 'moderator',
      'staff', 'support', 'bts.online', 'btshq.online', 'bts studio'
    ) then
    raise exception using message = 'BTS_PROFILE_INVALID_DISPLAY_NAME', errcode = 'P0001';
  end if;

  if not exists (
    select 1 from auth.users as users where users.id = p_actor_user_id
  ) then
    raise exception using message = 'BTS_PROFILE_UNAUTHORIZED', errcode = 'P0001';
  end if;

  insert into public.bts_account_profiles as profile (
    user_id,
    display_name
  ) values (
    p_actor_user_id,
    p_display_name
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    updated_at = clock_timestamp()
  returning profile.display_name into v_display_name;

  return v_display_name;
end;
$$;

insert into public.newsletter_consent_versions (
  version,
  consent_text_en,
  consent_text_de,
  privacy_version
) values (
  'newsletter-consent-v2',
  'I consent to receive the btshq.online newsletter by email: New Writing and occasional updates from the Digital HQ. No fixed schedule, no spam. I can unsubscribe at any time.',
  'Ich willige ein, den btshq.online Newsletter per E-Mail zu erhalten: Neue Texte und gelegentliche Updates aus dem Digital HQ. Kein fester Rhythmus, kein Spam. Ich kann mich jederzeit abmelden.',
  'newsletter-privacy-v1'
);

notify pgrst, 'reload schema';

commit;
