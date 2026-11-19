import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { store } from '../services/db';
import { Avatar, Header } from '../components/ui';
import * as I from '../components/Icons';

export default function Chat({ id }) {
  const { matches, users, uid, back, sendMessage, roles, navigate } = useApp();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const end = useRef(null);
  const match = matches.find((m) => m.id === id);
  const other = match && users[match.users.find((x) => x !== uid)];
  const role = match && roles.find((r) => r.id === match.roleId);

  useEffect(() => store.subscribe(`matches/${id}/messages`, [], (l) => setMsgs(l.sort((a, b) => a.createdAt - b.createdAt))), [id]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  if (!match || !other) return null;
  const send = async (e) => {
    e.preventDefault(); if (!text.trim()) return;
    const t = text.trim(); setText('');
    await sendMessage(match, t);
  };
  return (
    <div className="overlay-screen with-input chat">
      <Header onBack={back} title={<span className="row gap-s" onClick={() => navigate('user', { id: other.id })}><Avatar user={other} size={30} />{other.nome}</span>} />
      <div className="chat-intro">
        <Avatar user={other} size={84} />
        <b>{other.nome}</b>
        <span className="small muted">Vocês deram match{role ? ` no ${role.nome}` : ''} 🔥</span>
      </div>
      <div className="messages">
        {msgs.map((m) => <div key={m.id} className={`bubble ${m.fromId === uid ? 'mine' : ''}`}>{m.texto}</div>)}
        <div ref={end} />
      </div>
      <form className="input-bar" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem…" maxLength={500} autoFocus />
        <button className="link strong" disabled={!text.trim()}><I.Send size={20} /></button>
      </form>
    </div>
  );
}
