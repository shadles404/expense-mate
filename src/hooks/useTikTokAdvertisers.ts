import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TikTokAdvertiser, AdType, PlatformType, ContractType } from '@/types/tiktok';
import { useToast } from '@/hooks/use-toast';

export function useTikTokAdvertisers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: advertisers = [], isLoading } = useQuery({
    queryKey: ['tiktok-advertisers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tiktok_advertisers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TikTokAdvertiser[];
    },
    enabled: !!user?.id,
  });

  const createAdvertiser = useMutation({
    mutationFn: async (advertiser: {
      name: string;
      phone?: string;
      salary: number;
      target_videos: number;
      platform: PlatformType;
      contract_type: ContractType;
      ad_types: AdType[];
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tiktok_advertisers')
        .insert({
          ...advertiser,
          user_id: user.id,
          targets_locked: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ title: 'Advertiser registered successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to register advertiser', description: error.message, variant: 'destructive' });
    },
  });

  const updateAdvertiser = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TikTokAdvertiser> & { id: string }) => {
      const { data, error } = await supabase
        .from('tiktok_advertisers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ title: 'Advertiser updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update advertiser', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAdvertiser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tiktok_advertisers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ title: 'Advertiser deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete advertiser', description: error.message, variant: 'destructive' });
    },
  });

  const resetProgress = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('tiktok_advertisers')
        .update({ completed_videos: 0 })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ title: 'Progress reset successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to reset progress', description: error.message, variant: 'destructive' });
    },
  });

  return {
    advertisers,
    isLoading,
    createAdvertiser,
    updateAdvertiser,
    deleteAdvertiser,
    resetProgress,
  };
}
