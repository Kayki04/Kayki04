import { useApp } from '../AppContext';
import { Avatar, BrotaButton, LiveDot, Photo } from '../components/ui';
import { distanceKm, formatKm, statusLabel } from '../utils';
import * as I from '../components/Icons';

export default function RolePage({ id }) {
  const { roles, posts, peopleAt, back, navigate, myCheckins, toggleVou, me, toggleRecomendacao, myPoint, uid } = useApp();
  const role = roles.find((r) => r.id === id);
  if (!role) return null;
  const here = peopleAt(role.id, 'aqui');
  const going = peopleAt(role.id, 'vou');
  const photos = posts.filter((p) => p.roleId === role.id);
  const mine = myCheckins.find((c) => c.roleId === role.id);
  const indicado = me?.recomendacoes?.includes(role.id);
  const amHere = mine?.status === 'aqui';

  return (
    <div className="overlay-screen role-page">
      <div className="role-cover">
        <Photo src={role.capa} alt={role.nome} label={role.nome} />
        <div className="cover-shade" />
        <button className="icon-btn round-white back" onClick={back}><I.Back /></button>
        <button className={`icon-btn round-white fav ${indicado ? 'on' : ''}`} onClick={() => toggleRecomendacao(role.id)} aria-label="Indicar"><I.Star filled={indicado} /></button>
        <div className="role-cover-text">
          {role.live && <span className="pill live"><LiveDot /> ROLANDO AGORA</span>}
          <h1>{role.nome}</h1>
          <span>{role.bairro} · {role.zona}</span>
        </div>
      </div>

      <div className="pad">
        <div className="role-meta">
          <span><I.Clock size={16} /> {role.horario}</span>
          <span><I.Ticket size={16} /> {role.preco}</span>
          <span><I.Pin size={16} /> {formatKm(distanceKm(myPoint, role))}</span>
        </div>
        <p className="role-desc">{role.descricao}</p>
        <p className="muted small">{role.endereco}</p>

        <div className="role-actions">
          <BrotaButton role={role} />
          <button className={`btn-outline ${mine?.status === 'vou' ? 'on' : ''}`} onClick={() => toggleVou(role.id)} disabled={amHere}>
            {mine?.status === 'vou' ? <><I.Check size={16} /> Vou</> : 'Vou'}
          </button>
          <button className="btn-match" onClick={() => navigate('match', { roleId: role.id })}><I.Flame size={16} filled /> Match</button>
        </div>
      </div>

      <section className="section">
        <div className="section-head"><h3>Quem tá lá <span className="muted">· {here.length}</span></h3></div>
        <div className="people-row">
          {here.map((u) => (
            <div key={u.id} className="person" onClick={() => u.id !== uid && navigate('user', { id: u.id })}>
              <Avatar user={u} size={64} ring />
              <span>{u.id === uid ? 'Você' : u.nome.split(' ')[0]}</span>
              <small>{statusLabel(u.status).emoji}</small>
            </div>
          ))}
          {!here.length && <p className="muted small pad-x">Ninguém deu check-in ainda. Seja o primeiro a brotar!</p>}
        </div>
        {going.length > 0 && <p className="small pad-x muted">+ {going.length} {going.length === 1 ? 'pessoa vai' : 'pessoas vão'}: {going.map((u) => u.nome.split(' ')[0]).join(', ')}</p>}
      </section>

      <section className="section">
        <div className="section-head">
          <h3>Fotos do rolê</h3>
          <button className="link" onClick={() => navigate('newpost', { tipo: 'feed', roleId: role.id })}>+ Postar</button>
        </div>
        <div className="grid3">
          {photos.map((p) => (
            <div key={p.id} className="grid-cell" onClick={() => navigate('comments', { id: p.id })}>
              <Photo src={p.mediaUrl} alt={p.legenda} />
            </div>
          ))}
        </div>
        {!photos.length && <p className="muted center small pad">Nenhuma foto ainda.</p>}
      </section>
    </div>
  );
}
