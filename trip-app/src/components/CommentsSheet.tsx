import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { blockedTerm } from '../lib/moderation';
import { Sheet } from './Sheet';
import { Avatar } from './Avatar';

type C = { id: string; text: string; created_at: string; author_id: string; author_handle: string; author_name: string; author_avatar: string | null; can_delete: boolean };
const quando = (iso: string) => { const m = Math.floor((Date.now() - +new Date(iso)) / 60000); return m < 1 ? 'agora' : m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h` : new Date(iso).toLocaleDateString('pt-BR'); };

export function CommentsSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['comments', postId], queryFn: async () => { const { data, error } = await supabase.rpc('post_comments', { p_post: postId }); if (error) throw error; return data as C[]; } });
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); if (!text.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('add_comment', { p_post: postId, p_text: text });
    setBusy(false);
    const r = data as { ok: boolean; error?: string; term?: string } | null;
    if (error || !r?.ok) {
      const term = r?.term ?? blockedTerm(text);
      setErr(r?.error === 'blocked_term' ? `Comentário bloqueado: termos ligados a menores de idade (“${term}”) são proibidos na Trip.` : 'Não foi possível comentar. Tente de novo.');
      if (r?.error === 'blocked_term') qc.invalidateQueries({ queryKey: ['me'] });
      return;
    }
    setText('');
    qc.invalidateQueries({ queryKey: ['comments', postId] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  };
  const del = async (id: string) => { await supabase.rpc('delete_comment', { p_id: id }); qc.invalidateQueries({ queryKey: ['comments', postId] }); qc.invalidateQueries({ queryKey: ['feed'] }); };
  return (
    <Sheet title="Comentários" onClose={onClose}>
      <div className="comments">
        {q.isLoading && <p className="dica">Carregando…</p>}
        {q.data && !q.data.length && <p className="dica">Ninguém comentou ainda. Comece a conversa.</p>}
        {q.data?.map(c => (
          <div className="comment" key={c.id}>
            <Avatar id={c.author_id} name={c.author_name} size={32} />
            <div><b>{c.author_handle}</b> {c.text}<small>{quando(c.created_at)}{c.can_delete && <> · <button className="link-p" onClick={() => del(c.id)}>Apagar</button></>}</small></div>
          </div>
        ))}
      </div>
      {err && <div className="alerta" role="alert">{err}</div>}
      <form className="comment-lin" onSubmit={send}>
        <textarea rows={1} maxLength={500} placeholder="Escreva um comentário…" aria-label="Comentário" value={text} onChange={e => setText(e.target.value)} />
        <button className="btn btn-marca" aria-label="Enviar comentário" disabled={busy || !text.trim()}>Enviar</button>
      </form>
    </Sheet>
  );
}
