import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { num } from '../lib/format';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

export type FeedItem = {
  id: string; author_id: string; type: 'photo' | 'video' | 'text'; text: string; bg: string | null; media_path: string | null;
  sensitive: boolean; adult: boolean; status: string; created_at: string;
  like_count: number; comment_count: number; liked_by_me: boolean;
  author_handle: string; author_name: string; author_avatar: string | null; author_is_creator: boolean;
};

type Props = { post: FeedItem; urls: Record<string, string>; onMore?: (p: FeedItem) => void; onComments?: (p: FeedItem) => void; mine?: boolean };

export function PostCard({ post: p, urls, onMore, onComments, mine }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [liked, setLiked] = useState(p.liked_by_me);
  const [count, setCount] = useState(p.like_count);
  const qc = useQueryClient();
  const like = useMutation({
    mutationFn: async () => { const { data, error } = await supabase.rpc('toggle_like', { p_post: p.id }); if (error) throw error; return data as boolean; },
    onMutate: () => { setLiked(v => !v); setCount(c => c + (liked ? -1 : 1)); },
    onError: () => { setLiked(p.liked_by_me); setCount(p.like_count); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const blur = p.sensitive && !revealed ? (
    <div className="blur"><b>Conteúdo sensível</b><span>Pode conter cenas fortes, como violência ou sangue.</span>
      <button className="reveal" onClick={() => setRevealed(true)}>Toque para ver</button></div>
  ) : null;
  const extras = (
    <>
      <Link className="autor" to={`/u/${p.author_handle}`}>
        <Avatar id={p.author_id} name={p.author_name} url={p.author_avatar ? urls[p.author_avatar] : null} />
        <span className="quem"><span className="nome"><b>{p.author_handle}</b>{p.author_is_creator && <span className="selo">criador</span>}</span><small>{p.author_name}</small></span>
      </Link>
      {p.status === 'pending' && <div className="tags"><span className="tag">Em análise</span></div>}
      {onMore && <button className="mais-btn" aria-label="Mais opções" onClick={() => onMore(p)}><Icon.dots /></button>}
    </>
  );
  const claro = p.type === 'text' && !p.bg;
  const src = p.media_path ? urls[p.media_path] : undefined;

  return (
    <article className="post" data-id={p.id} data-type={p.type}>
      {p.type === 'text' ? (
        <div className={'texto-post' + (claro ? ' claro' : '')} style={{ background: claro ? 'var(--nevoa)' : p.bg! }}>
          <span>{p.text}</span>{blur}{extras}
        </div>
      ) : (
        <div className="midia">
          {p.type === 'photo'
            ? (src ? <img className="foto" src={src} alt={p.text || 'Foto de ' + p.author_handle} loading="lazy" /> : <div className="arte" />)
            : (src ? <FeedVideo src={src} /> : <div className="arte" />)}
          {blur}{extras}
        </div>
      )}
      {p.type !== 'text' && p.text && <p className="legenda">{p.text}</p>}
      <div className="acoes">
        <button className="acao like-btn" aria-label="Curtir" aria-pressed={liked} onClick={() => like.mutate()}><Icon.heart /><span>{num(count)}</span></button>
        <button className="acao comment-btn" aria-label="Comentários" onClick={() => onComments?.(p)}><Icon.chat /><span>{num(p.comment_count)}</span></button>
        {mine ? null : <button className="acao" aria-label="Enviar"><Icon.send /></button>}
      </div>
    </article>
  );
}

/** Vídeo do feed: toca sem som quando aparece na tela; tocar liga/desliga o som. */
function FeedVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.6 });
    io.observe(v); return () => io.disconnect();
  }, []);
  return (
    <>
      <video ref={ref} className="foto" src={src} muted={muted} loop playsInline preload="metadata" onClick={() => setMuted(m => !m)} />
      <button className="som" aria-label={muted ? 'Ligar som' : 'Desligar som'} onClick={() => setMuted(m => !m)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />{muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" />}</svg>
      </button>
    </>
  );
}
