
-- Allow sub-users to read their admin's data across all shared tables
-- This enables the shared dashboard system where sub-users see the same data as admin

-- Helper function: get the admin_user_id for a given sub_user_id
CREATE OR REPLACE FUNCTION public.get_admin_user_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT admin_user_id 
  FROM public.admin_sub_users 
  WHERE sub_user_id = _user_id 
    AND is_active = true
  LIMIT 1
$$;

-- Helper function: check if current user is a sub-user of a given admin
CREATE OR REPLACE FUNCTION public.is_sub_user_of(_admin_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_sub_users
    WHERE sub_user_id = auth.uid()
      AND admin_user_id = _admin_id
      AND is_active = true
  )
$$;

-- =============================================
-- PROJECTS: sub-users can read admin's projects
-- =============================================
CREATE POLICY "Sub-users can view admin projects"
ON public.projects FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- EXPENSES: sub-users can read admin's expenses
-- =============================================
CREATE POLICY "Sub-users can view admin expenses"
ON public.expenses FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- EXPENSE CATEGORIES: sub-users can read admin's categories
-- =============================================
CREATE POLICY "Sub-users can view admin categories"
ON public.expense_categories FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- TIKTOK ADVERTISERS: sub-users can read admin's influencers
-- =============================================
CREATE POLICY "Sub-users can view admin advertisers"
ON public.tiktok_advertisers FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- TIKTOK DELIVERIES: sub-users can read admin's deliveries
-- =============================================
CREATE POLICY "Sub-users can view admin deliveries"
ON public.tiktok_deliveries FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- TIKTOK PRODUCT DELIVERIES: sub-users can read admin's product deliveries
-- =============================================
CREATE POLICY "Sub-users can view admin product deliveries"
ON public.tiktok_product_deliveries FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- TIKTOK PAYMENTS: sub-users can read admin's payments
-- =============================================
CREATE POLICY "Sub-users can view admin payments"
ON public.tiktok_payments FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- TIKTOK SETTINGS: sub-users can read admin's settings
-- =============================================
CREATE POLICY "Sub-users can view admin settings"
ON public.tiktok_settings FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- TIKTOK MONTHLY REPORTS: sub-users can read admin's reports
-- =============================================
CREATE POLICY "Sub-users can view admin monthly reports"
ON public.tiktok_monthly_reports FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- JOB NOTES: sub-users can read admin's schedules
-- =============================================
CREATE POLICY "Sub-users can view admin job notes"
ON public.job_notes FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- INVOICE SETTINGS: sub-users can read admin's invoice settings
-- =============================================
CREATE POLICY "Sub-users can view admin invoice settings"
ON public.invoice_settings FOR SELECT
USING (public.is_sub_user_of(user_id));

-- =============================================
-- PROFILES: admins can view all sub-user profiles
-- =============================================
CREATE POLICY "Admins can view sub-user profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
