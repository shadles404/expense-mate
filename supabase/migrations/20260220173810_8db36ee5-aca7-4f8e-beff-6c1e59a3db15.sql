
-- 1. Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2. Create tiktok_section_permissions table for granular TikTok sub-section access
CREATE TABLE IF NOT EXISTS public.tiktok_section_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  section_key text NOT NULL,
  access_level text NOT NULL DEFAULT 'none',
  granted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, section_key)
);

-- 3. Enable RLS
ALTER TABLE public.tiktok_section_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Admins have full access
CREATE POLICY "Admins full access tiktok sections"
  ON public.tiktok_section_permissions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Users can view their own section permissions
CREATE POLICY "Users view own tiktok section permissions"
  ON public.tiktok_section_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Update trigger
CREATE TRIGGER update_tiktok_section_permissions_updated_at
  BEFORE UPDATE ON public.tiktok_section_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
