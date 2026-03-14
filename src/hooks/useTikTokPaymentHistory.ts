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
    mutationFn: async (payments: Array<{ id: string; advertiser_id: string; campaign_month: string; total_target_videos: number; completed_videos: number | null; amount: number; status: string; payment_date: string | null }>) => {
      if (payments.length === 0) throw new Error('No payments to archive');

      // Separate reached vs unreached using current data passed from the component
      const reached = payments.filter(p => (p.completed_videos ?? 0) >= (p.total_target_videos ?? 1) && (p.total_target_videos ?? 0) > 0);
      const unreached = payments.filter(p => !((p.completed_videos ?? 0) >= (p.total_target_videos ?? 1) && (p.total_target_videos ?? 0) > 0));

      // Archive ALL payments to history
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

      const { error: archiveError } = await (supabase as any)
        .from('tiktok_payment_history')
        .insert(archives);
      if (archiveError) throw archiveError;

      // Delete ONLY unreached influencers from the active payments table
      if (unreached.length > 0) {
        const unreachedIds = unreached.map(p => p.id);
        const { error: deleteError } = await supabase
          .from('tiktok_payments')
          .delete()
          .in('id', unreachedIds);
        if (deleteError) throw deleteError;
      }

      // Update reached payments with current completion data
      for (const p of reached) {
        const { error } = await supabase
          .from('tiktok_payments')
          .update({
            completed_videos: p.completed_videos,
            total_target_videos: p.total_target_videos,
          } as any)
          .eq('id', p.id);
        if (error) throw error;
      }

      return { archived: archives.length, removed: unreached.length, kept: reached.length };
    },
    onSuccess: ({ archived, removed, kept }) => {
      // Force immediate refetch to update UI
      queryClient.invalidateQueries({ queryKey: ['tiktok-payment-history'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ 
        title: 'Monthly reset complete', 
        description: `${archived} archived · ${kept} reached (kept) · ${removed} unreached (removed)` 
      });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { paymentHistory, isLoading, archivePayments };
}
