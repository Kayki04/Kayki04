import { useEffect, useState } from 'react';
import { useApp } from '../AppContext';
import { Avatar, BrotaButton, Photo } from './ui';
import * as I from './Icons';

export function StoriesBar() {
  const { roles, me, peopleAt, navigate } = useApp();
  const live = roles.filter((r) => r.live).sort((a, b) => peopleAt(b.id).length - peopleAt(a.id).length);
  return (
    <div className="stories">
      <div className="story" onClick={() => navigate('newpost', { tipo: 'feed' })}>
        <div className="story-me">
          <Avatar user={me} size={64} />
          <span className="story-plus"><I.Plus size={14} stroke={3} /></span>
        </div>
        <span>Seu rolê</span>
      </div>
      {live.map((r, i) => (
        <div key={r.id} className="story" onClick={() => navigate('story', { index: i })}>
          <div className="avatar ring" style={{ width: 70, height: 70 }}>
            <div className="avatar-inner"><Photo src={r.capa} alt={r.nome} /></div>
            <span className="story-live">AO VIVO</span>
          </div>
          <span>{r.nome.replace(/^(Rolê|Bar|Baile|Funk|Pagode) (em |na |da |no )?/, '')}</span>
        </div>
      ))}
    </div>
  );
}

export function StoryViewer({ index = 0 }) {
  const { roles, peopleAt, posts, back, navigate } = useApp();
  const live = roles.filter((r) => r.live).sort((a, b) => peopleAt(b.id).length - peopleAt(a.id).length);
  const [i, setI] = useState(index);
  const [frame, setFrame] = useState(0);
  const role = live[i];
  // cada rolê mostra a capa + as fotos postadas lá
  const frames = role ? [role.capa, ...posts.filter((p) => p.roleId === role.id && p.mediaType !== 'video').map((p) => p.mediaUrl)].slice(0, 4) : [];

  const next = () => {
    if (frame < frames.length - 1) setFrame(frame + 1);
    else if (i < live.length - 1) { setI(i + 1); setFrame(0); }
    else back();
  };
  const prev = () => {
    if (frame > 0) setFrame(frame - 1);
    else if (i > 0) { setI(i - 1); setFrame(0); }
  };
  useEffect(() => { const t = setTimeout(next, 4500); return () => clearTimeout(t); }); // avança sozinho

  if (!role) return null;
  const people = peopleAt(role.id);
  return (
    <div className="story-viewer">
      <Photo src={frames[frame]} alt={role.nome} label={role.nome} className="story-img" />
      <div className="story-progress">
        {frames.map((_, k) => <div key={`${i}-${k}`} className={`bar ${k < frame ? 'full' : k === frame ? 'run' : ''}`}><span /></div>)}
      </div>
      <div className="story-top">
        <Avatar user={{ nome: role.nome, foto: role.capa }} size={34} />
        <div><b>{role.nome}</b><span>{role.bairro} · {people.length} no rolê</span></div>
        <button className="icon-btn white" onClick={back}><I.Close /></button>
      </div>
      <div className="story-tap left" onClick={prev} />
      <div className="story-tap right" onClick={next} />
      <div className="story-bottom">
        <p>{role.descricao}</p>
        <div className="row gap">
          <button className="btn-light" onClick={() => { back(); setTimeout(() => navigate('role', { id: role.id }), 30); }}>Ver rolê</button>
          <BrotaButton role={role} />
        </div>
      </div>
    </div>
  );
}
