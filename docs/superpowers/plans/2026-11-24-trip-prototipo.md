# Trip Protótipo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protótipo navegável da Trip em um único arquivo HTML, com dados de exemplo, publicável como link.

**Architecture:** `trip/index.html` contém CSS, HTML e JS. Um objeto global `T` guarda dados de exemplo, estado do usuário (salvo em localStorage com try/catch) e a navegação por views (`T.go(view)`), sem bibliotecas. Testes de fumaça com Playwright abrem o arquivo via `file://` e exercitam cada fluxo.

**Tech Stack:** HTML/CSS/JS puro; Google Fonts (Unbounded, Inter); Playwright (já instalado no ambiente) para testes.

**Spec:** `docs/superpowers/specs/2026-11-24-trip-prototipo-design.md`

## Global Constraints
- Paleta: `--magenta:#FF0A78`, `--roxo:#8A2BE2`, `--ciano:#00D4FF`, gradiente da marca nessa ordem; `--lima:#C6FF00` (Assinar/pagamentos); `--laranja:#FF8A00` (Ao vivo, Em alta, Impulsionado); `--branco:#FFFFFF`, `--nevoa:#F4F3F7`, `--tinta:#14121A`. Vídeos com fundo preto.
- Um único arquivo; scripts externos só de cdnjs (não previstos); fontes só do Google Fonts.
- Sem imagens explícitas: mídia é gradiente/ilustração CSS; conteúdo adulto aparece só borrado/bloqueado.
- Taxa da Trip: 10% (comparar com 20% do OnlyFans no painel).
- Textos em português do Brasil; nomes de criadores inventados.
- Nada sai do navegador.
- Funciona em 360px de largura sem rolagem horizontal.

## Review Focus
1. localStorage bloqueado (janela privada/preview): o app abre e funciona, só não lembra. → teste na Task 1.
2. Palavra proibida com maiúsculas/acentos ("CRIANÇA", "Menor de Idade", "15 anos") é bloqueada. → teste na Task 5.
3. Tocar "Assinar" duas vezes não duplica a assinatura. → teste na Task 4.
4. Impulsionar com valor vazio, zero ou negativo não deixa pagar. → teste na Task 5.
5. Post de texto muito longo não estoura a largura em 360px. → teste na Task 2.

---

### Task 1: Base do app (tokens, entrada 18+, navegação, estado)

**Files:**
- Create: `trip/index.html`
- Create: `trip/tests/smoke.mjs` (runner Playwright: `node trip/tests/smoke.mjs` roda todos os testes, imprime `ok`/`FAIL` e sai com código ≠0 se algum falhar)

**Interfaces:**
- Produces: `window.T` com `T.data = {creators:[], posts:[], stories:[]}`; `T.state = {age:boolean, likes:{}, subs:{[creatorId]:planId}, myPosts:[], isCreator:boolean, boosts:[]}`; `T.save()`; `T.go(view: 'home'|'videos'|'post'|'subs'|'me'|'creator', arg?)`; `T.toast(msg)`; `T.sheet(html)` / `T.closeSheet()`. Elementos: `#age-gate`, `#age-ok`, `nav#tabs button[data-view]`, `main#view[data-view]`.
- Creator: `{id, name, handle, color, bio, plans:[{id, name, price}]}`. Post: `{id, creatorId, type:'photo'|'video'|'text', bg, text, likes, exclusive:boolean, sensitive:boolean, boosted:boolean}`.

- [ ] Step 1: Testes: `ageGateVisivel` (sem estado, `#age-gate` visível); `ageGateConfirma` (clica `#age-ok`, gate some, `#view[data-view=home]`); `navegaAbas` (cada `[data-view]` da barra muda `#view` para aquela view); `semStorage` (`addInitScript` que faz `localStorage.getItem` lançar erro; app abre e o gate funciona).
- [ ] Step 2: Rodar `node trip/tests/smoke.mjs` → FAIL (arquivo não existe).
- [ ] Step 3: Implementar estrutura, tokens, gate, barra inferior (Início, Vídeos, +, Assinaturas, Perfil), `T.go`, `T.save` com try/catch, 4 criadores e ~12 posts de exemplo cobrindo foto/vídeo/texto, exclusivo, sensível, impulsionado.
- [ ] Step 4: Rodar testes → PASS.
- [ ] Step 5: Commit `Trip: base do protótipo`.

### Task 2: Feed e stories

**Interfaces:** Consumes `T.data`, `T.state.likes`. Produces `.post[data-id]`, `.like-btn`, `.locked` (exclusivo), `.sensitive` + `.reveal`, `.story[data-id]`, `#story-viewer`.

- [ ] Step 1: Testes: `feedMostraTipos` (há `.post` com `data-type` photo, video e text); `curtir` (clicar `.like-btn` incrementa contador em 1 e marca ativo; clicar de novo volta); `sensivelRevela` (clicar `.reveal` remove o borrado daquele post); `exclusivoBloqueado` (post exclusivo de criador não assinado tem `.locked` e botão Assinar); `storyAbre` (clicar `.story` abre `#story-viewer`, tocar à direita avança, fecha ao fim); `textoLongo360` (viewport 360, post de texto com 600 caracteres, `document.documentElement.scrollWidth <= 360`).
- [ ] Step 2: Rodar → FAIL.
- [ ] Step 3: Implementar feed (cabeçalho com logo, sino), barra de stories com anel gradiente/visto, cards de post, menu "…" com Denunciar (abre sheet da Task 6; aqui só o botão `.report-btn`), viewer de stories com barras de progresso (5s por story).
- [ ] Step 4: Rodar → PASS. Step 5: Commit `Trip: feed e stories`.

