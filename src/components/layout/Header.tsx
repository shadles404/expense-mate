import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, BarChart3, FileText, CalendarCheck, LogOut, User, Tags, Video, ChevronDown, Users, Target, Package, DollarSign, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useModulePermissions, useTikTokSectionPermissions, TIKTOK_SECTION_KEYS } from '@/hooks/useModulePermissions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, moduleKey: 'dashboard' },
  { name: 'Projects', href: '/projects', icon: FolderOpen, moduleKey: 'projects' },
  { name: 'Schedule', href: '/schedule', icon: CalendarCheck, moduleKey: 'schedule' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, moduleKey: 'analytics' },
  { name: 'Reports', href: '/reports', icon: FileText, moduleKey: 'reports' },
];

const tiktokNavIconMap: Record<string, React.ElementType> = {
  tiktok_dashboard: LayoutDashboard,
  tiktok_influencers: Users,
  tiktok_tracking: Target,
  tiktok_delivery: Package,
  tiktok_payments: DollarSign,
  tiktok_reports: BarChart3,
  tiktok_settings: Settings,
};

export function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { canAccess } = useModulePermissions();
  const { canAccessSection } = useTikTokSectionPermissions();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const isTikTokActive = location.pathname.startsWith('/tiktok');

  // For non-admins, filter main nav by module permissions
  const visibleNav = isAdmin
    ? navigation
    : navigation.filter(item => canAccess(item.moduleKey));

  // TikTok sections visible to this user
  const visibleTikTokSections = isAdmin
    ? TIKTOK_SECTION_KEYS
    : TIKTOK_SECTION_KEYS.filter(s => canAccessSection(s.key));

  const showTikTok = isAdmin || (canAccess('tiktok') && visibleTikTokSections.length > 0);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
                <span className="text-lg font-bold text-primary-foreground">E</span>
              </div>
              <span className="text-xl font-bold text-foreground">ExpenseFlow</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {visibleNav.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}

              {/* TikTok Module Dropdown */}
              {showTikTok && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        isTikTokActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Video className="h-4 w-4" />
                      TikTok
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {visibleTikTokSections.map((item) => {
                      const Icon = tiktokNavIconMap[item.key] || Video;
                      return (
                        <DropdownMenuItem key={item.key} asChild>
                          <Link to={item.href} className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
          </div>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">Account</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Tags className="mr-2 h-4 w-4" />
                      Manage Categories
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Manage Expense Categories</DialogTitle>
                    </DialogHeader>
                    <CategoryManager />
                  </DialogContent>
                </Dialog>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="flex md:hidden items-center gap-1 px-4 pb-3 overflow-x-auto">
        {visibleNav.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
        {showTikTok && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  isTikTokActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Video className="h-4 w-4" />
                TikTok
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {visibleTikTokSections.map((item) => {
                const Icon = tiktokNavIconMap[item.key] || Video;
                return (
                  <DropdownMenuItem key={item.key} asChild>
                    <Link to={item.href} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
    </header>
  );
}
