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