### Task 3: Vídeos em tela cheia

**Interfaces:** Produces `#view[data-view=videos] .reel` (scroll-snap vertical).

- [ ] Step 1: Teste `videosTelaCheia`: view videos tem ≥4 `.reel`, cada um com altura = altura do viewport (±2px), fundo escuro, botão Assinar; rolar leva ao próximo reel.
- [ ] Step 2: FAIL. Step 3: Implementar com `scroll-snap-type: y mandatory`, ilustração animada CSS como "vídeo", lateral com curtir/comentar/enviar, selo AO VIVO em um deles. Step 4: PASS. Step 5: Commit `Trip: vídeos`.

### Task 4: Perfil do criador, assinar e Minhas assinaturas

**Interfaces:** Consumes `T.state.subs`. Produces `T.subscribe(creatorId, planId)` (idempotente), `T.isSubscribed(creatorId) -> boolean`, `.plan[data-plan]`, `#pix-pay`, `#pix-done`.

- [ ] Step 1: Testes: `abrePerfil` (clicar nome do criador no feed abre `creator`, mostra planos e grade com exclusivos bloqueados); `fluxoAssinar` (escolher `.plan` → aparece QR Pix de exemplo e valor → `#pix-done` → toast, posts do criador perdem `.locked`); `assinarDuasVezes` (repetir o fluxo não cria segunda entrada em Minhas assinaturas); `minhasAssinaturas` (view subs lista o criador, plano, valor mensal e próxima renovação = hoje + 30 dias).
- [ ] Step 2: FAIL. Step 3: Implementar; QR é um SVG gerado de padrão fixo, com aviso "pagamento simulado". Step 4: PASS. Step 5: Commit `Trip: assinaturas`.

### Task 5: Postar (com moderação) e Impulsionar

**Interfaces:** Produces `T.isBlocked(text) -> {blocked:boolean, term?:string}`; `T.boostEstimate(porDia:number, dias:number) -> {total, min, max}` com `total = porDia*dias`, `min = total*60`, `max = total*140`; `#post-type`, `#post-text`, `#post-exclusive`, `#post-sensitive`, `#post-publish`, `#boost-day`, `#boost-days`, `#boost-pay`.

- [ ] Step 1: Testes: `publicaTexto` (tipo texto, escrever, publicar → aparece no topo do feed); `publicaExclusivo` (marcado como só assinantes aparece com selo "Assinantes"); `bloqueiaProibido` para `"CRIANÇA"`, `"menor de idade"`, `"Menor De Idade"`, `"tenho 15 anos"`, `"novinha"` → não publica, mostra aviso de remoção e "perfil em revisão"; `naoBloqueiaNormal` (`"18 anos de carreira"`, `"comemorando 25 anos"` publicam); `estimativa` (`T.boostEstimate(10,3)` → `{total:30,min:1800,max:4200}`); `impulsionarInvalido` (vazio, 0, -5 → `#boost-pay` desabilitado); `impulsionarOk` (10/dia, 3 dias → pagar simulado → post ganha selo Impulsionado).
- [ ] Step 2: FAIL.
- [ ] Step 3: Implementar. `isBlocked`: normalizar (minúsculas, sem acentos) e testar lista (`crianca`, `infantil`, `menor de idade`, `novinha`, `pedo`, `colegial`, `lolita`) + regex `\b([1-9]|1[0-7])\s*anos\b`. Foto/vídeo: escolher entre ilustrações de exemplo (sem upload real). Impulsionar abre pelo botão do post próprio e pelo menu do Perfil; mínimo R$ 5/dia, 1–30 dias.
- [ ] Step 4: PASS. Step 5: Commit `Trip: postar e impulsionar`.

### Task 6: Meu perfil, painel do criador e Denunciar

**Interfaces:** Consumes `T.state.isCreator`, `T.boostEstimate`. Produces `#toggle-creator`, `#dash`, `#dash-gross`, `#dash-fee`, `#dash-net`, `#plan-add`, `.report-reason`, `#report-send`.

- [ ] Step 1: Testes: `alternaCriador` (ligar `#toggle-creator` mostra `#dash`; desligar esconde); `painelTaxa` (com bruto de exemplo R$ 4.800,00: `#dash-fee` = "R$ 480,00", `#dash-net` = "R$ 4.320,00", e comparação "No OnlyFans você ficaria com R$ 3.840,00"); `criaPlano` (adicionar plano nome+preço aparece na lista e no perfil público); `denunciar` (no feed, `.report-btn` → escolher `.report-reason` "Menor de idade" → `#report-send` → confirmação "Recebemos. O post foi ocultado enquanto analisamos." e o post some do feed).
- [ ] Step 2: FAIL. Step 3: Implementar; valores em BRL com `Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})`. Step 4: PASS. Step 5: Commit `Trip: perfil, painel e denúncia`.

### Task 7: Publicar e conferir

- [ ] Step 1: `node trip/tests/smoke.mjs` → todos `ok`.
- [ ] Step 2: Publicar `trip/index.html` como Artifact (ícone `phone`), uma olhada no celular/escuro.
- [ ] Step 3: Commit e push na branch `claude/beautiful-cray-mf4id7`.
