/* Gatecão: ponte entre o app e o Firebase.
   O app foi feito para o runtime do Claude (window.claude.use). Este arquivo
   entrega as mesmas funções (db, user, assets, downloads) usando o Firebase,
   então o código do app continua igual nos dois lugares. */
(function(){
  'use strict';
  var CFG = self.GC_FIREBASE_CONFIG;
  firebase.initializeApp(CFG);
  var auth = firebase.auth();
  var fs = firebase.firestore();
  try { fs.settings({ ignoreUndefinedProperties: true, merge: true }); } catch (e) {}
  // Sem cache offline: evita snapshots marcados como "do cache" que deixam o caixa preso em "Sem resposta do banco ainda".
  auth.languageCode = 'pt';
  window.GCFB = { auth: auth, db: fs, logout: function(){ auth.signOut().then(function(){ location.reload(); }); } };
  window.GCFB.fnBase = 'https://southamerica-east1-gatecao-5acbc.cloudfunctions.net';
  window.GCFB.idToken = function(){ var u = auth.currentUser; return u ? u.getIdToken() : Promise.resolve(null); };

  /* ---------- avisos no celular (push) ---------- */
  function pushOk(){ try { return !!(firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported()) && 'serviceWorker' in navigator && 'Notification' in window; } catch (e) { return false; } }
  window.GCFB.pushSupported = pushOk;
  window.GCFB.isIOSBrowser = function(){ return /iPhone|iPad|iPod/.test(navigator.userAgent) && !(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)); };
  window.GCFB.enablePush = function(){
    var u = auth.currentUser; if (!u || !pushOk() || Notification.permission !== 'granted') return Promise.resolve(false);
    return navigator.serviceWorker.register('/sw.js').then(function(){ return navigator.serviceWorker.ready; }).then(function(reg){
      return firebase.messaging().getToken({ serviceWorkerRegistration: reg });
    }).then(function(tok){
      if (!tok) return false;
      var o = {}; o['t.' + tok] = { ts: Date.now(), origin: location.origin, ua: navigator.userAgent.slice(0, 120) };
      var ref = fs.doc('pushTokens/' + u.uid);
      return ref.update(o).catch(function(){ var t = {}; t[tok] = o['t.' + tok]; return ref.set({ t: t }); }).then(function(){ try { localStorage.setItem('gc_ptok', tok); } catch (e) {} return true; });
    }).catch(function(){ return false; });
  };
  window.GCFB.disablePush = function(){
    var u = auth.currentUser, tok = null; try { tok = localStorage.getItem('gc_ptok'); } catch (e) {}
    if (!u || !tok) return Promise.resolve();
    var o = {}; o['t.' + tok] = firebase.firestore.FieldValue.delete();
    return fs.doc('pushTokens/' + u.uid).update(o).catch(function(){}).then(function(){ try { return firebase.messaging().deleteToken(); } catch (e) {} });
  };
  // Token de push do app nativo (Capacitor): mesmo formato, origin 'app'.
  window.GCFB.saveNativeToken = function(tok, platform){
    var u = auth.currentUser; if (!u || !tok) return Promise.resolve(false);
    var o = {}; o['t.' + tok] = { ts: Date.now(), origin: 'app', platform: platform || 'app' };
    var ref = fs.doc('pushTokens/' + u.uid);
    return ref.update(o).catch(function(){ var t = {}; t[tok] = o['t.' + tok]; return ref.set({ t: t }); }).then(function(){ return true; }).catch(function(){ return false; });
  };

  /* ---------- tela de login ---------- */
  var css = '.gcl{position:fixed;inset:0;z-index:100;background:#fff;display:grid;place-items:center;padding:24px;font-family:"Nunito Sans",system-ui,sans-serif;color:#0B2A5B}' +
    '.gcl .box{width:100%;max-width:360px;display:grid;gap:14px;text-align:center}' +
    '.gcl img{height:64px;justify-self:center}' +
    '.gcl h1{font-family:Fredoka,system-ui,sans-serif;font-size:26px;margin:4px 0 0}' +
    '.gcl p{margin:0;color:#5E6F8E;font-size:15px}' +
    '.gcl button{border:0;border-radius:14px;padding:14px;font:inherit;font-weight:800;font-size:16px;cursor:pointer;display:flex;gap:10px;align-items:center;justify-content:center}' +
    '.gcl .g{background:#fff;border:2px solid #E3E9F3;color:#0B2A5B}' +
    '.gcl .o{background:#FF7A00;color:#0B2A5B;box-shadow:0 4px 0 #C75500}' +
    '.gcl .l{background:none;color:#5E6F8E;font-weight:700;font-size:14px;padding:6px}' +
    '.gcl input{border:2px solid #E3E9F3;border-radius:12px;padding:13px;font:inherit;font-size:17px;text-align:center;width:100%;box-sizing:border-box}' +
    '.gcl .err{color:#C2412D;font-weight:700;font-size:14px;min-height:1em}' +
    '.gcl small{color:#5E6F8E;font-size:12px}';
  var G_ICON = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  var el = null, recaptcha = null, confirmRes = null;
  function logoSrc(){ var i = document.querySelector('.logoimg'); return i ? i.src : ''; }
  var guestResolve = null, closable = false, ctxMsg = '';
  function isGuest(){ try { return localStorage.getItem('gc_guest') === '1'; } catch (e) { return false; } }
  function googleSignIn(){
    var p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    auth.signInWithPopup(p).catch(function(e){
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) return auth.signInWithRedirect(p);
      if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') showLogin('', 'Não foi possível entrar com Google. Tente de novo.');
    });
  }
  function ensureRecap(){
    if (recaptcha) return recaptcha;
    var c = document.getElementById('gcRecap');
    if (!c) { c = document.createElement('div'); c.id = 'gcRecap'; c.style.display = 'none'; document.body.appendChild(c); }
    recaptcha = new firebase.auth.RecaptchaVerifier('gcRecap', { size: 'invisible' });
    return recaptcha;
  }
  var cdT = null, cdLeft = 0, lastPhone = '';
  function updCd(){ var b = document.getElementById('gcResend'); if (!b) return; if (cdLeft > 0) { b.disabled = true; b.textContent = 'Reenviar código em ' + cdLeft + 's'; } else { b.disabled = false; b.textContent = 'Reenviar código por SMS'; } }
  function startCd(){ cdLeft = 60; updCd(); clearInterval(cdT); cdT = setInterval(function(){ cdLeft--; if (cdLeft <= 0) { clearInterval(cdT); cdT = null; } updCd(); }, 1000); }
  function phoneErrText(e){
    var c = (e && e.code) || '', m = String((e && e.message) || '');
    var t = c === 'auth/too-many-requests' ? 'Muitas tentativas com este número. Espere alguns minutos ou use o Google.' :
      c === 'auth/invalid-phone-number' ? 'Número inválido. Confira o DDD e o número.' :
      /region|BILLING_NOT_ENABLED|sms/i.test(m) ? 'O envio de SMS para o Brasil ainda não foi liberado nas configurações. Use o Google por enquanto.' :
      c === 'auth/operation-not-allowed' ? 'Login por celular ainda não foi ativado. Use o Google.' :
      /captcha|domain|app-check/i.test(c + m) ? 'Falha na verificação de segurança. Recarregue a página e tente de novo.' :
      'Não foi possível enviar o código. Tente de novo ou use o Google.';
    return t + (c ? ' (' + c.replace('auth/', '') + ')' : '');
  }
  function doSendCode(d, isResend){
    var btn = document.getElementById(isResend ? 'gcResend' : 'gcSend'); if (btn) btn.disabled = true;
    try { if (recaptcha) { recaptcha.clear(); recaptcha = null; } } catch (e) {}
    var r; try { r = ensureRecap(); } catch (e) {}
    auth.signInWithPhoneNumber('+55' + d, r).then(function(res){
      confirmRes = res; lastPhone = d;
      if (isResend) { var e2 = document.getElementById('gcErr'); if (e2) { e2.style.color = '#1D7F53'; e2.textContent = 'Enviamos um novo código.'; } startCd(); }
      else showLogin('code');
    }).catch(function(e){
      try { recaptcha && recaptcha.clear(); } catch (x) {} recaptcha = null;
      if (isResend) { var e3 = document.getElementById('gcErr'); if (e3) e3.textContent = phoneErrText(e); updCd(); }
      else showLogin('phone', phoneErrText(e));
    });
  }
  function showLogin(step, msg){
    if (!el) {
      var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      el = document.createElement('div'); el.className = 'gcl'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Entrar');
      document.body.appendChild(el);
    }
    var h = '<div class="box">' + (logoSrc() ? '<img src="' + logoSrc() + '" alt="Gatecão">' : '');
    if (step === 'phone') {
      h += '<h1>Entrar com celular</h1><p>Enviamos um código por SMS.</p>' +
        '<input id="gcPh" type="tel" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000">' +
        '<button class="o" id="gcSend">Receber código</button><div class="err" id="gcErr">' + (msg || '') + '</div>' +
        '<button class="g" id="gcGoogle2">' + G_ICON + 'Prefiro entrar com Google</button>' +
        '<button class="l" id="gcBack">Voltar</button><div id="gcCap"></div>';
    } else if (step === 'code') {
      h += '<h1>Digite o código</h1><p>Enviado por SMS para ' + (lastPhone ? '(' + lastPhone.slice(0, 2) + ') ' + lastPhone.slice(2, 7) + '-' + lastPhone.slice(7) : 'o seu celular') + '.</p>' +
        '<input id="gcCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000">' +
        '<button class="o" id="gcOk">Entrar</button><div class="err" id="gcErr">' + (msg || '') + '</div>' +
        '<button class="l" id="gcResend">Reenviar código por SMS</button>' +
        '<small>O SMS pode levar até 1 minuto. Não chegou? Reenvie ou entre com o Google.</small>' +
        '<button class="g" id="gcGoogle2">' + G_ICON + 'Entrar com Google</button>' +
        '<button class="l" id="gcBack">Usar outro número</button>';
    } else {
      h += '<h1>' + (closable ? 'Entrar ou cadastrar' : 'Bem-vindo à Gatecão') + '</h1><p>' + (ctxMsg || 'Entre para comprar, agendar banho e tosa e ganhar pontos no clube.') + '</p>' +
        '<button class="g" id="gcG">' + G_ICON + 'Entrar com Google</button>' +
        '<button class="o" id="gcP">Entrar com celular</button>' +
        '<div class="err" id="gcErr">' + (msg || '') + '</div>' +
        (closable ? '<button class="l" id="gcX">Agora não</button>' : '<button class="l" id="gcGuest">Ver o app sem cadastro</button>') +
        '<small>O cadastro é grátis. Ao entrar, você recebe avisos dos seus pedidos e agendamentos.</small>';
    }
    el.innerHTML = h + '</div>';
    var $ = function(id){ return document.getElementById(id); };
    if ($('gcG')) $('gcG').onclick = googleSignIn;
    if ($('gcGoogle2')) $('gcGoogle2').onclick = googleSignIn;
    if ($('gcP')) $('gcP').onclick = function(){ showLogin('phone'); };
    if ($('gcX')) $('gcX').onclick = function(){ hideLogin(); };
    if ($('gcGuest')) $('gcGuest').onclick = function(){ try { localStorage.setItem('gc_guest', '1'); } catch (e) {} hideLogin(); if (guestResolve) guestResolve(null); };
    if ($('gcBack')) $('gcBack').onclick = function(){ showLogin(step === 'code' ? 'phone' : ''); };
    if (closable && step) { var bx = el.querySelector('.box'), x = document.createElement('button'); x.className = 'l'; x.textContent = 'Agora não'; x.onclick = hideLogin; bx.appendChild(x); }
    if ($('gcSend')) $('gcSend').onclick = function(){
      var d = String($('gcPh').value).replace(/\D/g, '');
      if (d.length < 10 || d.length > 11) { $('gcErr').textContent = 'Digite o celular com DDD'; return; }
      doSendCode(d, false);
    };
    if ($('gcResend')) $('gcResend').onclick = function(){ if (cdLeft > 0 || !lastPhone) return; var e = $('gcErr'); if (e) { e.style.color = ''; e.textContent = ''; } doSendCode(lastPhone, true); };
    if ($('gcOk')) $('gcOk').onclick = function(){
      var c = String($('gcCode').value).replace(/\D/g, '');
      if (c.length !== 6) { $('gcErr').textContent = 'O código tem 6 números'; return; }
      this.disabled = true;
      confirmRes.confirm(c).catch(function(){ showLogin('code', 'Código incorreto. Confira e tente de novo.'); });
    };
    if (step === 'code') startCd(); else { clearInterval(cdT); cdT = null; }
  }
  function hideLogin(){ if (el) { el.remove(); el = null; } }

  /* ---------- conta e administradores ---------- */
  var adminDoc = fs.doc('admins/list'), resolvedUser = null;
  window.GCFB.login = function(msg){ closable = true; ctxMsg = msg || ''; showLogin(''); };
  var booted = false;
  var ready = new Promise(function(resolve){
    guestResolve = function(v){ if (!booted) { booted = true; resolve(v); } };
    auth.getRedirectResult().catch(function(){});
    auth.onAuthStateChanged(function(u){
      if (!u) { if (isGuest()) { guestResolve(null); } else if (!booted) showLogin(''); return; }
      hideLogin();
      if (booted && !resolvedUser) { try { localStorage.removeItem('gc_guest'); } catch (e) {} location.reload(); return; }
      try { localStorage.removeItem('gc_guest'); } catch (e) {}
      resolvedUser = u; booted = true;
      resolve(u);
      try { if (u && pushOk() && Notification.permission === 'granted' && localStorage.getItem('gc_sysoff') !== 'true') setTimeout(window.GCFB.enablePush, 3000); } catch (e) {}
    });
  });
  var OWNER_PHONES = ['+5521959240452']; // números donos da loja
  var adminP = ready.then(function(u){
    if (!u) return false;
    if (u.phoneNumber && OWNER_PHONES.indexOf(u.phoneNumber) > -1) return true;
    return adminDoc.get().then(function(s){
      if (s.exists) return (s.data().uids || []).indexOf(u.uid) > -1;
      return firstAdminOffer(u);
    }).catch(function(){ return false; });
  });
  function firstAdminOffer(u){
    return new Promise(function(resolve){
      var b = document.createElement('div'); b.className = 'gcl';
      b.innerHTML = '<div class="box"><h1>Primeira conta</h1><p>Ainda não existe uma conta administradora da loja. Esta conta (' + (u.email || u.phoneNumber || 'sem e-mail') + ') é a da Gatecão?</p>' +
        '<button class="o" id="gcAdmY">Sim, sou o dono da loja</button><button class="l" id="gcAdmN">Não, sou cliente</button></div>';
      if (!document.querySelector('style[data-gcl]')) { var st = document.createElement('style'); st.setAttribute('data-gcl', '1'); st.textContent = css; document.head.appendChild(st); }
      document.body.appendChild(b);
      b.querySelector('#gcAdmY').onclick = function(){ adminDoc.set({ uids: [u.uid], ts: Date.now() }).then(function(){ b.remove(); resolve(true); }).catch(function(){ b.remove(); resolve(false); }); };
      b.querySelector('#gcAdmN').onclick = function(){ b.remove(); resolve(false); };
    });
  }

  /* ---------- fotos (Storage) ---------- */
  var BUCKET = CFG.storageBucket;
  var assets = {
    upload: function(blob, opts){
      var name = Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + (/png/.test((opts && opts.type) || blob.type) ? '.png' : '.jpg');
      var ref = firebase.storage().ref('assets/' + name);
      return ref.put(blob, { contentType: (opts && opts.type) || blob.type || 'image/jpeg', cacheControl: 'public,max-age=31536000' })
        .then(function(){ var id = name + '?alt=media'; return { id: id, url: 'https://firebasestorage.googleapis.com/v0/b/' + BUCKET + '/o/assets%2F' + id, sizeBytes: blob.size, contentType: blob.type }; })
        .catch(function(e){ var err = new Error('upload'); err.code = e && e.code === 'storage/quota-exceeded' ? 'quota_or_state' : 'upload_failed'; throw err; });
    },
    delete: function(id){ return firebase.storage().ref('assets/' + String(id).split('?')[0]).delete().catch(function(){}); },
    list: function(){ return Promise.resolve({ assets: [], usage: { files: 0, maxFiles: 100000, bytes: 0, maxBytes: 5e9 } }); }
  };

  /* ---------- downloads ---------- */
  var downloads = {
    save: function(o){
      var a = document.createElement('a'), blob = o.data instanceof Blob ? o.data : new Blob([o.data], { type: /\.csv$/i.test(o.filename) ? 'text/csv;charset=utf-8' : /\.json$/i.test(o.filename) ? 'application/json' : 'application/octet-stream' });
      a.href = URL.createObjectURL(blob); a.download = o.filename || 'arquivo'; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      return Promise.resolve();
    }
  };

  /* ---------- a mesma interface do runtime do Claude ---------- */
  window.claude = {
    use: function(name){
      return ready.then(function(u){
        if (name === 'db') return fs;
        if (!u) return name === 'downloads' ? downloads : null;
        if (name === 'user') return {
          id: function(){ return Promise.resolve(u.uid); },
          canEdit: function(){ return adminP; },
          isOwner: function(){ return adminP; },
          me: function(){ return Promise.resolve({ id: u.uid, name: u.displayName || '' }); }
        };
        if (name === 'assets') return adminP.then(function(a){ return a ? assets : null; });
        if (name === 'downloads') return downloads;
        return null;
      });
    }
  };

  /* ---------- app na tela inicial (PWA) ---------- */
  if ('serviceWorker' in navigator) window.addEventListener('load', function(){ navigator.serviceWorker.register('/sw.js').catch(function(){}); });
})();
