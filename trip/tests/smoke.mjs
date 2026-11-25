// Testes de fumaça do protótipo Trip. Uso: node trip/tests/smoke.mjs [filtro]
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const URL_APP = pathToFileURL(path.join(here, '..', 'index.html')).href;

const tests = [];
const test = (name, fn, opts = {}) => tests.push({ name, fn, opts });
const assert = (c, msg) => { if (!c) throw new Error(msg); };

async function open(browser, { width = 400, height = 800, blockStorage = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  if (blockStorage) await ctx.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } });
  });
  ctx.setDefaultTimeout(3000);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL_APP, { waitUntil: 'domcontentloaded' });
  page.errors = errors;
  return page;
}
async function enter(page) { await page.click('#age-ok'); }
const view = page => page.getAttribute('#view', 'data-view');

// ---------- Task 1 ----------
test('ageGateVisivel', async b => {
  const p = await open(b);
  assert(await p.isVisible('#age-gate'), 'gate deveria estar visível');
});
test('ageGateConfirma', async b => {
  const p = await open(b); await enter(p);
  assert(!(await p.isVisible('#age-gate')), 'gate deveria sumir');
  assert((await view(p)) === 'home', 'view deveria ser home');
});
test('navegaAbas', async b => {
  const p = await open(b); await enter(p);
  for (const v of ['videos', 'post', 'subs', 'me', 'home']) {
    await p.click(`nav#tabs button[data-view="${v}"]`);
    assert((await view(p)) === v, `view deveria ser ${v}, veio ${await view(p)}`);
  }
});
test('semStorage', async b => {
  const p = await open(b, { blockStorage: true });
  assert(await p.isVisible('#age-gate'), 'gate visível sem storage');
  await enter(p);
  assert((await view(p)) === 'home', 'entra sem storage');
  assert(p.errors.length === 0, 'erros: ' + p.errors.join('; '));
});


// ---------- Task 2 ----------
test('feedMostraTipos', async b => {
  const p = await open(b); await enter(p);
  for (const t of ['photo', 'video', 'text'])
    assert(await p.locator(`.post[data-type="${t}"]`).count() > 0, `sem post ${t}`);
});
test('curtir', async b => {
  const p = await open(b); await enter(p);
  const btn = p.locator('.post').first().locator('.like-btn');
  const n0 = Number(await btn.getAttribute('data-count'));
  await btn.click();
  assert(Number(await btn.getAttribute('data-count')) === n0 + 1, 'curtida não somou 1');
  assert((await btn.getAttribute('aria-pressed')) === 'true', 'não ficou ativo');
  await btn.click();
  assert(Number(await btn.getAttribute('data-count')) === n0, 'descurtir não voltou');
  assert((await btn.getAttribute('aria-pressed')) === 'false', 'não desativou');
});
test('sensivelRevela', async b => {
  const p = await open(b); await enter(p);
  const post = p.locator('.post[data-id="p7"]');
  assert(await post.locator('.blur').count() === 1, 'post sensível deveria estar borrado');
  await post.locator('.reveal').click();
  assert(await post.locator('.blur').count() === 0, 'continuou borrado');
});
test('exclusivoBloqueado', async b => {
  const p = await open(b); await enter(p);
  const lock = p.locator('.post[data-id="p3"] .locked');
  assert(await lock.count() === 1, 'exclusivo sem .locked');
  assert((await lock.locator('button').innerText()).includes('Assinar'), 'sem botão Assinar');
});
test('storyAbre', async b => {
  const p = await open(b); await enter(p);
  await p.click('.story[data-id="bia"]');
  assert(await p.isVisible('#story-viewer'), 'viewer não abriu');
  const f = () => p.getAttribute('#story-viewer', 'data-frame');
  assert((await f()) === '0', 'frame inicial');
  await p.click('#story-viewer .story-next'); assert((await f()) === '1', 'não avançou');
  await p.click('#story-viewer .story-next'); assert((await f()) === '2', 'não avançou 2');
  await p.click('#story-viewer .story-next');
  assert(!(await p.isVisible('#story-viewer')), 'não fechou no fim');
});
test('textoLongo360', async b => {
  const p = await open(b, { width: 360 }); await enter(p);
  await p.evaluate(() => {
    const longo = ('Texto bem comprido para testar a quebra de linha. ').repeat(11) + 'a'.repeat(90);
    T.data.posts.unshift({ id: 'longo', creatorId: 'caio', type: 'text', bg: '#FF0A78', text: longo, likes: 1, comments: 0 });
    T.refresh();
  });
  assert(await p.locator('.post[data-id="longo"]').count() === 1, 'post longo não apareceu');
  const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('view').scrollWidth));
  assert(w <= 360, 'largura estourou: ' + w);
});


