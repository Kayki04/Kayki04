import { useState } from 'react';
import { useApp } from '../AppContext';
import { Avatar, Empty, Header, Photo } from '../components/ui';
import RoleRow from '../components/RoleRow';
import { ProfileForm } from './Login';
import { statusLabel } from '../utils';
import * as I from '../components/Icons';

export default function Profile({ userId }) {
  const { uid, users, posts, checkins, roles, matches, navigate, back, logout, isVip, mode, showToast } = useApp();
  const id = userId || uid;
  const own = id === uid;
  const user = users[id];
  const [tab, setTab] = useState('fotos');
  const [editing, setEditing] = useState(false);
  if (!user) return null;

  const myPosts = posts.filter((p) => p.userId === id);
  const visited = checkins.filter((c) => c.userId === id).sort((a, b) => b.createdAt - a.createdAt)
    .map((c) => ({ ...c, role: roles.find((r) => r.id === c.roleId) })).filter((c) => c.role);
  const recs = (user.recomendacoes || []).map((rid) => roles.find((r) => r.id === rid)).filter(Boolean);
  const st = statusLabel(user.status);
  const matched = matches.find((m) => m.users.includes(id) && m.users.includes(uid));

  if (editing) {
    return (
      <div className="overlay-screen">
        <Header title="Editar perfil" onBack={() => setEditing(false)} />
        <div className="pad"><ProfileForm initial={user} title="" onDone={() => { setEditing(false); showToast('Perfil atualizado'); }} /></div>
      </div>
    );
  }

  return (
    <div className={own && !userId ? 'screen' : 'overlay-screen'}>
      <Header
        onBack={userId ? back : undefined}
        title={<span className="row gap-s">{user.nome}{user.vip && <span className="vip-mini"><I.Crown size={12} filled /></span>}</span>}
        right={own && <button className="icon-btn" onClick={logout} aria-label="Sair"><I.Logout /></button>}
      />
      <div className="profile-top">
        <Avatar user={user} size={86} ring />
        <div className="profile-stats">
          <div><b>{myPosts.length}</b><span>posts</span></div>
          <div><b>{new Set(visited.map((v) => v.roleId)).size}</b><span>rolês</span></div>
          <div><b>{own ? matches.length : recs.length}</b><span>{own ? 'matches' : 'indicações'}</span></div>
        </div>
      </div>
      <div className="profile-bio">
        <b>{user.nome}, {user.idade}</b>
        <span className="pill">{st.emoji} {st.label}</span>
        <span className="muted small"><I.Pin size={13} /> {user.bairro}, Rio de Janeiro</span>
        {user.bio && <p>{user.bio}</p>}
      </div>
      <div className="profile-buttons">
        {own ? (
          <>
            <button className="btn-gray" onClick={() => setEditing(true)}>Editar perfil</button>
            {isVip ? <button className="btn-gray"><I.Crown size={14} filled /> VIP ativo</button>
              : <button className="btn-vip wide" onClick={() => navigate('vip', {})}><I.Crown size={14} filled /> Assinar VIP</button>}
          </>
        ) : matched ? (
          <button className="btn-primary" onClick={() => navigate('chat', { id: matched.id })}>Mensagem</button>
        ) : (
          <button className="btn-gray" onClick={() => navigate('match')}>Ver no Match</button>
        )}
      </div>
      {own && mode === 'demo' && <p className="tiny muted center">Modo demo · dados salvos neste aparelho</p>}

      <div className="tabs">
        <button className={tab === 'fotos' ? 'on' : ''} onClick={() => setTab('fotos')}><I.Grid size={22} /></button>
        <button className={tab === 'roles' ? 'on' : ''} onClick={() => setTab('roles')}><I.Pin size={22} /></button>
        <button className={tab === 'recs' ? 'on' : ''} onClick={() => setTab('recs')}><I.Star size={22} /></button>
      </div>

      {tab === 'fotos' && (myPosts.length ? (
        <div className="grid3">
          {myPosts.map((p) => (
            <div key={p.id} className="grid-cell" onClick={() => navigate('comments', { id: p.id })}>
              {p.mediaType === 'video' ? <video src={p.mediaUrl} muted /> : <Photo src={p.mediaUrl} alt={p.legenda} />}
              {p.tipo === 'arrumando' && <span className="grid-icon"><I.Reels size={16} filled /></span>}
            </div>
          ))}
        </div>
      ) : <Empty icon="📸" title={own ? 'Compartilhe teu primeiro rolê' : 'Nenhum post ainda'} action={own && <button className="btn-primary" onClick={() => navigate('newpost', { tipo: 'arrumando' })}>Postar</button>} />)}

      {tab === 'roles' && (
        <div className="section">
          <div className="section-head"><h3>{own ? 'Meus rolês' : 'Rolês'}</h3></div>
          {visited.map((v) => (
            <div key={v.id} className="visited">
              <span className={`tag ${v.status}`}>{{ aqui: 'Tá lá agora', vou: 'Vai', fui: 'Foi' }[v.status]}</span>
              <RoleRow role={v.role} />
            </div>
          ))}
          {!visited.length && <p className="muted center small pad">Nenhum rolê ainda. Bora brotar?</p>}
        </div>
      )}

      {tab === 'recs' && (
        <div className="section">
          <div className="section-head"><h3>{own ? 'Minhas indicações' : 'Indicações'}</h3></div>
          {recs.map((r) => <RoleRow key={r.id} role={r} />)}
          {!recs.length && <p className="muted center small pad">{own ? 'Toque na ⭐ na página de um rolê pra indicar.' : 'Sem indicações ainda.'}</p>}
        </div>
      )}
    </div>
  );
}
