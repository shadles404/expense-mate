
-- Add payment_status column to tiktok_product_deliveries
ALTER TABLE public.tiktok_product_deliveries 
ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid' 
CHECK (payment_status IN ('paid', 'unpaid'));

-- Create tiktok_payment_history table for monthly payment archiving
CREATE TABLE public.tiktok_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  advertiser_id uuid NOT NULL REFERENCES public.tiktok_advertisers(id),
  campaign_month text NOT NULL,
  target_videos integer NOT NULL DEFAULT 0,
  completed_videos integer NOT NULL DEFAULT 0,
  payment_amount numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tiktok_payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own payment history" ON public.tiktok_payment_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access payment history" ON public.tiktok_payment_history
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sub-users can view admin payment history" ON public.tiktok_payment_history
  FOR SELECT TO authenticated
  USING (is_sub_user_of(user_id));