// ---------- Task 3 ----------
test('videosTelaCheia', async b => {
  const p = await open(b); await enter(p);
  await p.click('nav#tabs button[data-view="videos"]');
  const info = await p.evaluate(() => {
    const v = document.getElementById('view');
    const reels = [...v.querySelectorAll('.reel')];
    return { n: reels.length, vh: v.clientHeight, hs: reels.map(r => r.getBoundingClientRect().height),
      btns: reels.map(r => !!r.querySelector('.sub-btn')), bg: getComputedStyle(v).backgroundColor };
  });
  assert(info.n >= 4, 'menos de 4 reels: ' + info.n);
  assert(info.hs.every(h => Math.abs(h - info.vh) <= 2), 'altura errada: ' + info.hs + ' vs ' + info.vh);
  assert(info.btns.every(Boolean), 'reel sem botão Assinar');
  assert(info.bg === 'rgb(11, 10, 16)', 'fundo não é escuro: ' + info.bg);
  const second = await p.evaluate(() => {
    const v = document.getElementById('view'); v.scrollTop = v.clientHeight;
    const r = v.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el && el.closest('.reel') ? el.closest('.reel').dataset.id : null;
  });
  const ids = await p.$$eval('.reel', rs => rs.map(r => r.dataset.id));
  assert(second === ids[1], 'rolar não levou ao segundo reel: ' + second);
});


// ---------- Task 4 ----------
async function assinar(p, creator, plan) {
  await p.evaluate(c => T.go('creator', c), creator);
  await p.click(`.plan[data-plan="${plan}"]`);
  assert(await p.isVisible('#pix-pay'), 'tela do Pix não apareceu');
  await p.click('#pix-done');
}
test('abrePerfil', async b => {
  const p = await open(b); await enter(p);
  await p.click('.post[data-id="p3"] [data-open-creator]');
  assert((await view(p)) === 'creator', 'não abriu perfil');
  assert(await p.locator('.plan').count() === 2, 'Bia deveria ter 2 planos');
  assert(await p.locator('.grade .locked-thumb').count() > 0, 'grade sem exclusivos bloqueados');
});
test('fluxoAssinar', async b => {
  const p = await open(b); await enter(p);
  await assinar(p, 'bia', 'bia-noite');
  assert(await p.isVisible('#toast'), 'sem toast');
  assert(await p.locator('.grade .locked-thumb').count() === 0, 'grade continua bloqueada');
  await p.click('nav#tabs button[data-view="home"]');
  assert(await p.locator('.post[data-id="p3"] .locked').count() === 0, 'feed continua bloqueado');
});
test('assinarDuasVezes', async b => {
  const p = await open(b); await enter(p);
  await assinar(p, 'bia', 'bia-noite');
  await p.evaluate(() => T.subscribe('bia', 'bia-noite'));
  await p.click('nav#tabs button[data-view="subs"]');
  assert(await p.locator('.sub-item[data-creator="bia"]').count() === 1, 'assinatura duplicada');
});
test('minhasAssinaturas', async b => {
  const p = await open(b); await enter(p);
  await assinar(p, 'luna', 'luna-vip');
  await p.click('nav#tabs button[data-view="subs"]');
  const item = p.locator('.sub-item[data-creator="luna"]');
  const txt = (await item.innerText()).replace(/\u00a0/g, ' ');
  assert(txt.includes('VIP'), 'sem nome do plano');
  assert(txt.includes('R$ 49,90'), 'sem valor: ' + txt);
  const d = new Date(); d.setDate(d.getDate() + 30);
  const esperado = d.toLocaleDateString('pt-BR');
  assert(txt.includes(esperado), `sem renovação ${esperado}: ` + txt);
});


