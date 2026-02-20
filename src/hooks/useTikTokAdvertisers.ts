import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdminContext } from './useAdminContext';
import { toast } from '@/hooks/use-toast';
import type { TikTokInfluencer } from '@/types/tiktok';

export function useTikTokAdvertisers() {
  const { user } = useAuth();
  const { effectiveUserId } = useAdminContext();
  const queryClient = useQueryClient();

  const { data: influencers = [], isLoading } = useQuery({
    queryKey: ['tiktok-advertisers', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_advertisers')
        .select('*')
        .eq('user_id', effectiveUserId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as TikTokInfluencer[];
    },
    enabled: !!effectiveUserId,
  });

  const createInfluencer = useMutation({
    mutationFn: async (input: Partial<TikTokInfluencer>) => {
      const { data, error } = await supabase
        .from('tiktok_advertisers')
        .insert({ ...input, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ title: 'Influencer registered successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateInfluencer = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TikTokInfluencer> & { id: string }) => {
      const { error } = await supabase
        .from('tiktok_advertisers')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ title: 'Influencer updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteInfluencer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tiktok_advertisers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ title: 'Influencer deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { influencers, isLoading, createInfluencer, updateInfluencer, deleteInfluencer };
}
