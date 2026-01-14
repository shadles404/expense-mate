import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, DollarSign, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { projects, isLoading } = useProjects();

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalSpent = projects.reduce((sum, p) => sum + p.totalCost, 0);
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const overBudgetCount = projects.filter(p => p.budget > 0 && p.totalCost > p.budget).length;
    const avgProjectCost = totalProjects > 0 ? totalSpent / totalProjects : 0;

    return { totalProjects, totalSpent, totalBudget, overBudgetCount, avgProjectCost };
  }, [projects]);

  const recentProjects = projects.slice(0, 4);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Track and manage your expense projects
            </p>
          </div>
          <Link to="/projects">
            <Button className="btn-float gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total Projects"
                value={stats.totalProjects}
                subtitle="Active projects"
                icon={<FolderOpen className="h-6 w-6" />}
              />
              <StatCard
                title="Total Spent"
                value={`$${stats.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                subtitle="Across all projects"
                icon={<DollarSign className="h-6 w-6" />}
                iconClassName="gradient-success"
              />
              <StatCard
                title="Avg. Project Cost"
                value={`$${stats.avgProjectCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                subtitle="Per project"
                icon={<TrendingUp className="h-6 w-6" />}
                iconClassName="gradient-primary"
              />
              <StatCard
                title="Over Budget"
                value={stats.overBudgetCount}
                subtitle={`of ${stats.totalProjects} projects`}
                icon={<AlertTriangle className="h-6 w-6" />}
                iconClassName={stats.overBudgetCount > 0 ? "gradient-danger" : "gradient-primary"}
              />
            </>
          )}
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Projects</h2>
            <Link to="/projects" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {recentProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No projects yet</h3>
              <p className="mt-1 text-muted-foreground">Get started by creating your first expense project</p>
              <Link to="/projects">
                <Button className="mt-4 btn-float gap-2">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
