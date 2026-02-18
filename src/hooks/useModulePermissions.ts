import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export type AccessLevel = 'none' | 'read' | 'write';

export const MODULE_KEYS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'projects', label: 'Projects' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'reports', label: 'Reports' },
  { key: 'tiktok', label: 'TikTok Management' },
] as const;

export type ModuleKey = typeof MODULE_KEYS[number]['key'];

export function useModulePermissions() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['module-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('module_permissions')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getAccess = (moduleKey: string): AccessLevel => {
    if (isAdmin) return 'write'; // Admins have full access
    const perm = permissions.find((p: any) => p.module_key === moduleKey);
    return (perm?.access_level as AccessLevel) || 'none';
  };

  const canAccess = (moduleKey: string): boolean => getAccess(moduleKey) !== 'none';
  const canWrite = (moduleKey: string): boolean => getAccess(moduleKey) === 'write';
  const canRead = (moduleKey: string): boolean => getAccess(moduleKey) === 'read' || getAccess(moduleKey) === 'write';

  return { permissions, isLoading, getAccess, canAccess, canWrite, canRead, isAdmin };
}
