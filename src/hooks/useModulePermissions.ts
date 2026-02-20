import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export type AccessLevel = 'none' | 'read' | 'write';

export const MODULE_KEYS = [
  { key: 'dashboard', label: 'Expense Dashboard' },
  { key: 'projects', label: 'Projects' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'reports', label: 'Reports' },
  { key: 'tiktok', label: 'TikTok Management' },
] as const;

export type ModuleKey = typeof MODULE_KEYS[number]['key'];

export const TIKTOK_SECTION_KEYS = [
  { key: 'tiktok_dashboard', label: 'Dashboard', href: '/tiktok' },
  { key: 'tiktok_influencers', label: 'Influencer Registration', href: '/tiktok/influencers' },
  { key: 'tiktok_tracking', label: 'Tracking', href: '/tiktok/tracking' },
  { key: 'tiktok_delivery', label: 'Delivery Records', href: '/tiktok/delivery' },
  { key: 'tiktok_payments', label: 'Payment Confirmation', href: '/tiktok/payments' },
  { key: 'tiktok_reports', label: 'Reports', href: '/tiktok/reports' },
  { key: 'tiktok_settings', label: 'Settings', href: '/tiktok/settings' },
] as const;

export type TikTokSectionKey = typeof TIKTOK_SECTION_KEYS[number]['key'];

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

export function useTikTokSectionPermissions() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const { data: sectionPerms = [], isLoading } = useQuery({
    queryKey: ['tiktok-section-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from('tiktok_section_permissions')
        .select('section_key, access_level')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as { section_key: string; access_level: string }[];
    },
    enabled: !!user?.id && !isAdmin,
  });

  const getSectionAccess = (sectionKey: string): AccessLevel => {
    if (isAdmin) return 'write';
    const perm = sectionPerms.find((p) => p.section_key === sectionKey);
    return (perm?.access_level as AccessLevel) || 'none';
  };

  const canAccessSection = (sectionKey: string): boolean => getSectionAccess(sectionKey) !== 'none';
  const canWriteSection = (sectionKey: string): boolean => getSectionAccess(sectionKey) === 'write';

  return { sectionPerms, isLoading, getSectionAccess, canAccessSection, canWriteSection };
}
