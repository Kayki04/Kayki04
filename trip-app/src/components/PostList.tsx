import { useState } from 'react';
import { PostCard, type FeedItem } from './PostCard';
import { CommentsSheet } from './CommentsSheet';
import { PostMenu } from './PostMenu';
import { useSession } from '../lib/auth';

/** Lista de posts com comentários e menu de opções. */
export function PostList({ items, urls }: { items: FeedItem[]; urls: Record<string, string> }) {
  const { profile } = useSession();
  const [comments, setComments] = useState<string | null>(null);
  const [menu, setMenu] = useState<FeedItem | null>(null);
  return (
    <>
      {items.map(p => <PostCard key={p.id} post={p} urls={urls} mine={p.author_id === profile?.id} onComments={x => setComments(x.id)} onMore={setMenu} />)}
      {comments && <CommentsSheet postId={comments} onClose={() => setComments(null)} />}
      {menu && <PostMenu post={menu} mine={menu.author_id === profile?.id} onClose={() => setMenu(null)} />}
    </>
  );
}
