
-- Create tracking history table
CREATE TABLE public.tiktok_tracking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  advertiser_id uuid NOT NULL REFERENCES public.tiktok_advertisers(id) ON DELETE CASCADE,
  tracking_month text NOT NULL,
  target_videos integer NOT NULL DEFAULT 0,
  completed_videos integer NOT NULL DEFAULT 0,
  reached_target boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one record per influencer per month
CREATE UNIQUE INDEX unique_tracking_per_influencer_month ON public.tiktok_tracking_history (user_id, advertiser_id, tracking_month);

ALTER TABLE public.tiktok_tracking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tracking history" ON public.tiktok_tracking_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access tracking history" ON public.tiktok_tracking_history
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sub-users can view admin tracking history" ON public.tiktok_tracking_history
  FOR SELECT USING (is_sub_user_of(user_id));

-- Add realtime for tracking history
ALTER PUBLICATION supabase_realtime ADD TABLE public.tiktok_tracking_history;
