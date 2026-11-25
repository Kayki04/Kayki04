import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { removeMedia, signedUrls, uploadMedia, validateFile } from '../lib/media';
import { blockedTerm } from '../lib/moderation';
import { useSession } from '../lib/auth';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { useToast } from './Toast';

type S = { id: string; author_id: string; author_handle: string; author_name: string; author_avatar: string | null; media_path: string | null; bg: string | null; text: string; created_at: string; seen: boolean };
type Group = { author_id: string; handle: string; name: string; avatar: string | null; items: S[]; seen: boolean };

function useStories() {
  const q = useQuery({ queryKey: ['stories'], queryFn: async () => { const { data, error } = await supabase.rpc('active_stories'); if (error) throw error; return data as S[]; } });
  const paths = (q.data ?? []).flatMap(s => [s.media_path, s.author_avatar]).filter((x): x is string => !!x).sort();
  const urls = useQuery({ queryKey: ['urls', paths], queryFn: () => signedUrls(paths), enabled: paths.length > 0, staleTime: 30 * 60_000 }).data ?? {};
  const groups = useMemo(() => {
    const m = new Map<string, Group>();
    for (const s of q.data ?? []) {
      const g = m.get(s.author_id) ?? { author_id: s.author_id, handle: s.author_handle, name: s.author_name, avatar: s.author_avatar, items: [], seen: true };
      g.items.push(s); g.seen = g.seen && s.seen; m.set(s.author_id, g);
    }
    return [...m.values()].sort((a, b) => Number(a.seen) - Number(b.seen));
  }, [q.data]);
  return { groups, urls };
}

const CORES = ['#FF0A78', '#8A2BE2', '#14121A', '#FF8A00', '#0a7fa3'];

function NewStory({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [bg, setBg] = useState(CORES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient(); const toast = useToast();
  const go = async () => {
    setErr('');
    const local = blockedTerm(text);
    setBusy(true);
    try {
      const path = file && !local ? await uploadMedia(file, file.type.startsWith('video') ? 'video' : 'photo') : null;
      const { data, error } = await supabase.rpc('create_story', { p_media_path: path, p_bg: bg, p_text: text });
      if (error) { await removeMedia([path]); throw error; }
      const r = data as { ok: boolean; error?: string; term?: string };
      if (!r.ok) { await removeMedia([path]); setErr(r.error === 'blocked_term' ? `Termo proibido (“${r.term}”). O story não foi publicado e seu perfil entrou em revisão.` : 'Escreva algo ou escolha uma foto.'); return; }
      await qc.invalidateQueries({ queryKey: ['stories'] }); toast('Story publicado. Some em 24 horas.'); onClose();
    } catch { setErr('Não foi possível publicar. Tente de novo.'); } finally { setBusy(false); }
  };
  return (
    <Sheet title="Novo story" onClose={onClose}>
      <div className="story-prev" style={{ background: bg }}><span>{text || 'Seu story aparece assim'}</span></div>
      <div className="cores">{CORES.map(c => <button key={c} className="cor" aria-pressed={bg === c} aria-label={'Cor ' + c} style={{ background: c }} onClick={() => setBg(c)} />)}</div>
      <div className="campo"><label htmlFor="st-text">Texto do story</label><input id="st-text" maxLength={200} value={text} onChange={e => setText(e.target.value)} /></div>
      <div className="campo"><label htmlFor="st-file">Foto ou vídeo (opcional)</label>
        <input id="st-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={e => { const f = e.target.files?.[0]; if (!f) return setFile(null); const v = validateFile(f, f.type.startsWith('video') ? 'video' : 'photo'); setErr(v || ''); setFile(v ? null : f); }} /></div>
      {err && <p className="erro" role="alert">{err}</p>}
      <button className="btn btn-marca btn-bloco" disabled={busy || (!text.trim() && !file)} onClick={go}>Publicar story</button>
    </Sheet>
  );
}

function Viewer({ group, urls, onClose }: { group: Group; urls: Record<string, string>; onClose: () => void }) {
  const [i, setI] = useState(0);
  const t = useRef<number>();
  const pending = useRef<PromiseLike<unknown>[]>([]);
  const s = group.items[i];
  useEffect(() => {
    if (!s) { Promise.all(pending.current).then(onClose); return; }
    // o cliente do Supabase só envia a chamada quando alguém espera o resultado
    pending.current.push(supabase.rpc('mark_story_seen', { p_story: s.id }).then(() => undefined));
    t.current = window.setTimeout(() => setI(x => x + 1), 5000);
    return () => clearTimeout(t.current);
  }, [s, onClose]);
  if (!s) return null;
  const src = s.media_path ? urls[s.media_path] : undefined;
  const isVideo = s.media_path && /\.(mp4|webm|mov)$/.test(s.media_path);
  return (
    <div className="story-viewer" role="dialog" aria-label={'Story de ' + group.handle} data-frame={i}>
      <div className="fundo" style={{ background: s.bg || 'var(--noite)' }}>
        {src && (isVideo ? <video src={src} autoPlay muted playsInline /> : <img src={src} alt="" />)}
      </div>
      <div className="barras">{group.items.map((_, k) => <span key={k} className={k < i ? 'feito' : k === i ? 'atual' : ''}><i /></span>)}</div>
      <div className="topo-s"><Avatar id={group.author_id} name={group.name} url={group.avatar ? urls[group.avatar] : null} size={34} /><b>{group.handle}</b>
        <button className="fechar" aria-label="Fechar" onClick={() => Promise.all(pending.current).then(onClose)}><Icon.close /></button></div>
      {s.text && <p className="frase">{s.text}</p>}
      <button className="story-prev-z" aria-label="Anterior" onClick={() => setI(x => Math.max(0, x - 1))} />
      <button className="story-next-z" aria-label="Próximo" onClick={() => setI(x => x + 1)} />
    </div>
  );
}

export function StoryBar() {
  const { profile } = useSession();
  const { groups, urls } = useStories();
  const [open, setOpen] = useState<Group | null>(null);
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();
  return (
    <>
      <div className="agora"><b>Agora</b><small>Some em 24h</small></div>
      <div className="stories">
        <button className="story meu" aria-label="Criar story" onClick={() => setCreating(true)}><span className="mais-s">+</span><span>Seu story</span></button>
        {groups.map(g => {
          const first = g.items[0];
          const src = first.media_path && !/\.(mp4|webm|mov)$/.test(first.media_path) ? urls[first.media_path] : undefined;
          return (
            <button key={g.author_id} className={'story' + (g.seen ? ' visto' : '')} data-seen={g.seen} aria-label={'Story de ' + g.handle}
              style={{ background: src ? `center/cover url("${src}")` : first.bg || 'var(--marca)' }} onClick={() => setOpen(g)}>
              {!g.seen && <span className="novo">NOVO</span>}
              <Avatar id={g.author_id} name={g.name} url={g.avatar ? urls[g.avatar] : null} />
              <span className="h">{g.author_id === profile?.id ? 'você' : g.handle}</span>
            </button>
          );
        })}
      </div>
      {open && <Viewer group={open} urls={urls} onClose={() => { setOpen(null); qc.invalidateQueries({ queryKey: ['stories'] }); }} />}
      {creating && <NewStory onClose={() => setCreating(false)} />}
    </>
  );
}
