create or replace function public.delete_writing_article(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_expected_title text
)
returns table (deleted_id uuid, deleted_slug text, deleted_status text)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_article public.writing_articles%rowtype;
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_expected_updated_at is null or p_expected_title is null then
    raise exception using message = 'WRITING_DELETE_INVALID_INPUT', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('writing-delete:' || p_id::text, 0));
  select article.* into v_article
  from public.writing_articles as article
  where article.id = p_id
  for update;
  if not found then raise exception using message = 'WRITING_DELETE_NOT_FOUND', errcode = 'P0001'; end if;
  if v_article.updated_at is distinct from p_expected_updated_at or v_article.title is distinct from p_expected_title then
    raise exception using message = 'WRITING_DELETE_STALE', errcode = 'P0001';
  end if;

  delete from public.writing_account_comment_events as event where event.article_id = p_id;
  delete from public.writing_comment_moderation_events as event where event.article_id = p_id;
  delete from public.writing_discussion_state_events as event where event.article_id = p_id;
  delete from public.writing_comments as comment where comment.article_id = p_id;
  delete from public.writing_discussions as discussion where discussion.article_id = p_id;
  delete from public.writing_article_translations as translation where translation.article_id = p_id;
  delete from public.writing_articles as article where article.id = p_id;

  return query select v_article.id, v_article.slug, v_article.status;
end;
$$;

revoke all on function public.delete_writing_article(uuid, timestamptz, text)
  from public, anon, authenticated, service_role;
grant execute on function public.delete_writing_article(uuid, timestamptz, text)
  to authenticated;

notify pgrst, 'reload schema';
