-- =====================================================
-- STUDY MODULE EXTENSION: Dynamic Templates & Progress
-- =====================================================

-- 1. EXAM CATEGORIES (if not exists)
CREATE TABLE IF NOT EXISTS public.study_exam_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'GraduationCap',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. EXAM TEMPLATES (if not exists)
CREATE TABLE IF NOT EXISTS public.study_exam_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.study_exam_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_name TEXT,
  conducting_body TEXT,
  description TEXT,
  icon TEXT DEFAULT 'FileText',
  cover_image TEXT,
  stages JSONB DEFAULT '[]'::jsonb,
  key_dates JSONB DEFAULT '{}'::jsonb,
  eligibility JSONB DEFAULT '{}'::jsonb,
  exam_pattern JSONB DEFAULT '{}'::jsonb,
  useful_links JSONB DEFAULT '[]'::jsonb,
  is_official BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  price NUMERIC(10,2) DEFAULT 0,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscribers_count INTEGER DEFAULT 0,
  average_rating NUMERIC(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TEMPLATE STAGES
CREATE TABLE IF NOT EXISTS public.study_template_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.study_exam_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  stage_type TEXT NOT NULL,
  description TEXT,
  total_marks INTEGER,
  duration_hours NUMERIC(4,1),
  is_qualifying BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  papers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. USER SUBSCRIPTIONS to templates
CREATE TABLE IF NOT EXISTS public.study_user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.study_exam_templates(id) ON DELETE CASCADE,
  target_date DATE,
  start_date DATE DEFAULT CURRENT_DATE,
  optional_subject TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- 5. USER TOPIC PROGRESS
CREATE TABLE IF NOT EXISTS public.study_user_topic_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.study_user_subscriptions(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.study_subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.study_chapters(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.study_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  progress_percent INTEGER DEFAULT 0,
  actual_hours NUMERIC(5,1) DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  last_studied_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. NOVA STUDY CHATS (with retention control)
CREATE TABLE IF NOT EXISTS public.nova_study_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.study_user_subscriptions(id) ON DELETE CASCADE,
  topic_context TEXT,
  is_retained BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cleared_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.nova_study_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.nova_study_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  context_data JSONB DEFAULT '{}'::jsonb,
  is_external_query BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. USER TEMPLATE DRAFTS
CREATE TABLE IF NOT EXISTS public.study_template_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.study_exam_categories(id),
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  review_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.study_exam_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_template_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_study_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_study_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_template_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active categories" ON public.study_exam_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view published templates" ON public.study_exam_templates
  FOR SELECT USING (is_published = true);

CREATE POLICY "Creators can manage own templates" ON public.study_exam_templates
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view template stages" ON public.study_template_stages
  FOR SELECT USING (true);

CREATE POLICY "Users manage own subscriptions" ON public.study_user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own topic progress" ON public.study_user_topic_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own nova chats" ON public.nova_study_chats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own nova messages" ON public.nova_study_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.nova_study_chats 
      WHERE id = nova_study_messages.chat_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own template drafts" ON public.study_template_drafts
  FOR ALL USING (auth.uid() = user_id);

-- Seed categories
INSERT INTO public.study_exam_categories (name, slug, description, icon, display_order) VALUES
  ('Government Exams (India)', 'govt-exams-india', 'Civil Services, State PSCs, SSC, Banking, Railways', 'Building2', 1),
  ('Technical Careers', 'technical-careers', 'Software, Data Science, Cloud, DevOps, AI/ML', 'Code2', 2),
  ('Management Exams', 'management-exams', 'CAT, XAT, GMAT, MBA Entrance', 'Briefcase', 3),
  ('Medical Exams', 'medical-exams', 'NEET, AIIMS, JIPMER, Medical PG', 'Stethoscope', 4),
  ('Law Exams', 'law-exams', 'CLAT, AILET, Judiciary Services', 'Scale', 5),
  ('International Exams', 'international-exams', 'GRE, IELTS, TOEFL, SAT', 'Globe', 6),
  ('User Templates', 'user-templates', 'Community-created preparation guides', 'Users', 99)
ON CONFLICT (slug) DO NOTHING;

-- Seed UPSC template
INSERT INTO public.study_exam_templates (
  category_id, name, slug, short_name, conducting_body, description, 
  is_official, stages, key_dates, eligibility
) VALUES (
  (SELECT id FROM public.study_exam_categories WHERE slug = 'govt-exams-india'),
  'UPSC Civil Services Examination',
  'upsc-cse-2026',
  'UPSC CSE 2026',
  'Union Public Service Commission (UPSC)',
  'The Civil Services Examination (CSE) is conducted by UPSC for recruitment to IAS, IPS, IFS, IRS and other central services.',
  true,
  '[{"name": "Preliminary Examination", "type": "Screening", "marks": 400}, {"name": "Main Examination", "type": "Descriptive", "marks": 1750}, {"name": "Personality Test", "type": "Interview", "marks": 275}]'::jsonb,
  '{"notification": "February 2026", "prelims": "May 2026", "mains": "September 2026"}'::jsonb,
  '{"nationality": "Indian Citizen", "age_min": 21, "age_max": 32, "qualification": "Bachelors degree"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Seed OPSC template
INSERT INTO public.study_exam_templates (
  category_id, name, slug, short_name, conducting_body, description, 
  is_official, stages, key_dates, eligibility
) VALUES (
  (SELECT id FROM public.study_exam_categories WHERE slug = 'govt-exams-india'),
  'OPSC OAS / OFS Examination',
  'opsc-oas-2026',
  'OPSC OAS 2026',
  'Odisha Public Service Commission (OPSC)',
  'Odisha Civil Services Examination for OAS, OFS and allied services.',
  true,
  '[{"name": "Preliminary Examination", "type": "Screening", "marks": 400}, {"name": "Main Examination", "type": "Descriptive", "marks": 1750}, {"name": "Personality Test", "type": "Interview", "marks": 250}]'::jsonb,
  '{"notification": "31 December 2025", "prelims": "7 June 2026"}'::jsonb,
  '{"nationality": "Indian Citizen", "age_min": 21, "age_max": 38, "qualification": "Bachelors degree", "language": "Odia"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Seed more State PSC templates
INSERT INTO public.study_exam_templates (category_id, name, slug, short_name, conducting_body, description, is_official) VALUES
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'govt-exams-india'), 'MPSC State Services Examination', 'mpsc-sse-2026', 'MPSC 2026', 'Maharashtra Public Service Commission', 'Maharashtra State Services Examination', true),
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'govt-exams-india'), 'BPSC Civil Services Examination', 'bpsc-cse-2026', 'BPSC 2026', 'Bihar Public Service Commission', 'Bihar Combined Competitive Examination', true),
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'govt-exams-india'), 'UPPSC PCS Examination', 'uppsc-pcs-2026', 'UPPSC 2026', 'Uttar Pradesh Public Service Commission', 'UP Combined State/Upper Subordinate Services Exam', true),
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'govt-exams-india'), 'WBPSC Civil Services Examination', 'wbpsc-cse-2026', 'WBPSC 2026', 'West Bengal Public Service Commission', 'West Bengal Civil Services Examination', true),
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'govt-exams-india'), 'KPSC KAS Examination', 'kpsc-kas-2026', 'KPSC 2026', 'Karnataka Public Service Commission', 'Karnataka Administrative Service Examination', true),
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'govt-exams-india'), 'SSC CGL Examination', 'ssc-cgl-2026', 'SSC CGL 2026', 'Staff Selection Commission', 'Combined Graduate Level Examination', true),
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'govt-exams-india'), 'IBPS PO Examination', 'ibps-po-2026', 'IBPS PO 2026', 'Institute of Banking Personnel Selection', 'Probationary Officer Recruitment', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Technical Career templates
INSERT INTO public.study_exam_templates (category_id, name, slug, short_name, description, is_official) VALUES
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'technical-careers'), 'Full Stack Development', 'fullstack-dev', 'Full Stack', 'Complete web development with React, Node.js, databases', true),
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'technical-careers'), 'Data Science & ML', 'data-science-ml', 'Data Science', 'Python, Statistics, Machine Learning, Deep Learning', true),
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'technical-careers'), 'Cloud & DevOps', 'cloud-devops', 'Cloud DevOps', 'AWS, Azure, GCP, Docker, Kubernetes, CI/CD', true),
  ((SELECT id FROM public.study_exam_categories WHERE slug = 'technical-careers'), 'System Design', 'system-design', 'System Design', 'High-level and low-level system design interviews', true)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_study_templates_category ON public.study_exam_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_study_subscriptions_user ON public.study_user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_nova_chats_user ON public.nova_study_chats(user_id);