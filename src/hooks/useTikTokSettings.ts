import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TikTokSettings, PlatformType, ContractType } from '@/types/tiktok';
import { useToast } from '@/hooks/use-toast';

export function useTikTokSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tiktok-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('tiktok_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TikTokSettings | null;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: {
      default_platform?: PlatformType;
      default_contract_type?: ContractType;
      currency?: string;
      tax_rate?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: existing } = await supabase
        .from('tiktok_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('tiktok_settings')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('tiktok_settings')
          .insert({
            ...updates,
            user_id: user.id,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktok-settings'] });
      toast({ title: 'Settings saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
  };
}
