import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TikTokDeliveryRecord, DeliveryRecordStatus } from '@/types/tiktok';

export function useTikTokDeliveryRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveryRecords = [], isLoading } = useQuery({
    queryKey: ['tiktok-delivery-records', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tiktok_delivery_records')
        .select(`*, advertiser:tiktok_advertisers(*)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as TikTokDeliveryRecord[];
    },
    enabled: !!user?.id,
  });

  const createDeliveryRecord = useMutation({
    mutationFn: async (record: {
      delivery_person_name: string;
      phone?: string;
      advertiser_id: string;
      status?: DeliveryRecordStatus;
      delivery_date: string;
      delivery_time: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tiktok_delivery_records')
        .insert({ ...record, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-delivery-records'] });
      toast({ title: 'Delivery record created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create delivery record', description: error.message, variant: 'destructive' });
    },
  });

  const updateDeliveryRecord = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeliveryRecordStatus }) => {
      const { data, error } = await supabase
        .from('tiktok_delivery_records')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-delivery-records'] });
      toast({ title: 'Delivery status updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update delivery', description: error.message, variant: 'destructive' });
    },
  });

  return {
    deliveryRecords,
    isLoading,
    createDeliveryRecord,
    updateDeliveryRecord,
  };
}
