import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles = [], isLoading, isPending, isFetching } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
    enabled: !!user?.id,
  });

  // In React Query v5, isLoading = isPending && isFetching
  // When enabled is false, isPending=true but isFetching=false, so isLoading=false
  // We need to report as loading when user exists but query hasn't resolved yet
  const effectiveLoading = !user?.id ? false : (isPending || isLoading);

  return {
    roles,
    isAdmin: roles.includes('admin'),
    isLoading: effectiveLoading,
  };
}
