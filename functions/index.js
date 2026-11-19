/* Avisos no celular da Gatecão.
   Quando a loja manda uma mensagem ao cliente (inbox), quando chega um pedido
   ou um agendamento, este servidor envia o aviso para o celular, mesmo com o app fechado. */
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 5, memory: '256MiB' });
const db = admin.firestore();
const SITE = 'https://gatecao.com.br';
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


/* ---------- Mercado Pago: pagamento online (Pix e cartão) ---------- */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const MP_TOKEN = defineSecret('MP_ACCESS_TOKEN');
const FN_BASE = 'https://southamerica-east1-gatecao-5acbc.cloudfunctions.net';

async function mpApi(path, method, body, token) {
  const r = await fetch('https://api.mercadopago.com' + path, {
    method,
    headers: Object.assign({ Authorization: 'Bearer ' + token },
      method === 'POST' ? { 'Content-Type': 'application/json', 'X-Idempotency-Key': String(Date.now()) + '-' + Math.random().toString(36).slice(2) } : {}),
    body: body ? JSON.stringify(body) : undefined
  });
  let j = null; try { j = await r.json(); } catch (e) {}
  return { ok: r.ok, status: r.status, j };
}

// Cria o pagamento (Pix com QR, ou cartão via Checkout Pro). Só o dono do pedido chama.
exports.mpCreate = onRequest({ secrets: [MP_TOKEN], cors: true, region: 'southamerica-east1' }, async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'metodo' }); return; }
  try {
    const token = MP_TOKEN.value();
    if (!token || token === 'disabled') { res.status(503).json({ error: 'nao_configurado' }); return; }
    const authH = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    let uid = null; try { uid = (await admin.auth().verifyIdToken(authH)).uid; } catch (e) {}
    if (!uid) { res.status(401).json({ error: 'auth' }); return; }
    const body = req.body || {};
    const orderId = String(body.orderId || '').slice(0, 40);
    const total = Math.round(Number(body.total) * 100) / 100;
    const method = body.method === 'card' ? 'card' : 'pix';
    if (!orderId || !(total > 0)) { res.status(400).json({ error: 'dados' }); return; }
    const os = await db.doc('orders/' + uid).get();
    const ord = os.exists && os.data().o && os.data().o[orderId];
    if (!ord) { res.status(404).json({ error: 'pedido' }); return; }
    const extRef = uid + '::' + orderId;
    const notification_url = FN_BASE + '/mpHook';
    if (method === 'pix') {
      const payer = { email: (body.email || '').slice(0, 80) || ('cliente.' + uid.slice(0, 10) + '@gatecao.com.br'), first_name: (body.name || 'Cliente').slice(0, 40) };
      const { ok, j } = await mpApi('/v1/payments', 'POST', {
        transaction_amount: total, description: 'Pedido Gatecao ' + orderId, payment_method_id: 'pix',
        external_reference: extRef, notification_url, payer
      }, token);
      if (!ok || !j || !j.id) { res.status(502).json({ error: 'mp' }); return; }
      const tx = (j.point_of_interaction && j.point_of_interaction.transaction_data) || {};
      await db.doc('pay/' + j.id).set({ uid, orderId, status: j.status, method: 'pix', amount: total, ts: Date.now() });
      res.json({ ok: true, id: String(j.id), method: 'pix', status: j.status, qr: tx.qr_code || '', qr_base64: tx.qr_code_base64 || '', ticket: tx.ticket_url || '' });
      return;
    }
    const { ok, j } = await mpApi('/checkout/preferences', 'POST', {
      items: [{ title: 'Pedido Gatecao ' + orderId, quantity: 1, currency_id: 'BRL', unit_price: total }],
      external_reference: extRef, notification_url,
      back_urls: { success: 'https://gatecao.com.br/#pedidos', pending: 'https://gatecao.com.br/#pedidos', failure: 'https://gatecao.com.br/#pedidos' },
      auto_return: 'approved', payment_methods: { excluded_payment_types: [{ id: 'ticket' }] }
    }, token);
    if (!ok || !j || !j.init_point) { res.status(502).json({ error: 'mp' }); return; }
    await db.doc('pay/pref_' + j.id).set({ uid, orderId, status: 'init', method: 'card', amount: total, ts: Date.now() });
    res.json({ ok: true, id: String(j.id), method: 'card', init_point: j.init_point });
  } catch (e) { res.status(500).json({ error: 'erro' }); }
});

// Webhook do Mercado Pago: confirma o pagamento e marca o pedido como pago.
exports.mpHook = onRequest({ secrets: [MP_TOKEN], region: 'southamerica-east1' }, async (req, res) => {
  res.status(200).send('ok');
  try {
    const token = MP_TOKEN.value(); if (!token || token === 'disabled') return;
    const q = req.query || {}, b = req.body || {};
    const type = q.type || q.topic || b.type || '';
    const id = q['data.id'] || q.id || (b.data && b.data.id) || b.id;
    if (!id) return;
    if (type && String(type).indexOf('payment') < 0) return;
    const { ok, j } = await mpApi('/v1/payments/' + id, 'GET', null, token);
    if (!ok || !j) return;
    const parts = String(j.external_reference || '').split('::');
    const uid = parts[0], orderId = parts[1];
    if (!uid || !orderId) return;
    await db.doc('pay/' + j.id).set({ uid, orderId, status: j.status, method: j.payment_type_id || '', amount: j.transaction_amount || 0, ts: Date.now() }, { merge: true });
    if (j.status !== 'approved') return;
    const oref = db.doc('orders/' + uid);
    const osnap = await oref.get(); if (!osnap.exists) return;
    const data = osnap.data(); const o = (data.o || {})[orderId]; if (!o || o.paid) return;
    o.paid = true; o.paidAt = Date.now(); o.payMethod = j.payment_type_id || 'mp'; o.mpId = String(j.id);
    const no = Object.assign({}, data.o); no[orderId] = o;
    await oref.set(Object.assign({}, data, { o: no }));
    try { const ad0 = await adminUids(); await send(ad0, 'Pagamento recebido · ' + (o.name || 'Cliente'), brl(o.total) + ' · ' + (j.payment_type_id === 'pix' ? 'Pix' : 'Cartão') + ' · pedido ' + String(orderId).slice(-5), 'gestao', 'gc-pay-' + orderId); } catch (e) {}
    try { const iref = db.doc('inbox/' + uid); const iss = await iref.get(); const m = (iss.exists && iss.data().m) || {}; const nid = 'n' + Date.now(); m[nid] = { id: nid, ts: Date.now(), title: 'Pagamento confirmado', body: 'Recebemos seu pagamento de ' + brl(o.total) + '. Já estamos cuidando do seu pedido!', kind: 'pedido' }; await iref.set({ m }); } catch (e) {}
  } catch (e) {}
});
