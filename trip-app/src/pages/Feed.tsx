import { useFeed, useUrls } from '../lib/feed';
import { PostCard } from '../components/PostCard';
import { useSession } from '../lib/auth';

export default function Feed() {
  const { profile } = useSession();
  const q = useFeed();
  const items = q.data?.pages.flat() ?? [];
  const urls = useUrls(items);
  return (
    <>
      <header className="cab"><p className="logo">trip</p></header>
      <div className="feed">
        {q.isLoading && <div className="vazio">Carregando…</div>}
        {q.isError && <div className="vazio">Não conseguimos carregar o feed. Puxe para atualizar.</div>}
        {!q.isLoading && !items.length && <div className="vazio feed-vazio"><b style={{ color: 'var(--tinta)' }}>Nada por aqui ainda</b><span>Seja a primeira pessoa a postar.</span></div>}
        {items.map(p => <PostCard key={p.id} post={p} urls={urls} mine={p.author_id === profile?.id} />)}
        {q.hasNextPage && <button className="btn btn-linha carregar" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>Carregar mais</button>}
      </div>
    </>
  );
}
