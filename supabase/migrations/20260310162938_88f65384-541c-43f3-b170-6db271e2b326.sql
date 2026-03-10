ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'suspended';