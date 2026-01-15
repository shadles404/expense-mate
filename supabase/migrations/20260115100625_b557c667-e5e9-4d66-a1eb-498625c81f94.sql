
-- Create job type enum
CREATE TYPE public.job_type AS ENUM ('meeting', 'delivery', 'inspection', 'support', 'maintenance', 'consultation', 'other');

-- Create job status enum
CREATE TYPE public.job_status AS ENUM ('pending', 'completed', 'overdue', 'cancelled');

-- Create job notes table
CREATE TABLE public.job_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_type public.job_type NOT NULL DEFAULT 'other',
  job_location TEXT,
  map_link TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  description TEXT,
  status public.job_status NOT NULL DEFAULT 'pending',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_minutes_before INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job activity log table
CREATE TABLE public.job_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.job_notes(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_notes
CREATE POLICY "Allow public read access to job_notes"
ON public.job_notes FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to job_notes"
ON public.job_notes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to job_notes"
ON public.job_notes FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to job_notes"
ON public.job_notes FOR DELETE USING (true);

-- RLS policies for job_activity_log
CREATE POLICY "Allow public read access to job_activity_log"
ON public.job_activity_log FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to job_activity_log"
ON public.job_activity_log FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_job_notes_updated_at
BEFORE UPDATE ON public.job_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log job status changes
CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.job_activity_log (job_id, action, old_value, new_value)
    VALUES (NEW.id, 'status_change', OLD.status::text, NEW.status::text);
  END IF;
  
  IF OLD.is_completed IS DISTINCT FROM NEW.is_completed THEN
    INSERT INTO public.job_activity_log (job_id, action, old_value, new_value)
    VALUES (NEW.id, 'completion_change', OLD.is_completed::text, NEW.is_completed::text);
  END IF;
  
  IF OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date OR OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time THEN
    INSERT INTO public.job_activity_log (job_id, action, old_value, new_value)
    VALUES (NEW.id, 'reschedule', 
      OLD.scheduled_date::text || ' ' || OLD.scheduled_time::text,
      NEW.scheduled_date::text || ' ' || NEW.scheduled_time::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for logging changes
CREATE TRIGGER log_job_changes
AFTER UPDATE ON public.job_notes
FOR EACH ROW
EXECUTE FUNCTION public.log_job_status_change();
