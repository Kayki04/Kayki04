import { useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { Avatar, Empty, Header, Photo } from '../components/ui';
import RoleRow from '../components/RoleRow';
import { bairroInfo, distanceKm, formatKm, statusLabel, timeAgo } from '../utils';
import * as I from '../components/Icons';

function SwipeCard({ user, role, onSwipe, top, flingRef }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState(null);
  const start = useRef(null);
  const st = statusLabel(user.status);

  const down = (e) => { if (!top) return; start.current = { x: e.clientX, y: e.clientY }; setDrag({ x: 0, y: 0, active: true }); e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => { if (!start.current) return; setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true }); };
  const up = () => {
    if (!start.current) return; start.current = null;
    if (Math.abs(drag.x) > 110) fling(drag.x > 0 ? 'like' : 'pass');
    else setDrag({ x: 0, y: 0, active: false });
  };
  const fling = async (tipo) => {
    const ok = await onSwipe(user, tipo);
    if (ok === false) { setDrag({ x: 0, y: 0, active: false }); return; }
    setLeaving(tipo);
  };
  if (top && flingRef) flingRef.current = fling;

  const x = leaving ? (leaving === 'pass' ? -600 : 600) : drag.x;
  const y = leaving === 'super' ? -800 : drag.y * 0.3;
  const style = {
    transform: `translate(${x}px, ${y}px) rotate(${x / 18}deg) ${top ? '' : 'scale(.95) translateY(14px)'}`,
    transition: drag.active && !leaving ? 'none' : 'transform .35s ease',
  };
  return (
    <div className="swipe-card" style={style} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <Photo src={user.foto} alt={user.nome} label={user.nome} />
      <div className="swipe-shade" />
      <span className="stamp like" style={{ opacity: Math.max(0, drag.x / 120) }}>CURTIR</span>
      <span className="stamp nope" style={{ opacity: Math.max(0, -drag.x / 120) }}>PASSAR</span>
      <div className="swipe-info">
        <h2>{user.nome.split(' ')[0]}, {user.idade}</h2>
        <span className="pill white">{st.emoji} {st.label}</span>
        <p>{user.bio}</p>
        <span className="small"><I.Pin size={14} /> Mora em {user.bairro}{role ? ` · tá no ${role.nome}` : ''}</span>
      </div>
    </div>
  );
}

