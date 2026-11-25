# Trip Marco 1 (Base) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App web real da Trip com contas por convite, perfis, seguir, posts (foto, vídeo, texto), feed, curtidas, comentários, stories, aba de vídeos, conteúdo sensível borrado, denúncia e filtro de termos proibidos, rodando sobre Supabase.

**Architecture:** `trip-app/` contém um app React + TypeScript (Vite, PWA) e o projeto Supabase (`trip-app/supabase/`: migrações SQL, políticas RLS, testes pgTAP, seed). Toda escrita sensível passa por funções RPC `security definer` no Postgres (moderação aplicada no banco, autoritativa); o cliente repete o filtro só para dar retorno rápido. Mídia no Supabase Storage atrás de `src/lib/media.ts`, para trocar vídeo por serviço dedicado depois.

**Tech Stack:** React 18, TypeScript, Vite, React Router, TanStack Query, @supabase/supabase-js 2, Supabase CLI (local via Docker), Vitest, pgTAP (`supabase test db`), Playwright (já instalado no ambiente).

**Spec:** `docs/superpowers/specs/2026-11-25-trip-versao-real-design.md` (protótipo de referência visual: `trip/index.html`)

## Global Constraints
- Paleta e tokens idênticos ao protótipo (`--magenta:#FF0A78`, `--roxo:#8A2BE2`, `--ciano:#00D4FF`, `--lima:#C6FF00`, `--laranja:#FF8A00`, `--branco:#FFFFFF`, `--nevoa:#F4F3F7`, `--tinta:#14121A`, `--noite:#0B0A10`), fontes Unbounded (logo) e Inter.
- Português do Brasil em toda a interface; datas em `America/Sao_Paulo`.
- Cadastro exige código de convite válido; sem convite, a pessoa não cria perfil.
- Nenhuma escrita direta do cliente em `posts`, `comments`, `profiles.role`, `profiles.under_review`; só via RPC.
- Filtro de termos: lista `crianca, infantil, menor de idade, novinha, colegial, lolita`, `\bpedo\w*`, e idade 1–17 com contexto (`tenho|tem|tinha|com|de|aos|fez|faz|fiz|idade` + `N anos`, sem `de` logo depois). Texto normalizado (minúsculas, sem acento). Bloqueio marca `profiles.under_review = true`.
- Conteúdo `adult = true` nunca aparece nesta etapa para quem tem `show_adult = false` (padrão `false`).
- Mídia: foto até 15 MB (jpeg/png/webp), vídeo até 200 MB (mp4/webm/quicktime).
- Funciona a partir de 360px de largura sem rolagem horizontal.

## Review Focus
1. Usuário sem perfil (logou mas não usou convite) tenta acessar o feed: deve cair na tela de convite, nunca ver erro. → teste na Task 3.
2. Outro usuário tenta apagar/editar post ou comentário alheio via API: negado pela RLS. → teste na Task 4/5.
3. Convite esgotado ou expirado: mensagem clara, perfil não é criado. → teste na Task 3.
4. Upload acima do limite ou de tipo errado: erro claro antes de enviar. → teste na Task 4.
5. Story expirado (>24h) não aparece nem por consulta direta. → teste na Task 6.

---

### Task 1: Esqueleto do app e Supabase local

**Files:** Create `trip-app/` (Vite React TS), `trip-app/supabase/config.toml` (via `supabase init`), `trip-app/src/styles/tokens.css`, `trip-app/src/App.tsx`, `trip-app/src/components/BottomNav.tsx`, `trip-app/src/components/AgeGate.tsx`, `trip-app/e2e/base.spec.ts`, `trip-app/playwright.config.ts`, `trip-app/README.md`.

**Interfaces:** Produces scripts `npm run dev`, `npm test` (vitest), `npm run e2e` (playwright), `npm run db:start|db:reset|db:test`; `src/lib/supabase.ts` exporta `supabase` criado com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

- [ ] Step 1: e2e `ageGate`: abre `/`, vê "Você tem 18 anos ou mais?", clica "Tenho 18 anos ou mais", gate some e fica salvo após recarregar. e2e `navBase`: barra inferior com Início, Vídeos, Postar, Assinaturas, Perfil.
- [ ] Step 2: Rodar `npm run e2e` → FAIL.
- [ ] Step 3: Implementar esqueleto, tokens do protótipo, AgeGate (localStorage com try/catch), BottomNav, rotas vazias.
- [ ] Step 4: `npm run e2e` → PASS; `npm run db:start` sobe o Supabase local.
- [ ] Step 5: Commit.

