import { useApp } from '../AppContext';
import { distanceKm, formatKm } from '../utils';
import { AvatarStack, BrotaButton, LiveDot, Photo } from './ui';

export default function RoleRow({ role }) {
  const { peopleAt, navigate, myPoint } = useApp();
  const people = peopleAt(role.id);
  const km = distanceKm(myPoint, role);
  return (
    <div className="role-row" onClick={() => navigate('role', { id: role.id })}>
      <Photo src={role.capa} alt={role.nome} label={role.nome} className="role-row-img" />
      <div className="role-row-info">
        <b>{role.nome}</b>
        <span className="muted small">{role.bairro} · {formatKm(km)}</span>
        <div className="row gap-s">
          <AvatarStack users={people} size={20} />
          <span className="small">{role.live && <LiveDot />} <b>{people.length}</b> {role.live ? 'tão lá' : 'vão'}</span>
        </div>
      </div>
      <BrotaButton role={role} compact />
    </div>
  );
}
