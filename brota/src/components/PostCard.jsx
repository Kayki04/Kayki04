import { useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { timeAgo } from '../utils';
import { Avatar, BrotaButton, Photo } from './ui';
import * as I from './Icons';

export default function PostCard({ post }) {
  const { users, roles, uid, likePost, savePost, navigate } = useApp();
  const [burst, setBurst] = useState(false);
  const lastTap = useRef(0);
  const author = users[post.userId];
  const role = roles.find((r) => r.id === post.roleId);
  const liked = post.likedBy?.includes(uid);
  const saved = post.savedBy?.includes(uid);
  const likes = (post.likedBy?.length || 0) + (post.likesExtra || 0);
  const comments = post.comments || [];

  const onMediaTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) likePost(post);
      setBurst(true); setTimeout(() => setBurst(false), 700);
    }
    lastTap.current = now;
  };

  return (
    <article className="post">
      <div className="post-head">
        <Avatar user={author} size={34} ring onClick={() => navigate('user', { id: post.userId })} />
        <div className="post-head-text" onClick={() => navigate('user', { id: post.userId })}>
          <b>{author?.nome || 'alguém'}</b>
          {role && <span className="muted small" onClick={(e) => { e.stopPropagation(); navigate('role', { id: role.id }); }}>📍 {role.nome} · {role.bairro}</span>}
        </div>
        {role && <BrotaButton role={role} compact />}
      </div>
      <div className="post-media" onClick={onMediaTap}>
        {post.mediaType === 'video'
          ? <video src={post.mediaUrl} muted loop playsInline autoPlay />
          : <Photo src={post.mediaUrl} alt={author?.nome} label={role?.nome} />}
        {burst && <div className="heart-burst"><I.Heart size={96} filled /></div>}
      </div>
      <div className="post-actions">
        <button className={`icon-btn ${liked ? 'liked' : ''}`} onClick={() => likePost(post)} aria-label="Curtir"><I.Heart filled={liked} size={26} /></button>
        <button className="icon-btn" onClick={() => navigate('comments', { id: post.id })} aria-label="Comentar"><I.Comment size={26} /></button>
        <button className="icon-btn" onClick={() => role && navigate('role', { id: role.id })} aria-label="Ver rolê"><I.Send size={24} /></button>
        <div className="spacer" />
        <button className="icon-btn" onClick={() => savePost(post)} aria-label="Salvar"><I.Bookmark filled={saved} size={26} /></button>
      </div>
      <div className="post-body">
        <b>{likes.toLocaleString('pt-BR')} curtidas</b>
        <p><b>{author?.nome?.split(' ')[0]}</b> {post.legenda}</p>
        {comments.length > 0 && (
          <button className="link muted" onClick={() => navigate('comments', { id: post.id })}>
            Ver {comments.length === 1 ? 'o comentário' : `todos os ${comments.length} comentários`}
          </button>
        )}
        <span className="muted tiny">há {timeAgo(post.createdAt)}</span>
      </div>
    </article>
  );
}
