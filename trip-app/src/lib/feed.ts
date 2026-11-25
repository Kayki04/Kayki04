import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { signedUrls } from './media';
import type { FeedItem } from '../components/PostCard';

export type FeedParams = { filter?: 'para-voce' | 'seguindo'; type?: 'video' | 'photo' | 'text'; author?: string };

export function useFeed(params: FeedParams = {}) {
  return useInfiniteQuery({
    queryKey: ['feed', params],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('feed', { p_filter: params.filter ?? 'para-voce', p_before: pageParam, p_type: params.type ?? null, p_author: params.author ?? null });
      if (error) throw error;
      return data as FeedItem[];
    },
    getNextPageParam: last => (last.length === 20 ? last[last.length - 1].created_at : undefined),
  });
}

/** URLs assinadas para mídia e avatares de uma lista de posts. */
export function useUrls(items: FeedItem[]) {
  const paths = items.flatMap(p => [p.media_path, p.author_avatar]).filter((x): x is string => !!x).sort();
  return useQuery({ queryKey: ['urls', paths], queryFn: () => signedUrls(paths), enabled: paths.length > 0, staleTime: 30 * 60_000 }).data ?? {};
}