// ---------- Task 5 ----------
async function postar(p, texto, { exclusive = false } = {}) {
  await p.click('nav#tabs button[data-view="post"]');
  await p.click('#post-type button[data-type="text"]');
  await p.fill('#post-text', texto);
  if (exclusive) await p.check('#post-exclusive');
  await p.click('#post-publish');
}
test('publicaTexto', async b => {
  const p = await open(b); await enter(p);
  await postar(p, 'Meu primeiro post na Trip');
  assert((await view(p)) === 'home', 'não voltou ao feed');
  const first = p.locator('.feed .post').first();
  assert((await first.innerText()).includes('Meu primeiro post na Trip'), 'post não está no topo');
});
test('publicaExclusivo', async b => {
  const p = await open(b); await enter(p);
  await postar(p, 'Só pra quem assina', { exclusive: true });
  const first = p.locator('.feed .post').first();
  assert(await first.locator('.tag.assin').count() === 1, 'sem selo Assinantes');
});
for (const proibido of ['CRIANÇA', 'menor de idade', 'Menor De Idade', 'tenho 15 anos', 'novinha']) {
  test('bloqueiaProibido: ' + proibido, async b => {
    const p = await open(b); await enter(p);
    const n0 = await p.evaluate(() => T.state.myPosts.length);
    await postar(p, 'olha isso ' + proibido + ' hoje');
    assert(await p.isVisible('#post-blocked'), 'sem aviso de bloqueio');
    assert((await p.innerText('#post-blocked')).toLowerCase().includes('perfil em revisão'), 'aviso sem "perfil em revisão"');
    assert((await p.evaluate(() => T.state.myPosts.length)) === n0, 'publicou mesmo assim');
  });
}
test('naoBloqueiaNormal', async b => {
  const p = await open(b); await enter(p);
  for (const ok of ['18 anos de carreira', 'comemorando 25 anos']) {
    const r = await p.evaluate(t => T.isBlocked(t), ok);
    assert(!r.blocked, 'bloqueou indevidamente: ' + ok);
  }
});
test('estimativa', async b => {
  const p = await open(b);
  const r = await p.evaluate(() => T.boostEstimate(10, 3));
  assert(r.total === 30 && r.min === 1800 && r.max === 4200, 'estimativa errada: ' + JSON.stringify(r));
});
test('impulsionarInvalido', async b => {
  const p = await open(b); await enter(p);
  await postar(p, 'Post para impulsionar');
  await p.locator('.feed .post').first().locator('.boost-btn').click();
  for (const v of ['', '0', '-5', '4']) {
    await p.fill('#boost-day', v); await p.fill('#boost-days', '3');
    assert(await p.isDisabled('#boost-pay'), 'pagar habilitado com valor ' + JSON.stringify(v));
  }
  await p.fill('#boost-day', '10'); await p.fill('#boost-days', '0');
  assert(await p.isDisabled('#boost-pay'), 'pagar habilitado com 0 dias');
});
test('impulsionarOk', async b => {
  const p = await open(b); await enter(p);
  await postar(p, 'Post para impulsionar');
  await p.locator('.feed .post').first().locator('.boost-btn').click();
  await p.fill('#boost-day', '10'); await p.fill('#boost-days', '3');
  assert((await p.innerText('#boost-est')).replace(/ /g, ' ').includes('1.800'), 'estimativa não aparece');
  await p.click('#boost-pay');
  await p.click('#pix-done');
  const first = p.locator('.feed .post').first();
  assert((await first.locator('.tag').allInnerTexts()).includes('Impulsionado'), 'sem selo Impulsionado');
});


