begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000f1', 'gabi@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000f2', 'hugo@t.com', 'authenticated', 'authenticated');
insert into public.profiles (id, handle, name) values
  ('00000000-0000-0000-0000-0000000000f1', 'gabi.t', 'Gabi'),
  ('00000000-0000-0000-0000-0000000000f2', 'hugo.t', 'Hugo');
insert into public.stories (id, author_id, bg, text, created_at, expires_at) values
  ('00000000-0000-0000-0000-0000000aa001', '00000000-0000-0000-0000-0000000000f2', '#FF0A78', 'velho', now() - interval '30 hours', now() - interval '6 hours');
insert into public.stories (id, author_id, bg, text, adult) values
  ('00000000-0000-0000-0000-0000000aa002', '00000000-0000-0000-0000-0000000000f2', '#FF0A78', 'adulto', true);

create or replace function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
select is((public.create_story(null, '#8A2BE2', 'Bom dia'))->>'ok', 'true', 'cria story de texto');
select is((public.create_story(null, null, ''))->>'error', 'story_empty', 'story vazio recusado');
select is((public.create_story('outra/x.jpg', null, ''))->>'error', 'media_path_invalid', 'mídia de outra pasta recusada');
select is((public.create_story(null, '#8A2BE2', 'garota de 16 anos'))->>'error', 'blocked_term', 'termo proibido recusado');
select is((select count(*)::int from public.active_stories() where text = 'velho'), 0, 'story expirado não aparece');
select is((select count(*)::int from public.active_stories() where text = 'adulto'), 0, 'story adulto escondido');
select throws_ok($$ select * from public.stories $$, '42501', null, 'tabela fechada para consulta direta');
select public.mark_story_seen((select id from public.active_stories() where text = 'Bom dia'));
select is((select seen from public.active_stories() where text = 'Bom dia'), true, 'marca como visto');

select * from finish();
rollback;
