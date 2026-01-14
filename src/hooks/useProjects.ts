import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectWithTotals } from '@/types/expense';
import { toast } from 'sonner';

export function useProjects() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<ProjectWithTotals[]> => {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const projectsWithTotals = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: expenses } = await supabase
            .from('expenses')
            .select('quantity, price')
            .eq('project_id', project.id);

          const totalCost = (expenses || []).reduce(
            (sum, exp) => sum + Number(exp.quantity) * Number(exp.price),
            0
          );

          return {
            ...project,
            budget: Number(project.budget),
            totalCost,
            expenseCount: expenses?.length || 0,
          };
        })
      );

      return projectsWithTotals;
    },
  });

  const createProject = useMutation({
    mutationFn: async (data: { title: string; budget: number }) => {
      const { data: project, error } = await supabase
        .from('projects')
        .insert([{ title: data.title, budget: data.budget }])
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create project: ' + error.message);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Project> & { id: string }) => {
      const { data: project, error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update project: ' + error.message);
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete project: ' + error.message);
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
  };
}
