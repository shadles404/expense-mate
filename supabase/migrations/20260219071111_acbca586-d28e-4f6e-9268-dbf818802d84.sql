
-- Fix ALL TikTok tables: convert RESTRICTIVE policies to PERMISSIVE

-- === tiktok_advertisers ===
DROP POLICY IF EXISTS "Admins can manage all advertisers" ON public.tiktok_advertisers;
DROP POLICY IF EXISTS "Admins can view all advertisers" ON public.tiktok_advertisers;
DROP POLICY IF EXISTS "Users can create their own advertisers" ON public.tiktok_advertisers;
DROP POLICY IF EXISTS "Users can delete their own advertisers" ON public.tiktok_advertisers;
DROP POLICY IF EXISTS "Users can update their own advertisers" ON public.tiktok_advertisers;
DROP POLICY IF EXISTS "Users can view their own advertisers" ON public.tiktok_advertisers;

CREATE POLICY "Admins full access advertisers" ON public.tiktok_advertisers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users manage own advertisers" ON public.tiktok_advertisers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === tiktok_payments ===
DROP POLICY IF EXISTS "Admins can update any payment" ON public.tiktok_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.tiktok_payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.tiktok_payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.tiktok_payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.tiktok_payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.tiktok_payments;

CREATE POLICY "Admins full access payments" ON public.tiktok_payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users manage own payments" ON public.tiktok_payments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === tiktok_deliveries ===
DROP POLICY IF EXISTS "Admins can update any delivery" ON public.tiktok_deliveries;
DROP POLICY IF EXISTS "Admins can view all deliveries" ON public.tiktok_deliveries;
DROP POLICY IF EXISTS "Admins only - TikTok module" ON public.tiktok_deliveries;
DROP POLICY IF EXISTS "Users can create their own deliveries" ON public.tiktok_deliveries;
DROP POLICY IF EXISTS "Users can delete their own deliveries" ON public.tiktok_deliveries;
DROP POLICY IF EXISTS "Users can update their own deliveries" ON public.tiktok_deliveries;
DROP POLICY IF EXISTS "Users can view their own deliveries" ON public.tiktok_deliveries;

CREATE POLICY "Admins full access deliveries" ON public.tiktok_deliveries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users manage own deliveries" ON public.tiktok_deliveries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === tiktok_product_deliveries ===
DROP POLICY IF EXISTS "Admins can delete all product deliveries" ON public.tiktok_product_deliveries;
DROP POLICY IF EXISTS "Admins can update all product deliveries" ON public.tiktok_product_deliveries;
DROP POLICY IF EXISTS "Admins can view all product deliveries" ON public.tiktok_product_deliveries;
DROP POLICY IF EXISTS "Users can create their own product deliveries" ON public.tiktok_product_deliveries;
DROP POLICY IF EXISTS "Users can delete their own product deliveries" ON public.tiktok_product_deliveries;
DROP POLICY IF EXISTS "Users can update their own product deliveries" ON public.tiktok_product_deliveries;
DROP POLICY IF EXISTS "Users can view their own product deliveries" ON public.tiktok_product_deliveries;

CREATE POLICY "Admins full access product deliveries" ON public.tiktok_product_deliveries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users manage own product deliveries" ON public.tiktok_product_deliveries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === tiktok_delivery_records ===
DROP POLICY IF EXISTS "Admins can create delivery records" ON public.tiktok_delivery_records;
DROP POLICY IF EXISTS "Admins can update any delivery record" ON public.tiktok_delivery_records;
DROP POLICY IF EXISTS "Admins can view all delivery records" ON public.tiktok_delivery_records;
DROP POLICY IF EXISTS "Users can update own delivery records" ON public.tiktok_delivery_records;
DROP POLICY IF EXISTS "Users can view own delivery records" ON public.tiktok_delivery_records;

CREATE POLICY "Admins full access delivery records" ON public.tiktok_delivery_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users manage own delivery records" ON public.tiktok_delivery_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === tiktok_monthly_reports ===
DROP POLICY IF EXISTS "Admins can view all reports" ON public.tiktok_monthly_reports;
DROP POLICY IF EXISTS "Users can create own reports" ON public.tiktok_monthly_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.tiktok_monthly_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.tiktok_monthly_reports;

CREATE POLICY "Admins full access reports" ON public.tiktok_monthly_reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users manage own reports" ON public.tiktok_monthly_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === tiktok_settings ===
DROP POLICY IF EXISTS "Users can create their own settings" ON public.tiktok_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.tiktok_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.tiktok_settings;

CREATE POLICY "Admins full access settings" ON public.tiktok_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users manage own settings" ON public.tiktok_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === admin_sub_users ===
DROP POLICY IF EXISTS "Admins can manage sub-users" ON public.admin_sub_users;
DROP POLICY IF EXISTS "Admins can view sub-users" ON public.admin_sub_users;
DROP POLICY IF EXISTS "Sub-users can view own record" ON public.admin_sub_users;

CREATE POLICY "Admins full access sub users" ON public.admin_sub_users FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sub-users view own record" ON public.admin_sub_users FOR SELECT TO authenticated USING (auth.uid() = sub_user_id);

-- === module_permissions ===
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Users can view own permissions" ON public.module_permissions;

CREATE POLICY "Admins full access permissions" ON public.module_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own permissions" ON public.module_permissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === user_roles (also fix) ===
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins full access roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
