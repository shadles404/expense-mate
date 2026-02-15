
-- Add company_name and delivery_person columns to tiktok_product_deliveries
ALTER TABLE public.tiktok_product_deliveries
  ADD COLUMN company_name text,
  ADD COLUMN delivery_person text;
