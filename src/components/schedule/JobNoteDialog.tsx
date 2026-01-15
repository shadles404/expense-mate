import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JobNote, JOB_TYPES } from '@/types/job';
import { useCreateJobNote, useUpdateJobNote } from '@/hooks/useJobNotes';

const jobSchema = z.object({
  person_name: z.string().min(1, 'Person name is required').max(100),
  job_title: z.string().min(1, 'Job title is required').max(200),
  job_type: z.enum(['meeting', 'delivery', 'inspection', 'support', 'maintenance', 'consultation', 'other']),
  job_location: z.string().max(500).optional(),
  map_link: z.string().url().optional().or(z.literal('')),
  scheduled_date: z.string().min(1, 'Date is required'),
  scheduled_time: z.string().min(1, 'Time is required'),
  description: z.string().max(2000).optional(),
  reminder_enabled: z.boolean(),
  reminder_minutes_before: z.coerce.number().min(5).max(1440).optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobNote | null;
}

export function JobNoteDialog({ open, onOpenChange, job }: JobNoteDialogProps) {
  const createJob = useCreateJobNote();
  const updateJob = useUpdateJobNote();
  const isEditing = !!job;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      person_name: '',
      job_title: '',
      job_type: 'other',
      job_location: '',
      map_link: '',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '09:00',
      description: '',
      reminder_enabled: false,
      reminder_minutes_before: 30,
    },
  });

  useEffect(() => {
    if (job) {
      form.reset({
        person_name: job.person_name,
        job_title: job.job_title,
        job_type: job.job_type,
        job_location: job.job_location || '',
        map_link: job.map_link || '',
        scheduled_date: job.scheduled_date,
        scheduled_time: job.scheduled_time,
        description: job.description || '',
        reminder_enabled: job.reminder_enabled,
        reminder_minutes_before: job.reminder_minutes_before || 30,
      });
    } else {
      form.reset({
        person_name: '',
        job_title: '',
        job_type: 'other',
        job_location: '',
        map_link: '',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        scheduled_time: '09:00',
        description: '',
        reminder_enabled: false,
        reminder_minutes_before: 30,
      });
    }
  }, [job, form]);

  const onSubmit = async (values: JobFormValues) => {
    const jobData = {
      person_name: values.person_name,
      job_title: values.job_title,
      job_type: values.job_type,
      job_location: values.job_location || null,
      map_link: values.map_link || null,
      scheduled_date: values.scheduled_date,
      scheduled_time: values.scheduled_time,
      description: values.description || null,
      reminder_enabled: values.reminder_enabled,
      reminder_minutes_before: values.reminder_enabled ? values.reminder_minutes_before : null,
    };

    if (isEditing) {
      await updateJob.mutateAsync({ id: job.id, ...jobData });
    } else {
      await createJob.mutateAsync(jobData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Job' : 'Schedule New Job'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="person_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person / Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="job_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter job title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="job_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="job_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="map_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Map Link (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://maps.google.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduled_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter job description or notes..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <FormField
                control={form.control}
                name="reminder_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Enable Reminder</FormLabel>
                  </FormItem>
                )}
              />
              {form.watch('reminder_enabled') && (
                <FormField
                  control={form.control}
                  name="reminder_minutes_before"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          className="w-20"
                          min={5}
                          max={1440}
                          {...field}
                        />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">minutes before</span>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createJob.isPending || updateJob.isPending}>
                {isEditing ? 'Save Changes' : 'Schedule Job'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
