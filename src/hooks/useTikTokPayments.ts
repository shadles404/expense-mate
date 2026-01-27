import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TikTokPayment, PaymentStatus } from '@/types/tiktok';
import { useToast } from '@/hooks/use-toast';

export function useTikTokPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['tiktok-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tiktok_payments')
        .select(`
          *,
          advertiser:tiktok_advertisers(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TikTokPayment[];
    },
    enabled: !!user?.id,
  });

  const createPayment = useMutation({
    mutationFn: async (payment: {
      advertiser_id: string;
      amount: number;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tiktok_payments')
        .insert({
          ...payment,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      toast({ title: 'Payment record created' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create payment', description: error.message, variant: 'destructive' });
    },
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TikTokPayment> & { id: string }) => {
      const { data, error } = await supabase
        .from('tiktok_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      toast({ title: 'Payment updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update payment', description: error.message, variant: 'destructive' });
    },
  });

  const approvePayment = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PaymentStatus }) => {
      const { data, error } = await supabase
        .from('tiktok_payments')
        .update({
          status,
          payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      toast({ title: 'Payment status updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update payment', description: error.message, variant: 'destructive' });
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tiktok_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      toast({ title: 'Payment deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete payment', description: error.message, variant: 'destructive' });
    },
  });

  return {
    payments,
    isLoading,
    createPayment,
    updatePayment,
    approvePayment,
    deletePayment,
  };
}
