# Gatecão Pet Shop

App da Gatecão: loja, banho e tosa, clube de vantagens e área de gestão.

## Caixa da loja (dentro de `gatecao.html`, endereço `#caixa`)

O caixa da loja física fica dentro do app Gatecão e usa o mesmo banco de dados, então **a pontuação do cliente é uma só**: comprou na loja ou pelo app, os pontos e o cashback caem na mesma carteira (`wallet/<id>`), que guarda a lista de movimentos e calcula o saldo.

- **Regras únicas (loja e app):** nível pelo gasto dos últimos 12 meses, cashback com validade, limite de uso, compra mínima, campanhas e bônus de indicação. Ficam em `settings/store` e são editadas em Caixa > Ajustes.
- **Cliente só da loja:** cadastrado como `customers/loja-…`. Quando ele entra no app com o mesmo telefone, o saldo da loja é unido à conta dele automaticamente (ao abrir o caixa).
- **Áreas só da equipe:** `pdv_ficha` (anotações, CPF, aniversário, indicação), `pdv_msgs`, `pdv_avulsas`, `pdv_fech`, `pdv_cfg` (equipe e PINs). Clientes não leem nada disso.
- **Caixa:** venda com cashback, troca de prêmios (os mesmos do app), fechamento do dia, CRM com gráficos, campanhas, mensagens para WhatsApp, equipe com PIN e modo consulta (`#caixa-consulta`).
- Quem usa o caixa precisa de acesso de Editor no app; a Gestão tem o botão "Caixa da loja".

`fidelidade.html` é a primeira versão, separada; hoje mostra só um aviso apontando para o caixa dentro do app.
