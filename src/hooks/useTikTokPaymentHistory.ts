import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdminContext } from './useAdminContext';
import { toast } from '@/hooks/use-toast';

export interface PaymentHistoryRecord {
  id: string;
  user_id: string;
  advertiser_id: string;
  campaign_month: string;
  target_videos: number;
  completed_videos: number;
  payment_amount: number;
  payment_status: string;
  payment_date: string | null;
  created_at: string;
}

export function useTikTokPaymentHistory() {
  const { user } = useAuth();
  const { effectiveUserId } = useAdminContext();
  const queryClient = useQueryClient();

  const { data: paymentHistory = [], isLoading } = useQuery({
    queryKey: ['tiktok-payment-history', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('tiktok_payment_history')
        .select('*')
        .eq('user_id', effectiveUserId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PaymentHistoryRecord[];
    },
    enabled: !!effectiveUserId,
  });

  const archivePayments = useMutation({
    mutationFn: async (payments: Array<{ advertiser_id: string; campaign_month: string; total_target_videos: number; completed_videos: number | null; amount: number; status: string; payment_date: string | null }>) => {
      if (payments.length === 0) throw new Error('No payments to archive');

      const archives = payments.map(p => ({
        user_id: user!.id,
        advertiser_id: p.advertiser_id,
        campaign_month: p.campaign_month || new Date().toISOString().slice(0, 7),
        target_videos: p.total_target_videos || 0,
        completed_videos: p.completed_videos || 0,
        payment_amount: p.amount,
        payment_status: p.status,
        payment_date: p.payment_date,
      }));

      const { error } = await (supabase as any)
        .from('tiktok_payment_history')
        .insert(archives);
      if (error) throw error;

      return archives.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payment-history'] });
      toast({ title: `${count} payments archived to history` });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { paymentHistory, isLoading, archivePayments };
}
