import type { FeedItem } from './PostCard';

export function Grid({ items, urls }: { items: FeedItem[]; urls: Record<string, string> }) {
  if (!items.length) return <div className="vazio">Nenhuma postagem ainda.</div>;
  return (
    <div className="grade">
      {items.map(p => {
        const src = p.media_path ? urls[p.media_path] : undefined;
        return (
          <div key={p.id} className="thumb" style={{ background: p.type === 'text' ? (p.bg || 'var(--tinta)') : 'var(--noite)' }}>
            {p.type === 'photo' && src && <img src={src} alt="" loading="lazy" />}
            {p.type === 'video' && src && <video src={src} muted preload="metadata" />}
            {p.type === 'text' && <span className="tt">{p.text}</span>}
            {p.type === 'video' && <svg className="ic" viewBox="0 0 24 24" fill="#fff"><path d="M7 4.5v15l13-7.5z" /></svg>}
          </div>
        );
      })}
    </div>
  );
}