### Task 2: Filtro de termos proibidos (cliente e banco)

**Files:** `trip-app/src/lib/moderation.ts`, `trip-app/src/lib/moderation.test.ts`, migração `supabase/migrations/0001_moderation.sql`, teste `supabase/tests/0001_moderation.test.sql`.

**Interfaces:** Produces `blockedTerm(text: string): string | null` (TS) e `public.blocked_term(t text) returns text` (SQL, usa extensão `unaccent`).

- [ ] Step 1: Testes (Vitest e pgTAP, mesmos casos): bloqueia `CRIANÇA`, `menor de idade`, `Menor De Idade`, `tenho 15 anos`, `ela tem 12 anos`, `garota de 16 anos`, `com 14 anos`, `novinha`, `pedofilia`; libera `18 anos de carreira`, `comemorando 25 anos`, `10 anos de carreira`, `Moro aqui há 3 anos`, `Torpedo de chocolate`, `3 anos de canal`, `depois de 2 anos de namoro`.
- [ ] Step 2: FAIL. Step 3: Implementar. Step 4: `npm test` e `npm run db:test` → PASS. Step 5: Commit.

### Task 3: Contas, convites e perfis

**Files:** migração `0002_profiles_invites.sql`, testes `0002_profiles.test.sql`, `src/pages/Login.tsx`, `src/pages/Invite.tsx`, `src/lib/auth.tsx` (contexto de sessão + perfil), `e2e/auth.spec.ts`, `e2e/helpers.ts`.

**Interfaces:**
- Tabelas: `profiles(id uuid pk references auth.users on delete cascade, handle citext unique check (handle ~ '^[a-z0-9._]{3,24}$'), name text check (length 1..50), bio text check (length ≤ 300), avatar_path text, is_creator bool default false, show_adult bool default false, role text default 'user' check in ('user','mod','admin'), under_review bool default false, suspended bool default false, created_at timestamptz default now())`; `invites(code text pk, kind text check in ('creator','fan'), created_by uuid, max_uses int default 1, uses int default 0, expires_at timestamptz)`.
- RPC `redeem_invite(code text, handle text, name text) returns profiles` — erros com códigos `invite_invalid`, `invite_used`, `invite_expired`, `handle_taken`, `handle_invalid`, `blocked_term`. `kind='creator'` define `is_creator=true`. Primeiro perfil do sistema recebe `role='admin'`.
- RPC `update_profile(name, bio, avatar_path, show_adult)`; `delete_my_account()`.
- Front: `useSession()` → `{ user, profile, loading }`; rota protegida redireciona para `/entrar` (sem sessão) ou `/convite` (sessão sem perfil).
- e2e helper `loginAs(page, email, { invite?: string, handle?: string })` cria usuário via API admin e injeta a sessão.

- [ ] Step 1: pgTAP: usuário não altera `role`/`under_review` de ninguém (nem o próprio) por update direto; `redeem_invite` com código válido cria perfil e incrementa `uses`; esgotado → `invite_used`; expirado → `invite_expired`; handle duplicado → `handle_taken`; handle com termo proibido → `blocked_term`. e2e: `semPerfilVaiProConvite`, `conviteValidoCriaPerfil`, `conviteInvalidoMostraErro`, `loginEmailMostraCampoCodigo`.
- [ ] Step 2: FAIL. Step 3: Implementar (login por código de e-mail e botão Google; telas no visual do protótipo). Step 4: PASS. Step 5: Commit.

### Task 4: Posts, mídia, feed e curtidas

**Files:** migração `0003_posts.sql` (tabelas, bucket `media`, políticas), `0003_posts.test.sql`, `src/lib/media.ts`, `src/pages/Feed.tsx`, `src/pages/NewPost.tsx`, `src/components/PostCard.tsx`, `e2e/posts.spec.ts`.

