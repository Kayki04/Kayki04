import { useState } from 'react';
import { safeStorage } from '../lib/storage';

const KEY = 'trip-age-ok';

export function AgeGate() {
  const [ok, setOk] = useState(() => safeStorage.get(KEY) === '1');
  const [under, setUnder] = useState(false);
  if (ok) return null;
  return (
    <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-title">
      <p className="logo">trip</p>
      <h1 id="age-title">Você tem 18 anos ou mais?</h1>
      <p>A Trip é para maiores de 18 anos. Criadores publicam conteúdo exclusivo para quem assina.</p>
      <ul className="regras">
        <li>Conteúdo com menores de idade é proibido e o perfil é suspenso na hora.</li>
        <li>Cenas de violência ficam borradas ou são removidas.</li>
        <li>Quem aparece no conteúdo precisa ser maior e ter concordado.</li>
      </ul>
      <div className="acoes-gate">
        <button className="btn btn-lima btn-bloco" onClick={() => { safeStorage.set(KEY, '1'); setOk(true); }}>Tenho 18 anos ou mais</button>
        <button className="btn btn-fantasma" onClick={() => setUnder(true)}>Tenho menos de 18</button>
        {under && <p className="aviso">A Trip é só para maiores de 18 anos.</p>}
      </div>
    </div>
  );
}
