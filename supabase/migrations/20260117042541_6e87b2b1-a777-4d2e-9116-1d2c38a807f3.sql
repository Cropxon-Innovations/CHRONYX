-- Create daily_badges table for storing productivity badges
CREATE TABLE public.daily_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  description TEXT,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_date, badge_type)
);

-- Enable RLS
ALTER TABLE public.daily_badges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own badges" 
ON public.daily_badges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own badges" 
ON public.daily_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badges" 
ON public.daily_badges FOR DELETE USING (auth.uid() = user_id);

-- Create notes table for Notion-like brainstorm notes
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT,
  folder TEXT DEFAULT 'General',
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#ffffff',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notes" 
ON public.notes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Create vault_items table for encrypted sensitive data
CREATE TABLE public.vault_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  encrypted_data TEXT NOT NULL,
  notes TEXT,
  website_url TEXT,
  icon TEXT,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own vault items" 
ON public.vault_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vault items" 
ON public.vault_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vault items" 
ON public.vault_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vault items" 
ON public.vault_items FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for notes updated_at
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for vault_items updated_at
CREATE TRIGGER update_vault_items_updated_at
BEFORE UPDATE ON public.vault_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();