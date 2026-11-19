import { useState } from 'react';
import { useApp } from '../AppContext';
import { Header } from '../components/ui';
import { compressImage, fileToDataUrl, noBairro } from '../utils';
import * as I from '../components/Icons';

const MAX_VIDEO = 900 * 1024; // vídeo vai direto no documento (limite do Firestore)

export default function NewPost({ tipo = 'arrumando', roleId: initialRole }) {
  const { roles, addPost, back, currentCheckin, navigate } = useApp();
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [legenda, setLegenda] = useState('');
  const [kind, setKind] = useState(tipo);
  const [roleId, setRoleId] = useState(initialRole || currentCheckin?.roleId || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const role = roles.find((r) => r.id === roleId);

  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setErr('');
    if (file.type.startsWith('video/')) {
      if (file.size > MAX_VIDEO) return setErr('Vídeo muito grande (máx. ~1 MB). Tenta um mais curto ou manda uma foto.');
      setMedia(await fileToDataUrl(file)); setMediaType('video');
    } else { setMedia(await compressImage(file)); setMediaType('image'); }
  };

  const suggestion = role ? (kind === 'arrumando' ? `Me arrumando pro rolê ${noBairro(role.bairro)} ✨` : `Brotei no ${role.nome} 🔥`) : '';

  const publish = async () => {
    if (!media) return setErr('Escolhe uma foto ou vídeo');
    setBusy(true);
    try {
      await addPost({ mediaUrl: media, mediaType, legenda: legenda || suggestion, roleId, tipo: kind });
      back(); setTimeout(() => navigate(kind === 'arrumando' ? 'reels' : 'home'), 30);
    } catch (e) { console.error(e); setErr('Não deu pra postar. Tenta uma foto menor.'); }
    setBusy(false);
  };

  return (
    <div className="overlay-screen">
      <Header title="Novo post" onBack={back} right={<button className="link strong" onClick={publish} disabled={busy}>{busy ? '…' : 'Postar'}</button>} />
      <div className="pad">
        <div className="segmented">
          <button className={kind === 'arrumando' ? 'on' : ''} onClick={() => setKind('arrumando')}>💄 Me arrumando</button>
          <button className={kind === 'feed' ? 'on' : ''} onClick={() => setKind('feed')}>📸 Foto do rolê</button>
        </div>
        <label className={`media-pick ${media ? 'has' : ''}`}>
          {media ? (mediaType === 'video' ? <video src={media} muted loop autoPlay playsInline /> : <img src={media} alt="" />) : (
            <div className="media-pick-empty"><I.Camera size={40} /><b>Escolher foto ou vídeo</b><span className="muted small">da galeria ou câmera</span></div>
          )}
          <input type="file" accept="image/*,video/*" onChange={pick} hidden />
        </label>
        <label className="field"><span>Legenda</span>
          <textarea rows={3} value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder={suggestion || 'Me arrumando pro rolê na Lapa 💃'} maxLength={220} />
        </label>
        <label className="field"><span>Qual rolê você vai?</span>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="">Nenhum rolê</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.nome} · {r.bairro}</option>)}
          </select>
        </label>
        {err && <p className="error">{err}</p>}
        <button className="btn-primary block" onClick={publish} disabled={busy}>{busy ? 'Postando…' : 'Compartilhar'}</button>
      </div>
    </div>
  );
}
