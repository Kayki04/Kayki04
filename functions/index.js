/* Avisos no celular da Gatecão.
   Quando a loja manda uma mensagem ao cliente (inbox), quando chega um pedido
   ou um agendamento, este servidor envia o aviso para o celular, mesmo com o app fechado. */
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 5, memory: '256MiB' });
const db = admin.firestore();
const SITE = 'https://gatecao-5acbc.web.app';
const brl = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

async function tokensOf(uids) {
  const out = [];
  for (const uid of [...new Set(uids)].filter(Boolean)) {
    const s = await db.doc('pushTokens/' + uid).get();
    const t = (s.exists && s.data().t) || {};
    Object.keys(t).forEach(k => out.push({ uid, token: k, origin: t[k].origin || SITE }));
  }
  return out;
}
async function adminUids() {
  const s = await db.doc('admins/list').get();
  return (s.exists && s.data().uids) || [];
}
async function send(uids, title, body, path, tag) {
  const list = await tokensOf(uids);
  if (!list.length) return;
  const msgs = list.map(t => ({
    token: t.token,
    notification: { title: String(title).slice(0, 80), body: String(body).slice(0, 240) },
    webpush: {
      notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: tag || undefined, renotify: true },
      fcmOptions: { link: t.origin + '/' + (path ? '#' + path : '') }
    }
  }));
  const r = await admin.messaging().sendEach(msgs);
  const dead = [];
  r.responses.forEach((x, i) => {
    const c = x.error && x.error.code;
    if (!x.success && /registration-token-not-registered|invalid-registration-token|invalid-argument/.test(c || '')) dead.push(list[i]);
  });
  for (const d of dead) await db.doc('pushTokens/' + d.uid).update({ ['t.' + d.token]: admin.firestore.FieldValue.delete() }).catch(() => {});
}

// Mensagens da loja para o cliente (pedido saiu, pet pronto, ração acabando, cupons...)
exports.avisoCliente = onDocumentWritten('inbox/{uid}', async ev => {
  const b = ev.data.before.exists ? ev.data.before.data().m || {} : {};
  const a = ev.data.after.exists ? ev.data.after.data().m || {} : {};
  const novos = Object.keys(a).filter(k => !b[k]).map(k => a[k]).sort((x, y) => y.ts - x.ts);
  if (!novos.length || (!ev.data.before.exists && novos.length > 1)) return; // importação: não avisar
  if (Date.now() - (novos[0].ts || 0) > 3600e3) return;
  const n = novos[0], path = n.kind === 'racao' ? 'pet' : n.kind === 'oferta' ? 'loja' : 'pedidos';
  await send([ev.params.uid], n.title, n.body, path, 'gc-' + n.title);
});

// Pedido novo ou pedido de plano: avisa a loja
exports.avisoLojaPedido = onDocumentWritten('orders/{uid}', async ev => {
  const bd = ev.data.before.exists ? ev.data.before.data() : {}, ad = ev.data.after.exists ? ev.data.after.data() : {};
  const b = bd.o || {}, a = ad.o || {};
  const novos = Object.keys(a).filter(k => !b[k]).map(k => a[k]).filter(o => Date.now() - (o.ts || 0) < 3600e3);
  const ad0 = await adminUids();
  if (novos.length === 1) {
    const o = novos[0];
    await send(ad0, 'Novo pedido · ' + (o.name || 'Cliente'), (o.items || []).map(i => i.q + ' x ' + i.n).join(', ').slice(0, 160) + ' · ' + brl(o.total) + ' · ' + (o.mode || ''), 'gestao', 'gc-ped-' + o.id);
  }
  if (ad.pl && (!bd.pl || bd.pl.ts !== ad.pl.ts) && Date.now() - (ad.pl.ts || 0) < 3600e3) {
    await send(ad0, 'Pedido de plano · ' + (ad.pl.name0 || 'Cliente'), ad.pl.name + ' · ' + brl(ad.pl.price) + '/mês. Confirme em Pedidos › Planos.', 'gestao', 'gc-plano-' + ev.params.uid);
  }
});

// Agendamento novo ou cancelado pelo cliente: avisa a loja
exports.avisoLojaAgenda = onDocumentWritten('appts/{uid}', async ev => {
  const b = ev.data.before.exists ? ev.data.before.data().a || {} : {};
  const a = ev.data.after.exists ? ev.data.after.data().a || {} : {};
  const ad0 = await adminUids();
  const novos = Object.keys(a).filter(k => !b[k]).map(k => a[k]).filter(x => Date.now() - (x.ts || 0) < 3600e3);
  if (novos.length === 1) {
    const x = novos[0];
    await send(ad0, 'Novo agendamento · ' + (x.pet || 'Pet'), String(x.svc || '') + ' · ' + String(x.day || '').split('-').reverse().slice(0, 2).join('/') + ' às ' + (x.slot || '') + (x.lt ? ' · leva e traz' : ''), 'gestao', 'gc-ag-' + x.id);
  }
  for (const k of Object.keys(a)) {
    if (a[k].canceled && b[k] && !b[k].canceled) {
      const x = a[k];
      await send(ad0, 'Agendamento cancelado · ' + (x.pet || 'Pet'), String(x.svc || '') + ' · ' + String(x.day || '').split('-').reverse().slice(0, 2).join('/') + ' às ' + (x.slot || '') + ' (cancelado pelo cliente)', 'gestao', 'gc-agc-' + x.id);
    }
  }
});

