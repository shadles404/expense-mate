-- Fix the job_activity_log insert policy to be more restrictive
-- This policy allows inserts only when the job belongs to the current user
DROP POLICY IF EXISTS "System can insert activity logs" ON public.job_activity_log;

CREATE POLICY "Users can insert activity logs for their jobs"
  ON public.job_activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_notes 
      WHERE job_notes.id = job_id 
      AND job_notes.user_id = auth.uid()
    )
  );