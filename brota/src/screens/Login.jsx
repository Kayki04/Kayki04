import { useState } from 'react';
import { useApp } from '../AppContext';
import { BAIRROS, STATUS, ZONAS, compressImage } from '../utils';
import { Avatar, Photo } from '../components/ui';
import * as I from '../components/Icons';

const HERO = 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1080&q=70';

export function Welcome() {
  const { loginGoogle, mode } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const go = async () => {
    setLoading(true); setError('');
    try { await loginGoogle(); } catch (e) { setError('Não deu pra entrar com o Google. Tenta de novo.'); console.error(e); }
    setLoading(false);
  };
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <Photo src={HERO} alt="Rio de Janeiro" label="Rio de Janeiro" />
        <div className="welcome-shade" />
        <div className="welcome-hero-text">
          <span className="pill white">📍 Rio de Janeiro · RJ</span>
        </div>
      </div>
      <div className="welcome-body">
        <div className="logo big">BROTA</div>
        <p className="welcome-sub">A rede social do rolê no Rio. Veja o que tá rolando agora, dá check-in e conhece quem tá no mesmo lugar que você.</p>
        <div className="welcome-chips">
          {['Lapa', 'Copacabana', 'Madureira', 'Tijuca', 'Botafogo', 'Barra'].map((b) => <span key={b} className="chip">{b}</span>)}
        </div>
        <button className="btn-google" onClick={go} disabled={loading}>
          <I.Google /> {loading ? 'Entrando…' : 'Entrar com Google'}
        </button>
        {error && <p className="error">{error}</p>}
        {mode === 'demo' && <p className="tiny muted center">Modo demonstração: seus dados ficam salvos neste aparelho.</p>}
        <p className="tiny muted center">Ao entrar você confirma que tem 18 anos ou mais.</p>
      </div>
    </div>
  );
}

export function ProfileForm({ initial, onDone, title = 'Cria teu perfil' }) {
  const { saveProfile, authUser } = useApp();
  const [f, setF] = useState(() => ({
    nome: initial?.nome || authUser?.displayName || '',
    idade: initial?.idade || '',
    bairro: initial?.bairro || '',
    status: initial?.status || '',
    bio: initial?.bio || '',
    foto: initial?.foto || authUser?.photoURL || '',
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    set('foto', await compressImage(file, 600, 0.8));
  };

  const submit = async (e) => {
    e.preventDefault();
    const idade = Number(f.idade);
    if (!f.nome.trim()) return setErr('Coloca teu nome');
    if (!idade || idade < 18) return setErr('O BROTA é só pra maiores de 18');
    if (!f.bairro) return setErr('Escolhe teu bairro');
    if (!f.status) return setErr('Escolhe teu status');
    setSaving(true); setErr('');
    await saveProfile({ ...f, nome: f.nome.trim(), idade });
    setSaving(false); onDone?.();
  };

  return (
    <form className="profile-form" onSubmit={submit}>
      <h2>{title}</h2>
      <label className="photo-pick">
        <Avatar user={{ nome: f.nome || '?', foto: f.foto }} size={104} />
        <span className="photo-pick-btn"><I.Camera size={16} /></span>
        <input type="file" accept="image/*" onChange={onPhoto} hidden />
      </label>
      <span className="small link center">{f.foto ? 'Trocar foto' : 'Adicionar foto'}</span>

      <label className="field"><span>Nome</span>
        <input value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Como a galera te chama" maxLength={40} />
      </label>
      <label className="field"><span>Idade</span>
        <input type="number" inputMode="numeric" min={18} max={99} value={f.idade} onChange={(e) => set('idade', e.target.value)} placeholder="18+" />
      </label>
      <label className="field"><span>Bairro (RJ)</span>
        <select value={f.bairro} onChange={(e) => set('bairro', e.target.value)}>
          <option value="">Escolher bairro…</option>
          {ZONAS.map((z) => (
            <optgroup key={z} label={z}>
              {BAIRROS.filter((b) => b.zona === z).map((b) => <option key={b.nome}>{b.nome}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="field"><span>Status</span>
        <div className="status-pick">
          {STATUS.map((s) => (
            <button type="button" key={s.id} className={`status-opt ${f.status === s.id ? 'on' : ''}`} onClick={() => set('status', s.id)}>
              <span className="emoji">{s.emoji}</span>{s.label}
            </button>
          ))}
        </div>
      </div>
      <label className="field"><span>Bio</span>
        <textarea rows={2} value={f.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Ex: Tijucano, pagode e praia 🌊" maxLength={120} />
      </label>
      {err && <p className="error">{err}</p>}
      <button className="btn-primary block" disabled={saving}>{saving ? 'Salvando…' : initial ? 'Salvar' : 'Bora pro rolê 🔥'}</button>
    </form>
  );
}

export function Onboarding() {
  return <div className="screen pad onboarding"><div className="logo">BROTA</div><ProfileForm /></div>;
}
