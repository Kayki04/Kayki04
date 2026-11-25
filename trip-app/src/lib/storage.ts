/** localStorage que nunca quebra o app (janela privada, bloqueio de cookies). */
export const safeStorage = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* sem armazenamento: segue sem lembrar */ }
  },
};
