import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { Avatar, Photo } from '../components/ui';
import * as I from '../components/Icons';

function Reel({ post }) {
  const { users, roles, uid, likePost, savePost, navigate } = useApp();
  const [burst, setBurst] = useState(false);
  const lastTap = useRef(0);
  const vid = useRef(null);
  const ref = useRef(null);
  const author = users[post.userId];
  const role = roles.find((r) => r.id === post.roleId);
  const liked = post.likedBy?.includes(uid);
  const saved = post.savedBy?.includes(uid);
  const likes = (post.likedBy?.length || 0) + (post.likesExtra || 0);

  useEffect(() => { // vídeo toca só quando aparece na tela
    if (post.mediaType !== 'video') return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) vid.current?.play().catch(() => {}); else vid.current?.pause(); }, { threshold: 0.6 });
    io.observe(ref.current); return () => io.disconnect();
  }, [post.mediaType]);

  const tap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) { if (!liked) likePost(post); setBurst(true); setTimeout(() => setBurst(false), 700); }
    lastTap.current = now;
  };

  return (
    <div className="reel" ref={ref} onClick={tap}>
      {post.mediaType === 'video'
        ? <video ref={vid} src={post.mediaUrl} loop muted playsInline className="reel-media" />
        : <Photo src={post.mediaUrl} alt={post.legenda} label={role?.nome} className="reel-media" />}
      <div className="reel-shade" />
      {burst && <div className="heart-burst"><I.Heart size={110} filled /></div>}
      <div className="reel-side" onClick={(e) => e.stopPropagation()}>
        <button className={liked ? 'liked' : ''} onClick={() => likePost(post)}><I.Heart filled={liked} size={30} /><span>{likes}</span></button>
        <button onClick={() => navigate('comments', { id: post.id })}><I.Comment size={30} /><span>{post.comments?.length || 0}</span></button>
        <button onClick={() => savePost(post)}><I.Bookmark filled={saved} size={30} /><span>Salvar</span></button>
      </div>
      <div className="reel-info" onClick={(e) => e.stopPropagation()}>
        <div className="row gap-s" onClick={() => navigate('user', { id: post.userId })}>
          <Avatar user={author} size={32} />
          <b>{author?.nome}</b>
        </div>
        <p>{post.legenda}</p>
        {role && <button className="reel-role" onClick={() => navigate('role', { id: role.id })}><I.Pin size={14} /> {role.nome} · {role.bairro}</button>}
      </div>
    </div>
  );
}

export default function Reels() {
  const { posts, navigate } = useApp();
  const list = posts.filter((p) => p.tipo === 'arrumando');
  return (
    <div className="reels">
      <div className="reels-top">
        <h1>Me arrumando</h1>
        <button className="icon-btn white" onClick={() => navigate('newpost', { tipo: 'arrumando' })} aria-label="Postar"><I.PlusSquare size={26} /></button>
      </div>
      {list.map((p) => <Reel key={p.id} post={p} />)}
      <button className="fab" onClick={() => navigate('newpost', { tipo: 'arrumando' })} aria-label="Novo post"><I.Plus size={28} stroke={2.6} /></button>
    </div>
  );
}
