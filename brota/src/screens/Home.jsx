import { useApp } from '../AppContext';
import PostCard from '../components/PostCard';
import RoleRow from '../components/RoleRow';
import { StoriesBar } from '../components/Stories';
import { Header, Photo } from '../components/ui';
import * as I from '../components/Icons';

export default function Home() {
  const { posts, roles, navigate, currentCheckin, matches } = useApp();
  const feed = posts.filter((p) => p.tipo === 'feed');
  const current = roles.find((r) => r.id === currentCheckin?.roleId);
  const hot = roles.filter((r) => r.live).slice(0, 3);
  return (
    <div className="screen">
      <Header logo right={<>
        <button className="icon-btn" onClick={() => navigate('newpost', { tipo: 'feed' })} aria-label="Postar"><I.PlusSquare /></button>
        <button className="icon-btn badge-wrap" onClick={() => navigate('match', { tab: 'chats' })} aria-label="Conversas">
          <I.Chat />{matches.length > 0 && <span className="dot-badge" />}
        </button>
      </>} />
      <StoriesBar />
      {current && (
        <div className="here-banner" onClick={() => navigate('role', { id: current.id })}>
          <Photo src={current.capa} alt={current.nome} className="here-img" />
          <div><span className="tiny">VOCÊ TÁ NO</span><b>{current.nome}</b></div>
          <button className="btn-small" onClick={(e) => { e.stopPropagation(); navigate('match'); }}>Ver quem tá aqui</button>
        </div>
      )}
      {feed.slice(0, 2).map((p) => <PostCard key={p.id} post={p} />)}
      <section className="section">
        <div className="section-head"><h3>🔥 Bombando agora</h3><button className="link" onClick={() => navigate('explore')}>Ver mapa</button></div>
        {hot.map((r) => <RoleRow key={r.id} role={r} />)}
      </section>
      {feed.slice(2).map((p) => <PostCard key={p.id} post={p} />)}
      <p className="muted center small pad">Você viu tudo por agora ✨</p>
    </div>
  );
}
