import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { TikTokVideoDelivery } from '@/types/tiktok';

export function useTikTokDeliveries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['tiktok-deliveries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_deliveries')
        .select('*, advertiser:tiktok_advertisers(*)')
        .order('submission_date', { ascending: false });
      if (error) throw error;
      return data as unknown as TikTokVideoDelivery[];
    },
    enabled: !!user?.id,
  });

  const createDelivery = useMutation({
    mutationFn: async (input: Partial<TikTokVideoDelivery>) => {
      const { data, error } = await supabase
        .from('tiktok_deliveries')
        .insert({ ...input, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-deliveries'] });
      toast({ title: 'Video submission recorded' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateDelivery = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TikTokVideoDelivery> & { id: string }) => {
      const { error } = await supabase
        .from('tiktok_deliveries')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-deliveries'] });
      toast({ title: 'Submission updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { deliveries, isLoading, createDelivery, updateDelivery };
}