// ---------- Task 6 ----------
const nb = s => s.replace(/ /g, ' ');
test('alternaCriador', async b => {
  const p = await open(b); await enter(p);
  await p.click('nav#tabs button[data-view="me"]');
  assert(!(await p.isVisible('#dash')), 'painel visível antes de virar criador');
  await p.click('#toggle-creator');
  assert(await p.isVisible('#dash'), 'painel não apareceu');
  await p.click('#toggle-creator');
  assert(!(await p.isVisible('#dash')), 'painel não sumiu');
});
test('painelTaxa', async b => {
  const p = await open(b); await enter(p);
  await p.click('nav#tabs button[data-view="me"]');
  await p.click('#toggle-creator');
  assert(nb(await p.innerText('#dash-gross')).includes('R$ 4.800,00'), 'bruto errado');
  assert(nb(await p.innerText('#dash-fee')).includes('R$ 480,00'), 'taxa errada');
  assert(nb(await p.innerText('#dash-net')).includes('R$ 4.320,00'), 'líquido errado');
  assert(nb(await p.innerText('#dash')).includes('No OnlyFans você ficaria com R$ 3.840,00'), 'sem comparação');
});
test('criaPlano', async b => {
  const p = await open(b); await enter(p);
  await p.click('nav#tabs button[data-view="me"]');
  await p.click('#toggle-creator');
  await p.click('#plan-add');
  await p.fill('#plan-name', 'Ouro');
  await p.fill('#plan-price', '39,90');
  await p.click('#plan-save');
  assert(nb(await p.innerText('#dash')).includes('Ouro'), 'plano não aparece no painel');
  await p.evaluate(() => T.go('creator', 'me'));
  assert(nb(await p.innerText('#view')).includes('R$ 39,90'), 'plano não aparece no perfil público');
});
test('denunciar', async b => {
  const p = await open(b); await enter(p);
  await p.click('.post[data-id="p5"] .report-btn');
  await p.click('.report-reason[data-reason="menor"]');
  await p.click('#report-send');
  assert((await p.innerText('#sheet')).includes('Recebemos. O post foi ocultado enquanto analisamos.'), 'sem confirmação');
  await p.evaluate(() => T.closeSheet());
  assert(await p.locator('.post[data-id="p5"]').count() === 0, 'post não sumiu do feed');
});


// ---------- Revisão final ----------
async function criarPlano(p, nome, preco) {
  await p.click('nav#tabs button[data-view="me"]');
  if (!(await p.isChecked('#toggle-creator'))) await p.click('#toggle-creator');
  await p.click('#plan-add'); await p.fill('#plan-name', nome); await p.fill('#plan-price', preco); await p.click('#plan-save');
}
test('planoPrecoComPonto', async b => {
  const p = await open(b); await enter(p);
  await criarPlano(p, 'A', '9.90');
  await criarPlano(p, 'B', '19.90');
  await criarPlano(p, 'C', '29,90');
  const prices = await p.evaluate(() => T.state.myPlans.map(x => x.price));
  assert(JSON.stringify(prices) === '[9.9,19.9,29.9]', 'preços errados: ' + prices);
});
test('naoBloqueiaInocente', async b => {
  const p = await open(b);
  for (const ok of ['10 anos de carreira', 'Moro aqui há 3 anos', 'Torpedo de chocolate', '3 anos de canal', 'depois de 2 anos de namoro'])
    assert(!(await p.evaluate(t => T.isBlocked(t), ok)).blocked, 'bloqueou indevidamente: ' + ok);
  for (const bad of ['tenho 15 anos', 'ela tem 12 anos', 'garota de 16 anos', 'com 14 anos', 'pedofilia'])
    assert((await p.evaluate(t => T.isBlocked(t), bad)).blocked, 'deixou passar: ' + bad);
});
test('planoNomeLongo360', async b => {
  const p = await open(b, { width: 360 }); await enter(p);
  await criarPlano(p, 'X'.repeat(30), '10,00');
  await p.evaluate(() => T.go('creator', 'me'));
  const r = await p.evaluate(() => {
    const v = document.getElementById('view'), pr = document.querySelector('.plan .preco').getBoundingClientRect();
    return { sw: v.scrollWidth, right: pr.right, vw: v.clientWidth };
  });
  assert(r.sw <= 360 && r.right <= r.vw, 'plano estourou: ' + JSON.stringify(r));
});


