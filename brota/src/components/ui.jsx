import { useState } from 'react';
import { colorFrom, initials } from '../utils';
import { useApp } from '../AppContext';
import * as I from './Icons';

// Imagem com plano B: se a foto não carregar, mostra um gradiente com o nome
export function Photo({ src, alt = '', className = '', style, label }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`photo-fallback ${className}`} style={{ ...style, background: `linear-gradient(135deg, ${colorFrom(alt || label || 'x')}, #FF8A00)` }}>
        {label && <span>{label}</span>}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} loading="lazy" onError={() => setErr(true)} />;
}

export function Avatar({ user, size = 40, ring = false, seen = false, onClick, className = '' }) {
  const [err, setErr] = useState(false);
  const inner = !user?.foto || err ? (
    <div className="avatar-fallback" style={{ background: colorFrom(user?.nome || ''), fontSize: size * 0.38 }}>{initials(user?.nome)}</div>
  ) : (
    <img src={user.foto} alt={user.nome} onError={() => setErr(true)} />
  );
  return (
    <div className={`avatar ${ring ? 'ring' : ''} ${seen ? 'seen' : ''} ${className}`} style={{ width: size, height: size }} onClick={onClick}>
      <div className="avatar-inner">{inner}</div>
    </div>
  );
}

export function AvatarStack({ users = [], max = 4, size = 24 }) {
  return (
    <div className="avatar-stack">
      {users.slice(0, max).map((u) => <Avatar key={u.id} user={u} size={size} />)}
    </div>
  );
}

export function BrotaButton({ role, compact = false }) {
  const { checkIn, currentCheckin } = useApp();
  const here = currentCheckin?.roleId === role?.id;
  return (
    <button
      className={`btn-brota ${compact ? 'compact' : ''} ${here ? 'done' : ''}`}
      onClick={(e) => { e.stopPropagation(); if (!here) checkIn(role.id); }}
    >
      {here ? <><I.Check size={16} /> Tô aqui</> : <><I.Flame size={16} filled /> BROTA</>}
    </button>
  );
}

export function Header({ title, onBack, right, logo = false }) {
  return (
    <header className="topbar">
      {onBack && <button className="icon-btn" onClick={onBack} aria-label="Voltar"><I.Back /></button>}
      {logo ? <div className="logo">BROTA</div> : <h1 className="topbar-title">{title}</h1>}
      <div className="topbar-right">{right}</div>
    </header>
  );
}

export function Sheet({ onClose, children, title }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {title && <div className="sheet-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function LiveDot() { return <span className="live-dot" />; }
