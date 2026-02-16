import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { TikTokPayment } from '@/types/tiktok';

export function useTikTokPayments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['tiktok-payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_payments')
        .select('*, advertiser:tiktok_advertisers(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as TikTokPayment[];
    },
    enabled: !!user?.id,
  });

  const createPayment = useMutation({
    mutationFn: async (input: Partial<TikTokPayment>) => {
      const { data, error } = await supabase
        .from('tiktok_payments')
        .insert({ ...input, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-payments'] });
      toast({ title: 'Payment recorded' });
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

  return { payments, isLoading, createPayment, updatePayment };
}