function Deck({ roleIds }) {
  const { checkins, users, uid, swipedIds, swipe, likesLeft, isVip, navigate, roles } = useApp();
  const [roleFilter, setRoleFilter] = useState('todos');
  const [gone, setGone] = useState(new Set());
  const flingRef = useRef(null);

  const cards = useMemo(() => {
    const seen = new Set();
    return checkins
      .filter((c) => roleIds.includes(c.roleId) && (roleFilter === 'todos' || c.roleId === roleFilter))
      .filter((c) => c.status === 'aqui' || c.status === 'vou')
      .filter((c) => c.userId !== uid && !swipedIds.has(c.userId))
      .filter((c) => { if (seen.has(c.userId)) return false; seen.add(c.userId); return true; })
      .map((c) => ({ user: users[c.userId], roleId: c.roleId }))
      .filter((c) => c.user);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleIds.join(), roleFilter, uid, users, checkins]);
  // swipedIds fica fora das deps de propósito: a carta sai com animação antes de sumir
  const stack = cards.filter((c) => !gone.has(c.user.id));

  const onSwipe = async (user, tipo) => {
    const card = stack.find((c) => c.user.id === user.id);
    const res = await swipe(user, tipo, card?.roleId);
    if (res.blocked) { navigate('vip', { reason: res.blocked === 'vip' ? 'super' : 'limit' }); return false; }
    setTimeout(() => setGone((g) => new Set(g).add(user.id)), 300);
    if (res.matchId) setTimeout(() => navigate('itsamatch', { userId: user.id, matchId: res.matchId }), 350);
    return true;
  };

  const top = stack[0];
  return (
    <>
      {roleIds.length > 1 && (
        <div className="chips-row">
          <button className={`chip ${roleFilter === 'todos' ? 'on' : ''}`} onClick={() => setRoleFilter('todos')}>Todos meus rolês</button>
          {roleIds.map((id) => { const r = roles.find((x) => x.id === id); return r && (
            <button key={id} className={`chip ${roleFilter === id ? 'on' : ''}`} onClick={() => setRoleFilter(id)}>{r.nome}</button>
          ); })}
        </div>
      )}
      <div className="deck">
        {stack.length === 0 ? (
          <Empty icon="🌙" title="Acabou a galera por aqui" text="Brota em outro rolê pra ver mais gente, ou volta mais tarde." action={<button className="btn-primary" onClick={() => navigate('explore')}>Ver rolês</button>} />
        ) : stack.slice(0, 2).reverse().map((c) => (
          <SwipeCard key={c.user.id} user={c.user} role={roles.find((r) => r.id === c.roleId)} top={c === top} onSwipe={onSwipe} flingRef={flingRef} />
        ))}
      </div>
      {top && (
        <div className="deck-actions">
          <button className="round-btn nope" onClick={() => flingRef.current?.('pass')} aria-label="Passar"><I.Close size={28} stroke={2.8} /></button>
          <button className={`round-btn super ${isVip ? '' : 'locked'}`} onClick={() => flingRef.current?.('super')} aria-label="Super Like">
            <I.Star size={24} filled />{!isVip && <span className="mini-lock"><I.Lock size={10} /></span>}
          </button>
          <button className="round-btn like" onClick={() => flingRef.current?.('like')} aria-label="Curtir"><I.Heart size={28} filled /></button>
        </div>
      )}
      <p className="center small muted">{isVip ? '👑 VIP: likes ilimitados' : `${likesLeft} ${likesLeft === 1 ? 'like restante' : 'likes restantes'} hoje à noite`}</p>
    </>
  );
}

function Admirers() {
  const { admirers, isVip, navigate } = useApp();
  if (!admirers.length) return null;
  return (
    <button className="admirers" onClick={() => (isVip ? navigate('admirers') : navigate('vip', { reason: 'admirers' }))}>
      <div className="admirers-faces">
        {admirers.slice(0, 3).map((a) => (
          <div key={a.id} className={`admirer-face ${isVip ? '' : 'blur'}`}><Avatar user={a.user} size={40} /></div>
        ))}
      </div>
      <div className="admirers-text">
        <b>{admirers.length} {admirers.length === 1 ? 'pessoa te curtiu' : 'pessoas te curtiram'}</b>
        <span className="small muted">{isVip ? 'Toque pra ver quem foi' : 'Assine o VIP pra desbloquear'}</span>
      </div>
      {isVip ? <I.Back size={20} style={{ transform: 'rotate(180deg)' }} /> : <span className="lock-pill"><I.Lock size={14} /> VIP</span>}
    </button>
  );
}

