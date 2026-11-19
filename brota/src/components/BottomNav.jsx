import { useApp } from '../AppContext';
import { Avatar } from './ui';
import * as I from './Icons';

export default function BottomNav() {
  const { route, navigate, me, admirers } = useApp();
  const t = route.name;
  const item = (name, Icon, label) => (
    <button className={`nav-item ${t === name ? 'active' : ''}`} onClick={() => navigate(name)} aria-label={label}>
      <Icon filled={t === name} size={26} stroke={t === name ? 2.4 : 2} />
    </button>
  );
  return (
    <nav className="bottom-nav">
      {item('home', I.Home, 'Início')}
      {item('explore', I.Search, 'Explorar')}
      {item('reels', I.Reels, 'Me arrumando')}
      <button className={`nav-item ${t === 'match' ? 'active' : ''}`} onClick={() => navigate('match')} aria-label="Match">
        <I.Flame filled={t === 'match'} size={26} />
        {admirers.length > 0 && <span className="nav-badge">{admirers.length}</span>}
      </button>
      <button className={`nav-item ${t === 'profile' ? 'active' : ''}`} onClick={() => navigate('profile')} aria-label="Perfil">
        <Avatar user={me} size={28} className={t === 'profile' ? 'nav-avatar-active' : ''} />
      </button>
    </nav>
  );
}
