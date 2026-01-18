-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create expense_categories table (replacing enum)
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'bg-gray-500',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Expense categories policies
CREATE POLICY "Users can view their own categories"
  ON public.expense_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON public.expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.expense_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.expense_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for expense_categories updated_at
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add user_id to projects
ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to expenses  
ALTER TABLE public.expenses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add category_id to expenses (reference to new categories table)
ALTER TABLE public.expenses ADD COLUMN category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL;

-- Add user_id to job_notes
ALTER TABLE public.job_notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old RLS policies on projects
DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public insert access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public update access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public delete access to projects" ON public.projects;

-- Create user-based RLS policies for projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Drop old RLS policies on expenses
DROP POLICY IF EXISTS "Allow public read access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public insert access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public update access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public delete access to expenses" ON public.expenses;

-- Create user-based RLS policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Drop old RLS policies on job_notes
DROP POLICY IF EXISTS "Allow public read access to job_notes" ON public.job_notes;
DROP POLICY IF EXISTS "Allow public insert access to job_notes" ON public.job_notes;
DROP POLICY IF EXISTS "Allow public update access to job_notes" ON public.job_notes;
DROP POLICY IF EXISTS "Allow public delete access to job_notes" ON public.job_notes;

-- Create user-based RLS policies for job_notes
CREATE POLICY "Users can view their own job_notes"
  ON public.job_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job_notes"
  ON public.job_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job_notes"
  ON public.job_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job_notes"
  ON public.job_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Drop old RLS policies on job_activity_log
DROP POLICY IF EXISTS "Allow public read access to job_activity_log" ON public.job_activity_log;
DROP POLICY IF EXISTS "Allow public insert access to job_activity_log" ON public.job_activity_log;

-- Create user-based RLS policies for job_activity_log (via job_notes)
CREATE POLICY "Users can view activity logs for their jobs"
  ON public.job_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_notes 
      WHERE job_notes.id = job_activity_log.job_id 
      AND job_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity logs"
  ON public.job_activity_log FOR INSERT
  WITH CHECK (true);

-- Create function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  -- Insert default expense categories for new user
  INSERT INTO public.expense_categories (user_id, name, color) VALUES
    (NEW.id, 'Materials', 'bg-blue-500'),
    (NEW.id, 'Labor', 'bg-green-500'),
    (NEW.id, 'Marketing', 'bg-purple-500'),
    (NEW.id, 'Equipment', 'bg-orange-500'),
    (NEW.id, 'Transportation', 'bg-cyan-500'),
    (NEW.id, 'Utilities', 'bg-yellow-500'),
    (NEW.id, 'Wedding', 'bg-pink-500'),
    (NEW.id, 'Other', 'bg-gray-500');
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();