import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { removeMedia, uploadMedia, validateFile, type MediaKind } from '../lib/media';
import { blockedTerm } from '../lib/moderation';
import { useToast } from '../components/Toast';

type PostType = 'photo' | 'video' | 'text';
const CORES = ['', '#FF0A78', '#8A2BE2', '#14121A', '#FF8A00', '#0a7fa3'];

export default function NewPost() {
  const [type, setType] = useState<PostType>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileErr, setFileErr] = useState('');
  const [text, setText] = useState('');
  const [bg, setBg] = useState('#FF0A78');
  const [sensitive, setSensitive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const pick = (f: File | undefined) => {
    setFileErr(''); setFile(null); setPreview(null);
    if (!f) return;
    const err = validateFile(f, type as MediaKind);
    if (err) return setFileErr(err);
    setFile(f); setPreview(URL.createObjectURL(f));
  };
  const switchType = (t: PostType) => { setType(t); setFile(null); setPreview(null); setFileErr(''); setBlocked(null); };

  const blockMsg = (term: string) => `Encontramos um termo proibido (“${term}”). Conteúdo que remete a menores de idade é proibido na Trip e não foi publicado.`;
  const ready = type === 'text' ? text.trim().length > 0 : !!file;

  const publish = async () => {
    setBlocked(null);
    const local = blockedTerm(text);
    setBusy(true);
    try {
      // o banco decide; se o filtro local já pegou, ainda chamamos o banco para registrar a revisão
      const media_path = type !== 'text' && file && !local ? await uploadMedia(file, type as MediaKind) : null;
      const { data, error } = await supabase.rpc('create_post', { p_type: type, p_text: text, p_bg: type === 'text' ? (bg || null) : null, p_media_path: media_path ?? (type === 'text' ? null : 'x'), p_sensitive: sensitive });
      if (error) { await removeMedia([media_path]); throw error; }
      const r = data as { ok: boolean; error?: string; term?: string };
      if (!r.ok) {
        await removeMedia([media_path]);
        if (r.error === 'blocked_term' || local) { setBlocked(blockMsg(r.term ?? local!)); qc.invalidateQueries({ queryKey: ['me'] }); }
        else setBlocked('Não foi possível publicar. Confira os campos.');
        return;
      }
      await qc.invalidateQueries({ queryKey: ['feed'] });
      toast('Publicado!');
      nav('/');
    } catch (e) {
      setBlocked((e as Error).message?.includes('MB') ? (e as Error).message : 'Não foi possível publicar. Verifique sua conexão e tente de novo.');
    } finally { setBusy(false); }
  };

  return (
    <>
      <header className="cab"><h1>Nova postagem</h1></header>
      <div className="secao">
        <div className="seg" role="group" aria-label="Tipo de postagem">
          {([['photo', 'Foto'], ['video', 'Vídeo'], ['text', 'Texto']] as const).map(([t, l]) =>
            <button key={t} aria-pressed={type === t} onClick={() => switchType(t)}>{l}</button>)}
        </div>

        {type === 'text' ? (
          <>
            <div className="campo"><span style={{ fontWeight: 700, fontSize: 14 }}>Cor de fundo</span>
              <div className="cores">{CORES.map(c => <button key={c || 'none'} className="cor" aria-pressed={bg === c} aria-label={c ? 'Cor ' + c : 'Sem cor'} style={{ background: c || 'var(--nevoa)' }} onClick={() => setBg(c)} />)}</div></div>
            <div className={'texto-post preview-texto' + (bg ? '' : ' claro')} id="post-preview" style={{ background: bg || 'var(--nevoa)' }}><span>{text || 'Seu texto aparece assim no feed'}</span></div>
          </>
        ) : preview ? (
          <div className="preview">{type === 'photo' ? <img src={preview} alt="Prévia" /> : <video src={preview} controls playsInline />}
            <button className="btn btn-linha btn-p" style={{ position: 'absolute', top: 10, right: 10 }} onClick={() => pick(undefined)}>Trocar</button></div>
        ) : (
          <label className="escolher">
            <input type="file" aria-label={type === 'photo' ? 'Escolher foto' : 'Escolher vídeo'} accept={type === 'photo' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm,video/quicktime'} onChange={e => pick(e.target.files?.[0])} />
            {type === 'photo' ? 'Escolher foto' : 'Escolher vídeo'}
            <span className="dica">{type === 'photo' ? 'JPG, PNG ou WEBP até 15 MB' : 'MP4, WEBM ou MOV até 200 MB'}</span>
          </label>
        )}
        {fileErr && <p className="erro" role="alert">{fileErr}</p>}

        <div className="campo"><label htmlFor="post-text">{type === 'text' ? 'Texto' : 'Legenda'}</label>
          <textarea id="post-text" maxLength={2200} value={text} onChange={e => setText(e.target.value)} placeholder={type === 'text' ? 'Escreva o que quiser…' : 'Conte algo sobre a postagem…'} />
          <span className="contador">{text.length}/2200</span></div>

        <label className="chave" htmlFor="post-sensitive"><span><b>Conteúdo sensível</b><small>Violência, sangue ou cenas fortes ficam borrados até a pessoa tocar.</small></span>
          <input type="checkbox" id="post-sensitive" checked={sensitive} onChange={e => setSensitive(e.target.checked)} /></label>

        {blocked && <div id="post-blocked" role="alert"><b>Postagem bloqueada</b><span>{blocked}</span><span><b>Perfil em revisão:</b> nossa equipe vai analisar suas outras postagens.</span></div>}
        <button className="btn btn-marca btn-bloco" onClick={publish} disabled={!ready || busy}>{busy ? 'Publicando…' : 'Publicar'}</button>
        <p className="regras-mod">Conteúdo com menores de idade, sem consentimento ou com mutilação e morte é removido. Termos ligados a menores bloqueiam a postagem e colocam o perfil em revisão.</p>
      </div>
    </>
  );
}
