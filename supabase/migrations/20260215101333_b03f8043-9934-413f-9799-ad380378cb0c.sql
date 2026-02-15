
-- Create delivery record status enum
CREATE TYPE public.delivery_record_status AS ENUM ('pending', 'completed', 'cancelled');

-- Create delivery records table for delivery personnel tracking
CREATE TABLE public.tiktok_delivery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  delivery_person_name TEXT NOT NULL,
  phone TEXT,
  advertiser_id UUID NOT NULL REFERENCES public.tiktok_advertisers(id) ON DELETE CASCADE,
  status delivery_record_status NOT NULL DEFAULT 'pending',
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_time TIME NOT NULL DEFAULT '09:00',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tiktok_delivery_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own records
CREATE POLICY "Users can view own delivery records"
  ON public.tiktok_delivery_records FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view ALL delivery records from all users
CREATE POLICY "Admins can view all delivery records"
  ON public.tiktok_delivery_records FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can create delivery records
CREATE POLICY "Admins can create delivery records"
  ON public.tiktok_delivery_records FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can update status on their own records
CREATE POLICY "Users can update own delivery records"
  ON public.tiktok_delivery_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can update any delivery record
CREATE POLICY "Admins can update any delivery record"
  ON public.tiktok_delivery_records FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- NO DELETE policy: historical records cannot be deleted

-- Updated_at trigger
CREATE TRIGGER update_tiktok_delivery_records_updated_at
  BEFORE UPDATE ON public.tiktok_delivery_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
