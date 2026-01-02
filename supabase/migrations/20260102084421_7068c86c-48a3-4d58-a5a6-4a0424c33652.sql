-- Custom task templates table
CREATE TABLE public.task_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    default_priority TEXT DEFAULT 'medium',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT,
    recurrence_days INTEGER[],
    icon TEXT DEFAULT 'clipboard',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own task templates" 
ON public.task_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task templates" 
ON public.task_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task templates" 
ON public.task_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task templates" 
ON public.task_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_task_templates_updated_at
BEFORE UPDATE ON public.task_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Memory module tables
CREATE TABLE public.memory_folders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    parent_folder_id UUID REFERENCES public.memory_folders(id) ON DELETE CASCADE,
    is_locked BOOLEAN DEFAULT false,
    lock_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.memory_collections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    folder_id UUID REFERENCES public.memory_folders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.memories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT,
    description TEXT,
    media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    collection_id UUID REFERENCES public.memory_collections(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES public.memory_folders(id) ON DELETE SET NULL,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all memory tables
ALTER TABLE public.memory_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Memory folders RLS
CREATE POLICY "Users can view their own memory folders" 
ON public.memory_folders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory folders" 
ON public.memory_folders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory folders" 
ON public.memory_folders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory folders" 
ON public.memory_folders FOR DELETE USING (auth.uid() = user_id);

-- Memory collections RLS
CREATE POLICY "Users can view their own memory collections" 
ON public.memory_collections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory collections" 
ON public.memory_collections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory collections" 
ON public.memory_collections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory collections" 
ON public.memory_collections FOR DELETE USING (auth.uid() = user_id);

-- Memories RLS
CREATE POLICY "Users can view their own memories" 
ON public.memories FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories" 
ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" 
ON public.memories FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.memories FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_memory_folders_updated_at
BEFORE UPDATE ON public.memory_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memory_collections_updated_at
BEFORE UPDATE ON public.memory_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON public.memories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for memories
INSERT INTO storage.buckets (id, name, public) VALUES ('memories', 'memories', false);

-- Storage policies for memories bucket
CREATE POLICY "Users can view their own memory files"
ON storage.objects FOR SELECT
USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own memory files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own memory files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own memory files"
ON storage.objects FOR DELETE
USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);