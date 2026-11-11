-- Add optional country declarations without changing the original submission RPC.
alter table public.echoes
  add column country_code text,
  add column include_in_community_map boolean not null default false,
  add constraint echoes_valid_country_code check (
    country_code is null or country_code in (
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
    )
  ),
  add constraint echoes_community_map_requires_country check (
    not include_in_community_map or country_code is not null
  );

grant update (country_code, include_in_community_map) on public.echoes to service_role;

create function public.submit_echo_with_country(
  p_display_name text, p_message text, p_category public.echo_category,
  p_email text, p_network_hash text, p_email_hash text, p_message_hash text,
  p_form_token_hash text, p_deletion_token_hash text,
  p_country_code text, p_include_in_community_map boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_echo_id uuid;
begin
  -- Original RPC still validates, rate limits, rejects replay and inserts pending.
  -- The column update shares the transaction. Invalid country data rolls it all back.
  v_echo_id := public.submit_echo(
    p_display_name, p_message, p_category, p_email, p_network_hash,
    p_email_hash, p_message_hash, p_form_token_hash, p_deletion_token_hash
  );
  update public.echoes
  set country_code = p_country_code,
      include_in_community_map = coalesce(p_include_in_community_map, false)
  where id = v_echo_id and status = 'pending';
  if not found then
    raise exception using message = 'ECHOWALL_INVALID_INPUT', errcode = 'P0001';
  end if;
  return v_echo_id;
end;
$$;

revoke all on function public.submit_echo_with_country(
  text, text, public.echo_category, text, text, text, text, text, text, text, boolean
) from public, anon, authenticated;

grant execute on function public.submit_echo_with_country(
  text, text, public.echo_category, text, text, text, text, text, text, text, boolean
) to service_role;
