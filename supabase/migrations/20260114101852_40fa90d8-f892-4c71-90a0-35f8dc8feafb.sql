-- Create enum for expense categories
CREATE TYPE public.expense_category AS ENUM (
  'Materials',
  'Labor',
  'Marketing',
  'Equipment',
  'Transportation',
  'Utilities',
  'Wedding',
  'Other'
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  budget NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  category public.expense_category NOT NULL DEFAULT 'Other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (no auth required for this app)
CREATE POLICY "Allow public read access to projects"
ON public.projects FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access to projects"
ON public.projects FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access to projects"
ON public.projects FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access to projects"
ON public.projects FOR DELETE
USING (true);

CREATE POLICY "Allow public read access to expenses"
ON public.expenses FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access to expenses"
ON public.expenses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access to expenses"
ON public.expenses FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access to expenses"
ON public.expenses FOR DELETE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);