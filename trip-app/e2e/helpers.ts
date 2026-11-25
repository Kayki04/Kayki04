import { createClient, type Session } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

// Chaves padrão do Supabase local (públicas, só valem na máquina de desenvolvimento).
export const SUPABASE_URL = 'http://127.0.0.1:54321';
export const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
export const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const STORAGE_KEY = 'sb-127-auth-token';

export const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

export const uniq = (p = 'u') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export async function createInvite(kind: 'creator' | 'fan' = 'fan', opts: { maxUses?: number; expiresAt?: string } = {}) {
  const code = uniq('E2E-').toUpperCase();
  const { error } = await admin.from('invites').insert({ code, kind, max_uses: opts.maxUses ?? 1, expires_at: opts.expiresAt ?? null });
  if (error) throw error;
  return code;
}

export type TestUser = { email: string; session: Session; client: ReturnType<typeof createClient>; id: string; handle?: string };

/** Cria usuário (e perfil, se pedir) e devolve a sessão; não usa e-mail. */
export async function makeUser(opts: { profile?: boolean; creator?: boolean; handle?: string; name?: string } = {}): Promise<TestUser> {
  const email = `${uniq()}@e2e.trip`;
  const { data: created, error: e1 } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (e1) throw e1;
  const { data: link, error: e2 } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (e2) throw e2;
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: v, error: e3 } = await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' });
  if (e3 || !v.session) throw e3 ?? new Error('sem sessão');
  const user: TestUser = { email, session: v.session, client, id: created.user.id };
  if (opts.profile !== false) {
    const code = await createInvite(opts.creator ? 'creator' : 'fan');
    const handle = opts.handle ?? uniq('t').slice(0, 20);
    const { error } = await client.rpc('redeem_invite', { p_code: code, p_handle: handle, p_name: opts.name ?? 'Pessoa Teste' });
    if (error) throw error;
    user.handle = handle;
  }
  return user;
}

/** Abre o app já logado como `user` e com a entrada 18+ confirmada. */
export async function loginAs(page: Page, user: TestUser) {
  await page.addInitScript(([key, value]) => {
    localStorage.setItem('trip-age-ok', '1');
    localStorage.setItem(key, value);
  }, [STORAGE_KEY, JSON.stringify(user.session)] as const);
}

export async function skipAgeGate(page: Page) {
  await page.addInitScript(() => localStorage.setItem('trip-age-ok', '1'));
}

/** Último código de login enviado para `email` (Mailpit local). */
export async function lastEmailCode(email: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent('to:' + email)}`);
    const j = await r.json() as { messages?: { ID: string }[] };
    if (j.messages?.length) {
      const m = await (await fetch(`http://127.0.0.1:54324/api/v1/message/${j.messages[0].ID}`)).json() as { Text: string };
      const code = m.Text.match(/\b(\d{6})\b/);
      if (code) return code[1];
    }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('código não chegou');
}
