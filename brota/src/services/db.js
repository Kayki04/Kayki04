// Camada de dados única: usa o Firestore quando configurado,
// senão um banco local (localStorage) com a mesma API.
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, arrayUnion, arrayRemove, writeBatch,
} from 'firebase/firestore';
import { db as firestore, isFirebaseConfigured } from '../firebase';

// ---------- Firestore ----------
function buildQuery(path, filters = []) {
  const ref = collection(firestore, path);
  if (!filters.length) return ref;
  return query(ref, ...filters.map(([f, op, v]) => where(f, op, v)));
}
const snapToList = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

const remote = {
  mode: 'firebase',
  async list(path, filters) { return snapToList(await getDocs(buildQuery(path, filters))); },
  async get(path, id) {
    const s = await getDoc(doc(firestore, path, id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  },
  async set(path, id, data, merge = true) { await setDoc(doc(firestore, path, id), data, { merge }); return id; },
  async add(path, data) { const r = await addDoc(collection(firestore, path), data); return r.id; },
  async update(path, id, patch) { await updateDoc(doc(firestore, path, id), patch); },
  async remove(path, id) { await deleteDoc(doc(firestore, path, id)); },
  async arrayAdd(path, id, field, value) { await updateDoc(doc(firestore, path, id), { [field]: arrayUnion(value) }); },
  async arrayRemove(path, id, field, value) { await updateDoc(doc(firestore, path, id), { [field]: arrayRemove(value) }); },
  async setMany(path, docs) {
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(firestore);
      docs.slice(i, i + 400).forEach(({ id, ...data }) => batch.set(doc(firestore, path, id), data));
      await batch.commit();
    }
  },
  subscribe(path, filters, cb) {
    return onSnapshot(buildQuery(path, filters), (snap) => cb(snapToList(snap)), (err) => console.error(path, err));
  },
};

// ---------- Banco local (modo demo) ----------
const KEY = 'brota_db_v1';
let mem = null;
const listeners = new Set();
function load() {
  if (mem) return mem;
  try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { mem = {}; }
  return mem;
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { console.warn('localStorage cheio', e); }
  listeners.forEach((l) => l());
}
const colOf = (path) => { const d = load(); d[path] = d[path] || {}; return d[path]; };
const match = (docData, filters = []) => filters.every(([f, op, v]) => {
  const val = docData[f];
  if (op === '==') return val === v;
  if (op === 'array-contains') return Array.isArray(val) && val.includes(v);
  if (op === 'in') return v.includes(val);
  return true;
});
const listLocal = (path, filters) => Object.entries(colOf(path))
  .map(([id, d]) => ({ id, ...d })).filter((d) => match(d, filters));
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

if (typeof window !== 'undefined') {
  try { window.addEventListener('storage', (e) => { if (e.key === KEY) { mem = null; listeners.forEach((l) => l()); } }); } catch { /* sem storage */ }
}

const local = {
  mode: 'demo',
  async list(path, filters) { return listLocal(path, filters); },
  async get(path, id) { const d = colOf(path)[id]; return d ? { id, ...d } : null; },
  async set(path, id, data, merge = true) {
    const c = colOf(path); c[id] = merge ? { ...(c[id] || {}), ...data } : { ...data }; persist(); return id;
  },
  async add(path, data) { const id = newId(); colOf(path)[id] = { ...data }; persist(); return id; },
  async update(path, id, patch) { const c = colOf(path); c[id] = { ...(c[id] || {}), ...patch }; persist(); },
  async remove(path, id) { delete colOf(path)[id]; persist(); },
  async arrayAdd(path, id, field, value) {
    const c = colOf(path); const cur = c[id]?.[field] || [];
    if (!cur.includes(value)) c[id] = { ...c[id], [field]: [...cur, value] }; persist();
  },
  async arrayRemove(path, id, field, value) {
    const c = colOf(path); const cur = c[id]?.[field] || [];
    c[id] = { ...c[id], [field]: cur.filter((x) => JSON.stringify(x) !== JSON.stringify(value)) }; persist();
  },
  async setMany(path, docs) { const c = colOf(path); docs.forEach(({ id, ...data }) => { c[id] = data; }); persist(); },
  subscribe(path, filters, cb) {
    const run = () => cb(listLocal(path, filters));
    listeners.add(run); run();
    return () => listeners.delete(run);
  },
  reset() { mem = {}; persist(); },
};

export const store = isFirebaseConfigured ? remote : local;
export const localStore = local;
