import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TikTokDelivery, DeliveryStatus } from '@/types/tiktok';
import { useToast } from '@/hooks/use-toast';

export function useTikTokDeliveries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['tiktok-deliveries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tiktok_deliveries')
        .select(`
          *,
          advertiser:tiktok_advertisers(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TikTokDelivery[];
    },
    enabled: !!user?.id,
  });

  const createDelivery = useMutation({
    mutationFn: async (delivery: {
      advertiser_id: string;
      video_link: string;
      submission_date?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tiktok_deliveries')
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
      queryClient.invalidateQueries({ queryKey: ['tiktok-deliveries'] });
      toast({ title: 'Delivery submitted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to submit delivery', description: error.message, variant: 'destructive' });
    },
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeliveryStatus }) => {
      const { data, error } = await supabase
        .from('tiktok_deliveries')
        .update({
          status,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ title: 'Delivery status updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update delivery', description: error.message, variant: 'destructive' });
    },
  });

  const deleteDelivery = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tiktok_deliveries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-deliveries'] });
      toast({ title: 'Delivery deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete delivery', description: error.message, variant: 'destructive' });
    },
  });

  return {
    deliveries,
    isLoading,
    createDelivery,
    updateDeliveryStatus,
    deleteDelivery,
  };
}
