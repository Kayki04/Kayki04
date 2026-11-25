-- Stories de 24 horas.
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  media_path text,
  bg text,
  text text not null default '' check (char_length(text) <= 200),
  adult boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create index stories_active_idx on public.stories (expires_at, author_id);
create table public.story_views (
  story_id uuid not null references public.stories on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (story_id, user_id)
);
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
revoke all on public.stories, public.story_views from anon, authenticated;

create or replace function public.create_story(p_media_path text, p_bg text, p_text text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t text := trim(coalesce(p_text, '')); term text; new_id uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.profiles where id = uid and not suspended) then raise exception 'not_allowed'; end if;
  term := public.blocked_term(t);
  if term is not null then
    update public.profiles set under_review = true where id = uid;
    return jsonb_build_object('ok', false, 'error', 'blocked_term', 'term', term);
  end if;
  if p_media_path is not null and p_media_path not like uid::text || '/%' then return jsonb_build_object('ok', false, 'error', 'media_path_invalid'); end if;
  if p_media_path is null and t = '' then return jsonb_build_object('ok', false, 'error', 'story_empty'); end if;
  insert into public.stories (author_id, media_path, bg, text) values (uid, p_media_path, p_bg, t) returning id into new_id;
  return jsonb_build_object('ok', true, 'id', new_id);
end;
$$;

create or replace function public.active_stories()
returns table (id uuid, author_id uuid, author_handle text, author_name text, author_avatar text, media_path text, bg text, text text, created_at timestamptz, seen boolean)
language sql stable security definer set search_path = public as $$
  with me as (select id, show_adult from public.profiles where id = auth.uid())
  select s.id, s.author_id, a.handle::text, a.name, a.avatar_path, s.media_path, s.bg, s.text, s.created_at,
    exists (select 1 from public.story_views v where v.story_id = s.id and v.user_id = (select id from me))
  from public.stories s join public.profiles a on a.id = s.author_id
  where (select id from me) is not null and s.expires_at > now() and not a.suspended
    and (not s.adult or (select show_adult from me))
    and not exists (select 1 from public.reports r where r.reporter_id = (select id from me) and r.target_type = 'story' and r.target_id = s.id)
  order by s.author_id, s.created_at;
$$;

create or replace function public.mark_story_seen(p_story uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.story_views (story_id, user_id)
  select p_story, auth.uid() where auth.uid() is not null and exists (select 1 from public.stories where id = p_story and expires_at > now())
  on conflict do nothing;
$$;

revoke execute on function public.create_story(text, text, text), public.active_stories(), public.mark_story_seen(uuid) from public, anon;
grant execute on function public.create_story(text, text, text), public.active_stories(), public.mark_story_seen(uuid) to authenticated;
