-- Correções de segurança da revisão do marco 1.

-- Pessoa ativa = tem perfil e não está suspensa.
create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and not suspended);
$$;
create or replace function public.require_active()
returns uuid language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active_user() then raise exception 'not_allowed'; end if;
  return auth.uid();
end;
$$;

-- Caminho de mídia: só <uid>/<id>.<ext>, sem "..", com extensão do tipo certo.
create or replace function public.valid_media_path(p text, uid uuid, kind text default null)
returns boolean language sql immutable as $$
  select p is not null and p ~ ('^' || uid::text || '/[0-9a-f-]{36}\.(' ||
    case kind when 'photo' then 'jpg|png|webp' when 'video' then 'mp4|webm|mov' else 'jpg|png|webp|mp4|webm|mov' end || ')$');
$$;
create or replace function public.valid_bg(p text)
returns boolean language sql immutable as $$ select p is null or p ~ '^#[0-9A-Fa-f]{6}$'; $$;

-- Quem pode ver um arquivo: o dono, ou qualquer pessoa ativa se ele estiver num post, story ou avatar visível.
create or replace function public.can_read_media(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  with me as (select id, show_adult from public.profiles where id = auth.uid() and not suspended)
  select exists (select 1 from me) and (
    split_part(p_name, '/', 1) = auth.uid()::text
    or exists (select 1 from public.posts p join public.profiles a on a.id = p.author_id
               where p.media_path = p_name and p.status = 'published' and not a.suspended and (not p.adult or (select show_adult from me)))
    or exists (select 1 from public.stories s join public.profiles a on a.id = s.author_id
               where s.media_path = p_name and s.expires_at > now() and not a.suspended and (not s.adult or (select show_adult from me)))
    or exists (select 1 from public.profiles a where a.avatar_path = p_name and not a.suspended)
  );
$$;

drop policy if exists "ler mídia logado" on storage.objects;
drop policy if exists "gravar na própria pasta" on storage.objects;
create policy "ler mídia visível" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.can_read_media(name));
create policy "gravar na própria pasta (perfil ativo)" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_user());

