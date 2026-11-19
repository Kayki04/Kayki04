export const BAIRROS = [
  { nome: 'Copacabana', zona: 'Zona Sul', lat: -22.9711, lng: -43.1822 },
  { nome: 'Ipanema', zona: 'Zona Sul', lat: -22.9838, lng: -43.2096 },
  { nome: 'Leblon', zona: 'Zona Sul', lat: -22.9847, lng: -43.2233 },
  { nome: 'Botafogo', zona: 'Zona Sul', lat: -22.9519, lng: -43.1822 },
  { nome: 'Flamengo', zona: 'Zona Sul', lat: -22.9329, lng: -43.1756 },
  { nome: 'Lapa', zona: 'Centro', lat: -22.9133, lng: -43.18 },
  { nome: 'Centro', zona: 'Centro', lat: -22.9035, lng: -43.178 },
  { nome: 'Santa Teresa', zona: 'Centro', lat: -22.9213, lng: -43.1873 },
  { nome: 'Tijuca', zona: 'Zona Norte', lat: -22.925, lng: -43.233 },
  { nome: 'Vila Isabel', zona: 'Zona Norte', lat: -22.916, lng: -43.247 },
  { nome: 'Maracanã', zona: 'Zona Norte', lat: -22.9122, lng: -43.2302 },
  { nome: 'Méier', zona: 'Zona Norte', lat: -22.902, lng: -43.28 },
  { nome: 'Madureira', zona: 'Zona Norte', lat: -22.873, lng: -43.338 },
  { nome: 'Penha', zona: 'Zona Norte', lat: -22.842, lng: -43.277 },
  { nome: 'Ilha do Governador', zona: 'Zona Norte', lat: -22.81, lng: -43.205 },
  { nome: 'Barra da Tijuca', zona: 'Zona Oeste', lat: -23.0004, lng: -43.365 },
  { nome: 'Recreio', zona: 'Zona Oeste', lat: -23.018, lng: -43.462 },
  { nome: 'Jacarepaguá', zona: 'Zona Oeste', lat: -22.96, lng: -43.37 },
  { nome: 'Campo Grande', zona: 'Zona Oeste', lat: -22.903, lng: -43.561 },
];
export const ZONAS = ['Zona Sul', 'Centro', 'Zona Norte', 'Zona Oeste'];
export const STATUS = [
  { id: 'solteiro', label: 'Solteiro(a)', emoji: '💘' },
  { id: 'curtindo', label: 'Curtindo', emoji: '😎' },
  { id: 'so-de-role', label: 'Só de rolê', emoji: '🍻' },
];
// "na Lapa", "no Centro", "em Copacabana"...
const PREP = { Lapa: 'na', Tijuca: 'na', 'Barra da Tijuca': 'na', Penha: 'na', 'Vila Isabel': 'em', 'Ilha do Governador': 'na', Centro: 'no', 'Méier': 'no', 'Maracanã': 'no', Flamengo: 'no', Leblon: 'no', Recreio: 'no' };
export const noBairro = (b) => `${PREP[b] || 'em'} ${b}`;
export const statusLabel = (id) => STATUS.find((s) => s.id === id) || STATUS[2];
export const bairroInfo = (nome) => BAIRROS.find((b) => b.nome === nome) || BAIRROS[0];

export const FREE_LIKES_PER_NIGHT = 3;
export const VIP_PRICE = 'R$ 14,90';

export function distanceKm(a, b) {
  if (!a || !b) return null;
  const R = 6371, toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const formatKm = (km) => (km == null ? '' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`);

// A "noite" vai das 6h de um dia até as 6h do dia seguinte.
export function nightKey(date = new Date()) {
  const d = new Date(date.getTime() - 6 * 3600 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24); return d < 7 ? `${d} d` : `${Math.floor(d / 7)} sem`;
}

export const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
export function colorFrom(str = '') {
  let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 70% 62%)`;
}
export const pairId = (a, b) => [a, b].sort().join('__');

// Reduz a foto para caber no Firestore (doc < 1 MB)
export function compressImage(file, max = 1080, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
export const fileToDataUrl = (file) => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
});