**Interfaces:**
- `posts(id uuid pk, author_id uuid, type text check in ('photo','video','text'), text text check length ≤ 2200, bg text, media_path text, sensitive bool default false, adult bool default false, status text default 'published' check in ('pending','published','hidden','removed'), created_at)`; `likes(post_id, user_id, pk)`.
- RPC `create_post(type, text, bg, media_path, sensitive) returns posts` (erro `blocked_term` marca `under_review`; `text` exige texto; `photo/video` exige `media_path` dentro de `media/<uid>/`).
- RPC `feed(filter text default 'para-voce', before timestamptz default null) returns setof feed_item` (posts `published`, autor não suspenso, `adult` só se `show_adult`, 20 por página, mais recentes primeiro; `filter='seguindo'` só quem eu sigo) com `like_count`, `comment_count`, `liked_by_me`, dados do autor.
- RPC `toggle_like(post_id) returns boolean`; `delete_post(id)` só do autor.
- `media.ts`: `validateFile(file, kind) -> string | null` (mensagens: "Foto até 15 MB (JPG, PNG ou WEBP)." / "Vídeo até 200 MB (MP4, WEBM ou MOV).") e `uploadMedia(file, kind) -> path`.

- [ ] Step 1: Vitest `validateFile` (tipos e limites). pgTAP: insert direto em `posts` negado; `create_post` com termo proibido falha e marca `under_review`; outro usuário não apaga post alheio; feed esconde `adult` com `show_adult=false`, esconde `removed`/`hidden` e autor suspenso. e2e: `publicaTexto`, `publicaFoto` (arquivo de teste), `curtir` (conta sobe e desce), `sensivelBorrado`.
- [ ] Step 2: FAIL. Step 3: Implementar PostCard igual ao protótipo (cartão, autor sobre a mídia, pílulas). Step 4: PASS. Step 5: Commit.

### Task 5: Comentários, denúncias, seguir e perfil público

**Files:** migração `0004_social.sql`, `0004_social.test.sql`, `src/components/CommentsSheet.tsx`, `src/components/ReportSheet.tsx`, `src/pages/Profile.tsx`, `src/pages/Me.tsx`, `e2e/social.spec.ts`.

**Interfaces:** `comments(id, post_id, author_id, text ≤ 500, status, created_at)`; `follows(follower_id, followee_id, pk, check follower<>followee)`; `reports(id, reporter_id, target_type check in ('post','comment','profile','story'), target_id uuid, reason check in ('menor','consentimento','violencia','spam','outro'), status default 'open', created_at, unique(reporter_id,target_type,target_id))`. RPCs `add_comment(post_id, text)`, `delete_comment(id)` (autor do comentário ou do post), `toggle_follow(user_id) returns boolean`, `report(target_type, target_id, reason)`. Denúncia de post o esconde para quem denunciou.

- [ ] Step 1: pgTAP: comentário proibido falha e marca `under_review`; denúncia duplicada não cria duas linhas; usuário comum não lê `reports` alheios. e2e: `comentar`, `seguirPersiste`, `denunciarEsconde`, `perfilMostraGrade`, `editarPerfil`, `excluirConta` (pede confirmação digitando o @).
- [ ] Step 2: FAIL. Step 3: Implementar. Step 4: PASS. Step 5: Commit.

### Task 6: Stories e aba de vídeos

**Files:** migração `0005_stories.sql`, `0005_stories.test.sql`, `src/components/StoryBar.tsx`, `src/components/StoryViewer.tsx`, `src/pages/Videos.tsx`, `e2e/stories.spec.ts`.

**Interfaces:** `stories(id, author_id, media_path, bg, text ≤ 200, created_at, expires_at default now()+24h)`; `story_views(story_id, user_id, pk)`. RPC `create_story(media_path, bg, text)` (filtro de termos), `active_stories() returns setof` (só não expirados, agrupados por autor, com `seen`). `Videos.tsx` usa `feed` filtrando `type='video'`, tela cheia com scroll-snap.

- [ ] Step 1: pgTAP: story com `expires_at` no passado não sai em `active_stories` nem em select direto. e2e: `criaStoryTexto`, `storyViewerAvancaEFecha`, `videosTelaCheia`.
- [ ] Step 2: FAIL. Step 3: Implementar. Step 4: PASS. Step 5: Commit.

### Task 7: Configurações, seed e documentação

**Files:** `supabase/seed.sql` (admin, 3 criadores de exemplo, convites `CRIADOR-TESTE`, `FA-TESTE`), `src/pages/Me.tsx` (chave "Mostrar conteúdo adulto", desabilitada com aviso "Disponível na próxima etapa"), `trip-app/README.md` (rodar local, criar projeto no Supabase, variáveis, deploy).

- [ ] Step 1: e2e `adultoDesabilitado` (chave visível e desabilitada com o aviso).
- [ ] Step 2: FAIL. Step 3: Implementar e escrever README. Step 4: suíte completa (`npm test`, `npm run db:test`, `npm run e2e`) → PASS. Step 5: Commit e push.
