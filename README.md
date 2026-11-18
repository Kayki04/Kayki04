# Gatecão Pet Shop

App da Gatecão: loja, banho e tosa, clube de vantagens e área de gestão.

## Versão Firebase

O mesmo `gatecao.html` roda no Claude (Artifact) e no Firebase.

- `firebase/shim.js`: entrega ao app as mesmas funções do Claude (banco, login, fotos, downloads) usando o Firebase, e mostra a tela de login (Google ou celular).
- `firebase/firestore.rules` e `firebase/storage.rules`: regras de acesso.
- `tools/build_firebase.py`: monta a pasta `public/` (app, ícones, manifest e service worker).
- `.github/workflows/firebase-deploy.yml`: publica sozinho no Firebase a cada push. Precisa do segredo `FIREBASE_SERVICE_ACCOUNT` no GitHub.

A primeira conta que entrar no app pode se tornar a dona da loja (lista em `admins/list`).
Para levar os dados do Claude: Gestão › Loja › Baixar cópia de tudo (no Claude) e Importar cópia (no Firebase).
