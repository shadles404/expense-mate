import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdminContext } from './useAdminContext';
import { toast } from '@/hooks/use-toast';
import type { TikTokPayment, PaymentAuditLog } from '@/types/tiktok';

export function useTikTokPayments() {
  const { user } = useAuth();
  const { effectiveUserId } = useAdminContext();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['tiktok-payments', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_payments')
        .select('*, advertiser:tiktok_advertisers(*)')
        .eq('user_id', effectiveUserId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as TikTokPayment[];
    },
    enabled: !!effectiveUserId,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['tiktok-payment-audit', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('payment_audit_log')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PaymentAuditLog[];
    },
    enabled: !!effectiveUserId,
  });

  const createPayment = useMutation({
    mutationFn: async (input: Partial<TikTokPayment>) => {
      const { data, error } = await supabase
        .from('tiktok_payments')
        .insert({ ...input, user_id: user!.id } as any)
        .select()
        .single();
      if (error) {
        if (error.code === '23505') {
          throw new Error('Payment already recorded for this influencer this month');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      toast({ title: 'Payment recorded' });
    },
    onError: (e: Error) => toast({ title: 'Duplicate detected', description: e.message, variant: 'destructive' }),
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      // Get current payment to log old status
      const current = payments.find(p => p.id === id);
      
      // Update status
      const { error } = await supabase
        .from('tiktok_payments')
        .update({ 
          status, 
          payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : (current?.payment_date || null),
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;

      // Log audit
      await (supabase as any)
        .from('payment_audit_log')
        .insert({
          payment_id: id,
          changed_by: user!.id,
          old_status: current?.status || null,
          new_status: status,
          notes: notes || null,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-payment-audit'] });
      toast({ title: 'Payment status updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TikTokPayment> & { id: string }) => {
      const { error } = await supabase
        .from('tiktok_payments')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      toast({ title: 'Payment updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // Auto-add eligible influencers as pending payments
  const autoAddEligible = useMutation({
    mutationFn: async (influencers: Array<{ id: string; name: string; target_videos: number; completed_videos: number; salary: number }>) => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const existingThisMonth = payments.filter(p => p.campaign_month === currentMonth);
      
      const eligible = influencers.filter(i => 
        i.completed_videos >= i.target_videos && 
        i.target_videos > 0 &&
        !existingThisMonth.some(p => p.advertiser_id === i.id)
      );

      if (eligible.length === 0) {
        throw new Error('No new eligible influencers found for this month');
      }

      const inserts = eligible.map(i => ({
        user_id: user!.id,
        advertiser_id: i.id,
        amount: i.salary,
        status: 'pending' as const,
        campaign_month: currentMonth,
        total_target_videos: i.target_videos,
        completed_videos: i.completed_videos,
      }));

      const { error } = await supabase
        .from('tiktok_payments')
        .insert(inserts as any);
      if (error) throw error;
      return eligible.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      toast({ title: `${count} eligible influencer(s) added as Pending` });
    },
    onError: (e: Error) => toast({ title: 'Info', description: e.message }),
  });

  const deletePayments = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('tiktok_payments')
        .delete()
        .in('id', ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      toast({ title: `${count} payment(s) deleted` });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { payments, auditLogs, isLoading, createPayment, updatePayment, updatePaymentStatus, autoAddEligible, deletePayments };
}
