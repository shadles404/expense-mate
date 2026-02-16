
-- Add influencer-specific fields to tiktok_advertisers
ALTER TABLE public.tiktok_advertisers
  ADD COLUMN IF NOT EXISTS tiktok_username text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS agreement_start_date date,
  ADD COLUMN IF NOT EXISTS agreement_end_date date,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add campaign tracking fields to tiktok_payments
ALTER TABLE public.tiktok_payments
  ADD COLUMN IF NOT EXISTS campaign_month text,
  ADD COLUMN IF NOT EXISTS total_target_videos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_videos integer DEFAULT 0;