function Chats() {
  const { matches, users, uid, navigate } = useApp();
  if (!matches.length) return <Empty icon="💬" title="Nenhum match ainda" text="Curte quem tá no mesmo rolê que você. Se rolar reciprocidade, abre o chat aqui." />;
  return (
    <div className="chat-list">
      <div className="new-matches">
        {matches.filter((m) => !m.lastMsg).map((m) => { const o = users[m.users.find((x) => x !== uid)]; return o && (
          <div key={m.id} className="person" onClick={() => navigate('chat', { id: m.id })}><Avatar user={o} size={64} ring /><span>{o.nome.split(' ')[0]}</span></div>
        ); })}
      </div>
      {matches.map((m) => {
        const o = users[m.users.find((x) => x !== uid)];
        if (!o) return null;
        return (
          <div key={m.id} className="chat-row" onClick={() => navigate('chat', { id: m.id })}>
            <Avatar user={o} size={54} />
            <div className="grow">
              <b>{o.nome}</b>
              <span className={`small ${m.lastMsg && m.lastFrom !== uid ? 'strong' : 'muted'}`}>{m.lastMsg ? `${m.lastFrom === uid ? 'Você: ' : ''}${m.lastMsg}` : 'Novo match! Manda um oi 👋'}</span>
            </div>
            <span className="tiny muted">{timeAgo(m.lastAt || m.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Match({ roleId, tab: initialTab }) {
  const { myCheckins, roles, navigate, isVip, matches } = useApp();
  const [tab, setTab] = useState(initialTab || 'descobrir');
  const active = myCheckins.filter((c) => c.status === 'aqui' || c.status === 'vou').map((c) => c.roleId);
  const roleIds = roleId ? [roleId, ...active.filter((x) => x !== roleId)] : active;

  return (
    <div className="screen">
      <Header title="Match" right={!isVip && <button className="btn-vip" onClick={() => navigate('vip', {})}><I.Crown size={14} filled /> VIP</button>} />
      <div className="segmented pad-x">
        <button className={tab === 'descobrir' ? 'on' : ''} onClick={() => setTab('descobrir')}>🔥 No rolê</button>
        <button className={tab === 'chats' ? 'on' : ''} onClick={() => setTab('chats')}>💬 Conversas {matches.length > 0 && `(${matches.length})`}</button>
      </div>
      {tab === 'descobrir' ? (
        <div className="pad-x">
          <Admirers />
          {roleIds.length ? <Deck roleIds={roleIds} /> : (
            <>
              <Empty icon="📍" title="Dá BROTA num rolê" text="O match mostra quem tá no mesmo rolê que você. Faz check-in ou marca 'Vou' pra começar." />
              {roles.filter((r) => r.live).map((r) => <RoleRow key={r.id} role={r} />)}
            </>
          )}
        </div>
      ) : <Chats />}
    </div>
  );
}

export function ItsAMatch({ userId, matchId }) {
  const { users, me, back, navigate } = useApp();
  const other = users[userId];
  return (
    <div className="its-match">
      <h1>Deu Match!</h1>
      <p>Você e {other?.nome.split(' ')[0]} se curtiram 🔥</p>
      <div className="match-faces">
        <Avatar user={me} size={120} />
        <Avatar user={other} size={120} />
      </div>
      <button className="btn-primary block" onClick={() => { back(); setTimeout(() => navigate('chat', { id: matchId }), 30); }}>Mandar mensagem</button>
      <button className="btn-ghost block" onClick={back}>Continuar no rolê</button>
    </div>
  );
}

export function AdmirersList() {
  const { admirers, back, swipe, navigate, myPoint } = useApp();
  const likeBack = async (u) => {
    const res = await swipe(u, 'like');
    if (res.matchId) navigate('itsamatch', { userId: u.id, matchId: res.matchId });
  };
  return (
    <div className="overlay-screen">
      <Header title="Quem te curtiu" onBack={back} />
      <div className="admirers-grid">
        {admirers.map((a) => (
          <div key={a.id} className="admirer-card">
            <Photo src={a.user.foto} alt={a.user.nome} label={a.user.nome} />
            {a.tipo === 'super' && <span className="super-tag"><I.Star size={12} filled /> Super Like</span>}
            <div className="admirer-info">
              <b>{a.user.nome.split(' ')[0]}, {a.user.idade}</b>
              <span className="tiny">{a.user.bairro} · {formatKm(distanceKm(myPoint, bairroInfo(a.user.bairro)))}</span>
              <button className="btn-small" onClick={() => likeBack(a.user)}><I.Heart size={14} filled /> Curtir de volta</button>
            </div>
          </div>
        ))}
      </div>
      {!admirers.length && <Empty icon="💘" title="Ninguém novo por aqui" />}
    </div>
  );
}
