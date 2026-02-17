
-- Fix RLS: Allow users to create their own product deliveries (not just admins)
DROP POLICY IF EXISTS "Admins can create product deliveries" ON public.tiktok_product_deliveries;
CREATE POLICY "Users can create their own product deliveries"
  ON public.tiktok_product_deliveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Also allow users to update and delete their own product deliveries
DROP POLICY IF EXISTS "Admins can update product deliveries" ON public.tiktok_product_deliveries;
CREATE POLICY "Users can update their own product deliveries"
  ON public.tiktok_product_deliveries FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete product deliveries" ON public.tiktok_product_deliveries;
CREATE POLICY "Users can delete their own product deliveries"
  ON public.tiktok_product_deliveries FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies for product deliveries (view/manage all)
CREATE POLICY "Admins can view all product deliveries"
  ON public.tiktok_product_deliveries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all product deliveries"
  ON public.tiktok_product_deliveries FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all product deliveries"
  ON public.tiktok_product_deliveries FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for advertisers (view all)
CREATE POLICY "Admins can view all advertisers"
  ON public.tiktok_advertisers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all advertisers"
  ON public.tiktok_advertisers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for payments (view all)
CREATE POLICY "Admins can view all payments"
  ON public.tiktok_payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for deliveries (view all)
CREATE POLICY "Admins can view all deliveries"
  ON public.tiktok_deliveries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Monthly report snapshots table
CREATE TABLE public.tiktok_monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_month text NOT NULL, -- e.g. '2026-02'
  total_influencers integer NOT NULL DEFAULT 0,
  active_influencers integer NOT NULL DEFAULT 0,
  total_target_videos integer NOT NULL DEFAULT 0,
  total_completed_videos integer NOT NULL DEFAULT 0,
  reached_target integer NOT NULL DEFAULT 0,
  unreached_target integer NOT NULL DEFAULT 0,
  total_payments_made numeric NOT NULL DEFAULT 0,
  total_payments_pending numeric NOT NULL DEFAULT 0,
  total_deliveries integer NOT NULL DEFAULT 0,
  report_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_month)
);

ALTER TABLE public.tiktok_monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.tiktok_monthly_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reports"
  ON public.tiktok_monthly_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON public.tiktok_monthly_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
  ON public.tiktok_monthly_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
