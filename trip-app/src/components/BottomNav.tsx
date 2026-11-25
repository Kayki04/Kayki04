import { NavLink } from 'react-router-dom';

const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

export function BottomNav() {
  return (
    <nav className="tabs" aria-label="Navegação principal">
      <NavLink to="/" end className={cls} aria-label="Início">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>Início
      </NavLink>
      <NavLink to="/videos" className={cls} aria-label="Vídeos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M10 8.5v7l6-3.5z" fill="currentColor" /></svg>Vídeos
      </NavLink>
      <NavLink to="/novo" className={cls} aria-label="Postar">
        <span className="mais"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>
      </NavLink>
      <NavLink to="/assinaturas" className={cls} aria-label="Assinaturas">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.4 6.6 19.4l1.2-6L3.4 9.3l6-.7z" /></svg>Assinaturas
      </NavLink>
      <NavLink to="/perfil" className={cls} aria-label="Perfil">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" /></svg>Perfil
      </NavLink>
    </nav>
  );
}
