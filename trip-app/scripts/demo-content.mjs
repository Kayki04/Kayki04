// Popula o Supabase LOCAL com criadores, fotos, vídeos e stories de demonstração.
// Fotos: picsum.photos (Unsplash, uso livre). Vídeos: gerados com ffmpeg a partir das fotos.
// Uso: node scripts/demo-content.mjs   (precisa do Supabase local rodando e do ffmpeg)
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const URL = 'http://127.0.0.1:54321';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const dir = process.env.DEMO_DIR || mkdtempSync(join(tmpdir(), 'trip-demo-'));

const CREATORS = [
  { email: 'luna@trip.local', handle: 'luna.vibe', name: 'Luna Vibe', bio: 'Viajo o Brasil e o mundo. Roteiros, ensaios e bastidores.', avatar: 64,
    photos: [[65, 'Fim de tarde perfeito. Quem vem comigo na próxima? 🌅'], [49, 'Santorini superou todas as expectativas.'], [77, 'Esse píer em Floripa é meu lugar favorito.'], [108, 'Palmeiras, vento e nada pra fazer.'], [164, 'Perdida nos canais. Roteiro completo em breve.']],
    video: [162, 'Chegando no litoral de drone ✈️'], story: [215, 'Bom dia de praia!'] },
  { email: 'caio@trip.local', handle: 'caio.fit', name: 'Caio Fit', bio: 'Treino em casa e ao ar livre. Sem desculpa.', avatar: 177,
    photos: [[173, 'Corrida das 6h. O dia rende muito mais.'], [177, 'Trilha de 12 km no fim de semana. Bora?'], [17, 'Caminhada leve pra quem está começando.'], [203, 'Pedal de domingo 🚴']],
    video: [29, 'Subida de serra: o treino que mais gosto'], story: [17, 'Treino de perna hoje.'] },
  { email: 'rafa@trip.local', handle: 'rafa.chef', name: 'Rafa Chef', bio: 'Receitas de boteco em casa. Aula nova todo sábado.', avatar: 292,
    photos: [[292, 'Mise en place do molho de sábado.'], [63, 'Café passado na hora. Receita do bolo nos stories.'], [225, 'Chá de hibisco gelado pra esse calor.'], [75, 'Uvas da serra. Vai virar geleia.']],
    video: [312, 'Mel de engenho na torrada. Simples e perfeito.'], story: [63, 'Aula às 18h!'] },
  { email: 'duda@trip.local', handle: 'duda.art', name: 'Duda Art', bio: 'Pintura, fotografia e luz. Quem segue escolhe o próximo projeto.', avatar: 82,
    photos: [[56, 'Bokeh de fim de noite. Qual cor vocês querem no próximo quadro?'], [82, 'Primavera chegou no ateliê 🌸'], [250, 'Minha câmera favorita, 40 anos e firme.'], [104, 'Filtro dos sonhos feito à mão.']],
    video: [158, 'Show de luzes que inspirou a série nova'], story: [195, 'Saindo pra fotografar a cidade'] },
  { email: 'mari@trip.local', handle: 'mari.yoga', name: 'Mari Yoga', bio: 'Yoga e respiração para quem passa o dia sentado.', avatar: 306,
    photos: [[306, 'Respira. Cinco minutos já mudam o dia.'], [152, 'Flores do jardim onde dou aula.'], [189, 'Depois da chuva tudo fica mais calmo.']],
    video: [13, 'Meditação guiada com som do mar 🌊'], story: null },
  { email: 'leo@trip.local', handle: 'leo.beats', name: 'Leo Beats', bio: 'Produção musical do zero. Projetos abertos para quem acompanha.', avatar: 39,
    photos: [[39, 'Vinil novo na coleção. Adivinha o disco?'], [145, 'Violão velho, som que não sai de moda.']],
    video: [96, 'Beat novo saindo do forno 🎧'], story: null },
];
const FANS = ['ana.lu', 'joao.p', 'carol.m', 'bru.na', 'gui.tz', 'lari.c', 'pedro.h', 'bia.s'];
const COMMENTS = ['Que lindo 😍', 'Melhor perfil da Trip!', 'Quero mais conteúdo assim', 'Salvei pra fazer depois', 'Incrível demais', 'Arrasou 🔥', 'Que vontade de estar aí', 'Me ensina!'];

