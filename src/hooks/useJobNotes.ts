import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { JobNote, JobActivityLog, JobStatus } from '@/types/job';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, isToday, parseISO, startOfDay } from 'date-fns';

export function useJobNotes(filters?: {
  dateFilter?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
  personName?: string;
  jobType?: string;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: ['job-notes', filters],
    queryFn: async () => {
      let query = supabase
        .from('job_notes')
        .select('*')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = (data || []) as JobNote[];
      const today = startOfDay(new Date());

      // Update overdue status for pending jobs
      filteredData = filteredData.map(job => {
        if (job.status === 'pending' && !job.is_completed) {
          const jobDate = parseISO(job.scheduled_date);
          if (isBefore(jobDate, today)) {
            return { ...job, status: 'overdue' as JobStatus };
          }
        }
        return job;
      });

      // Apply filters
      if (filters?.dateFilter) {
        switch (filters.dateFilter) {
          case 'today':
            filteredData = filteredData.filter(job => isToday(parseISO(job.scheduled_date)));
            break;
          case 'upcoming':
            filteredData = filteredData.filter(job => 
              isAfter(parseISO(job.scheduled_date), today) && job.status !== 'completed'
            );
            break;
          case 'overdue':
            filteredData = filteredData.filter(job => 
              job.status === 'overdue' || (isBefore(parseISO(job.scheduled_date), today) && !job.is_completed)
            );
            break;
          case 'completed':
            filteredData = filteredData.filter(job => job.is_completed);
            break;
        }
      }

      if (filters?.personName) {
        filteredData = filteredData.filter(job => 
          job.person_name.toLowerCase().includes(filters.personName!.toLowerCase())
        );
      }

      if (filters?.jobType && filters.jobType !== 'all') {
        filteredData = filteredData.filter(job => job.job_type === filters.jobType);
      }

      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredData = filteredData.filter(job =>
          job.person_name.toLowerCase().includes(query) ||
          job.job_title.toLowerCase().includes(query) ||
          job.job_location?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query)
        );
      }

      return filteredData;
    },
  });
}

export function useJobNote(id: string | undefined) {
  return useQuery({
    queryKey: ['job-note', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('job_notes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as JobNote | null;
    },
    enabled: !!id,
  });
}

export function useJobActivityLog(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-activity-log', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from('job_activity_log')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as JobActivityLog[];
    },
    enabled: !!jobId,
  });
}

export function useCreateJobNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (job: Omit<JobNote, 'id' | 'created_at' | 'updated_at' | 'status' | 'is_completed' | 'completed_at'>) => {
      const { data, error } = await supabase
        .from('job_notes')
        .insert([job])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-notes'] });
      toast({ title: 'Job scheduled successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create job', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateJobNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JobNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('job_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-notes'] });
      queryClient.invalidateQueries({ queryKey: ['job-note'] });
      toast({ title: 'Job updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update job', description: error.message, variant: 'destructive' });
    },
  });
}

export function useToggleJobCompletion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const updates: Partial<JobNote> = {
        is_completed: isCompleted,
        status: isCompleted ? 'completed' : 'pending',
        completed_at: isCompleted ? new Date().toISOString() : null,
      };
      
      const { data, error } = await supabase
        .from('job_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-notes'] });
      queryClient.invalidateQueries({ queryKey: ['job-note'] });
      toast({ 
        title: variables.isCompleted ? 'Job marked as completed' : 'Job marked as pending' 
      });
    },
    onError: (error) => {
      toast({ title: 'Failed to update job status', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteJobNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-notes'] });
      toast({ title: 'Job deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete job', description: error.message, variant: 'destructive' });
    },
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_notes')
        .select('*');
      if (error) throw error;

      const jobs = data as JobNote[];
      const today = startOfDay(new Date());

      const total = jobs.length;
      const completed = jobs.filter(j => j.is_completed).length;
      const pending = jobs.filter(j => !j.is_completed && !isBefore(parseISO(j.scheduled_date), today)).length;
      const overdue = jobs.filter(j => !j.is_completed && isBefore(parseISO(j.scheduled_date), today)).length;
      const todayJobs = jobs.filter(j => isToday(parseISO(j.scheduled_date))).length;

      return { total, completed, pending, overdue, todayJobs };
    },
  });
}
