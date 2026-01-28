import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TikTokProductDelivery, ProductDeliveryStatus } from '@/types/tiktok';
import { useToast } from '@/hooks/use-toast';

export function useTikTokProductDeliveries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['tiktok-product-deliveries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tiktok_product_deliveries')
        .select(`
          *,
          advertiser:tiktok_advertisers(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TikTokProductDelivery[];
    },
    enabled: !!user?.id,
  });

  const totalDeliveryPrice = deliveries.reduce((sum, d) => sum + Number(d.price) * d.quantity, 0);

  const createDelivery = useMutation({
    mutationFn: async (delivery: {
      advertiser_id: string;
      product_name: string;
      quantity: number;
      date_sent: string;
      status: ProductDeliveryStatus;
      price: number;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tiktok_product_deliveries')
        .insert({
          ...delivery,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-product-deliveries'] });
      toast({ title: 'Delivery added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add delivery', description: error.message, variant: 'destructive' });
    },
  });

  const updateDelivery = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      advertiser_id?: string;
      product_name?: string;
      quantity?: number;
      date_sent?: string;
      status?: ProductDeliveryStatus;
      price?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('tiktok_product_deliveries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-product-deliveries'] });
      toast({ title: 'Delivery updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update delivery', description: error.message, variant: 'destructive' });
    },
  });

  const deleteDelivery = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tiktok_product_deliveries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-product-deliveries'] });
      toast({ title: 'Delivery deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete delivery', description: error.message, variant: 'destructive' });
    },
  });

  return {
    deliveries,
    isLoading,
    totalDeliveryPrice,
    createDelivery,
    updateDelivery,
    deleteDelivery,
  };
}
