import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Calendar as CalendarIcon, List, Download } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobStats } from '@/components/schedule/JobStats';
import { JobFilters } from '@/components/schedule/JobFilters';
import { JobCard } from '@/components/schedule/JobCard';
import { JobCalendarView } from '@/components/schedule/JobCalendarView';
import { JobNoteDialog } from '@/components/schedule/JobNoteDialog';
import { JobDetailDialog } from '@/components/schedule/JobDetailDialog';
import { DeleteConfirmDialog } from '@/components/projects/DeleteConfirmDialog';
import { useJobNotes, useDeleteJobNote } from '@/hooks/useJobNotes';
import { JobNote } from '@/types/job';

export default function Schedule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-asc');
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobNote | null>(null);

  const { data: jobs = [], isLoading } = useJobNotes({
    dateFilter: dateFilter as any,
    jobType: jobTypeFilter,
    searchQuery,
  });

  const deleteJob = useDeleteJobNote();

  const sortedJobs = useMemo(() => {
    const sorted = [...jobs];
    switch (sortBy) {
      case 'date-desc':
        sorted.sort((a, b) => 
          new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
        );
        break;
      case 'status':
        sorted.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case 'type':
        sorted.sort((a, b) => a.job_type.localeCompare(b.job_type));
        break;
      default: // date-asc
        sorted.sort((a, b) => 
          new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        );
    }
    return sorted;
  }, [jobs, sortBy]);

  const handleCreateNew = () => {
    setSelectedJob(null);
    setDialogOpen(true);
  };

  const handleEdit = (job: JobNote) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const handleView = (job: JobNote) => {
    setSelectedJob(job);
    setDetailDialogOpen(true);
  };

  const handleDelete = (job: JobNote) => {
    setSelectedJob(job);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedJob) {
      await deleteJob.mutateAsync(selectedJob.id);
      setDeleteDialogOpen(false);
      setSelectedJob(null);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedJob(null);
    setDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['Person Name', 'Job Title', 'Type', 'Location', 'Date', 'Time', 'Status', 'Completed'];
    const rows = sortedJobs.map(job => [
      job.person_name,
      job.job_title,
      job.job_type,
      job.job_location || '',
      job.scheduled_date,
      job.scheduled_time,
      job.status,
      job.is_completed ? 'Yes' : 'No',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
            <p className="text-muted-foreground mt-1">Manage your jobs and appointments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleCreateNew} className="gradient-primary shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        </div>

        <JobStats />

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Jobs & Appointments</CardTitle>
              <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Calendar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <JobFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                jobTypeFilter={jobTypeFilter}
                onJobTypeFilterChange={setJobTypeFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : view === 'list' ? (
                sortedJobs.length > 0 ? (
                  <div className="space-y-3">
                    {sortedJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No jobs found</p>
                    <p className="text-sm">Create a new job to get started</p>
                  </div>
                )
              ) : (
                <JobCalendarView
                  jobs={jobs}
                  onDateSelect={handleDateSelect}
                  onJobClick={handleView}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <JobNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={selectedJob}
      />

      <JobDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        job={selectedJob}
        onEdit={() => {
          setDetailDialogOpen(false);
          setDialogOpen(true);
        }}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Job"
        description={`Are you sure you want to delete "${selectedJob?.job_title}"? This action cannot be undone.`}
        isLoading={deleteJob.isPending}
      />
    </Layout>
  );
}
