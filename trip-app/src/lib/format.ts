export const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
export const num = (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + ' mil' : String(n));
export const initial = (name: string) => (name || '?').trim()[0]?.toUpperCase() ?? '?';
/** Cor estável por pessoa, para o avatar sem foto. */
export function colorFor(id: string) {
  const cores = ['#b78f7d', '#6d7f99', '#a2697a', '#9a7d9f', '#8c8c7a', '#5fa38a', '#3b5bdb', '#c2410c'];
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return cores[h % cores.length];
}
