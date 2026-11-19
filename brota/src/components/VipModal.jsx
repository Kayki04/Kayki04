import { useState } from 'react';
import { useApp } from '../AppContext';
import { FREE_LIKES_PER_NIGHT, VIP_PRICE } from '../utils';
import { Sheet } from './ui';
import * as I from './Icons';

export default function VipModal({ reason }) {
  const { back, becomeVip, isVip } = useApp();
  const [paying, setPaying] = useState(false);
  const subscribe = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 900)); // pagamento fake
    await becomeVip();
    setPaying(false); back();
  };
  const title = {
    limit: 'Seus likes de hoje acabaram',
    admirers: 'Veja quem te curtiu',
    super: 'Super Like é VIP',
  }[reason] || 'BROTA VIP';

  return (
    <Sheet onClose={back}>
      <div className="vip">
        <div className="vip-badge"><I.Crown size={30} filled /></div>
        <h2>{title}</h2>
        <p className="muted">Assine o VIP e aproveite o rolê sem limites.</p>
        <div className="plans">
          <div className="plan">
            <b>Grátis</b>
            <ul>
              <li><I.Check size={16} /> {FREE_LIKES_PER_NIGHT} likes por noite</li>
              <li><I.Check size={16} /> Ver todos os rolês</li>
              <li className="off"><I.Close size={16} /> Ver quem curtiu</li>
              <li className="off"><I.Close size={16} /> Super Like</li>
            </ul>
          </div>
          <div className="plan vip-plan">
            <span className="plan-tag">Mais escolhido</span>
            <b>VIP <small>{VIP_PRICE}/mês</small></b>
            <ul>
              <li><I.Check size={16} /> Likes ilimitados</li>
              <li><I.Check size={16} /> Ver quem te curtiu</li>
              <li><I.Check size={16} /> Super Like ⭐</li>
              <li><I.Check size={16} /> Selo VIP no perfil</li>
            </ul>
          </div>
        </div>
        {isVip ? (
          <button className="btn-primary block" onClick={back}>Você já é VIP 👑</button>
        ) : (
          <button className="btn-primary block" onClick={subscribe} disabled={paying}>
            {paying ? 'Processando…' : `Assinar VIP · ${VIP_PRICE}`}
          </button>
        )}
        <p className="tiny muted center">Pagamento de demonstração — nenhuma cobrança real é feita.</p>
      </div>
    </Sheet>
  );
}
