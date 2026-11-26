// Exporta um retrato do Supabase LOCAL para a versão de demonstração (sem servidor).
// Gera demo/snapshot.json e demo/media/*. Uso: node scripts/export-demo.mjs
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const URL = 'http://127.0.0.1:54321';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const OUT = 'demo';
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email: 'bia.s@trip.local' });
const c = createClient(URL, ANON, { auth: { persistSession: false } });
await c.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' });

let posts = [], before = null;
for (;;) { const { data } = await c.rpc('feed', { p_filter: 'para-voce', p_before: before }); posts.push(...data); if (data.length < 20) break; before = data[data.length - 1].created_at; }
const handles = [...new Set(posts.map(p => p.author_handle))];
const profiles = {};
for (const h of handles) { const { data } = await c.rpc('profile_by_handle', { p_handle: h }); profiles[h] = data; }
const comments = {};
for (const p of posts) { const { data } = await c.rpc('post_comments', { p_post: p.id }); if (data.length) comments[p.id] = data.map(({ can_delete, ...x }) => x); }
const { data: stories } = await c.rpc('active_stories');
for (const p of posts) p.liked_by_me = false;

const paths = [...new Set([...posts.flatMap(p => [p.media_path, p.author_avatar]), ...stories.flatMap(s => [s.media_path, s.author_avatar]), ...Object.values(profiles).map(p => p.avatar_path)].filter(Boolean))];
const { data: signed } = await c.storage.from('media').createSignedUrls(paths, 600);
const map = {};
for (const s of signed) {
  const isVideo = /\.(mp4|webm|mov)$/.test(s.path);
  const name = s.path.replace(/[^a-z0-9.]/gi, '_').replace(/\.(jpg|png|webp)$/, '.jpg');
  const file = join(OUT, 'media', name);
  mkdirSync(dirname(file), { recursive: true });
  const buf = Buffer.from(await (await fetch(s.signedUrl)).arrayBuffer());
  const tmp = file + '.orig';
  writeFileSync(tmp, buf);
  // fotos menores para a demonstração carregar rápido
  if (isVideo) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-vf', 'scale=540:-2', '-c:v', 'libx264', '-crf', '30', '-preset', 'veryfast', '-movflags', '+faststart', '-an', file]);
  else execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-vf', "scale='min(720,iw)':-2", '-q:v', '6', file]);
  execFileSync('rm', [tmp]);
  map[s.path] = 'media/' + name;
}
writeFileSync(join(OUT, 'snapshot.json'), JSON.stringify({ posts, profiles, comments, stories, media: map }));
console.log('ok', posts.length, 'posts,', paths.length, 'arquivos');
