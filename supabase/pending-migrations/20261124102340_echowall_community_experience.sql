-- Additive. New tables are private, including on projects with broad default grants.
begin;

create table public.echo_founder_replies (
  echo_id uuid primary key references public.echoes(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  updated_at timestamptz not null default statement_timestamp()
);

create table public.echo_reactions (
  echo_id uuid not null references public.echoes(id) on delete cascade,
  actor_key bytea not null check (octet_length(actor_key) = 32),
  primary key (echo_id, actor_key)
);

create table public.echo_reaction_limits (
  network_key text not null check (network_key ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  attempts integer not null check (attempts between 1 and 30),
  primary key (network_key, window_start)
);
create index echo_reaction_expiry_idx on public.echo_reaction_limits(window_start);

alter table public.echo_founder_replies enable row level security;
alter table public.echo_reactions enable row level security;
alter table public.echo_reaction_limits enable row level security;
revoke all on table public.echo_founder_replies, public.echo_reactions, public.echo_reaction_limits
  from public, anon, authenticated, service_role;
create index echo_feed_published_idx on public.echoes (approved_at desc, id)
  where status = 'approved' and approved_at is not null;

create function public.community_echo_is_synthetic(p_value text)
returns boolean language sql immutable set search_path = pg_catalog
as $$
  select regexp_replace(lower(btrim(normalize(coalesce(p_value,''), NFKC))), '[[:space:]]+', ' ', 'g')
    ~ '^(?:(?:archive )?recovery test(?: message)?|development only|development-only|fixture|qa|synthetic|test|writing test updated|(?:qa|test|fixture|synthetic|development[- ]only)(?:[_:#-].+| (?:content|data|entry|message|record|updated)))$';
$$;
revoke all on function public.community_echo_is_synthetic(text) from public, anon, authenticated, service_role;

create function public.get_public_echo_feed(
  p_query text, p_page integer, p_size integer, p_popular boolean, p_counts boolean, p_actor text default null
) returns jsonb language sql stable security definer set search_path = pg_catalog
as $$
  with eligible as materialized (
    select e.id, e.display_name, e.message, e.category, e.approved_at
    from public.echoes e
    where e.status = 'approved' and e.approved_at is not null
      and not public.community_echo_is_synthetic(e.display_name) and not public.community_echo_is_synthetic(e.message)
  ), matches as materialized (
    select e.* from eligible e
    where p_query is not null and length(p_query) <= 40 and strpos(lower(e.display_name), lower(p_query)) > 0
       or p_query = ''
  ), counts as materialized (
    select r.echo_id, count(*) as likes from matches e
    join public.echo_reactions r on e.id = r.echo_id
    where p_counts and p_popular group by r.echo_id
  ), page as (
    select e.*, coalesce(c.likes, 0) as popularity
    from matches e left join counts c on e.id = c.echo_id
    order by case when p_counts and p_popular then coalesce(c.likes, 0) else 0 end desc,
      e.approved_at desc, e.id
    offset ((greatest(1, least(coalesce(p_page,1), 1000000)) - 1)::bigint * greatest(1, least(coalesce(p_size,12),24)))
    limit greatest(1, least(coalesce(p_size,12),24))
  )
  select jsonb_build_object(
    'published', (select count(*) from eligible),
    'matched', (select count(*) from matches),
    'echoes', coalesce((select jsonb_agg(
      jsonb_build_object('id', e.id, 'display_name', e.display_name, 'message', e.message,
        'category', e.category, 'approved_at', e.approved_at,
        'reply', case when not public.community_echo_is_synthetic(f.body) then f.body end,
        'likes', case when p_counts and p_popular then e.popularity when p_counts then
          (select count(*) from public.echo_reactions r where r.echo_id = e.id) end,
        'liked', case when p_counts and p_actor ~ '^[0-9a-f]{64}$' then exists(
          select 1 from public.echo_reactions r where r.echo_id = e.id and
          r.actor_key = extensions.hmac(convert_to(e.id::text, 'UTF8'), decode(p_actor,'hex'), 'sha256')
        ) else false end)
      order by e.popularity desc, e.approved_at desc, e.id)
      from page e left join public.echo_founder_replies f on f.echo_id = e.id), '[]'::jsonb));
$$;
revoke all on function public.get_public_echo_feed(text,integer,integer,boolean,boolean,text) from public, anon, authenticated, service_role;
grant execute on function public.get_public_echo_feed(text,integer,integer,boolean,boolean,text) to service_role;

create function public.read_echo_founder_reply(p_echo_id uuid)
returns text language plpgsql stable security definer set search_path = pg_catalog
as $$
begin
  perform public.assert_echowall_admin(true);
  return (select f.body from public.echo_founder_replies f where f.echo_id = p_echo_id);
end;
$$;
revoke all on function public.read_echo_founder_reply(uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_echo_founder_reply(uuid) to authenticated;

create function public.save_echo_founder_reply(p_echo_id uuid, p_body text)
returns boolean language plpgsql security definer set search_path = pg_catalog
as $$
declare
  admin_id uuid := public.assert_echowall_admin(true);
  current_status public.echo_status;
  body_trim text := btrim(p_body);
  event_name text;
begin
  select e.status into current_status from public.echoes e where e.id = p_echo_id for update;
  if not found then return false; end if;
  if p_body is null then
    delete from public.echo_founder_replies where echo_id = p_echo_id;
    if not found then return false; end if;
    event_name := 'founder_reply_removed';
  else
    if current_status <> 'approved' or char_length(body_trim) not between 1 and 500 or
       public.community_echo_is_synthetic(body_trim) then return false; end if;
    if exists (select 1 from public.echo_founder_replies where echo_id = p_echo_id) then
      event_name := 'founder_reply_updated';
    else
      event_name := 'founder_reply_created';
    end if;
    insert into public.echo_founder_replies(echo_id, body) values (p_echo_id, body_trim)
    on conflict (echo_id) do update set body = excluded.body, updated_at = statement_timestamp();
  end if;
  insert into public.echo_moderation_events(echo_id, actor_id, action, previous_status, new_status)
  values (p_echo_id, admin_id, event_name, current_status, current_status);
  return true;
end;
$$;
revoke all on function public.save_echo_founder_reply(uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.save_echo_founder_reply(uuid,text) to authenticated;

create function public.set_echo_reaction(p_echo_id uuid, p_actor text, p_network text, p_liked boolean)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare
  reaction_key bytea;
  current_window timestamptz := date_bin(interval '15 minutes', statement_timestamp(), timestamptz '2000-01-01 UTC');
begin
  if p_liked is null or p_actor is null or p_actor !~ '^[0-9a-f]{64}$' or p_network is null or p_network !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'invalid');
  end if;
  -- Serialize with moderation and other writes to this echo. The unique key is authoritative.
  perform 1 from public.echoes e
    where e.id = p_echo_id and e.status = 'approved' and e.approved_at is not null
      and not public.community_echo_is_synthetic(e.display_name) and not public.community_echo_is_synthetic(e.message)
    for update;
  if not found then return jsonb_build_object('status', 'unavailable'); end if;
  insert into public.echo_reaction_limits(network_key, window_start, attempts)
  values (p_network, current_window, 1)
  on conflict (network_key, window_start) do update
    set attempts = public.echo_reaction_limits.attempts + 1
    where public.echo_reaction_limits.attempts < 30;
  if not found then return jsonb_build_object('status', 'rate_limited'); end if;

  reaction_key := extensions.hmac(convert_to(p_echo_id::text, 'UTF8'), decode(p_actor,'hex'), 'sha256');
  if p_liked then
    insert into public.echo_reactions(echo_id, actor_key) values (p_echo_id, reaction_key)
    on conflict do nothing;
  else
    delete from public.echo_reactions where echo_id = p_echo_id and actor_key = reaction_key;
  end if;
  return jsonb_build_object('status','ok','liked',p_liked,'likes',
    (select count(*) from public.echo_reactions where echo_id = p_echo_id));
end;
$$;
revoke all on function public.set_echo_reaction(uuid,text,text,boolean) from public, anon, authenticated, service_role;
grant execute on function public.set_echo_reaction(uuid,text,text,boolean) to service_role;

commit;
