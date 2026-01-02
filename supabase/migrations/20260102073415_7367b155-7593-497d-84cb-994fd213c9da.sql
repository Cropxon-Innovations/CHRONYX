-- Create expense_categories table for predefined + custom categories
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_categories
CREATE POLICY "Users can view default and their own categories" 
ON public.expense_categories FOR SELECT 
USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
ON public.expense_categories FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own categories" 
ON public.expense_categories FOR UPDATE 
USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own categories" 
ON public.expense_categories FOR DELETE 
USING (auth.uid() = user_id AND is_default = false);

-- Insert default expense categories
INSERT INTO public.expense_categories (name, is_default) VALUES
  ('Food', true),
  ('Transport', true),
  ('Rent', true),
  ('Utilities', true),
  ('Shopping', true),
  ('Health', true),
  ('Education', true),
  ('Entertainment', true),
  ('Travel', true),
  ('Insurance Premium', true),
  ('Loan EMI', true),
  ('Other', true);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  sub_category TEXT,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Bank Transfer')),
  notes TEXT,
  is_auto_generated BOOLEAN DEFAULT false,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
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

-- Create trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create income_sources table
CREATE TABLE public.income_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Salary', 'Freelance', 'Business', 'Rental', 'Investment Returns', 'Interest', 'Bonus', 'Other')),
  frequency TEXT NOT NULL CHECK (frequency IN ('Monthly', 'Quarterly', 'Yearly', 'Irregular')),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for income_sources
CREATE POLICY "Users can view their own income sources" 
ON public.income_sources FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own income sources" 
ON public.income_sources FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income sources" 
ON public.income_sources FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income sources" 
ON public.income_sources FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_income_sources_updated_at
BEFORE UPDATE ON public.income_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create income_entries table
CREATE TABLE public.income_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_source_id UUID REFERENCES public.income_sources(id) ON DELETE SET NULL,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for income_entries
CREATE POLICY "Users can view their own income entries" 
ON public.income_entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own income entries" 
ON public.income_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income entries" 
ON public.income_entries FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income entries" 
ON public.income_entries FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_income_entries_updated_at
BEFORE UPDATE ON public.income_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();