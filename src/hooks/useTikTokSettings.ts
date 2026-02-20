import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdminContext } from './useAdminContext';
import { toast } from '@/hooks/use-toast';
import type { TikTokSettings } from '@/types/tiktok';

export function useTikTokSettings() {
  const { user } = useAuth();
  const { effectiveUserId } = useAdminContext();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tiktok-settings', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiktok_settings')
        .select('*')
        .eq('user_id', effectiveUserId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as TikTokSettings | null;
    },
    enabled: !!effectiveUserId,
  });

  const upsertSettings = useMutation({
    mutationFn: async (input: Partial<TikTokSettings>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('tiktok_settings')
          .update(input as any)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tiktok_settings')
          .insert({ ...input, user_id: user!.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-settings'] });
      toast({ title: 'Settings saved' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { settings, isLoading, upsertSettings };
}
