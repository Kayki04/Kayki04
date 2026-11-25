begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- usuários de teste
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'bia@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'caio@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'dani@t.com', 'authenticated', 'authenticated');
delete from public.profiles;
insert into public.invites (code, kind, max_uses) values ('CRIADOR-1', 'creator', 1), ('FA-1', 'fan', 5);
insert into public.invites (code, kind, max_uses, expires_at) values ('VELHO', 'fan', 5, now() - interval '1 day');

create or replace function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select is((public.redeem_invite('CRIADOR-1', 'bia.noite', 'Bia Noite')).is_creator, true, 'convite de criador cria perfil de criador');
reset role;
select is((select role from public.profiles where handle = 'bia.noite'), 'admin', 'primeiro perfil vira admin');
select is((select uses from public.invites where code = 'CRIADOR-1'), 1, 'uso do convite contado');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000a2');
select throws_ok($$ select public.redeem_invite('CRIADOR-1', 'outra', 'Outra') $$, 'P0001', 'invite_used', 'convite esgotado');
select throws_ok($$ select public.redeem_invite('VELHO', 'outra', 'Outra') $$, 'P0001', 'invite_expired', 'convite expirado');
select throws_ok($$ select public.redeem_invite('NAOEXISTE', 'outra', 'Outra') $$, 'P0001', 'invite_invalid', 'convite inválido');
select throws_ok($$ select public.redeem_invite('FA-1', 'Bia.Noite', 'Copia') $$, 'P0001', 'handle_taken', '@ repetido (maiúsculas não importam)');
select throws_ok($$ select public.redeem_invite('FA-1', 'a', 'Curto') $$, 'P0001', 'handle_invalid', '@ inválido');
select throws_ok($$ select public.redeem_invite('FA-1', 'novinha22', 'X') $$, 'P0001', 'blocked_term', '@ com termo proibido');
select is((public.redeem_invite('FA-1', 'caio.fit', 'Caio Fit')).role, 'user', 'segundo perfil é usuário comum');

-- ninguém muda role/under_review por update direto
select throws_ok($$ update public.profiles set role = 'admin', under_review = true where id = '00000000-0000-0000-0000-0000000000a2' $$, '42501', null, 'update direto negado');
reset role;
select is((select role from public.profiles where handle = 'caio.fit'), 'user', 'update direto não muda role');
select is((select under_review from public.profiles where handle = 'caio.fit'), false, 'update direto não muda under_review');

select * from finish();
rollback;
