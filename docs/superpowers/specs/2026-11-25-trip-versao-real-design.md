# Trip: versão real, etapa 1 (teste fechado sem +18) — design

## Por que existe
A Trip é uma rede social de fotos, vídeos, textos e stories com assinaturas de criadores, cobrando taxa baixa (10%) para atrair quem hoje está no OnlyFans e similares. O protótipo (`trip/index.html`) validou visual e fluxos. A etapa 1 transforma isso num app real, usado por um grupo fechado de criadores convidados e seus assinantes, para provar três coisas: o criador ganha dinheiro de verdade, o pagamento funciona e a moderação segura. A etapa 2 libera conteúdo +18 quando os fornecedores exigidos por lei estiverem contratados.

## Objetivos da etapa 1
- Pessoas reais criam conta, seguem, curtem, comentam e conversam.
- Criadores convidados publicam foto, vídeo, texto e stories, criam planos e recebem dinheiro real via Pix.
- Assinantes pagam assinatura, gorjeta e mensagem paga com Pix.
- A equipe Trip modera tudo por um painel, com revisão prévia de mídia de criadores novos.
- O app já nasce com a estrutura do +18 (marcação de conteúdo adulto, filtro "mostrar +18", verificação de idade plugável), desligada.

## Fora da etapa 1
- Conteúdo +18 liberado (etapa 2).
- Lives com vídeo real (etapa posterior; precisam de serviço de streaming ao vivo).
- App nas lojas Apple/Google (a Trip é site instalável/PWA; lojas proíbem adulto e a etapa 2 vem logo).
- Cadastro aberto ao público: só entra quem tem convite.

## O que não pode acontecer
- Dinheiro de criador ou assinante perdido, cobrado em dobro ou com valor errado.
- Mídia de abuso infantil ficar no ar: toda mídia de criador novo passa por aprovação manual antes de aparecer, e há denúncia em tudo.
- Ficar preso a um fornecedor que proíba adulto: dados em PostgreSQL padrão, mídia em armazenamento compatível com S3, pagamento atrás de uma interface própria.
- Perder o visual aprovado: a interface segue o protótipo (paleta "mistura", cartões, stories em blocos, filtros).

## Restrições
- **Lei (ECA Digital, Lei 15.211/2025):** conteúdo pornográfico exige verificação de idade confiável, não basta autodeclaração. Na etapa 1 não há pornografia; a autodeclaração 18+ na entrada continua, e criadores passam por verificação de identidade (via fornecedor de pagamento) para receber. **Um advogado precisa confirmar o que a lei exige para a etapa 1 antes do convite.**
- **LGPD:** coletar só o necessário; documento e selfie ficam com o fornecedor de verificação, não no nosso banco.
- **Pagamento:** Pix com divisão automática (split) para a subconta do criador; a Trip retém 10%. Taxas do processador saem da parte da Trip na etapa 1 (decisão minha, ajustável).
- **Português do Brasil**, valores em BRL, horário de Brasília.
- Funciona bem no celular (a partir de 360px de largura) e no computador.

## Abordagens consideradas
1. **Firebase (igual à Gatecão):** mais rápido, mas regras do Google sobre adulto explícito não estão claras e o banco é proprietário; migrar na etapa 2 seria quase reescrever.
2. **Código portátil em serviço gerenciado (escolhida pelo Kayki):** app web + Supabase (PostgreSQL, login, armazenamento, funções) + serviço de vídeo dedicado. Quase tão rápido quanto Firebase e tudo padrão, portanto migrável.
3. **Servidor próprio desde o início:** controle total, mas muita manutenção e segurança sem equipe técnica.

