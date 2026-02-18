
-- Module permissions table for granular access control
CREATE TABLE public.module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_key text NOT NULL,
  access_level text NOT NULL DEFAULT 'none' CHECK (access_level IN ('none', 'read', 'write')),
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);

-- Admin-created sub-users tracking
CREATE TABLE public.admin_sub_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  sub_user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sub_user_id)
);

-- Enable RLS
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sub_users ENABLE ROW LEVEL SECURITY;

-- Module permissions policies
CREATE POLICY "Users can view own permissions"
  ON public.module_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions"
  ON public.module_permissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage permissions"
  ON public.module_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin sub-users policies
CREATE POLICY "Admins can manage sub-users"
  ON public.admin_sub_users FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view sub-users"
  ON public.admin_sub_users FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sub-users can view own record"
  ON public.admin_sub_users FOR SELECT
  USING (auth.uid() = sub_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_module_permissions_updated_at
  BEFORE UPDATE ON public.module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_sub_users_updated_at
  BEFORE UPDATE ON public.admin_sub_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
