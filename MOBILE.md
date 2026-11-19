# App nativo (Android e iOS) — Gatecão

O app das lojas é o **mesmo app web** (`gatecao.html` → build em `public/`), empacotado
com **Capacitor**. O código vai **dentro do app** (abre offline, não aponta para o site).

- **appId:** `br.com.gatecao.app`
- **Nome:** Gatecão
- **Projeto Android:** `android/`  ·  **Projeto iOS:** `ios/`
- **Conteúdo web:** `public/` (gerado por `python3 tools/build_firebase.py`)

---

## 0. O que você precisa (uma vez)

| Item | Para quê | Custo |
|------|----------|-------|
| Conta **Google Play Console** | publicar no Android | US$ 25 (uma vez) |
| Conta **Apple Developer** | publicar no iPhone | US$ 99/ano |
| Um **Mac** com Xcode | compilar o iOS (obrigatório da Apple) | — |
| **Android Studio** | compilar/assinar o Android | grátis |

No Linux/na nuvem dá para gerar tudo e compilar o **Android**; o **iOS só compila no Mac**.

---

## 1. Atualizar o app depois de qualquer mudança no site

Sempre que mexer em `gatecao.html`:

```bash
npm install                 # só na primeira vez
npm run build:web           # gera public/ (roda tools/build_firebase.py)
npx cap sync                # copia public/ para android/ e ios/
```

Depois é só recompilar (passos 3 e 4).

---

## 2. Ligar os avisos (push) nativos — Firebase

O push nativo usa o Firebase (mesmo projeto `gatecao-5acbc`). Uma vez só:

### Android
1. No **console do Firebase → Configurações do projeto → Seus apps → Adicionar app → Android**.
2. Pacote: `br.com.gatecao.app`. Baixe o **`google-services.json`**.
3. Coloque o arquivo em **`android/app/google-services.json`**.
4. Em `android/build.gradle`, dentro de `dependencies` do bloco `buildscript`, adicione:
   ```gradle
   classpath 'com.google.gms:google-services:4.4.2'
   ```
5. No fim de `android/app/build.gradle`, adicione:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```
   e em `dependencies`:
   ```gradle
   implementation platform('com.google.firebase:firebase-bom:33.5.1')
   implementation 'com.google.firebase:firebase-messaging'
   ```
6. `npx cap sync android`.

### iOS
1. No Firebase → Adicionar app → **iOS**, pacote `br.com.gatecao.app`. Baixe **`GoogleService-Info.plist`**.
2. No Xcode, arraste o arquivo para dentro do projeto `App` (marcando "Copy if needed").
3. No Xcode → **Signing & Capabilities** do alvo `App`: adicione **Push Notifications** e **Background Modes → Remote notifications**.
4. No **Apple Developer**, crie a **APNs Key** e cadastre no Firebase (Cloud Messaging → Apple app).

> O código JS do push já está pronto (`GCFB.saveNativeToken` + bridge no app). O servidor de
> avisos (Cloud Functions) já envia para o campo `pushTokens/{uid}` com `origin: 'app'` — não
> precisa mudar nada no servidor.

---

## 3. Compilar e publicar o **Android**

### Rodar/testar
```bash
npx cap open android      # abre no Android Studio
```
Ou gerar o pacote de publicação (Android App Bundle):
```bash
cd android
./gradlew bundleRelease   # gera app/build/outputs/bundle/release/app-release.aab
```

### Assinar (uma vez)
Crie a chave de assinatura e configure em `android/app` (o Android Studio tem
**Build → Generate Signed Bundle** que faz isso pela interface). **Guarde o keystore e as
senhas** — sem eles você não consegue atualizar o app depois.

### Subir
Google Play Console → **Criar app** → preencher ficha (textos abaixo) → **Produção → Novo
release** → enviar o `.aab` → revisão (algumas horas a 2 dias).

### Verificar o domínio (links)
No Play Console, em **Configuração → App Bundles** você pega o SHA-256 do app e adiciona um
`assetlinks.json` no site, se quiser que links `gatecao.com.br` abram no app.

---

## 4. Compilar e publicar o **iOS** (no Mac)

```bash
npm run build:web
npx cap sync ios
sudo gem install cocoapods     # 1ª vez
cd ios/App && pod install
npx cap open ios               # abre o Xcode
```
No Xcode:
1. Selecione o time (sua conta Apple Developer) em **Signing & Capabilities**.
2. **Product → Archive** → **Distribute App → App Store Connect**.
3. No **App Store Connect**, crie o app (pacote `br.com.gatecao.app`), preencha a ficha,
   anexe o build e envie para revisão (1–3 dias).

> **Atenção Apple (regra 4.2):** apps que são "só um site" podem ser recusados. O nosso tem
> push, offline, pagamento e cara de app, o que costuma passar. Se pedirem mais, a gente
> reforça recursos nativos.

---

## 5. Textos da ficha da loja (pt-BR)

**Nome:** Gatecão Pet Shop
**Subtítulo / descrição curta (até 30/80 car.):** Ração, farmácia e banho com entrega
**Descrição longa:**
> O app da Gatecão Pet Shop: peça ração, petiscos, farmácia, brinquedos e acessórios com
> entrega no mesmo dia (pedidos até as 15h). Agende banho e tosa em 1 minuto, acompanhe seus
> pedidos e ganhe pontos e cashback no Clube Gatecão. Pague no app por Pix ou cartão.
> Combos "Leve N por R$ X", recompra automática de ração e lembretes dos seus pets.

**Palavras-chave:** pet shop, ração, banho e tosa, cachorro, gato, petshop, entrega, cashback
**Categoria:** Compras (Shopping)
**Política de privacidade (URL):** https://gatecao.com.br (rodapé → Privacidade)

**Capturas de tela (precisa):** tela inicial, um produto, carrinho/checkout, clube de
vantagens, banho e tosa. Tire no celular (ou no navegador em modo celular) e recorte.

---

## 6. Como lançar uma atualização

1. Edite `gatecao.html` (como sempre).
2. `npm run build:web && npx cap sync`.
3. Suba o `versionCode`/`versionName` (Android, em `android/app/build.gradle`) e o
   **Build** (iOS, no Xcode).
4. Recompile e reenvie nas duas lojas.

> Correções pequenas de conteúdo que já estão no site saem na hora pela web; as lojas só
> precisam de novo envio quando você quer atualizar o app instalado.
