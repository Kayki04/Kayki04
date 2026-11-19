# BROTA · a rede social do rolê no Rio

App mobile-first (React + Vite) no estilo Instagram: fundo branco, fotos grandes, botões arredondados.
Foco: Rio de Janeiro — Lapa, Copacabana, Madureira, Tijuca, Barra, Botafogo, Centro, Zona Norte e Zona Sul.

## Telas

| Tela | O que faz |
|---|---|
| Login | Entrar com Google → foto, nome, idade (18+), bairro do RJ e status (Solteiro / Curtindo / Só de rolê) |
| Home | Stories "Rolando Agora" + feed da galera do RJ + botão **BROTA** (check-in) |
| Explorar | Mapa com pins "rolando agora", lista de rolês (foto, nome, quantos tão lá, bairro, distância) e grade de fotos |
| Página do Rolê | Capa grande, quem tá lá, fotos do rolê, botões **BROTA**, **Vou**, **Match** e ⭐ indicar |
| Me Arrumando | Feed vertical tipo Reels (foto/vídeo), curtir, comentar, salvar e **+** pra postar escolhendo o rolê |
| Match | Cartas de quem tá no mesmo rolê, arrasta pra curtir/passar, "X pessoas te curtiram" embaçado (VIP), chat |
| Perfil | Foto redonda, bio, grade 3x3, meus rolês e minhas indicações |

## Planos

- **Grátis:** 3 likes por noite (a noite vai das 6h às 6h), ver rolês.
- **VIP R$ 14,90:** likes ilimitados, ver quem curtiu, Super Like. O botão "Assinar VIP" é de demonstração (não cobra).

## Rodar

```bash
cd brota
npm install
npm run dev
```

Sem configuração o app roda em **modo demo**: o login Google é simulado e tudo fica salvo no navegador (localStorage), já com os rolês de exemplo (Baile da Lapa, Pagode em Madureira, Rolê em Copacabana, Bar em Botafogo, Funk na Tijuca, Samba da Pedra do Sal, Luau na Barra).

## Ligar o Firebase

1. Crie um projeto no Firebase, ative **Authentication › Google** e o **Firestore**.
2. Copie `.env.example` para `.env` e preencha com a config Web do projeto.
3. `npm run dev` — na primeira abertura o app grava os dados de exemplo no Firestore.
4. Publicar: `npm run build && npx firebase-tools deploy --project SEU_PROJETO` (usa `firebase.json` e `firestore.rules` desta pasta).

`src/firebase.js` inicializa o app com `getFirestore`. Coleções: `users`, `roles` (festas), `posts`, `matches` (+ `matches/{id}/messages`), `likes`, `checkins`.
`src/services/db.js` é a camada única de dados: usa o Firestore quando configurado, senão o banco local com a mesma API.

> As regras em `firestore.rules` são de fase de testes (qualquer usuário logado escreve). Antes de lançar, restrinja por dono.
