/**
 * Modo demonstração: imita o Supabase dentro do navegador, usando um retrato
 * exportado do banco (demo/snapshot.json). Nada sai do aparelho.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { blockedTerm } from './moderation';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const ME = { id: 'demo-me', handle: 'voce', name: 'Você', bio: 'Testando a Trip.', avatar_path: null as string | null, is_creator: false, show_adult: false, role: 'user', under_review: false, suspended: false, created_at: new Date().toISOString() };

let S: { posts: Row[]; profiles: Record<string, Row>; comments: Record<string, Row[]>; stories: Row[]; media: Record<string, string> };
const likes = new Set<string>(); const follows = new Set<string>(); const reported = new Set<string>(); const seen = new Set<string>();
const uploads: Record<string, string> = {};
const ready = fetch('snapshot.json').then(r => r.json()).then(j => { S = j; });

const ok = (data: unknown) => ({ data, error: null });
const fail = (message: string) => ({ data: null, error: { message } });
const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const meProfileRow = () => ({ id: ME.id, handle: ME.handle, name: ME.name, bio: ME.bio, avatar_path: ME.avatar_path, is_creator: ME.is_creator });
const profileFor = (handle: string): Row | null => (handle === ME.handle ? { ...meProfileRow(), followers: 0, following: follows.size, posts: S.posts.filter(p => p.author_id === ME.id).length, i_follow: false, is_me: true } : S.profiles[handle] ? { ...S.profiles[handle] } : null);
const byId = (id: string) => Object.values(S.profiles).find(p => p.id === id);

const RPC: Record<string, (a: Row) => unknown> = {
  my_profile: () => ME,
  redeem_invite: () => ME,
  feed: ({ p_filter, p_before, p_type, p_author }) => S.posts
    .filter(p => !reported.has(p.id))
    .filter(p => !p_before || p.created_at < p_before)
    .filter(p => !p_type || p.type === p_type)
    .filter(p => !p_author || p.author_id === p_author)
    .filter(p => p_filter !== 'seguindo' || follows.has(p.author_id) || (byId(p.author_id)?.i_follow && !follows.has('-' + p.author_id)))
    .slice(0, 20)
    .map(p => ({ ...p, comment_count: (S.comments[p.id] ?? []).length })),
  toggle_like: ({ p_post }) => { const p = S.posts.find(x => x.id === p_post)!; const on = !likes.has(p_post); on ? likes.add(p_post) : likes.delete(p_post); p.liked_by_me = on; p.like_count += on ? 1 : -1; return on; },
  post_comments: ({ p_post }) => (S.comments[p_post] ?? []).map(c => ({ ...c, can_delete: c.author_id === ME.id })),
  add_comment: ({ p_post, p_text }) => {
    const term = blockedTerm(p_text); if (term) { ME.under_review = true; return { ok: false, error: 'blocked_term', term }; }
    (S.comments[p_post] ??= []).push({ id: uuid(), text: p_text.trim(), created_at: now(), author_id: ME.id, author_handle: ME.handle, author_name: ME.name, author_avatar: ME.avatar_path });
    return { ok: true };
  },
  delete_comment: ({ p_id }) => { for (const k in S.comments) S.comments[k] = S.comments[k].filter(c => c.id !== p_id); return null; },
  profile_by_handle: ({ p_handle }) => profileFor(p_handle),
  toggle_follow: ({ p_user }) => {
    const p = byId(p_user); if (!p) return false;
    const on = !p.i_follow; p.i_follow = on; p.followers += on ? 1 : -1;
    on ? follows.add(p_user) : (follows.delete(p_user), follows.add('-' + p_user));
    if (on) follows.delete('-' + p_user);
    return on;
  },
  active_stories: () => S.stories.map(s => ({ ...s, seen: s.seen || seen.has(s.id) })),
  mark_story_seen: ({ p_story }) => { seen.add(p_story); return null; },
  create_post: ({ p_type, p_text, p_bg, p_media_path, p_sensitive }) => {
    const term = blockedTerm(p_text ?? ''); if (term) { ME.under_review = true; return { ok: false, error: 'blocked_term', term }; }
    const id = uuid();
    S.posts.unshift({ id, author_id: ME.id, type: p_type, text: (p_text ?? '').trim(), bg: p_type === 'text' ? p_bg : null, media_path: p_type === 'text' ? null : p_media_path, sensitive: !!p_sensitive, adult: false, status: 'published', created_at: now(), like_count: 0, comment_count: 0, liked_by_me: false, author_handle: ME.handle, author_name: ME.name, author_avatar: ME.avatar_path, author_is_creator: ME.is_creator });
    return { ok: true, id };
  },
  create_story: ({ p_media_path, p_bg, p_text }) => {
    const term = blockedTerm(p_text ?? ''); if (term) { ME.under_review = true; return { ok: false, error: 'blocked_term', term }; }
    S.stories.unshift({ id: uuid(), author_id: ME.id, author_handle: ME.handle, author_name: ME.name, author_avatar: ME.avatar_path, media_path: p_media_path, bg: p_bg, text: (p_text ?? '').trim(), created_at: now(), seen: false });
    return { ok: true };
  },
  delete_post: ({ p_id }) => { const p = S.posts.find(x => x.id === p_id); S.posts = S.posts.filter(x => x.id !== p_id); return p?.media_path ?? null; },
  report: ({ p_target }) => { reported.add(p_target); return { ok: true }; },
  update_profile: ({ p_name, p_bio, p_avatar_path }) => {
    const term = blockedTerm(p_name) ?? blockedTerm(p_bio ?? ''); if (term) { ME.under_review = true; return { ok: false, error: 'blocked_term', term }; }
    Object.assign(ME, { name: p_name.trim(), bio: (p_bio ?? '').trim(), avatar_path: p_avatar_path });
    for (const p of S.posts) if (p.author_id === ME.id) Object.assign(p, { author_name: ME.name, author_avatar: ME.avatar_path });
    return { ok: true };
  },
};

const resolveUrl = (path: string) => uploads[path] ?? S.media[path];

export function createDemoClient(): SupabaseClient {
  const session = { access_token: 'demo', refresh_token: 'demo', token_type: 'bearer', expires_in: 3600, user: { id: ME.id, email: 'voce@demo' } };
  const client = {
    auth: {
      getSession: async () => ok({ session }),
      getUser: async () => ok({ user: session.user }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ok(null),
      signInWithOtp: async () => ok(null),
      verifyOtp: async () => ok({ session }),
      signInWithOAuth: async () => fail('demo'),
    },
    rpc: async (name: string, args: Row = {}) => {
      await ready;
      if (name === 'delete_my_account') return fail('Indisponível na demonstração.');
      const fn = RPC[name];
      return fn ? ok(structuredClone(fn(args))) : fail('not_found');
    },
    storage: {
      from: () => ({
        upload: async (path: string, file: Blob) => { uploads[path] = URL.createObjectURL(file); return ok({ path }); },
        createSignedUrls: async (paths: string[]) => { await ready; return ok(paths.map(p => ({ path: p, signedUrl: resolveUrl(p) ? new globalThis.URL(resolveUrl(p)!, location.href).href : null, error: null }))); },
        list: async () => ok([]),
        remove: async () => ok([]),
      }),
    },
  };
  return client as unknown as SupabaseClient;
}