## Como fica (decidido)
- **Front-end:** app web instalável (PWA) em React + TypeScript (Vite), reaproveitando o visual do protótipo. Hospedado em serviço estático (escolha do construtor, conferindo os termos de uso para adulto antes da etapa 2).
- **Back-end:** Supabase — PostgreSQL com regras de acesso por linha (RLS), Auth, Storage, Edge Functions para pagamento, webhooks e tarefas agendadas.
- **Vídeo:** serviço dedicado com conversão e streaming (Bunny Stream, Cloudflare Stream ou Mux). Escolher um cujo termo aceite adulto, para não trocar na etapa 2.
- **Login:** e-mail com código e Google. Cadastro exige **código de convite** na etapa 1.
- **Pagamento:** um módulo `payments` com interface própria (criar cobrança Pix, receber webhook, criar subconta do criador, split, saque). Primeira implementação num processador brasileiro com Pix, split e subcontas (Asaas ou Pagar.me; decisão final depende da conta que o Kayki conseguir abrir).
- **Verificação do criador:** a abertura da subconta no processador (KYC com CPF, data de nascimento, documento) é a verificação na etapa 1. Criador menor de 18 é recusado. A interface de verificação fica plugável para um fornecedor dedicado (Unico, Veriff ou Yoti) na etapa 2.

## Funcionalidades da etapa 1 (em marcos, cada um entregável)
1. **Base:** contas com convite, perfil (nome, @, bio, foto), seguir, feed (Para você cronológico, Quem eu assino), posts de foto, vídeo e texto, curtidas, comentários, stories de 24h, vídeos curtos em tela cheia, conteúdo sensível borrado, denúncia, filtro de palavras proibidas (o mesmo do protótipo, com os ajustes de falso positivo).
2. **Dinheiro:** modo criador, planos de assinatura, assinatura mensal por Pix (cobrança a cada 30 dias com lembrete; sem renovação automática no cartão nesta etapa), conteúdo exclusivo, gorjeta, carteira (disponível em 7 dias, a liberar), saque Pix, painel de ganhos.
3. **Conversa:** mensagens diretas, mensagem paga individual e em massa, chat só para um plano, notificações (no app e e-mail; push do navegador opcional).
4. **Moderação:** painel da equipe com fila por gravidade, aprovação prévia de mídia de criadores novos (primeiros 30 dias ou 20 posts), remover/borrar/manter, suspender perfil, registro de cada decisão, botão para exportar evidência de caso envolvendo menor (para denúncia às autoridades).
5. **Crescimento:** Explorar com busca e categorias, impulsionar post (pago, aparece com selo no feed de quem não segue), agendar post.

## Decisões minhas (para o Kayki conferir)
- Assinatura renova por nova cobrança Pix a cada 30 dias; se não pagar em 3 dias, o acesso acaba.
- Taxa da Trip: 10% sobre assinatura, gorjeta, mensagem paga. Impulsionar é 100% da Trip.
- Dinheiro do criador fica disponível 7 dias após o pagamento (proteção contra estorno/fraude); saque mínimo R$ 10,00.
- Mídia de criador novo passa por aprovação manual antes de ir ao ar.
- Convites: cada criador convidado recebe um link para os seus assinantes; a equipe gera convites de criador.
- Lives ficam fora da etapa 1.
- Feed "Para você": todos os posts visíveis da plataforma, mais recentes primeiro, com um post impulsionado a cada 5. Com poucos criadores no teste, não precisa de algoritmo.
- Cancelar assinatura mantém o acesso até o fim do período pago.
- Limites de valor (vindos do protótipo): plano de R$ 4,90 a R$ 999,00; gorjeta de R$ 2,00 a R$ 5.000,00; mensagem paga de R$ 2,00 a R$ 500,00; impulsionar a partir de R$ 5,00 por dia, de 1 a 30 dias.
- Equipe: contas marcadas como moderador/admin numa tabela própria; a primeira conta criada vira admin.
- Excluir conta (LGPD) disponível no perfil; dados financeiros ficam guardados pelo prazo legal.

## O que precisa do Kayki (fora do código)
- Abrir conta no Supabase, no serviço de vídeo e no processador de pagamento (em nome da empresa).
- Empresa (CNPJ), domínio (ex.: trip-algo.com.br), e-mail da equipe.
- Advogado: termos de uso, política de privacidade, regras do teste fechado e confirmação das exigências do ECA Digital para a etapa 1.
- Pessoa(s) para moderar durante o teste.
- Lista dos primeiros criadores convidados.

## Fica para quem construir
Estrutura de pastas, nomes de tabelas, bibliotecas de interface, testes (unitários nas regras de dinheiro e acesso; ponta a ponta nos fluxos principais), escolha final entre os serviços de vídeo listados, textos de e-mail.
