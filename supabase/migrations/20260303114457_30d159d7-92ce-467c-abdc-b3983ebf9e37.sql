
-- Add unique constraint to prevent duplicate payments per influencer per month
CREATE UNIQUE INDEX unique_payment_per_influencer_month ON public.tiktok_payments (user_id, advertiser_id, campaign_month) WHERE campaign_month IS NOT NULL;
