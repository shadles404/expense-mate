-- Create enum for ad types
CREATE TYPE public.ad_type AS ENUM ('Milk', 'Makeup', 'Perfume', 'Cream', 'Skincare', 'Other');

-- Create enum for platform types
CREATE TYPE public.platform_type AS ENUM ('TikTok', 'Instagram', 'YouTube', 'Facebook', 'Other');

-- Create enum for contract types
CREATE TYPE public.contract_type AS ENUM ('Full-time', 'Part-time', 'Freelance', 'Contract');

-- Create enum for delivery status
CREATE TYPE public.delivery_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('paid', 'unpaid');

-- Create app_role enum for admin system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles - users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create advertisers table
CREATE TABLE public.tiktok_advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  salary NUMERIC NOT NULL DEFAULT 0,
  target_videos INTEGER NOT NULL DEFAULT 0,
  completed_videos INTEGER NOT NULL DEFAULT 0,
  platform platform_type NOT NULL DEFAULT 'TikTok',
  contract_type contract_type NOT NULL DEFAULT 'Freelance',
  ad_types ad_type[] NOT NULL DEFAULT '{}',
  notes TEXT,
  targets_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tiktok_advertisers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own advertisers"
ON public.tiktok_advertisers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own advertisers"
ON public.tiktok_advertisers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own advertisers"
ON public.tiktok_advertisers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own advertisers"
ON public.tiktok_advertisers FOR DELETE
USING (auth.uid() = user_id);

-- Create deliveries table
CREATE TABLE public.tiktok_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  advertiser_id UUID REFERENCES public.tiktok_advertisers(id) ON DELETE CASCADE NOT NULL,
  video_link TEXT NOT NULL,
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  status delivery_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tiktok_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deliveries"
ON public.tiktok_deliveries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deliveries"
ON public.tiktok_deliveries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deliveries"
ON public.tiktok_deliveries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any delivery"
ON public.tiktok_deliveries FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own deliveries"
ON public.tiktok_deliveries FOR DELETE
USING (auth.uid() = user_id);

-- Create payments table
CREATE TABLE public.tiktok_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  advertiser_id UUID REFERENCES public.tiktok_advertisers(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'unpaid',
  payment_date DATE,
  receipt_url TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tiktok_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.tiktok_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.tiktok_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
ON public.tiktok_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any payment"
ON public.tiktok_payments FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own payments"
ON public.tiktok_payments FOR DELETE
USING (auth.uid() = user_id);

-- Create TikTok settings table
CREATE TABLE public.tiktok_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  default_platform platform_type DEFAULT 'TikTok',
  default_contract_type contract_type DEFAULT 'Freelance',
  currency TEXT DEFAULT 'USD',
  tax_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tiktok_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
ON public.tiktok_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
ON public.tiktok_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.tiktok_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_tiktok_advertisers_updated_at
BEFORE UPDATE ON public.tiktok_advertisers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tiktok_deliveries_updated_at
BEFORE UPDATE ON public.tiktok_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tiktok_payments_updated_at
BEFORE UPDATE ON public.tiktok_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tiktok_settings_updated_at
BEFORE UPDATE ON public.tiktok_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to assign default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign user role on signup
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();