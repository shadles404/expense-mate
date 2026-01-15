import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JobNote, JOB_TYPES } from '@/types/job';
import { cn } from '@/lib/utils';

interface JobCalendarViewProps {
  jobs: JobNote[];
  onDateSelect: (date: Date) => void;
  onJobClick: (job: JobNote) => void;
}

export function JobCalendarView({ jobs, onDateSelect, onJobClick }: JobCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const getJobsForDate = (date: Date) => {
    return jobs.filter(job => isSameDay(parseISO(job.scheduled_date), date));
  };

  const getDaysToShow = () => {
    if (view === 'week') {
      const start = startOfWeek(currentMonth, { weekStartsOn: 1 });
      const end = endOfWeek(currentMonth, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const days = getDaysToShow();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const navigatePrev = () => {
    setCurrentMonth(prev => view === 'week' 
      ? subMonths(prev, 0.25) // ~1 week
      : subMonths(prev, 1)
    );
  };

  const navigateNext = () => {
    setCurrentMonth(prev => view === 'week'
      ? addMonths(prev, 0.25)
      : addMonths(prev, 1)
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button 
            variant={view === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button 
            variant={view === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('month')}
          >
            Month
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          const dayJobs = getJobsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <div
              key={index}
              className={cn(
                'min-h-[100px] p-1 border rounded-md cursor-pointer transition-colors hover:bg-muted/50',
                !isCurrentMonth && 'opacity-40',
                isToday(day) && 'border-primary bg-primary/5'
              )}
              onClick={() => onDateSelect(day)}
            >
              <div className={cn(
                'text-sm font-medium mb-1',
                isToday(day) && 'text-primary'
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayJobs.slice(0, 3).map(job => {
                  const jobType = JOB_TYPES.find(t => t.value === job.job_type);
                  return (
                    <div
                      key={job.id}
                      className={cn(
                        'text-xs px-1 py-0.5 rounded truncate cursor-pointer',
                        job.is_completed 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 line-through' 
                          : `${jobType?.color} text-white`
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onJobClick(job);
                      }}
                      title={job.job_title}
                    >
                      {job.scheduled_time.slice(0, 5)} {job.job_title}
                    </div>
                  );
                })}
                {dayJobs.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayJobs.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
