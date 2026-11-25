import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useSession, errorMessage } from '../lib/auth';
import { removeAllMyMedia, removeMedia, uploadMedia, validateFile } from '../lib/media';
import { ProfileHeader } from './Profile';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';

function EditProfile({ onClose }: { onClose: () => void }) {
  const { profile } = useSession();
  const [name, setName] = useState(profile!.name);
  const [bio, setBio] = useState(profile!.bio);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const old = profile!.avatar_path;
      const avatar = file ? await uploadMedia(file, 'photo') : old;
      const { data, error } = await supabase.rpc('update_profile', { p_name: name, p_bio: bio, p_avatar_path: avatar, p_show_adult: profile!.show_adult });
      if (error) throw error;
      const r = data as { ok: boolean; error?: string };
      if (!r.ok) { if (file) await removeMedia([avatar]); setErr(errorMessage({ message: r.error })); qc.invalidateQueries({ queryKey: ['me'] }); return; }
      if (file && old) await removeMedia([old]);
      await qc.invalidateQueries({ queryKey: ['me'] }); await qc.invalidateQueries({ queryKey: ['profile'] }); await qc.invalidateQueries({ queryKey: ['feed'] });
      toast('Perfil atualizado.'); onClose();
    } catch (e) { setErr((e as Error).message?.includes('MB') ? (e as Error).message : 'Não foi possível salvar. Tente de novo.'); }
    finally { setBusy(false); }
  };
  return (
    <Sheet title="Editar perfil" onClose={onClose}>
      <form className="form" onSubmit={save}>
        <div className="campo"><label htmlFor="ed-foto">Foto do perfil</label>
          <input id="ed-foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const f = e.target.files?.[0]; const v = f && validateFile(f, 'photo'); setErr(v || ''); setFile(v ? null : f ?? null); }} /></div>
        <div className="campo"><label htmlFor="ed-nome">Nome</label><input id="ed-nome" maxLength={50} value={name} onChange={e => setName(e.target.value)} required /></div>
        <div className="campo"><label htmlFor="ed-bio">Bio</label><textarea id="ed-bio" maxLength={300} value={bio} onChange={e => setBio(e.target.value)} /></div>
        {err && <p className="erro" role="alert">{err}</p>}
        <button className="btn btn-lima btn-bloco" disabled={busy || !name.trim()}>Salvar</button>
      </form>
    </Sheet>
  );
}

function DeleteAccount({ handle, onClose }: { handle: string; onClose: () => void }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const go = async () => {
    setBusy(true); setErr('');
    const filesGone = await removeAllMyMedia();
    const { error } = filesGone ? await supabase.rpc('delete_my_account') : { error: true };
    if (error) { setBusy(false); setErr('Não foi possível excluir agora. Verifique a conexão e tente de novo.'); return; }
    await supabase.auth.signOut();
    nav('/entrar', { replace: true });
  };
  return (
    <Sheet title="Excluir sua conta?" onClose={onClose}>
      <p className="sub">Seus posts, comentários e seguidores somem para sempre. Dados de pagamento ficam guardados pelo prazo que a lei exige.</p>
      <div className="form">
        <div className="campo"><label htmlFor="del-h">Digite seu @ para confirmar</label><input id="del-h" autoCapitalize="none" value={typed} onChange={e => setTyped(e.target.value.trim().replace(/^@/, '').toLowerCase())} placeholder={handle} /></div>
        {err && <p className="erro" role="alert">{err}</p>}
        <button className="btn btn-perigo btn-bloco" disabled={typed !== handle || busy} onClick={go}>Excluir para sempre</button>
        <button className="btn btn-linha btn-bloco" onClick={onClose}>Cancelar</button>
      </div>
    </Sheet>
  );
}

export default function Me() {
  const { profile } = useSession();
  const [sheet, setSheet] = useState<'edit' | 'delete' | null>(null);
  if (!profile) return null;
  return (
    <>
      <header className="cab"><h1>Meu perfil</h1><div className="dir"><Link className="btn btn-linha btn-p" to={'/u/' + profile.handle}>Ver público</Link></div></header>
      {profile.under_review && <div className="secao"><div className="revisao"><b>Perfil em revisão</b><span>Uma postagem sua foi bloqueada. Nossa equipe está analisando suas outras postagens.</span></div></div>}
      <ProfileHeader handle={profile.handle} back={false} />
      <div className="secao">
        <button className="btn btn-linha btn-bloco" onClick={() => setSheet('edit')}>Editar perfil</button>
        <p className="rotulo">Configurações</p>
        <label className="chave" htmlFor="toggle-adult"><span><b>Mostrar conteúdo adulto (+18)</b><small>Disponível na próxima etapa da Trip.</small></span>
          <input type="checkbox" id="toggle-adult" checked={profile.show_adult} disabled readOnly /></label>
        <p className="rotulo">Conta</p>
        <button className="btn btn-linha btn-bloco" onClick={() => supabase.auth.signOut()}>Sair</button>
        <button className="btn btn-linha btn-bloco" style={{ color: 'var(--perigo)' }} onClick={() => setSheet('delete')}>Excluir conta</button>
      </div>
      {sheet === 'edit' && <EditProfile onClose={() => setSheet(null)} />}
      {sheet === 'delete' && <DeleteAccount handle={profile.handle} onClose={() => setSheet(null)} />}
    </>
  );
}
