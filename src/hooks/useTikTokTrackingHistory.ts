import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdminContext } from './useAdminContext';
import { toast } from '@/hooks/use-toast';

export interface TrackingHistoryRecord {
  id: string;
  user_id: string;
  advertiser_id: string;
  tracking_month: string;
  target_videos: number;
  completed_videos: number;
  reached_target: boolean;
  created_at: string;
}

export function useTikTokTrackingHistory() {
  const { user } = useAuth();
  const { effectiveUserId } = useAdminContext();
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['tiktok-tracking-history', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('tiktok_tracking_history')
        .select('*')
        .eq('user_id', effectiveUserId!)
        .order('tracking_month', { ascending: false });
      if (error) throw error;
      return data as TrackingHistoryRecord[];
    },
    enabled: !!effectiveUserId,
  });

  const archiveAndReset = useMutation({
    mutationFn: async (influencers: Array<{ id: string; target_videos: number; completed_videos: number }>) => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Archive current tracking data
      const archives = influencers
        .filter(i => i.target_videos > 0)
        .map(i => ({
          user_id: user!.id,
          advertiser_id: i.id,
          tracking_month: currentMonth,
          target_videos: i.target_videos,
          completed_videos: i.completed_videos,
          reached_target: i.completed_videos >= i.target_videos,
        }));

      if (archives.length > 0) {
        const { error } = await (supabase as any)
          .from('tiktok_tracking_history')
          .upsert(archives, { onConflict: 'user_id,advertiser_id,tracking_month' });
        if (error) throw error;
      }

      // Reset completed_videos to 0 for all influencers
      for (const i of influencers) {
        const { error } = await supabase
          .from('tiktok_advertisers')
          .update({ completed_videos: 0 } as any)
          .eq('id', i.id);
        if (error) throw error;
      }

      return archives.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-tracking-history'] });
      queryClient.invalidateQueries({ queryKey: ['tiktok-advertisers'] });
      toast({ title: `Monthly reset complete`, description: `${count} records archived` });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { history, isLoading, archiveAndReset };
}
