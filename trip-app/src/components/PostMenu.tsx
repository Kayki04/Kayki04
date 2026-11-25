import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { removeMedia } from '../lib/media';
import { Sheet } from './Sheet';
import { useToast } from './Toast';
import type { FeedItem } from './PostCard';

const MOTIVOS = [
  ['menor', 'Envolve menor de idade', 'Vai direto para a equipe de segurança.'],
  ['consentimento', 'Sem consentimento ou vazamento', 'Alguém aparece sem ter concordado.'],
  ['violencia', 'Violência, sangue ou morte', 'Cenas fortes sem aviso.'],
  ['spam', 'Golpe ou spam', ''],
  ['outro', 'Outro motivo', ''],
] as const;

export function PostMenu({ post, mine, onClose }: { post: FeedItem; mine: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'menu' | 'report' | 'done' | 'delete'>('menu');
  const [reason, setReason] = useState<string | null>(null);
  const qc = useQueryClient();
  const toast = useToast();
  const close = () => { if (step === 'done') qc.invalidateQueries({ queryKey: ['feed'] }); onClose(); };

  if (step === 'menu') return (
    <Sheet title={mine ? 'Seu post' : 'Opções'} onClose={close}>
      <div className="opcoes">
        {mine ? <button className="btn btn-linha btn-bloco" onClick={() => setStep('delete')}>Excluir post</button>
              : <button className="btn btn-linha btn-bloco" onClick={() => setStep('report')}>Denunciar</button>}
      </div>
    </Sheet>
  );
  if (step === 'delete') return (
    <Sheet title="Excluir este post?" onClose={close}>
      <p className="sub">Ele some do feed e do seu perfil. Não dá para desfazer.</p>
      <div className="opcoes">
        <button className="btn btn-perigo btn-bloco" onClick={async () => {
          const { data, error } = await supabase.rpc('delete_post', { p_id: post.id });
          if (error) { toast('Não foi possível excluir. Tente de novo.'); return; }
          await removeMedia([data as string | null]);
          qc.invalidateQueries({ queryKey: ['feed'] }); toast('Post excluído.'); onClose();
        }}>Excluir</button>
        <button className="btn btn-linha btn-bloco" onClick={close}>Manter</button>
      </div>
    </Sheet>
  );
  if (step === 'report') return (
    <Sheet title="Denunciar post" onClose={close}>
      <p className="sub">Sua denúncia é anônima. Por que este post não deveria estar na Trip?</p>
      <div className="motivos">{MOTIVOS.map(([k, l, d]) => (
        <button key={k} className="report-reason" aria-pressed={reason === k} onClick={() => setReason(k)}>{l}{d && <small>{d}</small>}</button>))}</div>
      <button className="btn btn-escuro btn-bloco" disabled={!reason} onClick={async () => { await supabase.rpc('report', { p_type: 'post', p_target: post.id, p_reason: reason }); setStep('done'); }}>Enviar denúncia</button>
    </Sheet>
  );
  return (
    <Sheet title="Denúncia enviada" onClose={close}>
      <div className="ok-denuncia">
        <span className="check" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#14121A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
        <h3>Recebemos. O post foi ocultado enquanto analisamos.</h3>
        <p className="sub">{reason === 'menor' ? 'Denúncias que envolvem menores vão direto para a equipe de segurança. Se confirmado, o post é removido, o perfil é suspenso e o caso vai para as autoridades.' : 'Você recebe uma notificação quando a análise terminar.'}</p>
      </div>
    </Sheet>
  );
}
