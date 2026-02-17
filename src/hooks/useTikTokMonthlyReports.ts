import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface MonthlyReport {
  id: string;
  user_id: string;
  report_month: string;
  total_influencers: number;
  active_influencers: number;
  total_target_videos: number;
  total_completed_videos: number;
  reached_target: number;
  unreached_target: number;
  total_payments_made: number;
  total_payments_pending: number;
  total_deliveries: number;
  report_data: any;
  created_at: string;
}

export function useTikTokMonthlyReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['tiktok-monthly-reports', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_monthly_reports' as any)
        .select('*')
        .order('report_month', { ascending: false });
      if (error) throw error;
      return data as unknown as MonthlyReport[];
    },
    enabled: !!user?.id,
  });

  const saveReport = useMutation({
    mutationFn: async (report: Omit<MonthlyReport, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('tiktok_monthly_reports' as any)
        .upsert(report as any, { onConflict: 'user_id,report_month' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-monthly-reports'] });
      toast({ title: 'Monthly report saved' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { reports, isLoading, saveReport };
}
