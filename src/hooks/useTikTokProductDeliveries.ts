import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { TikTokProductDelivery } from '@/types/tiktok';

export function useTikTokProductDeliveries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: productDeliveries = [], isLoading } = useQuery({
    queryKey: ['tiktok-product-deliveries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_product_deliveries')
        .select('*, advertiser:tiktok_advertisers(*)')
        .order('date_sent', { ascending: false });
      if (error) throw error;
      return data as unknown as TikTokProductDelivery[];
    },
    enabled: !!user?.id,
  });

  const createProductDelivery = useMutation({
    mutationFn: async (input: Partial<TikTokProductDelivery>) => {
      const { data, error } = await supabase
        .from('tiktok_product_deliveries')
        .insert({ ...input, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-product-deliveries'] });
      toast({ title: 'Delivery recorded' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateProductDelivery = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TikTokProductDelivery> & { id: string }) => {
      const { error } = await supabase
        .from('tiktok_product_deliveries')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-product-deliveries'] });
      toast({ title: 'Delivery updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteProductDelivery = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tiktok_product_deliveries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-product-deliveries'] });
      toast({ title: 'Delivery deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { productDeliveries, isLoading, createProductDelivery, updateProductDelivery, deleteProductDelivery };
}
