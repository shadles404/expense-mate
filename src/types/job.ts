export type JobType = 'meeting' | 'delivery' | 'inspection' | 'support' | 'maintenance' | 'consultation' | 'other';
export type JobStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

export interface JobNote {
  id: string;
  user_id: string;
  person_name: string;
  job_title: string;
  job_type: JobType;
  job_location: string | null;
  map_link: string | null;
  scheduled_date: string;
  scheduled_time: string;
  description: string | null;
  status: JobStatus;
  is_completed: boolean;
  completed_at: string | null;
  reminder_enabled: boolean;
  reminder_minutes_before: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobActivityLog {
  id: string;
  job_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export const JOB_TYPES: { value: JobType; label: string; color: string }[] = [
  { value: 'meeting', label: 'Meeting', color: 'bg-blue-500' },
  { value: 'delivery', label: 'Delivery', color: 'bg-green-500' },
  { value: 'inspection', label: 'Inspection', color: 'bg-yellow-500' },
  { value: 'support', label: 'Support', color: 'bg-purple-500' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-500' },
  { value: 'consultation', label: 'Consultation', color: 'bg-pink-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

export const JOB_STATUSES: { value: JobStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-500' },
];
