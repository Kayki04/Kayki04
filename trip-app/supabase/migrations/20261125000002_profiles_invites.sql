-- Perfis e convites. Cadastro só com convite; escrita sensível só por funções.
create extension if not exists citext with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  handle extensions.citext not null unique check (handle ~ '^[a-z0-9._]{3,24}$'),
  name text not null check (char_length(name) between 1 and 50),
  bio text not null default '' check (char_length(bio) <= 300),
  avatar_path text,
  is_creator boolean not null default false,
  show_adult boolean not null default false,
  role text not null default 'user' check (role in ('user', 'mod', 'admin')),
  under_review boolean not null default false,
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.invites (
  code text primary key,
  kind text not null check (kind in ('creator', 'fan')),
  created_by uuid references public.profiles on delete set null,
  max_uses int not null default 1 check (max_uses > 0),
  uses int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.invites enable row level security;

-- Dados públicos do perfil: só estas colunas são legíveis por outras pessoas.
revoke all on public.profiles from anon, authenticated;
grant select (id, handle, name, bio, avatar_path, is_creator, created_at) on public.profiles to authenticated;
create policy "perfis visíveis para quem está logado" on public.profiles
  for select to authenticated using (not suspended or id = auth.uid());
revoke all on public.invites from anon, authenticated;

create or replace function public.my_profile()
returns public.profiles language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid();
$$;

create or replace function public.redeem_invite(p_code text, p_handle text, p_name text)
returns public.profiles language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  inv public.invites;
  h text := lower(trim(coalesce(p_handle, '')));
  n text := trim(coalesce(p_name, ''));
  first boolean;
  prof public.profiles;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.profiles where id = uid) then raise exception 'already_has_profile'; end if;
  if h !~ '^[a-z0-9._]{3,24}$' then raise exception 'handle_invalid'; end if;
  if char_length(n) < 1 or char_length(n) > 50 then raise exception 'name_invalid'; end if;
  if public.blocked_term(h) is not null or public.blocked_term(n) is not null then raise exception 'blocked_term'; end if;
  select * into inv from public.invites where code = upper(trim(coalesce(p_code, ''))) for update;
  if not found then raise exception 'invite_invalid'; end if;
  if inv.expires_at is not null and inv.expires_at < now() then raise exception 'invite_expired'; end if;
  if inv.uses >= inv.max_uses then raise exception 'invite_used'; end if;
  if exists (select 1 from public.profiles where handle = h) then raise exception 'handle_taken'; end if;
  first := not exists (select 1 from public.profiles);
  insert into public.profiles (id, handle, name, is_creator, role)
    values (uid, h, n, inv.kind = 'creator', case when first then 'admin' else 'user' end)
    returning * into prof;
  update public.invites set uses = uses + 1 where code = inv.code;
  return prof;
end;
$$;

create or replace function public.update_profile(p_name text, p_bio text, p_avatar_path text, p_show_adult boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); term text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  term := coalesce(public.blocked_term(p_name), public.blocked_term(p_bio));
  if term is not null then
    update public.profiles set under_review = true where id = uid;
    return jsonb_build_object('ok', false, 'error', 'blocked_term', 'term', term);
  end if;
  if p_avatar_path is not null and p_avatar_path not like uid::text || '/%' then raise exception 'media_path_invalid'; end if;
  update public.profiles set name = trim(p_name), bio = trim(coalesce(p_bio, '')), avatar_path = p_avatar_path, show_adult = coalesce(p_show_adult, false) where id = uid;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.my_profile(), public.redeem_invite(text, text, text), public.update_profile(text, text, text, boolean), public.delete_my_account() from public, anon;
grant execute on function public.my_profile(), public.redeem_invite(text, text, text), public.update_profile(text, text, text, boolean), public.delete_my_account() to authenticated;