// ---------- Mensagens ----------
async function abrirChat(p, c) { await p.click('#open-inbox'); await p.click(`.chat-item[data-creator="${c}"]`); }
test('inboxAbre', async b => {
  const p = await open(b); await enter(p);
  await p.click('#open-inbox');
  assert((await view(p)) === 'inbox', 'não abriu mensagens');
  assert(await p.locator('.chat-item').count() >= 3, 'poucas conversas');
});
test('enviaMensagem', async b => {
  const p = await open(b); await enter(p);
  await abrirChat(p, 'caio');
  const them0 = await p.locator('.msg.them').count();
  await p.fill('#chat-input', 'Oi Caio, quanto custa o Pro?');
  await p.click('#chat-send');
  assert((await p.locator('.msg.me').last().innerText()).includes('quanto custa o Pro'), 'mensagem não apareceu');
  await p.waitForFunction(n => document.querySelectorAll('.msg.them').length > n, them0, { timeout: 4000 });
});
test('mensagemProibida', async b => {
  const p = await open(b); await enter(p);
  await abrirChat(p, 'caio');
  const me0 = await p.locator('.msg.me').count();
  await p.fill('#chat-input', 'tenho 15 anos');
  await p.click('#chat-send');
  assert(await p.isVisible('#chat-blocked'), 'sem aviso de bloqueio');
  assert(await p.locator('.msg.me').count() === me0, 'enviou mesmo assim');
});
test('ppvDesbloqueia', async b => {
  const p = await open(b); await enter(p);
  await abrirChat(p, 'luna');
  const ppv = p.locator('.ppv').first();
  assert(await ppv.locator('.locked-msg').count() === 1, 'mensagem paga não está bloqueada');
  await ppv.locator('.ppv-unlock').click();
  await p.click('#pix-done');
  assert(await p.locator('.ppv').first().locator('.locked-msg').count() === 0, 'não desbloqueou');
});
test('chatSoAssinante', async b => {
  const p = await open(b); await enter(p);
  await abrirChat(p, 'bia');
  assert(await p.isVisible('#chat-locked'), 'chat da Bia deveria estar travado');
  assert(await p.locator('#chat-input').count() === 0, 'campo de mensagem visível');
  await p.evaluate(() => { T.subscribe('bia', 'bia-noite'); T.refresh(); });
  assert(await p.isVisible('#chat-locked'), 'plano Noite não libera chat');
  await p.evaluate(() => { T.subscribe('bia', 'bia-mais'); T.refresh(); });
  assert(await p.locator('#chat-input').count() === 1, 'Noite+ deveria liberar chat');
});
test('perfilMensagem', async b => {
  const p = await open(b); await enter(p);
  await p.evaluate(() => T.go('creator', 'duda'));
  await p.click('#msg-btn');
  assert((await view(p)) === 'chat', 'não abriu conversa');
});


// ---------- Visual novo: filtros do feed ----------
test('filtroQuemEuAssino', async b => {
  const p = await open(b); await enter(p);
  await p.click('.filtros [data-filter="assinando"]');
  assert(await p.locator('.feed .post').count() === 0, 'deveria estar vazio sem assinaturas');
  await p.evaluate(() => { T.subscribe('bia', 'bia-noite'); T.refresh(); });
  const ids = await p.$$eval('.feed .post', ps => ps.map(x => x.dataset.id));
  assert(ids.length === 3 && ids.every(i => ['p3', 'p8', 'p10'].includes(i)), 'filtro errado: ' + ids);
});
test('filtroEmAlta', async b => {
  const p = await open(b); await enter(p);
  await p.click('.filtros [data-filter="em-alta"]');
  const first = await p.locator('.feed .post').first().getAttribute('data-id');
  assert(first === 'p10', 'mais curtido deveria vir primeiro: ' + first);
});


