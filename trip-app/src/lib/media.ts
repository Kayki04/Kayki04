import { supabase } from './supabase';

export type MediaKind = 'photo' | 'video';
const MB = 1024 * 1024;
const RULES: Record<MediaKind, { max: number; types: string[]; msg: string; ext: Record<string, string> }> = {
  photo: { max: 15 * MB, types: ['image/jpeg', 'image/png', 'image/webp'], msg: 'Foto até 15 MB (JPG, PNG ou WEBP).', ext: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } },
  video: { max: 200 * MB, types: ['video/mp4', 'video/webm', 'video/quicktime'], msg: 'Vídeo até 200 MB (MP4, WEBM ou MOV).', ext: { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' } },
};

/** Mensagem de erro para mostrar, ou null se o arquivo serve. */
export function validateFile(file: { size: number; type: string }, kind: MediaKind): string | null {
  const r = RULES[kind];
  return r.types.includes(file.type) && file.size <= r.max ? null : r.msg;
}

/** Envia para media/<uid>/<id>.<ext> e devolve o caminho. */
export async function uploadMedia(file: File, kind: MediaKind): Promise<string> {
  const err = validateFile(file, kind);
  if (err) throw new Error(err);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error('not_authenticated');
  const path = `${u.user.id}/${crypto.randomUUID()}.${RULES[kind].ext[file.type]}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

/** URLs assinadas (1 h) para vários caminhos de uma vez. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const uniq = [...new Set(paths.filter(Boolean))];
  if (!uniq.length) return {};
  const { data, error } = await supabase.storage.from('media').createSignedUrls(uniq, 3600);
  if (error) throw error;
  const out: Record<string, string> = {};
  for (const d of data) if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  return out;
}
