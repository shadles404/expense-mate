import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useModulePermissions, useTikTokSectionPermissions } from '@/hooks/useModulePermissions';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: roleLoading, roles } = useUserRole();

  // Show spinner while auth or roles are still loading
  // Also show spinner if user exists but roles haven't been fetched yet (empty array and still no query result)
  if (loading || roleLoading || (user && roles.length === 0 && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

interface TikTokSectionRouteProps {
  sectionKey: string;
  children: React.ReactNode;
}

/**
 * Route guard for TikTok sub-sections.
 * Admins pass through; sub-users must have section-level access.
 */
export function TikTokSectionRoute({ sectionKey, children }: TikTokSectionRouteProps) {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { isLoading: modLoading, canAccess } = useModulePermissions();
  const { isLoading: secLoading, canAccessSection } = useTikTokSectionPermissions();

  if (loading || roleLoading || modLoading || secLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Admins always have access
  if (isAdmin) return <>{children}</>;

  // Must have tiktok module access
  if (!canAccess('tiktok')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the TikTok module.</p>
        </div>
      </div>
    );
  }

  // Must have section-level access
  if (!canAccessSection(sectionKey)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this TikTok section.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
