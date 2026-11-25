begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-000000000ab1', 'ana2@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000ab2', 'bob2@t.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000ab3', 'semperfil@t.com', 'authenticated', 'authenticated');
insert into public.profiles (id, handle, name) values
  ('00000000-0000-0000-0000-000000000ab1', 'ana2.t', 'Ana'),
  ('00000000-0000-0000-0000-000000000ab2', 'bob2.t', 'Bob');
-- arquivos: um publicado num post, um solto (não publicado)
insert into storage.objects (bucket_id, name, owner_id) values
  ('media', '00000000-0000-0000-0000-000000000ab1/11111111-aaaa-bbbb-cccc-000000000001.png', '00000000-0000-0000-0000-000000000ab1'),
  ('media', '00000000-0000-0000-0000-000000000ab1/11111111-aaaa-bbbb-cccc-000000000002.png', '00000000-0000-0000-0000-000000000ab1');
insert into public.posts (id, author_id, type, text, media_path) values
  ('00000000-0000-0000-0000-0000000ab001', '00000000-0000-0000-0000-000000000ab1', 'photo', 'foto', '00000000-0000-0000-0000-000000000ab1/11111111-aaaa-bbbb-cccc-000000000001.png'),
  ('00000000-0000-0000-0000-0000000ab002', '00000000-0000-0000-0000-000000000ab1', 'text', 'removido', null);
insert into public.comments (post_id, author_id, text) values ('00000000-0000-0000-0000-0000000ab002', '00000000-0000-0000-0000-000000000ab2', 'comentário escondido');
update public.posts set status = 'removed' where id = '00000000-0000-0000-0000-0000000ab002';

create or replace function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- leitura de mídia
select pg_temp.as_user('00000000-0000-0000-0000-000000000ab2');
select is((select count(*)::int from storage.objects where bucket_id = 'media' and name like '00000000-0000-0000-0000-000000000ab1/%'), 1, 'outro usuário só vê a mídia publicada, não a solta');
select pg_temp.as_user('00000000-0000-0000-0000-000000000ab3');
select is((select count(*)::int from storage.objects where bucket_id = 'media'), 0, 'conta sem perfil não vê mídia nenhuma');
select throws_ok($$ insert into storage.objects (bucket_id, name, owner_id) values ('media', '00000000-0000-0000-0000-000000000ab3/x.png', '00000000-0000-0000-0000-000000000ab3') $$, '42501', null, 'conta sem perfil não envia arquivo');
select pg_temp.as_user('00000000-0000-0000-0000-000000000ab1');
select is((select count(*)::int from storage.objects where bucket_id = 'media' and name like '00000000-0000-0000-0000-000000000ab1/%'), 2, 'dono vê os próprios arquivos');

-- caminho de mídia e cor de fundo
select is((public.create_post('photo', 'x', null, '00000000-0000-0000-0000-000000000ab1/../00000000-0000-0000-0000-000000000ab2/a.png', false))->>'error', 'media_path_invalid', 'caminho com .. recusado');
select is((public.create_post('video', 'x', null, '00000000-0000-0000-0000-000000000ab1/11111111-aaaa-bbbb-cccc-000000000002.png', false))->>'error', 'media_path_invalid', 'imagem não vale como vídeo');
select is((public.create_post('photo', 'x', null, '00000000-0000-0000-0000-000000000ab1/11111111-aaaa-bbbb-cccc-000000000002.png', false))->>'ok', 'true', 'caminho válido aceito');
select is((public.create_post('text', 'x', 'url(https://evil/px.gif)', null, false))->>'error', 'bg_invalid', 'cor de fundo que não é cor recusada');
select is((public.create_story(null, 'red;background:url(x)', 'oi'))->>'error', 'bg_invalid', 'cor do story validada');
select throws_ok($$ select public.update_profile('Ana', '', '00000000-0000-0000-0000-000000000ab1/../x.png', false) $$, 'P0001', 'media_path_invalid', 'avatar com .. recusado');

-- comentários de post removido não saem
select is((select count(*)::int from public.post_comments('00000000-0000-0000-0000-0000000ab002')), 0, 'comentários de post removido escondidos');

-- suspenso não age
reset role;
update public.profiles set suspended = true where id = '00000000-0000-0000-0000-000000000ab2';
select pg_temp.as_user('00000000-0000-0000-0000-000000000ab2');
select throws_ok($$ select public.toggle_like('00000000-0000-0000-0000-0000000ab001') $$, 'P0001', 'not_allowed', 'suspenso não curte');
select throws_ok($$ select public.toggle_follow('00000000-0000-0000-0000-000000000ab1') $$, 'P0001', 'not_allowed', 'suspenso não segue');
select throws_ok($$ select public.report('post', '00000000-0000-0000-0000-0000000ab001', 'spam') $$, 'P0001', 'not_allowed', 'suspenso não denuncia');

select * from finish();
rollback;
