import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';

export type Profile = {
  id: string; handle: string; name: string; bio: string; avatar_path: string | null;
  is_creator: boolean; show_adult: boolean; role: 'user' | 'mod' | 'admin';
  under_review: boolean; suspended: boolean; created_at: string;
};

type Ctx = { session: Session | null; ready: boolean };
const AuthCtx = createContext<Ctx>({ session: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ session: null, ready: false });
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, ready: true }));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ session, ready: true });
      qc.invalidateQueries({ queryKey: ['me'] });
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export function useSession() {
  const { session, ready } = useContext(AuthCtx);
  const uid = session?.user.id;
  const q = useQuery({
    queryKey: ['me', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_profile');
      if (error) throw error;
      const p = data as Profile | null;
      return p && p.id ? p : null;
    },
  });
  return { session, user: session?.user ?? null, profile: q.data ?? null, loading: !ready || (!!uid && q.isLoading) };
}

/** Só mostra a página para quem tem sessão e perfil. */
export function RequireProfile({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useSession();
  const loc = useLocation();
  if (loading) return <div className="vazio" aria-busy="true">Carregando…</div>;
  if (!session) return <Navigate to="/entrar" replace state={{ from: loc.pathname }} />;
  if (!profile) return <Navigate to={'/convite' + loc.search} replace />;
  return <>{children}</>;
}

const ERROS: Record<string, string> = {
  invite_invalid: 'Convite não encontrado. Confira o código.',
  invite_used: 'Este convite já foi usado.',
  invite_expired: 'Este convite expirou.',
  handle_taken: 'Esse @ já está em uso.',
  handle_invalid: 'O @ precisa ter de 3 a 24 caracteres: letras minúsculas, números, ponto ou _.',
  name_invalid: 'Digite seu nome (até 50 caracteres).',
  blocked_term: 'Esse texto tem um termo proibido na Trip.',
  already_has_profile: 'Sua conta já está criada.',
  media_path_invalid: 'Arquivo inválido. Envie de novo.',
  not_authenticated: 'Sua sessão expirou. Entre de novo.',
};
export const errorMessage = (e: unknown) => {
  const msg = (e as { message?: string })?.message ?? '';
  return ERROS[msg] ?? 'Algo deu errado. Tente de novo.';
};
