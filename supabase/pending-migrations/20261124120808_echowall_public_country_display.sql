-- Public flag consent is stored separately from optional aggregate country data.
-- Requires the reviewed voluntary-country and community-experience migrations.
begin;

create table public.echo_public_countries (
  echo_id uuid primary key references public.echoes(id) on delete cascade,
  country_code text not null check (country_code in (
    'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
    'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
    'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
    'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
    'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
    'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
    'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
    'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
    'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
    'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
    'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
    'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
    'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
    'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
    'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
    'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
    'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
    'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
    'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
    'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
    'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
  )),
  consented_at timestamptz not null default now()
);
alter table public.echo_public_countries enable row level security;
revoke all on table public.echo_public_countries from public, anon, authenticated, service_role;
grant insert (echo_id, country_code) on table public.echo_public_countries to service_role;

create function public.submit_echo_with_public_country(
  p_display_name text, p_message text, p_category public.echo_category,
  p_email text, p_network_hash text, p_email_hash text, p_message_hash text,
  p_form_token_hash text, p_deletion_token_hash text,
  p_public_country_code text, p_aggregate boolean
) returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_public_country_code is null then
    raise exception using message = 'ECHOWALL_INVALID_INPUT', errcode = 'P0001';
  end if;
  if p_aggregate is true then
    v_id := public.submit_echo_with_country(p_display_name, p_message, p_category, p_email, p_network_hash,
      p_email_hash, p_message_hash, p_form_token_hash, p_deletion_token_hash, p_public_country_code, true);
  else
    v_id := public.submit_echo(p_display_name, p_message, p_category, p_email, p_network_hash,
      p_email_hash, p_message_hash, p_form_token_hash, p_deletion_token_hash);
  end if;
  insert into public.echo_public_countries(echo_id, country_code) values (v_id, p_public_country_code);
  return v_id;
end;
$$;
revoke all on function public.submit_echo_with_public_country(text,text,public.echo_category,text,text,text,text,text,text,text,boolean)
  from public, anon, authenticated, service_role;
grant execute on function public.submit_echo_with_public_country(text,text,public.echo_category,text,text,text,text,text,text,text,boolean)
  to service_role;

create function public.get_public_echo_feed_with_countries(
  p_query text, p_page integer, p_size integer, p_popular boolean, p_counts boolean, p_actor text default null
) returns jsonb language sql stable security definer set search_path = pg_catalog
as $$
  with feed as materialized (
    select public.get_public_echo_feed(p_query, p_page, p_size, p_popular, p_counts, p_actor) as value
  )
  select jsonb_set(value, '{echoes}', coalesce((
    select jsonb_agg(case when c.country_code is null then entry.echo
      else entry.echo || jsonb_build_object('public_country_code', c.country_code) end order by entry.position)
    from jsonb_array_elements(value -> 'echoes') with ordinality as entry(echo, position)
    left join public.echo_public_countries c on c.echo_id = (entry.echo ->> 'id')::uuid
  ), '[]'::jsonb)) from feed;
$$;
revoke all on function public.get_public_echo_feed_with_countries(text,integer,integer,boolean,boolean,text)
  from public, anon, authenticated, service_role;
grant execute on function public.get_public_echo_feed_with_countries(text,integer,integer,boolean,boolean,text)
  to service_role;

-- A verified withdrawal request can remove the display permission without changing the Echo or aggregate choice.
create function public.withdraw_echo_public_country(p_echo_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog
as $$
begin
  perform public.assert_echowall_admin(true);
  delete from public.echo_public_countries where echo_id = p_echo_id;
  return found;
end;
$$;
revoke all on function public.withdraw_echo_public_country(uuid) from public, anon, authenticated, service_role;
grant execute on function public.withdraw_echo_public_country(uuid) to authenticated;

-- Soft deletion and final rejection erase the public-country declaration, including on later restoration.
create function public.clear_echo_public_country_on_removal()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$
begin
  delete from public.echo_public_countries where echo_id = new.id;
  return new;
end;
$$;
revoke all on function public.clear_echo_public_country_on_removal() from public, anon, authenticated, service_role;

create trigger clear_echo_public_country_on_removal after update of status on public.echoes
  for each row when (old.status is distinct from new.status and new.status in ('deleted', 'rejected'))
  execute function public.clear_echo_public_country_on_removal();

commit;
