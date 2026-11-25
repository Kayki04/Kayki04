begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'ana@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b2', 'beto@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b3', 'cris@t.com', 'authenticated', 'authenticated');
insert into public.profiles (id, handle, name) values
  ('00000000-0000-0000-0000-0000000000b1', 'ana.t', 'Ana'),
  ('00000000-0000-0000-0000-0000000000b2', 'beto.t', 'Beto'),
  ('00000000-0000-0000-0000-0000000000b3', 'cris.t', 'Cris');

create or replace function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select throws_ok($$ insert into public.posts (author_id, type, text) values ('00000000-0000-0000-0000-0000000000b1', 'text', 'oi') $$, '42501', null, 'insert direto negado');
select is((public.create_post('text', 'Primeiro post', '#FF0A78', null, false))->>'ok', 'true', 'cria post de texto');
select is((public.create_post('text', '', null, null, false))->>'error', 'text_required', 'texto vazio recusado');
select is((public.create_post('photo', 'foto', null, 'outro-usuario/x.jpg', false))->>'error', 'media_path_invalid', 'mídia de outra pasta recusada');
select is((public.create_post('text', 'tenho 15 anos', null, null, false))->>'error', 'blocked_term', 'termo proibido recusado');
select is((public.create_post('photo', 'tenho 15 anos', null, null, false))->>'error', 'blocked_term', 'termo proibido em foto sem mídia ainda é bloqueio');
reset role;
select is((select under_review from public.profiles where handle = 'ana.t'), true, 'termo proibido marca perfil em revisão');

-- post adulto, removido e de autor suspenso não aparecem no feed
insert into public.posts (id, author_id, type, text, adult) values ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-0000000000b2', 'text', 'adulto', true);
insert into public.posts (id, author_id, type, text, status) values ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-0000000000b2', 'text', 'removido', 'removed');
insert into public.posts (id, author_id, type, text) values ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-0000000000b3', 'text', 'suspenso');
update public.profiles set suspended = true where handle = 'cris.t';

select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select is((select count(*)::int from public.feed() where text = 'adulto'), 0, 'adulto escondido com show_adult desligado');
select is((select count(*)::int from public.feed() where text in ('removido', 'suspenso')), 0, 'removido e autor suspenso escondidos');
select is((select count(*)::int from public.feed() where text = 'Primeiro post'), 1, 'post publicado aparece');

-- curtir e apagar
reset role;
select set_config('t.pid', (select id::text from public.posts where text = 'Primeiro post'), false);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select is(public.toggle_like(current_setting('t.pid')::uuid), true, 'curtir');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
select throws_ok($$ select public.delete_post(current_setting('t.pid')::uuid) $$, 'P0001', 'not_allowed', 'não apaga post alheio');

select * from finish();
rollback;
