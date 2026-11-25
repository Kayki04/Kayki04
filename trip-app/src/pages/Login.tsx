import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../lib/auth';

export default function Login() {
  const { session } = useSession();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (session) return <Navigate to="/" replace />;

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) setErr('Não conseguimos enviar o código. Confira o e-mail e tente de novo.'); else setStep('code');
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) setErr('Código errado ou vencido. Confira ou peça outro.');
  };
  const google = async () => {
    setErr('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) setErr('Entrar com Google ainda não está disponível. Use seu e-mail.');
  };

  return (
    <div className="entrada">
      <p className="logo">trip</p>
      <h1>Entrar na Trip</h1>
      <p className="sub">A Trip está em teste fechado. Para criar sua conta você vai precisar de um convite.</p>
      {step === 'email' ? (
        <form className="form" onSubmit={sendCode}>
          <div className="campo"><label htmlFor="email">Seu e-mail</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <button className="btn btn-lima btn-bloco" disabled={busy || !email.includes('@')}>Receber código</button>
          <button type="button" className="btn btn-linha btn-bloco" onClick={google}>Entrar com Google</button>
        </form>
      ) : (
        <form className="form" onSubmit={verify}>
          <p className="sub">Mandamos um código para <b>{email}</b>.</p>
          <div className="campo"><label htmlFor="code">Código de 6 números</label>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /></div>
          <button className="btn btn-lima btn-bloco" disabled={busy || code.length !== 6}>Entrar</button>
          <button type="button" className="btn btn-linha btn-bloco" onClick={() => { setStep('email'); setCode(''); }}>Usar outro e-mail</button>
        </form>
      )}
      {err && <p className="erro" role="alert">{err}</p>}
    </div>
  );
}
