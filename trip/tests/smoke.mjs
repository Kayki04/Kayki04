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
  await page.goto(URL_APP);
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
