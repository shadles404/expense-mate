import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Check, 
  X, 
  Edit2, 
  Trash2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { JobNote, JOB_TYPES, JOB_STATUSES } from '@/types/job';
import { useToggleJobCompletion } from '@/hooks/useJobNotes';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: JobNote;
  onEdit: (job: JobNote) => void;
  onDelete: (job: JobNote) => void;
  onView: (job: JobNote) => void;
}

export function JobCard({ job, onEdit, onDelete, onView }: JobCardProps) {
  const toggleCompletion = useToggleJobCompletion();
  const jobType = JOB_TYPES.find(t => t.value === job.job_type);
  
  const today = startOfDay(new Date());
  const isOverdue = !job.is_completed && isBefore(parseISO(job.scheduled_date), today);
  const effectiveStatus = isOverdue ? 'overdue' : job.status;
  const statusInfo = JOB_STATUSES.find(s => s.value === effectiveStatus);

  const handleToggle = () => {
    toggleCompletion.mutate({ id: job.id, isCompleted: !job.is_completed });
  };

  const getStatusColor = () => {
    switch (effectiveStatus) {
      case 'completed':
        return 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
      case 'overdue':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'pending':
        return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20';
      case 'cancelled':
        return 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-950/20';
      default:
        return 'border-l-primary';
    }
  };

  return (
    <Card 
      className={cn(
        'border-l-4 transition-all hover:shadow-md cursor-pointer',
        getStatusColor()
      )}
      onClick={() => onView(job)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={job.is_completed}
              onCheckedChange={handleToggle}
              disabled={toggleCompletion.isPending}
              className="h-5 w-5"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className={cn(
                  'font-semibold text-foreground',
                  job.is_completed && 'line-through text-muted-foreground'
                )}>
                  {job.job_title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{job.person_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={cn('text-xs', jobType?.color, 'text-white border-0')}>
                  {jobType?.label}
                </Badge>
                <Badge 
                  variant={effectiveStatus === 'overdue' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {job.is_completed ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : effectiveStatus === 'overdue' ? (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  ) : null}
                  {statusInfo?.label}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(parseISO(job.scheduled_date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{job.scheduled_time}</span>
              </div>
              {job.job_location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[150px]">{job.job_location}</span>
                  {job.map_link && (
                    <a 
                      href={job.map_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {job.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {job.description}
              </p>
            )}

            {job.completed_at && (
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                Completed on {format(parseISO(job.completed_at), 'MMM d, yyyy at h:mm a')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(job)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(job)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
