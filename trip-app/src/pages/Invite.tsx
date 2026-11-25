import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { errorMessage, useSession } from '../lib/auth';
import { blockedTerm } from '../lib/moderation';

export default function Invite() {
  const { session, profile, loading } = useSession();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('c') ?? '');
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const qc = useQueryClient();
  if (loading) return <div className="vazio">Carregando…</div>;
  if (!session) return <Navigate to="/entrar" replace />;
  if (profile) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (blockedTerm(handle) || blockedTerm(name)) return setErr(errorMessage({ message: 'blocked_term' }));
    setBusy(true);
    const { error } = await supabase.rpc('redeem_invite', { p_code: code, p_handle: handle, p_name: name });
    setBusy(false);
    if (error) return setErr(errorMessage(error));
    await qc.invalidateQueries({ queryKey: ['me'] });
    nav('/', { replace: true });
  };

  return (
    <div className="entrada">
      <p className="logo">trip</p>
      <h1>Você tem um convite?</h1>
      <p className="sub">Durante o teste fechado, só entra quem foi convidado por um criador ou pela equipe Trip.</p>
      <form className="form" onSubmit={submit}>
        <div className="campo"><label htmlFor="code">Código do convite</label>
          <input id="code" autoCapitalize="characters" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required /></div>
        <div className="campo"><label htmlFor="handle">Seu @</label>
          <input id="handle" autoCapitalize="none" maxLength={24} value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} required />
          <span className="dica">De 3 a 24 caracteres: letras, números, ponto ou _.</span></div>
        <div className="campo"><label htmlFor="name">Seu nome</label>
          <input id="name" maxLength={50} value={name} onChange={e => setName(e.target.value)} required /></div>
        {err && <p className="erro" role="alert">{err}</p>}
        <button className="btn btn-lima btn-bloco" disabled={busy}>Criar minha conta</button>
        <button type="button" className="btn btn-linha btn-bloco" onClick={() => supabase.auth.signOut()}>Sair</button>
      </form>
    </div>
  );
}
