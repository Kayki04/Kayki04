# Trip — app (etapa 1: teste fechado)

App web da Trip (React + TypeScript + Vite) sobre Supabase (PostgreSQL, login, arquivos).
Design: `../docs/superpowers/specs/2026-11-25-trip-versao-real-design.md`. Protótipo visual: `../trip/index.html`.

## O que já funciona (marco 1)
- Entrada 18+, login por código no e-mail (Google preparado), cadastro só com convite.
- Perfil: foto, nome, bio, seguir, perfil público com grade, editar, excluir conta.
- Posts de foto, vídeo e texto; feed "Para você" e "Seguindo"; curtidas; comentários.
- Stories de 24 horas; aba de vídeos em tela cheia.
- Conteúdo sensível borrado; denúncia (esconde o post para quem denunciou).
- Filtro de termos ligados a menores no banco (autoritativo) e na tela; bloqueio coloca o perfil em revisão.

## Rodar no computador
Precisa de Node 20+, Docker e o Supabase CLI (vem no `npm install`).

```bash
cd trip-app
npm install
npm run db:start            # sobe o Supabase local (Docker)
npx supabase db reset       # cria as tabelas e os dados de exemplo
cp .env.example .env.local  # preencha com as chaves que o db:start mostra
npm run dev                 # abre em http://localhost:5173
```

E-mails de login (com o código) chegam no Mailpit local: http://127.0.0.1:54324.
Convites de exemplo: `CRIADOR-TESTE` (criador) e `FA-TESTE` (fã).

## Testes
```bash
npm test          # regras do app (Vitest)
npm run db:test   # regras do banco e permissões (pgTAP)
npm run e2e       # fluxos completos no navegador (Playwright)
```

## Colocar no ar (projeto real no Supabase)
1. Crie o projeto em supabase.com (região São Paulo). Anote a URL e a chave pública (anon).
2. `npx supabase link --project-ref <id-do-projeto>` e `npx supabase db push` para criar as tabelas.
3. Em Authentication › Email Templates, cole os modelos de `supabase/templates/` (o e-mail precisa mostrar o código `{{ .Token }}`).
4. Em Authentication › URL Configuration, coloque o endereço do site.
5. Configure um SMTP próprio (o envio padrão do Supabase é limitado e serve só para teste).
6. Crie os convites de criador direto na tabela `invites` (ou peça para a equipe).
7. Publique o front (`npm run build`, pasta `dist/`) num serviço estático com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` definidos.

O primeiro perfil criado no banco vira administrador.

## Antes de liberar +18 (etapa 2)
A chave "Mostrar conteúdo adulto" já existe e está desligada. Antes de ligar: verificação de idade por fornecedor (exigência do ECA Digital), detecção automática de abuso infantil nas imagens, e conferir se os termos de uso do Supabase, do serviço de vídeo e da hospedagem aceitam conteúdo adulto.
