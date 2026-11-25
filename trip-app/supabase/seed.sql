-- Dados de exemplo para desenvolvimento local (supabase db reset). Não usar em produção.
insert into auth.users (id, instance_id, email, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'equipe@trip.local', 'authenticated', 'authenticated', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'luna@trip.local', 'authenticated', 'authenticated', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'caio@trip.local', 'authenticated', 'authenticated', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'rafa@trip.local', 'authenticated', 'authenticated', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, handle, name, bio, is_creator, role) values
  ('11111111-1111-1111-1111-111111111111', 'equipe.trip', 'Equipe Trip', 'Conta da equipe. Fale com a gente por aqui.', false, 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'luna.vibe', 'Luna Vibe', 'Ensaios, viagens e bastidores.', true, 'user'),
  ('33333333-3333-3333-3333-333333333333', 'caio.fit', 'Caio Fit', 'Treinos em casa, dieta sem frescura.', true, 'user'),
  ('44444444-4444-4444-4444-444444444444', 'rafa.chef', 'Rafa Chef', 'Receitas de boteco em casa.', true, 'user');

insert into public.invites (code, kind, max_uses, created_by) values
  ('CRIADOR-TESTE', 'creator', 50, '11111111-1111-1111-1111-111111111111'),
  ('FA-TESTE', 'fan', 500, '11111111-1111-1111-1111-111111111111');

insert into public.posts (author_id, type, text, bg, created_at) values
  ('33333333-3333-3333-3333-333333333333', 'text', 'Treino de 20 minutos que eu faço em casa toda manhã. Bora?', '#FF0A78', now() - interval '3 hours'),
  ('44444444-4444-4444-4444-444444444444', 'text', 'Dica rápida: sal no torresmo só depois de fritar. Confia.', '#14121A', now() - interval '2 hours'),
  ('22222222-2222-2222-2222-222222222222', 'text', 'Chegando em Floripa. Ensaio novo em breve ☀️', '#8A2BE2', now() - interval '1 hour');

insert into public.stories (author_id, bg, text) values
  ('22222222-2222-2222-2222-222222222222', '#FF0A78', 'Bom dia de Floripa!'),
  ('33333333-3333-3333-3333-333333333333', '#14121A', 'Treino de perna hoje. Sem desculpa.');
