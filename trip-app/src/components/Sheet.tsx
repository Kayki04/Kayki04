import { useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';

/** Painel que sobe de baixo. Fecha no fundo, no X ou com Esc. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="sheet-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-top"><h2>{title}</h2><button className="fechar-s" aria-label="Fechar" onClick={onClose}><Icon.close /></button></div>
        {children}
      </div>
    </div>
  );
}
