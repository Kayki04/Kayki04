import { useState } from 'react';
import { useApp } from '../AppContext';
import { Avatar, Header, Photo } from '../components/ui';
import { timeAgo } from '../utils';
import * as I from '../components/Icons';

export default function Comments({ id }) {
  const { posts, users, me, back, commentPost } = useApp();
  const [text, setText] = useState('');
  const post = posts.find((p) => p.id === id);
  if (!post) return null;
  const author = users[post.userId];
  const send = async (e) => {
    e.preventDefault(); if (!text.trim()) return;
    await commentPost(post, text.trim()); setText('');
  };
  return (
    <div className="overlay-screen with-input">
      <Header title="Comentários" onBack={back} />
      <div className="comment-media"><Photo src={post.mediaUrl} alt={post.legenda} /></div>
      <div className="comment">
        <Avatar user={author} size={34} />
        <p><b>{author?.nome}</b> {post.legenda}<br /><span className="muted tiny">{timeAgo(post.createdAt)}</span></p>
      </div>
      <div className="divider" />
      {(post.comments || []).map((c, i) => (
        <div className="comment" key={i}>
          <Avatar user={users[c.userId]} size={34} />
          <p><b>{users[c.userId]?.nome || 'alguém'}</b> {c.texto}<br /><span className="muted tiny">{timeAgo(c.createdAt)}</span></p>
        </div>
      ))}
      {!post.comments?.length && <p className="muted center small pad">Seja o primeiro a comentar.</p>}
      <form className="input-bar" onSubmit={send}>
        <Avatar user={me} size={32} />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Comente algo…" maxLength={200} />
        <button className="link strong" disabled={!text.trim()}><I.Send size={20} /></button>
      </form>
    </div>
  );
}
