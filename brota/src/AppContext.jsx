import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { store } from './services/db';
import { SEED_ROLES, SEED_USERS, buildSeedCheckins, buildSeedPosts } from './data/seed';
import { FREE_LIKES_PER_NIGHT, bairroInfo, nightKey, pairId } from './utils';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const DEMO_UID_KEY = 'brota_demo_uid';
// Alguns navegadores (ex.: iOS dentro de apps) bloqueiam o localStorage e jogam erro.
let memUid = null;
const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return memUid; } };
const safeSet = (k, v) => { memUid = v; try { localStorage.setItem(k, v); } catch { /* fica só na memória */ } };
const safeDel = (k) => { memUid = null; try { localStorage.removeItem(k); } catch { /* ignora */ } };
const TABS = ['home', 'explore', 'reels', 'match', 'profile'];

async function seedIfEmpty() {
  const roles = await store.list('roles');
  if (roles.length) return;
  const now = Date.now();
  await store.setMany('roles', SEED_ROLES);
  await store.setMany('users', SEED_USERS);
  await store.setMany('checkins', buildSeedCheckins(now));
  await store.setMany('posts', buildSeedPosts(now));
}

const DEMO_REPLIES = [
  'Oii! Tô aqui perto do bar, cola aqui 😄',
  'Haha finalmente um match! Já tá no rolê?',
  'Opa! Bora se encontrar na entrada?',
  'Eaí! Curti teu perfil, vai até que horas?',
];

