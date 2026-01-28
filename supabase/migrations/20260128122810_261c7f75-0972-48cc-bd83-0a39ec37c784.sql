-- Add payment status enum
CREATE TYPE public.payment_project_status AS ENUM ('unpaid', 'partially_paid', 'paid');

-- Add payment tracking columns to projects table
ALTER TABLE public.projects 
ADD COLUMN payment_status public.payment_project_status NOT NULL DEFAULT 'unpaid',
ADD COLUMN amount_paid numeric NOT NULL DEFAULT 0,
ADD COLUMN payment_due_date date;

-- Create product delivery status enum (different from video delivery)
CREATE TYPE public.product_delivery_status AS ENUM ('pending', 'sent', 'returned');

-- Create TikTok product deliveries table
CREATE TABLE public.tiktok_product_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  advertiser_id uuid NOT NULL REFERENCES public.tiktok_advertisers(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  date_sent date NOT NULL DEFAULT CURRENT_DATE,
  status public.product_delivery_status NOT NULL DEFAULT 'pending',
  price numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tiktok_product_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for product deliveries
CREATE POLICY "Users can view their own product deliveries"
ON public.tiktok_product_deliveries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create product deliveries"
ON public.tiktok_product_deliveries FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product deliveries"
ON public.tiktok_product_deliveries FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product deliveries"
ON public.tiktok_product_deliveries FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_tiktok_product_deliveries_updated_at
BEFORE UPDATE ON public.tiktok_product_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();