import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export type PublicProfile = { id: string; handle: string; name: string; bio: string; avatar_path: string | null; is_creator: boolean; followers: number; following: number; posts: number; i_follow: boolean; is_me: boolean };

export function usePublicProfile(handle: string | undefined) {
  return useQuery({
    queryKey: ['profile', handle],
    enabled: !!handle,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('profile_by_handle', { p_handle: handle });
      if (error) throw error;
      const p = data as PublicProfile | null;
      return p && p.id ? p : null;
    },
  });
}
