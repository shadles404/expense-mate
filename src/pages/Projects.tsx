import { useState, useMemo } from 'react';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { Layout } from '@/components/layout/Layout';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { DeleteConfirmDialog } from '@/components/projects/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectWithTotals } from '@/types/expense';

export default function Projects() {
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithTotals | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(p => p.title.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  const handleCreateOrUpdate = async (data: { title: string; budget: number }) => {
    if (editProject) {
      await updateProject.mutateAsync({ id: editProject.id, ...data });
      setEditProject(null);
    } else {
      await createProject.mutateAsync(data);
    }
    setIsCreateOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProject.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="mt-1 text-muted-foreground">
              Manage all your expense projects
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="btn-float gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-focus"
          />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => {
                  setEditProject(p);
                  setIsCreateOpen(true);
                }}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {searchQuery ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="mt-1 text-muted-foreground">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Get started by creating your first expense project'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)} className="mt-4 btn-float gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>
        )}

        {/* Dialogs */}
        <CreateProjectDialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) setEditProject(null);
          }}
          onSubmit={handleCreateOrUpdate}
          isLoading={createProject.isPending || updateProject.isPending}
          editProject={editProject}
        />

        <DeleteConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          onConfirm={handleDelete}
        />
      </div>
    </Layout>
  );
}