// ---------- Explorar ----------
test('exploreBusca', async b => {
  const p = await open(b); await enter(p);
  await p.click('#open-explore');
  assert((await view(p)) === 'explore', 'não abriu Explorar');
  await p.fill('#explore-q', 'culin');
  const ids = await p.$$eval('.creator-card', cs => cs.map(c => c.dataset.creator));
  assert(ids.length === 1 && ids[0] === 'rafa', 'busca errada: ' + ids);
});
test('exploreCategoria', async b => {
  const p = await open(b); await enter(p);
  await p.click('#open-explore');
  await p.click('.cat[data-cat="Fitness"]');
  const ids = await p.$$eval('.resultados .creator-card', cs => cs.map(c => c.dataset.creator));
  assert(ids.length >= 2 && ids.includes('caio') && !ids.includes('bia'), 'categoria errada: ' + ids);
});
// ---------- +18 ----------
test('esconderAdulto', async b => {
  const p = await open(b); await enter(p);
  await p.click('nav#tabs button[data-view="me"]');
  await p.click('#toggle-adult');
  await p.click('nav#tabs button[data-view="home"]');
  const ids = await p.$$eval('.feed .post', ps => ps.map(x => x.dataset.id));
  assert(!ids.some(i => ['p1', 'p3', 'p6', 'p8', 'p10', 'p12'].includes(i)), 'feed mostra adulto: ' + ids);
  assert(await p.locator('.story[data-id="bia"]').count() === 0, 'story adulto visível');
  await p.click('#open-explore');
  assert(await p.locator('.creator-card[data-creator="bia"]').count() === 0, 'explorar mostra adulto');
  assert(await p.locator('.cat[data-cat="+18"]').count() === 0, 'categoria +18 visível');
  await p.click('nav#tabs button[data-view="videos"]');
  const reels = await p.$$eval('.reel', rs => rs.map(r => r.dataset.id));
  assert(!reels.includes('r3') && !reels.includes('r5'), 'vídeos adultos: ' + reels);
});
// ---------- Gorjeta ----------
test('gorjetaPost', async b => {
  const p = await open(b); await enter(p);
  await p.click('.post[data-id="p5"] .tip-btn');
  await p.click('.tip-amt[data-v="10"]');
  await p.click('#tip-send');
  await p.click('#pix-done');
  assert(nb(await p.innerText('#toast')).includes('Gorjeta de R$ 10,00'), 'sem confirmação da gorjeta');
});
test('gorjetaInvalida', async b => {
  const p = await open(b); await enter(p);
  await p.click('.post[data-id="p5"] .tip-btn');
  await p.fill('#tip-other', '1');
  assert(await p.isDisabled('#tip-send'), 'gorjeta de R$ 1 permitida');
  await p.fill('#tip-other', '');
  assert(await p.isDisabled('#tip-send'), 'gorjeta vazia permitida');
});
test('gorjetaChat', async b => {
  const p = await open(b); await enter(p);
  await abrirChat(p, 'caio');
  await p.click('#chat-tip');
  await p.click('.tip-amt[data-v="20"]');
  await p.click('#tip-send');
  await p.click('#pix-done');
  assert(nb(await p.locator('.msg.me').last().innerText()).includes('Gorjeta de R$ 20,00'), 'gorjeta não apareceu na conversa');
});
// ---------- Verificação e carteira ----------
async function virarCriador(p) {
  await p.click('nav#tabs button[data-view="me"]');
  if (!(await p.isChecked('#toggle-creator'))) await p.click('#toggle-creator');
}
async function verificar(p, nasc = '1995-05-10') {
  await p.click('#verify-start');
  await p.fill('#v-name', 'Fulana de Tal'); await p.fill('#v-cpf', '123.456.789-09'); await p.fill('#v-birth', nasc);
  await p.click('#v-next');
}
test('saqueExigeVerificacao', async b => {
  const p = await open(b); await enter(p); await virarCriador(p);
  assert(await p.isVisible('#wallet'), 'sem carteira');
  assert(await p.isDisabled('#withdraw'), 'saque liberado sem verificação');
});
test('verificacaoMenor', async b => {
  const p = await open(b); await enter(p); await virarCriador(p);
  await verificar(p, '2010-01-01');
  assert(await p.isVisible('#v-erro'), 'sem erro de idade');
  assert((await p.innerText('#v-erro')).includes('18'), 'erro não fala de 18 anos');
});
test('verificacaoCompleta', async b => {
  const p = await open(b); await enter(p); await virarCriador(p);
  await verificar(p);
  await p.click('#v-doc'); await p.click('#v-next');
  await p.click('#v-selfie'); await p.click('#v-next');
  await p.check('#v-consent'); await p.click('#v-finish');
  assert(await p.isVisible('#verified'), 'sem selo de verificado');
  assert(!(await p.isDisabled('#withdraw')), 'saque continua bloqueado');
});
test('saque', async b => {
  const p = await open(b); await enter(p); await virarCriador(p);
  await p.evaluate(() => { T.state.verified = true; T.refresh(); });
  await p.click('#withdraw');
  await p.fill('#withdraw-key', 'fulana@exemplo.com');
  await p.fill('#withdraw-amount', '99999');
  assert(await p.isDisabled('#withdraw-confirm'), 'saque acima do saldo permitido');
  await p.fill('#withdraw-amount', '1000');
  await p.click('#withdraw-confirm');
  assert(nb(await p.innerText('#wallet-available')).includes('R$ 2.120,00'), 'saldo não diminuiu');
  assert(await p.locator('.saque-item').count() === 1, 'sem histórico do saque');
});
// ---------- Comentários, notificações, seguir ----------
test('comentar', async b => {
  const p = await open(b); await enter(p);
  await p.click('.post[data-id="p5"] .comment-btn');
  await p.fill('#comment-input', 'Que delícia, vou fazer!');
  await p.click('#comment-send');
  assert((await p.locator('.comment').last().innerText()).includes('Que delícia'), 'comentário não apareceu');
  await p.evaluate(() => T.closeSheet());
  assert((await p.innerText('.post[data-id="p5"] .comment-btn')).includes('53'), 'contador não subiu');
});
test('comentarProibido', async b => {
  const p = await open(b); await enter(p);
  await p.click('.post[data-id="p5"] .comment-btn');
  const n = await p.locator('.comment').count();
  await p.fill('#comment-input', 'que novinha');
  await p.click('#comment-send');
  assert(await p.isVisible('#comment-blocked'), 'sem bloqueio');
  assert(await p.locator('.comment').count() === n, 'comentou mesmo assim');
});
test('notificacoes', async b => {
  const p = await open(b); await enter(p);
  await p.click('#open-notifs');
  assert((await view(p)) === 'notifs', 'não abriu notificações');
  assert(await p.locator('.notif').count() >= 3, 'poucas notificações');
  await p.click('nav#tabs button[data-view="home"]');
  assert(await p.locator('#open-notifs .badge').count() === 0, 'contador não zerou');
});
test('seguir', async b => {
  const p = await open(b); await enter(p);
  await p.evaluate(() => T.go('creator', 'duda'));
  await p.click('#seguir');
  assert((await p.innerText('#seguir')).includes('Seguindo'), 'não mudou para Seguindo');
  await p.evaluate(() => { T.go('home'); T.go('creator', 'duda'); });
  assert((await p.innerText('#seguir')).includes('Seguindo'), 'não lembrou');
});


