/**
 * Filtro de termos ligados a menores de idade. A regra que vale é a do banco
 * (public.blocked_term); esta cópia só dá retorno imediato na tela.
 */
const TERMOS = ['crianca', 'infantil', 'menor de idade', 'novinha', 'colegial', 'lolita'];
const IDADE = /\b(tenho|tem|tinha|com|de|aos|fez|faz|fiz|idade)\s+([1-9]|1[0-7])\s*anos\b(?!\s+de\s)/;

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function blockedTerm(text: string): string | null {
  const t = normalize(text);
  const term = TERMOS.find(x => t.includes(x));
  if (term) return term;
  const pedo = t.match(/\bpedo\w*/);
  if (pedo) return pedo[0];
  const idade = t.match(IDADE);
  return idade ? idade[0] : null;
}
