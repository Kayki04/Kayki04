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
