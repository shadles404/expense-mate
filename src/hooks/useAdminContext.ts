import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

/**
 * Returns the effective "owner" userId to use when querying shared data.
 * - Admins: use their own userId (they own the data)
 * - Sub-users: use their parent admin's userId (they share admin's data)
 * This enables a shared dashboard where sub-users see the exact same records as admin.
 */
export function useAdminContext() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const { data: adminRelation, isLoading: relationLoading } = useQuery({
    queryKey: ['admin-sub-user-relation', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_sub_users')
        .select('admin_user_id')
        .eq('sub_user_id', user!.id)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !isAdmin && !roleLoading,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  const isSubUser = !isAdmin && !!adminRelation?.admin_user_id;
  // The userId whose data we should query:
  // - admin → own id
  // - sub-user → parent admin's id
  // - standalone user → own id
  const effectiveUserId = isAdmin
    ? user?.id
    : (adminRelation?.admin_user_id || user?.id);

  const isLoading = roleLoading || (!isAdmin && relationLoading);

  return { effectiveUserId, isSubUser, isAdmin, isLoading };
}
