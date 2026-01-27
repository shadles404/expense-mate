import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/tiktok';

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isAdmin = roles.some(r => r.role === 'admin');
  const isModerator = roles.some(r => r.role === 'moderator');
  const hasRole = (role: AppRole) => roles.some(r => r.role === role);

  return {
    roles,
    isLoading,
    isAdmin,
    isModerator,
    hasRole,
  };
}
