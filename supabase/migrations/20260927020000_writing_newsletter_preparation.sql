create function public.prepare_writing_newsletter_edition(
  p_writing_article_id uuid,
  p_site_origin text
)
returns table (
  edition_id uuid,
  edition_state public.newsletter_edition_state,
  outcome text,
  article_slug text
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor uuid := public.assert_bts_admin(true);
  v_article public.writing_articles%rowtype;
  v_edition public.newsletter_editions%rowtype;
begin
  if p_writing_article_id is null or p_site_origin is null
    or p_site_origin !~ '^(https://[A-Za-z0-9.-]+(:[0-9]+)?|http://localhost(:[0-9]+)?)$'
  then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-newsletter-prepare:' || p_writing_article_id::text, 0)
  );

  select article.* into v_article
  from public.writing_articles as article
  where article.id = p_writing_article_id
    and article.status = 'published'
    and article.slug is not null
    and article.published_at is not null;
  if not found then
    raise exception using message = 'NEWSLETTER_WRITING_NOT_PUBLISHED', errcode = 'P0001';
  end if;

  select edition.* into v_edition
  from public.newsletter_editions as edition
  where edition.writing_article_id = p_writing_article_id
    and edition.state = 'draft'
  order by edition.created_at, edition.id
  limit 1
  for update;
  if found then
    return query select v_edition.id, v_edition.state, 'reused_draft'::text, v_article.slug;
    return;
  end if;

  select edition.* into v_edition
  from public.newsletter_editions as edition
  where edition.writing_article_id = p_writing_article_id
    and edition.state <> 'draft'
  order by
    case edition.state when 'sending' then 0 when 'sent' then 1 else 2 end,
    edition.created_at desc,
    edition.id
  limit 1;
  if found then
    return query select
      v_edition.id,
      v_edition.state,
      case v_edition.state
        when 'sending' then 'existing_sending'
        when 'sent' then 'existing_sent'
        else 'existing_failed'
      end,
      v_article.slug;
    return;
  end if;

  insert into public.newsletter_editions (
    writing_article_id,
    article_title,
    article_excerpt,
    canonical_url,
    subject,
    preheader,
    introduction,
    created_by
  ) values (
    v_article.id,
    v_article.title,
    v_article.excerpt,
    p_site_origin || '/writing/' || v_article.slug,
    pg_catalog.left(v_article.title, 120),
    pg_catalog.left(v_article.excerpt, 160),
    '',
    v_actor
  )
  returning * into v_edition;

  return query select v_edition.id, v_edition.state, 'created'::text, v_article.slug;
end;
$$;

revoke all on function public.prepare_writing_newsletter_edition(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.prepare_writing_newsletter_edition(uuid, text)
  to authenticated;

notify pgrst, 'reload schema';
