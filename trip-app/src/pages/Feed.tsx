import { useState } from 'react';
import { useFeed, useUrls } from '../lib/feed';
import { PostList } from '../components/PostList';
import { StoryBar } from '../components/Stories';

const FILTROS = [['para-voce', 'Para você'], ['seguindo', 'Seguindo']] as const;

export default function Feed() {
  const [filter, setFilter] = useState<'para-voce' | 'seguindo'>('para-voce');
  const q = useFeed({ filter });
  const items = q.data?.pages.flat() ?? [];
  const urls = useUrls(items);
  return (
    <>
      <header className="cab"><p className="logo">trip</p></header>
      <div className="filtros" role="group" aria-label="Filtrar feed">
        {FILTROS.map(([k, l]) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {filter === 'para-voce' && <StoryBar />}
      <div className="feed">
        {q.isLoading && <div className="vazio">Carregando…</div>}
        {q.isError && <div className="vazio">Não conseguimos carregar o feed. Tente de novo em instantes.</div>}
        {!q.isLoading && !items.length && <div className="vazio feed-vazio"><b style={{ color: 'var(--tinta)' }}>Nada por aqui ainda</b>
          <span>{filter === 'seguindo' ? 'Siga criadores para ver os posts deles aqui.' : 'Seja a primeira pessoa a postar.'}</span></div>}
        <PostList items={items} urls={urls} />
        {q.hasNextPage && <button className="btn btn-linha carregar" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>Carregar mais</button>}
      </div>
    </>
  );
}