create or replace function public.create_post(p_type text, p_text text, p_bg text, p_media_path text, p_sensitive boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_active(); term text; t text := trim(coalesce(p_text, '')); new_id uuid;
begin
  if p_type not in ('photo', 'video', 'text') then return jsonb_build_object('ok', false, 'error', 'type_invalid'); end if;
  if p_type = 'text' and t = '' then return jsonb_build_object('ok', false, 'error', 'text_required'); end if;
  term := public.blocked_term(t);
  if term is not null then
    update public.profiles set under_review = true where id = uid;
    return jsonb_build_object('ok', false, 'error', 'blocked_term', 'term', term);
  end if;
  if p_type <> 'text' and not public.valid_media_path(p_media_path, uid, p_type) then return jsonb_build_object('ok', false, 'error', 'media_path_invalid'); end if;
  if p_type = 'text' and not public.valid_bg(p_bg) then return jsonb_build_object('ok', false, 'error', 'bg_invalid'); end if;
  insert into public.posts (author_id, type, text, bg, media_path, sensitive)
    values (uid, p_type, t, case when p_type = 'text' then p_bg end, case when p_type <> 'text' then p_media_path end, coalesce(p_sensitive, false))
    returning id into new_id;
  return jsonb_build_object('ok', true, 'id', new_id);
end;
$$;

create or replace function public.create_story(p_media_path text, p_bg text, p_text text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_active(); t text := trim(coalesce(p_text, '')); term text; new_id uuid;
begin
  term := public.blocked_term(t);
  if term is not null then
    update public.profiles set under_review = true where id = uid;
    return jsonb_build_object('ok', false, 'error', 'blocked_term', 'term', term);
  end if;
  if p_media_path is not null and not public.valid_media_path(p_media_path, uid) then return jsonb_build_object('ok', false, 'error', 'media_path_invalid'); end if;
  if not public.valid_bg(p_bg) then return jsonb_build_object('ok', false, 'error', 'bg_invalid'); end if;
  if p_media_path is null and t = '' then return jsonb_build_object('ok', false, 'error', 'story_empty'); end if;
  insert into public.stories (author_id, media_path, bg, text) values (uid, p_media_path, p_bg, t) returning id into new_id;
  return jsonb_build_object('ok', true, 'id', new_id);
end;
$$;

create or replace function public.update_profile(p_name text, p_bio text, p_avatar_path text, p_show_adult boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_active(); term text;
begin
  term := coalesce(public.blocked_term(p_name), public.blocked_term(p_bio));
  if term is not null then
    update public.profiles set under_review = true where id = uid;
    return jsonb_build_object('ok', false, 'error', 'blocked_term', 'term', term);
  end if;
  if p_avatar_path is not null and not public.valid_media_path(p_avatar_path, uid, 'photo') then raise exception 'media_path_invalid'; end if;
  update public.profiles set name = trim(p_name), bio = trim(coalesce(p_bio, '')), avatar_path = p_avatar_path, show_adult = coalesce(p_show_adult, false) where id = uid;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.toggle_like(p_post uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_active();
begin
  if not exists (select 1 from public.posts where id = p_post and status = 'published') then raise exception 'not_found'; end if;
  delete from public.likes where post_id = p_post and user_id = uid;
  if found then return false; end if;
  insert into public.likes (post_id, user_id) values (p_post, uid);
  return true;
end;
$$;

create or replace function public.toggle_follow(p_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_active();
begin
  if uid = p_user then raise exception 'not_allowed'; end if;
  if not exists (select 1 from public.profiles where id = p_user and not suspended) then raise exception 'not_found'; end if;
  delete from public.follows where follower_id = uid and followee_id = p_user;
  if found then return false; end if;
  insert into public.follows (follower_id, followee_id) values (uid, p_user);
  return true;
end;
$$;

create or replace function public.report(p_type text, p_target uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_active();
begin
  insert into public.reports (reporter_id, target_type, target_id, reason) values (uid, p_type, p_target, p_reason)
    on conflict (reporter_id, target_type, target_id) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.mark_story_seen(p_story uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.story_views (story_id, user_id)
  select p_story, auth.uid() where public.is_active_user() and exists (select 1 from public.stories where id = p_story and expires_at > now())
  on conflict do nothing;
$$;

create or replace function public.post_comments(p_post uuid)
returns table (id uuid, text text, created_at timestamptz, author_id uuid, author_handle text, author_name text, author_avatar text, can_delete boolean)
language sql stable security definer set search_path = public as $$
  with me as (select id, show_adult from public.profiles where id = auth.uid() and not suspended)
  select c.id, c.text, c.created_at, c.author_id, a.handle::text, a.name, a.avatar_path,
    c.author_id = (select id from me) or p.author_id = (select id from me)
  from public.comments c
  join public.profiles a on a.id = c.author_id
  join public.posts p on p.id = c.post_id
  join public.profiles pa on pa.id = p.author_id
  where c.post_id = p_post and c.status = 'published' and not a.suspended and exists (select 1 from me)
    and (p.status = 'published' or (p.status = 'pending' and p.author_id = (select id from me))) and not pa.suspended
    and (not p.adult or (select show_adult from me))
    and not exists (select 1 from public.reports r where r.reporter_id = (select id from me) and r.target_type = 'comment' and r.target_id = c.id)
  order by c.created_at;
$$;

-- Apagar post devolve o arquivo para o app remover do armazenamento.
drop function public.delete_post(uuid);
create function public.delete_post(p_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare path text;
begin
  select media_path into path from public.posts where id = p_id and author_id = auth.uid();
  if not found then raise exception 'not_allowed'; end if;
  delete from public.posts where id = p_id;
  return path;
end;
$$;

revoke execute on function public.is_active_user(), public.require_active(), public.can_read_media(text), public.delete_post(uuid) from public, anon;
grant execute on function public.is_active_user(), public.require_active(), public.can_read_media(text), public.delete_post(uuid) to authenticated;
