import { Link } from 'react-router-dom';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, AlertTriangle, ChevronRight } from 'lucide-react';
import { useJobNotes } from '@/hooks/useJobNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  completed: { label: 'Done', className: 'bg-green-100 text-green-800 border-green-200' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 border-red-200' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export function UpcomingSchedules() {
  const { data: jobNotes = [], isLoading } = useJobNotes({});

  // Get upcoming and overdue jobs (not completed, not cancelled)
  const now = new Date();
  const importantJobs = jobNotes
    .filter(job => !job.is_completed && job.status !== 'cancelled')
    .map(job => {
      const jobDate = parseISO(job.scheduled_date);
      const [hours, minutes] = job.scheduled_time.split(':').map(Number);
      jobDate.setHours(hours, minutes);
      return { ...job, dateTime: jobDate };
    })
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
    .slice(0, 5);

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Schedules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Schedules
        </CardTitle>
        <Link to="/schedule">
          <Button variant="ghost" size="sm" className="gap-1">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {importantJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No upcoming schedules</p>
            <Link to="/schedule">
              <Button variant="link" className="mt-2">
                Create a schedule →
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {importantJobs.map((job) => {
              const isOverdue = isPast(job.dateTime) && !job.is_completed;
              const status = isOverdue ? 'overdue' : job.status;
              const statusConfig = STATUS_CONFIG[status];

              return (
                <Link 
                  key={job.id} 
                  to="/schedule"
                  className="block"
                >
                  <div className={cn(
                    "p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                    isOverdue ? "border-red-200 bg-red-50/50" : "border-border bg-card hover:border-primary/30"
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">
                            {job.job_title}
                          </h4>
                          <Badge className={cn('text-xs shrink-0', statusConfig.className)}>
                            {isOverdue && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.person_name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn(
                          "text-sm font-medium",
                          isToday(job.dateTime) && "text-primary",
                          isOverdue && "text-destructive"
                        )}>
                          {formatDateLabel(job.dateTime)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                          <Clock className="h-3 w-3" />
                          {job.scheduled_time}
                        </div>
                      </div>
                    </div>
                    {job.job_location && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{job.job_location}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
