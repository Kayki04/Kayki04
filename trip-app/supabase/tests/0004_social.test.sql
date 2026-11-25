begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000d1', 'dora@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d2', 'edu@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d3', 'fabi@t.com', 'authenticated', 'authenticated');
insert into public.profiles (id, handle, name) values
  ('00000000-0000-0000-0000-0000000000d1', 'dora.t', 'Dora'),
  ('00000000-0000-0000-0000-0000000000d2', 'edu.t', 'Edu'),
  ('00000000-0000-0000-0000-0000000000d3', 'fabi.t', 'Fabi');
insert into public.posts (id, author_id, type, text) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-0000000000d1', 'text', 'post da dora'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-0000000000d3', 'text', 'post da fabi');

create or replace function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2');
select is((public.add_comment('00000000-0000-0000-0000-00000000e001', 'Que legal!'))->>'ok', 'true', 'comenta');
select is((select comment_count from public.feed() where id = '00000000-0000-0000-0000-00000000e001'), 1, 'feed conta comentário');
select is((public.add_comment('00000000-0000-0000-0000-00000000e001', 'cadê a novinha'))->>'error', 'blocked_term', 'comentário proibido recusado');
reset role;
select is((select under_review from public.profiles where handle = 'edu.t'), true, 'comentário proibido marca revisão');
select set_config('t.cid', (select id::text from public.comments where text = 'Que legal!'), false);

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d3');
select throws_ok($$ select public.delete_comment(current_setting('t.cid')::uuid) $$, 'P0001', 'not_allowed', 'terceiro não apaga comentário');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
select lives_ok($$ select public.delete_comment(current_setting('t.cid')::uuid) $$, 'dono do post apaga comentário');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2');
select throws_ok($$ select public.toggle_follow('00000000-0000-0000-0000-0000000000d2') $$, 'P0001', 'not_allowed', 'não segue a si mesmo');
select is(public.toggle_follow('00000000-0000-0000-0000-0000000000d1'), true, 'segue');
select is((select count(*)::int from public.feed('seguindo')), 1, 'feed Seguindo só tem quem eu sigo');
select is((public.profile_by_handle('dora.t')).followers, 1, 'perfil conta seguidores');

select public.report('post', '00000000-0000-0000-0000-00000000e002', 'spam');
select public.report('post', '00000000-0000-0000-0000-00000000e002', 'spam');
select is((select count(*)::int from public.feed() where id = '00000000-0000-0000-0000-00000000e002'), 0, 'post denunciado some para quem denunciou');
select throws_ok($$ select * from public.reports $$, '42501', null, 'usuário não lê denúncias');
reset role;
select is((select count(*)::int from public.reports where target_id = '00000000-0000-0000-0000-00000000e002'), 1, 'denúncia repetida não duplica');

select * from finish();
rollback;
