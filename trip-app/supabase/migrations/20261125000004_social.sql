-- Comentários, seguir, denúncias e perfil público.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.follows (
  follower_id uuid not null references public.profiles on delete cascade,
  followee_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'profile', 'story')),
  target_id uuid not null,
  reason text not null check (reason in ('menor', 'consentimento', 'violencia', 'spam', 'outro')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.reports enable row level security;
revoke all on public.comments, public.follows, public.reports from anon, authenticated;

create or replace function public.add_comment(p_post uuid, p_text text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t text := trim(coalesce(p_text, '')); term text; new_id uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.profiles where id = uid and not suspended) then raise exception 'not_allowed'; end if;
  if t = '' or char_length(t) > 500 then return jsonb_build_object('ok', false, 'error', 'text_invalid'); end if;
  term := public.blocked_term(t);
  if term is not null then
    update public.profiles set under_review = true where id = uid;
    return jsonb_build_object('ok', false, 'error', 'blocked_term', 'term', term);
  end if;
  if not exists (select 1 from public.posts where id = p_post and status = 'published') then raise exception 'not_found'; end if;
  insert into public.comments (post_id, author_id, text) values (p_post, uid, t) returning id into new_id;
  return jsonb_build_object('ok', true, 'id', new_id);
end;
$$;

create or replace function public.post_comments(p_post uuid)
returns table (id uuid, text text, created_at timestamptz, author_id uuid, author_handle text, author_name text, author_avatar text, can_delete boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.text, c.created_at, c.author_id, a.handle::text, a.name, a.avatar_path,
    c.author_id = auth.uid() or p.author_id = auth.uid()
  from public.comments c join public.profiles a on a.id = c.author_id join public.posts p on p.id = c.post_id
  where c.post_id = p_post and c.status = 'published' and not a.suspended and auth.uid() is not null
    and not exists (select 1 from public.reports r where r.reporter_id = auth.uid() and r.target_type = 'comment' and r.target_id = c.id)
  order by c.created_at;
$$;

create or replace function public.delete_comment(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.comments c join public.posts p on p.id = c.post_id
                 where c.id = p_id and (c.author_id = auth.uid() or p.author_id = auth.uid())) then
    raise exception 'not_allowed';
  end if;
  delete from public.comments where id = p_id;
end;
$$;

create or replace function public.toggle_follow(p_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null or uid = p_user then raise exception 'not_allowed'; end if;
  if not exists (select 1 from public.profiles where id = p_user and not suspended) then raise exception 'not_found'; end if;
  delete from public.follows where follower_id = uid and followee_id = p_user;
  if found then return false; end if;
  insert into public.follows (follower_id, followee_id) values (uid, p_user);
  return true;
end;
$$;

create or replace function public.report(p_type text, p_target uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.reports (reporter_id, target_type, target_id, reason) values (auth.uid(), p_type, p_target, p_reason)
    on conflict (reporter_id, target_type, target_id) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

create type public.public_profile as (
  id uuid, handle text, name text, bio text, avatar_path text, is_creator boolean,
  followers int, following int, posts int, i_follow boolean, is_me boolean
);
create or replace function public.profile_by_handle(p_handle text)
returns public.public_profile language sql stable security definer set search_path = public as $$
  select a.id, a.handle::text, a.name, a.bio, a.avatar_path, a.is_creator,
    (select count(*)::int from public.follows f where f.followee_id = a.id),
    (select count(*)::int from public.follows f where f.follower_id = a.id),
    (select count(*)::int from public.posts p where p.author_id = a.id and p.status = 'published'),
    exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.followee_id = a.id),
    a.id = auth.uid()
  from public.profiles a
  where a.handle = p_handle and auth.uid() is not null and (not a.suspended or a.id = auth.uid());
$$;

-- Feed agora conta comentários, filtra "Seguindo" e esconde o que eu denunciei.
create or replace function public.feed(p_filter text default 'para-voce', p_before timestamptz default null, p_type text default null, p_author uuid default null)
returns table (
  id uuid, author_id uuid, type text, text text, bg text, media_path text, sensitive boolean, adult boolean, status text, created_at timestamptz,
  like_count int, comment_count int, liked_by_me boolean,
  author_handle text, author_name text, author_avatar text, author_is_creator boolean
) language sql stable security definer set search_path = public as $$
  with me as (select id, show_adult from public.profiles where id = auth.uid())
  select p.id, p.author_id, p.type, p.text, p.bg, p.media_path, p.sensitive, p.adult, p.status, p.created_at,
    (select count(*)::int from public.likes l where l.post_id = p.id),
    (select count(*)::int from public.comments c where c.post_id = p.id and c.status = 'published'),
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
    and (p_filter <> 'seguindo' or exists (select 1 from public.follows f where f.follower_id = (select id from me) and f.followee_id = p.author_id))
    and not exists (select 1 from public.reports r where r.reporter_id = (select id from me) and r.target_type = 'post' and r.target_id = p.id)
  order by p.created_at desc
  limit 20;
$$;

revoke execute on function public.add_comment(uuid, text), public.post_comments(uuid), public.delete_comment(uuid), public.toggle_follow(uuid), public.report(text, uuid, text), public.profile_by_handle(text) from public, anon;
grant execute on function public.add_comment(uuid, text), public.post_comments(uuid), public.delete_comment(uuid), public.toggle_follow(uuid), public.report(text, uuid, text), public.profile_by_handle(text) to authenticated;
