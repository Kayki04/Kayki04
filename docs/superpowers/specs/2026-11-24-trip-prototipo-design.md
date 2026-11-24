# Trip: protótipo navegável (design)

## Por que existe
A Trip é uma rede social de fotos, vídeos, textos e stories (estilo Instagram/TikTok) com conteúdo adulto liberado e assinaturas de criadores, cobrando uma taxa bem menor que OnlyFans e similares para atrair criadores. O protótipo serve para validar a ideia, o visual e os fluxos (e mostrar para sócios ou investidores) antes de construir a versão real.

## Objetivos
- Um link que abre no celular e se comporta como app, com dados de exemplo.
- Mostrar os fluxos principais funcionando na tela: navegar no feed, ver stories, vídeos curtos, assinar um criador, publicar, impulsionar, denunciar e ver o painel do criador.
- Aplicar a paleta aprovada (`trip/paleta.html`).

## Fora do escopo (é protótipo)
- Servidor, contas reais, upload real, pagamento real, moderação automática real.
- Nada do que se faz no protótipo é enviado para lugar nenhum; fica só no navegador de quem usa.

## O que não pode acontecer
- Imagens explícitas de verdade no protótipo: os conteúdos são blocos de cor e ilustrações. O conteúdo adulto aparece como post bloqueado/borrado, que é como ele se comporta para quem não assina.
- O protótipo parecer cópia do Instagram ou TikTok: a identidade é a da paleta "mistura".

## Restrições já conhecidas para a versão real (registradas, não construídas agora)
- Verificação de idade (documento + selfie) de todo criador e de quem aparece no conteúdo, com registro de consentimento.
- Proibido: qualquer conteúdo envolvendo menores (remoção imediata, perfil em revisão, denúncia às autoridades), conteúdo sem consentimento, zoofilia e outros ilegais.
- Violência, sangue, mutilação e morte: borrado com aviso ou removido.
- Apple e Google não aceitam pornografia: distribuição como site/PWA.
- Processador de pagamento que aceite conteúdo adulto, com Pix.

## Abordagens consideradas
1. **Arquivo HTML único** (escolhida): mesmo esquema do `gatecao.html`, publica com um link, abre no celular. Rápido e suficiente para protótipo.
2. Projeto React/Vite: mais estrutura, mas atrasa e não muda o que se vê num protótipo.
3. Design estático (só imagens das telas): mais rápido, mas não dá para tocar e sentir os fluxos.

## Paleta (aprovada)
Gradiente da marca magenta `#FF0A78` → roxo `#8A2BE2` → ciano `#00D4FF` (logo, anel dos stories, selo de criador, Impulsionar). Verde-limão `#C6FF00` para Assinar e pagamentos. Laranja `#FF8A00` para Ao vivo, Em alta e impulsionado. Fundo branco `#FFFFFF`, cinza `#F4F3F7`, texto `#14121A`. Vídeos curtos em tela cheia com fundo preto.

## Telas e fluxos
- **Entrada 18+**: confirmação de idade antes de entrar.
- **Barra inferior**: Início, Vídeos, Postar (+), Assinaturas, Perfil.
- **Início (feed)**: stories no topo; posts de foto, vídeo e texto (texto com fundo colorido opcional); post impulsionado com selo; post só para assinantes borrado com botão Assinar; post sensível borrado com "toque para ver". Curtir, comentar, menu com Denunciar.
- **Stories**: abre em tela cheia, avança sozinho e com toque.
- **Vídeos**: rolagem vertical em tela cheia, fundo preto, botões laterais, Assinar.
- **Perfil de criador**: capa, selo, planos de assinatura, grade de posts com os exclusivos bloqueados.
- **Assinar**: escolher plano → pagamento simulado (Pix com QR de exemplo) → conteúdo desbloqueado.
- **Minhas assinaturas**: criadores assinados, renovação, valor.
- **Postar**: foto, vídeo ou texto; público ou só assinantes; aviso de conteúdo sensível. Demonstração da moderação: palavras proibidas bloqueiam a publicação com aviso.
- **Impulsionar**: escolher valor e dias, ver alcance estimado, pagamento simulado.
- **Meu perfil**: alternar entre pessoa comum e criador. Como criador, painel com assinantes, ganhos, taxa da Trip e criar/editar planos.
- **Denunciar**: motivos (menor de idade, sem consentimento, violência, outro), confirmação na tela.

## Decisões minhas (para você conferir)
- Taxa da Trip mostrada no protótipo: **10%** (comparada com os 20% do OnlyFans no painel do criador).
- Criadores e posts de exemplo com nomes inventados e conteúdo ilustrado.
- Ações do usuário (curtidas, assinaturas, posts) ficam salvas no navegador para o protótipo parecer vivo.
- Arquivo: `trip/index.html`.

## Fica para quem construir
Detalhes de animação, textos de exemplo e ilustrações dos posts.
