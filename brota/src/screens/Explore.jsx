import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import MapView from '../components/MapView';
import RoleRow from '../components/RoleRow';
import { LiveDot, Photo } from '../components/ui';
import { ZONAS, distanceKm } from '../utils';
import * as I from '../components/Icons';

export default function Explore() {
  const { roles, posts, peopleAt, myPoint, setMyLocation, navigate, showToast } = useApp();
  const [q, setQ] = useState('');
  const [zona, setZona] = useState('Todos');
  const [view, setView] = useState('mapa');

  const filtered = useMemo(() => roles
    .filter((r) => zona === 'Todos' || (zona === 'Agora' ? r.live : r.zona === zona))
    .filter((r) => !q || `${r.nome} ${r.bairro} ${r.tags?.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.live - a.live) || ((distanceKm(myPoint, a) ?? 0) - (distanceKm(myPoint, b) ?? 0))), [roles, zona, q, myPoint]);

  const gridPosts = posts.filter((p) => filtered.some((r) => r.id === p.roleId));

  const locate = () => {
    if (!navigator.geolocation) return showToast('Localização indisponível');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); showToast('Distâncias atualizadas 📍'); },
      () => showToast('Não deu pra pegar tua localização'),
    );
  };

  return (
    <div className="screen">
      <div className="search-bar">
        <I.Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar rolê, bairro, ritmo…" />
        {q && <button className="icon-btn" onClick={() => setQ('')}><I.Close size={16} /></button>}
      </div>
      <div className="chips-row">
        {['Todos', 'Agora', ...ZONAS].map((z) => (
          <button key={z} className={`chip ${zona === z ? 'on' : ''}`} onClick={() => setZona(z)}>{z === 'Agora' ? '🔴 Rolando agora' : z}</button>
        ))}
      </div>
      <div className="segmented">
        <button className={view === 'mapa' ? 'on' : ''} onClick={() => setView('mapa')}><I.Map size={18} /> Mapa</button>
        <button className={view === 'grade' ? 'on' : ''} onClick={() => setView('grade')}><I.Grid size={18} /> Fotos</button>
      </div>

      {view === 'mapa' ? (
        <>
          <div className="map-wrap">
            <MapView roles={filtered} />
            <span className="map-legend"><LiveDot /> ROLANDO AGORA · {filtered.filter((r) => r.live).length}</span>
            <button className="map-locate" onClick={locate}><I.Location size={18} /></button>
          </div>
          <section className="section">
            <div className="section-head"><h3>Rolês perto de você</h3><span className="muted small">{filtered.length} rolês</span></div>
            {filtered.map((r) => <RoleRow key={r.id} role={r} />)}
            {!filtered.length && <p className="muted center pad">Nenhum rolê encontrado.</p>}
          </section>
        </>
      ) : (
        <div className="explore-grid">
          {filtered.map((r) => (
            <div key={r.id} className="grid-cell" onClick={() => navigate('role', { id: r.id })}>
              <Photo src={r.capa} alt={r.nome} />
              <span className="grid-label">{r.live && '● '}{r.nome}<small>{peopleAt(r.id).length} lá</small></span>
            </div>
          ))}
          {gridPosts.map((p) => (
            <div key={p.id} className="grid-cell" onClick={() => navigate('role', { id: p.roleId })}>
              <Photo src={p.mediaUrl} alt={p.legenda} />
              {p.tipo === 'arrumando' && <span className="grid-icon"><I.Reels size={16} filled /></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
