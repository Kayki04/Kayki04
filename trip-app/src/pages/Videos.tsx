import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeed, useUrls } from '../lib/feed';
import { num } from '../lib/format';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { CommentsSheet } from '../components/CommentsSheet';
import type { FeedItem } from '../components/PostCard';
import { supabase } from '../lib/supabase';

function Reel({ p, urls, onComments }: { p: FeedItem; urls: Record<string, string>; onComments: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(p.liked_by_me);
  const [count, setCount] = useState(p.like_count);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.6 });
    io.observe(v); return () => io.disconnect();
  }, []);
  const like = async () => { setLiked(!liked); setCount(c => c + (liked ? -1 : 1)); await supabase.rpc('toggle_like', { p_post: p.id }); };
  return (
    <section className="reel" aria-label={'Vídeo de ' + p.author_handle}>
      <video ref={ref} className="reel-video" src={p.media_path ? urls[p.media_path] : undefined} muted loop playsInline preload="metadata" />
      <div className="lado">
        <button className="acao like-btn" aria-label="Curtir" aria-pressed={liked} onClick={like}><Icon.heart /><span>{num(count)}</span></button>
        <button className="acao" aria-label="Comentários" onClick={onComments}><Icon.chat /><span>{num(p.comment_count)}</span></button>
      </div>
      <div className="info">
        <Link className="quem-r" to={'/u/' + p.author_handle}><Avatar id={p.author_id} name={p.author_name} url={p.author_avatar ? urls[p.author_avatar] : null} size={36} /><span>{p.author_handle}</span>{p.author_is_creator && <span className="selo">criador</span>}</Link>
        {p.text && <p>{p.text}</p>}
      </div>
    </section>
  );
}

export default function Videos() {
  const q = useFeed({ type: 'video' });
  const items = q.data?.pages.flat() ?? [];
  const urls = useUrls(items);
  const [comments, setComments] = useState<string | null>(null);
  if (q.isLoading) return <div className="vazio" style={{ color: '#c9c4d4' }}>Carregando…</div>;
  if (!items.length) return <div className="vazio" style={{ color: '#c9c4d4' }}>Ainda não tem vídeos. Poste o primeiro pelo botão +.</div>;
  return (
    <>
      {items.map(p => <Reel key={p.id} p={p} urls={urls} onComments={() => setComments(p.id)} />)}
      {q.hasNextPage && <button className="btn btn-linha carregar" onClick={() => q.fetchNextPage()}>Carregar mais</button>}
      {comments && <CommentsSheet postId={comments} onClose={() => setComments(null)} />}
    </>
  );
}
