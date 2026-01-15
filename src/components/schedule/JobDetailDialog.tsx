import { format, parseISO } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Bell,
  ExternalLink,
  History,
  Check,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JobNote, JOB_TYPES, JOB_STATUSES } from '@/types/job';
import { useJobActivityLog, useToggleJobCompletion } from '@/hooks/useJobNotes';
import { cn } from '@/lib/utils';

interface JobDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobNote | null;
  onEdit: () => void;
}

export function JobDetailDialog({ open, onOpenChange, job, onEdit }: JobDetailDialogProps) {
  const { data: activityLog } = useJobActivityLog(job?.id);
  const toggleCompletion = useToggleJobCompletion();

  if (!job) return null;

  const jobType = JOB_TYPES.find(t => t.value === job.job_type);
  const statusInfo = JOB_STATUSES.find(s => s.value === job.status);

  const handleToggle = () => {
    toggleCompletion.mutate({ id: job.id, isCompleted: !job.is_completed });
  };

  const formatAction = (action: string) => {
    switch (action) {
      case 'status_change':
        return 'Status changed';
      case 'completion_change':
        return 'Completion status changed';
      case 'reschedule':
        return 'Rescheduled';
      default:
        return action;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{job.job_title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn(jobType?.color, 'text-white border-0')}>
                  {jobType?.label}
                </Badge>
                <Badge variant={job.is_completed ? 'default' : 'secondary'}>
                  {job.is_completed ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <X className="h-3 w-3 mr-1" />
                  )}
                  {statusInfo?.label}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Person/Company</p>
                  <p className="font-medium">{job.person_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Date</p>
                  <p className="font-medium">{format(parseISO(job.scheduled_date), 'MMMM d, yyyy')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Time</p>
                  <p className="font-medium">{job.scheduled_time}</p>
                </div>
              </div>

              {job.job_location && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{job.job_location}</p>
                      {job.map_link && (
                        <a 
                          href={job.map_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {job.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Description
                </div>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{job.description}</p>
              </div>
            )}

            {job.reminder_enabled && (
              <div className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>Reminder set for {job.reminder_minutes_before} minutes before</span>
              </div>
            )}

            {job.completed_at && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Completed on {format(parseISO(job.completed_at), 'MMMM d, yyyy at h:mm a')}</span>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <History className="h-4 w-4" />
                Activity Log
              </div>
              {activityLog && activityLog.length > 0 ? (
                <div className="space-y-2">
                  {activityLog.map((log) => (
                    <div key={log.id} className="text-sm flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground mt-1.5" />
                      <div>
                        <p className="text-muted-foreground">
                          {formatAction(log.action)}: {log.old_value} → {log.new_value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(log.created_at), 'MMM d, yyyy at h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button
            variant={job.is_completed ? 'outline' : 'default'}
            onClick={handleToggle}
            disabled={toggleCompletion.isPending}
          >
            {job.is_completed ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Mark as Pending
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Mark as Completed
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onEdit}>
            Edit Job
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