// ---------- Lives ----------
test('liveAbre', async b => {
  const p = await open(b); await enter(p);
  await p.click('.live-entry[data-creator="duda"]');
  assert((await view(p)) === 'live', 'não abriu a live');
  await p.waitForFunction(() => document.querySelectorAll('.live-msg').length >= 2, null, { timeout: 5000 });
  await p.fill('#live-input', 'Pinta de azul!');
  await p.click('#live-send');
  assert((await p.locator('.live-msg.me').last().innerText()).includes('Pinta de azul'), 'comentário não apareceu');
});
test('liveGorjeta', async b => {
  const p = await open(b); await enter(p);
  await p.click('.live-entry[data-creator="duda"]');
  await p.click('#live-tip'); await p.click('.tip-amt[data-v="5"]'); await p.click('#tip-send'); await p.click('#pix-done');
  assert(nb(await p.locator('.live-msg.me').last().innerText()).includes('R$ 5,00'), 'gorjeta não apareceu na live');
});
test('liveComentarioProibido', async b => {
  const p = await open(b); await enter(p);
  await p.click('.live-entry[data-creator="duda"]');
  await p.fill('#live-input', 'cadê a novinha');
  await p.click('#live-send');
  assert(await p.locator('.live-msg.me').count() === 0, 'enviou comentário proibido');
  assert(await p.isVisible('#live-blocked'), 'sem aviso');
});
test('liveCriador', async b => {
  const p = await open(b); await enter(p); await virarCriador(p);
  await p.click('#live-start');
  assert((await view(p)) === 'live', 'não iniciou live');
  await p.click('#live-end');
  assert(await p.isVisible('#live-summary'), 'sem resumo da live');
});
// ---------- Moderação ----------
test('modFila', async b => {
  const p = await open(b); await enter(p);
  await p.click('nav#tabs button[data-view="me"]'); await p.click('#open-mod');
  assert((await view(p)) === 'mod', 'não abriu moderação');
  assert(await p.locator('.case').count() >= 3, 'fila curta');
  assert((await p.locator('.case').first().getAttribute('data-reason')) === 'menor', 'menor não está no topo');
});
async function denunciar(p, id, motivo) {
  await p.click(`.post[data-id="${id}"] .report-btn`); await p.click(`.report-reason[data-reason="${motivo}"]`); await p.click('#report-send'); await p.evaluate(() => T.closeSheet());
}
test('modManter', async b => {
  const p = await open(b); await enter(p);
  await denunciar(p, 'p5', 'spam');
  await p.evaluate(() => T.go('mod'));
  await p.click('.case[data-id="p5"] .mod-keep');
  await p.click('nav#tabs button[data-view="home"]');
  assert(await p.locator('.post[data-id="p5"]').count() === 1, 'post não voltou');
});
test('modBorrar', async b => {
  const p = await open(b); await enter(p);
  await denunciar(p, 'p5', 'violencia');
  await p.evaluate(() => T.go('mod'));
  await p.click('.case[data-id="p5"] .mod-blur');
  await p.click('nav#tabs button[data-view="home"]');
  assert(await p.locator('.post[data-id="p5"] .blur').count() === 1, 'post não voltou borrado');
});
test('modRemover', async b => {
  const p = await open(b); await enter(p);
  await p.evaluate(() => T.go('mod'));
  const n = await p.locator('.case').count();
  await p.locator('.case').first().locator('.mod-remove').click();
  assert(await p.locator('.case').count() === n - 1, 'caso não saiu da fila');
  assert((await p.innerText('#toast')).includes('suspenso'), 'sem aviso de suspensão');
});
// ---------- Agendar ----------
const amanha = () => { const d = new Date(Date.now() + 864e5); d.setSeconds(0, 0); const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; };
test('agendar', async b => {
  const p = await open(b); await enter(p);
  await p.click('nav#tabs button[data-view="post"]');
  await p.click('#post-type button[data-type="text"]');
  await p.fill('#post-text', 'Post agendado da Trip');
  await p.check('#post-schedule');
  await p.fill('#post-when', amanha());
  await p.click('#post-publish');
  assert((await view(p)) === 'me', 'deveria ir para o perfil');
  await p.click('nav#tabs button[data-view="home"]');
  assert(!(await p.locator('.feed .post').first().innerText()).includes('Post agendado'), 'publicou na hora');
  await p.click('nav#tabs button[data-view="me"]');
  assert(await p.locator('.agendado').count() === 1, 'não aparece em agendados');
  await p.click('.agendado .ag-now');
  await p.click('nav#tabs button[data-view="home"]');
  assert((await p.locator('.feed .post').first().innerText()).includes('Post agendado'), 'publicar agora falhou');
});
test('agendarPassado', async b => {
  const p = await open(b); await enter(p);
  await p.click('nav#tabs button[data-view="post"]');
  await p.click('#post-type button[data-type="text"]');
  await p.fill('#post-text', 'teste');
  await p.check('#post-schedule');
  await p.fill('#post-when', '2020-01-01T10:00');
  await p.click('#post-publish');
  assert((await p.innerText('#post-blocked')).includes('futuro'), 'aceitou data no passado');
});
// ---------- Mensagem em massa ----------
test('massaEnvia', async b => {
  const p = await open(b); await enter(p); await virarCriador(p);
  await p.click('#mass-open');
  await p.fill('#mass-text', 'Ensaio novo só pra vocês');
  await p.check('#mass-paid'); await p.fill('#mass-price', '15');
  await p.click('#mass-send');
  const item = p.locator('.mass-item');
  assert(await item.count() === 1, 'sem histórico');
  assert(nb(await item.innerText()).includes('R$ 15,00'), 'sem preço no histórico');
});
test('massaPrecoInvalido', async b => {
  const p = await open(b); await enter(p); await virarCriador(p);
  await p.click('#mass-open');
  await p.fill('#mass-text', 'oi');
  await p.check('#mass-paid'); await p.fill('#mass-price', '0');
  assert(await p.isDisabled('#mass-send'), 'aceitou preço zero');
});

// ---------- runner ----------
const filter = process.argv[2];
const browser = await chromium.launch();
let fail = 0;
for (const t of tests) {
  if (filter && !t.name.includes(filter)) continue;
  try { await t.fn(browser); console.log('ok  ', t.name); }
  catch (e) { fail++; console.log('FAIL', t.name, '-', e.message.split('\n')[0]); }
}
await browser.close();
console.log(fail ? `${fail} falharam` : 'todos ok');
process.exit(fail ? 1 : 0);
