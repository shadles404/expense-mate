ALTER TABLE public.invoice_settings 
  ADD COLUMN signature_count integer DEFAULT 1,
  ADD COLUMN signature_details jsonb DEFAULT '[]'::jsonb;