export function AppProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined); // undefined = carregando
  const [me, setMe] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [roles, setRoles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [likesFromMe, setLikesFromMe] = useState([]);
  const [likesToMe, setLikesToMe] = useState([]);
  const [matches, setMatches] = useState([]);
  const [toast, setToast] = useState(null);
  const [route, setRoute] = useState({ name: 'home' });
  const [overlay, setOverlay] = useState(null); // { name, params }
  const [myLocation, setMyLocation] = useState(null);
  const toastTimer = useRef();

  // ---------- Auth ----------
  useEffect(() => {
    seedIfEmpty().catch((e) => console.error('seed', e));
    if (isFirebaseConfigured) {
      return onAuthStateChanged(auth, (u) => setAuthUser(u ? { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL, email: u.email } : null));
    }
    const uid = safeGet(DEMO_UID_KEY);
    setAuthUser(uid ? { uid, displayName: '', photoURL: '' } : null);
    return undefined;
  }, []);

  const uid = authUser?.uid;

  // ---------- Assinaturas em tempo real ----------
  useEffect(() => {
    if (!uid) { setMe(null); setProfileLoaded(false); return undefined; }
    const unsubs = [
      store.subscribe('users', [], (list) => {
        setUsersList(list);
        setMe(list.find((x) => x.id === uid) || null);
        setProfileLoaded(true);
      }),
      store.subscribe('roles', [], setRoles),
      store.subscribe('posts', [], (list) => setPosts(list.sort((a, b) => b.createdAt - a.createdAt))),
      store.subscribe('checkins', [], setCheckins),
      store.subscribe('likes', [['fromId', '==', uid]], setLikesFromMe),
      store.subscribe('likes', [['toId', '==', uid]], setLikesToMe),
      store.subscribe('matches', [['users', 'array-contains', uid]], (list) => setMatches(list.sort((a, b) => (b.lastAt || b.createdAt) - (a.lastAt || a.createdAt)))),
    ];
    return () => unsubs.forEach((f) => f && f());
  }, [uid]);

  const users = useMemo(() => Object.fromEntries(usersList.map((x) => [x.id, x])), [usersList]);

  const showToast = useCallback((msg) => {
    setToast(msg); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ---------- Navegação (com botão voltar do celular) ----------
  const navigate = useCallback((name, params = {}) => {
    if (TABS.includes(name)) { setOverlay(null); setRoute({ name, params }); window.scrollTo(0, 0); return; }
    setOverlay({ name, params });
    window.history.pushState({ overlay: name }, '');
  }, []);
  const back = useCallback(() => { if (window.history.state?.overlay) window.history.back(); else setOverlay(null); }, []);
  useEffect(() => {
    const onPop = () => setOverlay(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ---------- Login ----------
  const loginGoogle = useCallback(async () => {
    if (isFirebaseConfigured) {
      await signInWithPopup(auth, googleProvider);
      return;
    }
    const id = `local_${Math.random().toString(36).slice(2, 10)}`;
    safeSet(DEMO_UID_KEY, id);
    setAuthUser({ uid: id, displayName: '', photoURL: '' });
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured) await signOut(auth);
    safeDel(DEMO_UID_KEY);
    setAuthUser(null); setOverlay(null); setRoute({ name: 'home' });
  }, []);

  const saveProfile = useCallback(async (data) => {
    const isNew = !me;
    await store.set('users', uid, {
      ...data,
      ...(isNew ? { vip: false, recomendacoes: [], createdAt: Date.now(), email: authUser?.email || null } : {}),
    });
    if (isNew) {
      // Galera do Rio que já te curtiu (alimenta o "X pessoas te curtiram")
      const admirers = SEED_USERS.filter((x) => x.likesYou);
      await Promise.all(admirers.map((a, i) => store.set('likes', `${a.id}_${uid}`, {
        fromId: a.id, toId: uid, tipo: i === 0 ? 'super' : 'like', createdAt: Date.now() - i * 600000,
      })));
    }
  }, [me, uid, authUser]);

  // ---------- Rolês / check-in ----------
  const myCheckins = useMemo(() => checkins.filter((c) => c.userId === uid).sort((a, b) => b.createdAt - a.createdAt), [checkins, uid]);
  const currentCheckin = myCheckins.find((c) => c.status === 'aqui') || null;

  const peopleAt = useCallback((roleId, status) => checkins
    .filter((c) => c.roleId === roleId && (!status || c.status === status))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((c) => users[c.userId]).filter(Boolean), [checkins, users]);

  const checkIn = useCallback(async (roleId) => {
    // Só um "tô aqui" por vez: os anteriores viram histórico ("fui")
    await Promise.all(myCheckins.filter((c) => c.status === 'aqui' && c.roleId !== roleId)
      .map((c) => store.update('checkins', c.id, { status: 'fui' })));
    await store.set('checkins', `${uid}_${roleId}`, { userId: uid, roleId, status: 'aqui', createdAt: Date.now() });
    const role = roles.find((r) => r.id === roleId);
    showToast(`Você brotou no ${role?.nome || 'rolê'}! 🔥`);
  }, [myCheckins, uid, roles, showToast]);

  const toggleVou = useCallback(async (roleId) => {
    const id = `${uid}_${roleId}`;
    const cur = myCheckins.find((c) => c.id === id);
    if (cur?.status === 'vou') { await store.remove('checkins', id); showToast('Tirado da sua lista'); return; }
    if (cur?.status === 'aqui') return;
    await store.set('checkins', id, { userId: uid, roleId, status: 'vou', createdAt: Date.now() });
    showToast('Anotado! Você vai nesse rolê 🙌');
  }, [uid, myCheckins, showToast]);

  const toggleRecomendacao = useCallback(async (roleId) => {
    const has = me?.recomendacoes?.includes(roleId);
    if (has) await store.arrayRemove('users', uid, 'recomendacoes', roleId);
    else { await store.arrayAdd('users', uid, 'recomendacoes', roleId); showToast('Adicionado às suas indicações ⭐'); }
  }, [me, uid, showToast]);

  // ---------- Posts ----------
  const likePost = useCallback(async (post) => {
    if (post.likedBy?.includes(uid)) await store.arrayRemove('posts', post.id, 'likedBy', uid);
    else await store.arrayAdd('posts', post.id, 'likedBy', uid);
  }, [uid]);
  const savePost = useCallback(async (post) => {
    if (post.savedBy?.includes(uid)) await store.arrayRemove('posts', post.id, 'savedBy', uid);
    else { await store.arrayAdd('posts', post.id, 'savedBy', uid); showToast('Salvo ✔'); }
  }, [uid, showToast]);
  const commentPost = useCallback(async (post, texto) => {
    await store.arrayAdd('posts', post.id, 'comments', { userId: uid, texto, createdAt: Date.now() });
  }, [uid]);
  const addPost = useCallback(async ({ mediaUrl, mediaType, legenda, roleId, tipo }) => {
    await store.add('posts', { userId: uid, mediaUrl, mediaType, legenda, roleId: roleId || null, tipo, likedBy: [], savedBy: [], comments: [], likesExtra: 0, createdAt: Date.now() });
    showToast('Postado! 📸');
  }, [uid, showToast]);

  // ---------- Match ----------
  const isVip = Boolean(me?.vip);
  const tonight = nightKey();
  const likesUsedTonight = me?.likesNoite?.key === tonight ? me.likesNoite.count : 0;
  const likesLeft = isVip ? Infinity : Math.max(0, FREE_LIKES_PER_NIGHT - likesUsedTonight);

  const swipedIds = useMemo(() => new Set(likesFromMe.map((l) => l.toId)), [likesFromMe]);
  const admirers = useMemo(() => likesToMe.filter((l) => l.tipo !== 'pass')
    .filter((l) => !matches.some((m) => m.users.includes(l.fromId)))
    .map((l) => ({ ...l, user: users[l.fromId] })).filter((l) => l.user), [likesToMe, matches, users]);

  const createMatch = useCallback(async (otherId, roleId) => {
    const id = pairId(uid, otherId);
    await store.set('matches', id, { users: [uid, otherId].sort(), roleId: roleId || null, createdAt: Date.now(), lastAt: Date.now(), lastMsg: '' });
    return id;
  }, [uid]);

  // tipo: 'like' | 'super' | 'pass'
  const swipe = useCallback(async (target, tipo, roleId) => {
    if (tipo === 'super' && !isVip) return { blocked: 'vip' };
    if (tipo !== 'pass' && likesLeft <= 0) return { blocked: 'limit' };
    await store.set('likes', `${uid}_${target.id}`, { fromId: uid, toId: target.id, tipo, roleId: roleId || null, createdAt: Date.now() });
    if (tipo === 'pass') return {};
    if (!isVip) await store.update('users', uid, { likesNoite: { key: tonight, count: likesUsedTonight + 1 } });
    const likedBack = likesToMe.some((l) => l.fromId === target.id && l.tipo !== 'pass');
    if (likedBack) {
      const matchId = await createMatch(target.id, roleId);
      return { matchId };
    }
    return {};
  }, [uid, isVip, likesLeft, likesUsedTonight, tonight, likesToMe, createMatch]);

  const becomeVip = useCallback(async () => {
    await store.update('users', uid, { vip: true, vipDesde: Date.now() });
    showToast('Bem-vindo ao BROTA VIP 👑');
  }, [uid, showToast]);

  const sendMessage = useCallback(async (match, texto) => {
    const path = `matches/${match.id}/messages`;
    await store.add(path, { fromId: uid, texto, createdAt: Date.now() });
    await store.update('matches', match.id, { lastAt: Date.now(), lastMsg: texto, lastFrom: uid });
    // No modo demo, a galera de exemplo responde
    const otherId = match.users.find((x) => x !== uid);
    if (users[otherId]?.demo && !match.demoReplied) {
      await store.update('matches', match.id, { demoReplied: true });
      setTimeout(async () => {
        const reply = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
        await store.add(path, { fromId: otherId, texto: reply, createdAt: Date.now() });
        await store.update('matches', match.id, { lastAt: Date.now(), lastMsg: reply, lastFrom: otherId });
      }, 1800);
    }
  }, [uid, users]);

  const myPoint = myLocation || (me ? bairroInfo(me.bairro) : null);

  const value = {
    authUser, uid, me, profileLoaded, users, roles, posts, checkins, likesFromMe, likesToMe, matches,
    route, overlay, navigate, back, toast, showToast,
    loginGoogle, logout, saveProfile,
    myCheckins, currentCheckin, peopleAt, checkIn, toggleVou, toggleRecomendacao,
    likePost, savePost, commentPost, addPost,
    isVip, likesLeft, swipedIds, admirers, swipe, becomeVip, sendMessage, createMatch,
    myPoint, myLocation, setMyLocation,
    mode: store.mode,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
