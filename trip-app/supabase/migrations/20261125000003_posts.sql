-- Posts, curtidas, feed e armazenamento de mídia. Tudo pelo RPC; tabelas fechadas para o cliente.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  type text not null check (type in ('photo', 'video', 'text')),
  text text not null default '' check (char_length(text) <= 2200),
  bg text,
  media_path text,
  sensitive boolean not null default false,
  adult boolean not null default false,
  status text not null default 'published' check (status in ('pending', 'published', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);
create index posts_feed_idx on public.posts (created_at desc) where status = 'published';
create index posts_author_idx on public.posts (author_id, created_at desc);

create table public.likes (
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.posts enable row level security;
alter table public.likes enable row level security;
revoke all on public.posts, public.likes from anon, authenticated;

create or replace function public.create_post(p_type text, p_text text, p_bg text, p_media_path text, p_sensitive boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); term text; t text := trim(coalesce(p_text, '')); new_id uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.profiles where id = uid and not suspended) then raise exception 'not_allowed'; end if;
  if p_type not in ('photo', 'video', 'text') then return jsonb_build_object('ok', false, 'error', 'type_invalid'); end if;
  if p_type = 'text' and t = '' then return jsonb_build_object('ok', false, 'error', 'text_required'); end if;
  term := public.blocked_term(t);
  if term is not null then
    update public.profiles set under_review = true where id = uid;
    return jsonb_build_object('ok', false, 'error', 'blocked_term', 'term', term);
  end if;
  if p_type <> 'text' and (p_media_path is null or p_media_path not like uid::text || '/%') then
    return jsonb_build_object('ok', false, 'error', 'media_path_invalid');
  end if;
  insert into public.posts (author_id, type, text, bg, media_path, sensitive)
    values (uid, p_type, t, case when p_type = 'text' then p_bg end, case when p_type <> 'text' then p_media_path end, coalesce(p_sensitive, false))
    returning id into new_id;
  return jsonb_build_object('ok', true, 'id', new_id);
end;
$$;

create or replace function public.delete_post(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.posts where id = p_id and author_id = auth.uid()) then raise exception 'not_allowed'; end if;
  delete from public.posts where id = p_id;
end;
$$;

create or replace function public.toggle_like(p_post uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.posts where id = p_post and status = 'published') then raise exception 'not_found'; end if;
  delete from public.likes where post_id = p_post and user_id = uid;
  if found then return false; end if;
  insert into public.likes (post_id, user_id) values (p_post, uid);
  return true;
end;
$$;

-- Feed: posts visíveis para quem pede, mais recentes primeiro.
create or replace function public.feed(p_filter text default 'para-voce', p_before timestamptz default null, p_type text default null, p_author uuid default null)
returns table (
  id uuid, author_id uuid, type text, text text, bg text, media_path text, sensitive boolean, adult boolean, status text, created_at timestamptz,
  like_count int, comment_count int, liked_by_me boolean,
  author_handle text, author_name text, author_avatar text, author_is_creator boolean
) language sql stable security definer set search_path = public as $$
  with me as (select id, show_adult from public.profiles where id = auth.uid())
  select p.id, p.author_id, p.type, p.text, p.bg, p.media_path, p.sensitive, p.adult, p.status, p.created_at,
    (select count(*)::int from public.likes l where l.post_id = p.id),
    0,
    exists (select 1 from public.likes l where l.post_id = p.id and l.user_id = (select id from me)),
    a.handle::text, a.name, a.avatar_path, a.is_creator
  from public.posts p
  join public.profiles a on a.id = p.author_id
  where (select id from me) is not null
    and (p.status = 'published' or (p.author_id = (select id from me) and p.status = 'pending'))
    and not a.suspended
    and (not p.adult or (select show_adult from me))
    and (p_before is null or p.created_at < p_before)
    and (p_type is null or p.type = p_type)
    and (p_author is null or p.author_id = p_author)
  order by p.created_at desc
  limit 20;
$$;

revoke execute on function public.create_post(text, text, text, text, boolean), public.delete_post(uuid), public.toggle_like(uuid), public.feed(text, timestamptz, text, uuid) from public, anon;
grant execute on function public.create_post(text, text, text, text, boolean), public.delete_post(uuid), public.toggle_like(uuid), public.feed(text, timestamptz, text, uuid) to authenticated;

-- Mídia: bucket privado; cada pessoa só grava na própria pasta; leitura por URL assinada.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 209715200, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do nothing;

create policy "gravar na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "apagar da própria pasta" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ler mídia logado" on storage.objects for select to authenticated
  using (bucket_id = 'media');