async function get(id, w, h) {
  const f = join(dir, `${id}-${w}x${h}.jpg`);
  if (!existsSync(f)) {
    const r = await fetch(`https://picsum.photos/id/${id}/${w}/${h}`);
    if (!r.ok) throw new Error('foto ' + id + ': ' + r.status);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
  return f;
}
function makeVideo(img, out) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-loop', '1', '-i', img, '-vf',
    "scale=1080:1920,zoompan=z='min(zoom+0.0009,1.18)':d=200:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280:fps=25",
    '-t', '8', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  return out;
}
async function session(email, handle, name) {
  let { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (!list.users.find(u => u.email === email)) await admin.auth.admin.createUser({ email, email_confirm: true });
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw error;
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: e2 } = await c.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' });
  if (e2) throw e2;
  const { data: me } = await c.rpc('my_profile');
  if (!me?.id) {
    const code = 'DEMO-' + randomUUID().slice(0, 8).toUpperCase();
    await admin.from('invites').insert({ code, kind: name ? 'creator' : 'fan' });
    const { error: e3 } = await c.rpc('redeem_invite', { p_code: code, p_handle: handle, p_name: name || handle });
    if (e3) throw e3;
  }
  const { data: u } = await c.auth.getUser();
  return { c, id: u.user.id };
}
async function upload(s, file, type) {
  const ext = type === 'video/mp4' ? 'mp4' : 'jpg';
  const path = `${s.id}/${randomUUID()}.${ext}`;
  const { error } = await s.c.storage.from('media').upload(path, readFileSync(file), { contentType: type });
  if (error) throw error;
  return path;
}

const posted = [];
for (const cr of CREATORS) {
  const s = await session(cr.email, cr.handle, cr.name);
  const avatar = await upload(s, await get(cr.avatar, 400, 400), 'image/jpeg');
  await s.c.rpc('update_profile', { p_name: cr.name, p_bio: cr.bio, p_avatar_path: avatar, p_show_adult: false });
  const items = [...cr.photos.map(p => ({ kind: 'photo', p })), { kind: 'video', p: cr.video }];
  for (const it of items) {
    const [id, text] = it.p;
    const path = it.kind === 'photo'
      ? await upload(s, await get(id, 1080, 1350), 'image/jpeg')
      : await upload(s, makeVideo(await get(id, 1080, 1920), join(dir, `v${id}.mp4`)), 'video/mp4');
    const { data, error } = await s.c.rpc('create_post', { p_type: it.kind, p_text: text, p_bg: null, p_media_path: path, p_sensitive: false });
    if (error || !data.ok) throw error || new Error(JSON.stringify(data));
    posted.push(data.id);
  }
  if (cr.story) {
    const sp = await upload(s, await get(cr.story[0], 1080, 1920), 'image/jpeg');
    await s.c.rpc('create_story', { p_media_path: sp, p_bg: null, p_text: cr.story[1] });
  }
  console.log('ok', cr.handle);
}
// fãs curtem, comentam e seguem
const fans = [];
for (const h of FANS) fans.push(await session(`${h}@trip.local`, h.replace('-', '.'), null));
const creatorIds = (await Promise.all(CREATORS.map(cr => session(cr.email, cr.handle, cr.name)))).map(s => s.id);
for (const [i, f] of fans.entries()) {
  for (const cid of creatorIds) if ((i + cid.charCodeAt(0)) % 3 !== 0) await f.c.rpc('toggle_follow', { p_user: cid });
  for (const [j, pid] of posted.entries()) {
    if ((i * 7 + j) % 3 !== 0) await f.c.rpc('toggle_like', { p_post: pid });
    if ((i * 5 + j) % 9 === 0) await f.c.rpc('add_comment', { p_post: pid, p_text: COMMENTS[(i + j) % COMMENTS.length] });
  }
}
console.log('pronto:', posted.length, 'posts, mídia em', dir);
