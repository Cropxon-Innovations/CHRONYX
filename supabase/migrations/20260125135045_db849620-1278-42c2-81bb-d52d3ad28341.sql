-- =============================================
-- CHRONYX TECHNICAL CAREER OS - Complete Schema
-- =============================================

-- Technical Categories (Backend, Frontend, DevOps, etc.)
CREATE TABLE public.tech_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Technical Tracks (e.g., .NET API, Java Spring Boot, React)
CREATE TABLE public.tech_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.tech_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'architect')) DEFAULT 'beginner',
  estimated_hours INTEGER,
  prerequisites TEXT[],
  career_relevance TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Track Levels (Beginner → Advanced → Architect)
CREATE TABLE public.tech_track_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES public.tech_tracks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  level_order INTEGER NOT NULL,
  description TEXT,
  estimated_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Modules within each level
CREATE TABLE public.tech_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES public.tech_track_levels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  importance_weight INTEGER DEFAULT 5 CHECK (importance_weight BETWEEN 1 AND 10),
  interview_frequency TEXT CHECK (interview_frequency IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Topics within modules
CREATE TABLE public.tech_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.tech_modules(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')) DEFAULT 'medium',
  importance_weight INTEGER DEFAULT 5,
  interview_frequency TEXT CHECK (interview_frequency IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  industry_relevance TEXT,
  prerequisites UUID[],
  next_topics UUID[],
  display_order INTEGER DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sub-topics for granular tracking
CREATE TABLE public.tech_subtopics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.tech_topics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User progress on technical topics
CREATE TABLE public.tech_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID REFERENCES public.tech_topics(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'revised', 'mastered')) DEFAULT 'not_started',
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  time_spent_minutes INTEGER DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  confidence_level INTEGER DEFAULT 0 CHECK (confidence_level BETWEEN 0 AND 5),
  notes TEXT,
  last_studied_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- User Projects
CREATE TABLE public.tech_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[],
  github_url TEXT,
  live_url TEXT,
  design_notes TEXT,
  status TEXT CHECK (status IN ('planned', 'in_progress', 'completed', 'archived')) DEFAULT 'planned',
  progress_percent INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_public BOOLEAN DEFAULT false,
  is_published_to_hub BOOLEAN DEFAULT false,
  hub_category TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link projects to tracks/modules/topics
CREATE TABLE public.tech_project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.tech_projects(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.tech_tracks(id) ON DELETE SET NULL,
  module_id UUID REFERENCES public.tech_modules(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.tech_topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Project documents/attachments
CREATE TABLE public.tech_project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.tech_projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Interview Questions Bank
CREATE TABLE public.tech_interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  track_id UUID REFERENCES public.tech_tracks(id) ON DELETE SET NULL,
  module_id UUID REFERENCES public.tech_modules(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.tech_topics(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  hint TEXT,
  answer TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')) DEFAULT 'medium',
  company_tags TEXT[],
  custom_tags TEXT[],
  is_system BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  frequency TEXT CHECK (frequency IN ('rare', 'occasional', 'common', 'very_common')) DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User's answers/practice for interview questions
CREATE TABLE public.tech_interview_practice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID REFERENCES public.tech_interview_questions(id) ON DELETE CASCADE NOT NULL,
  user_answer TEXT,
  status TEXT CHECK (status IN ('unknown', 'partially_known', 'known', 'mastered', 'needs_revision')) DEFAULT 'unknown',
  confidence INTEGER DEFAULT 0 CHECK (confidence BETWEEN 0 AND 5),
  practice_count INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- DSA Problems
CREATE TABLE public.tech_dsa_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  input_format TEXT,
  output_format TEXT,
  constraints TEXT,
  examples JSONB,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  category TEXT NOT NULL,
  subcategory TEXT,
  company_tags TEXT[],
  topic_tags TEXT[],
  hints TEXT[],
  solution TEXT,
  time_complexity TEXT,
  space_complexity TEXT,
  is_premium BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User DSA Practice Results
CREATE TABLE public.tech_dsa_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  problem_id UUID REFERENCES public.tech_dsa_problems(id) ON DELETE CASCADE NOT NULL,
  code TEXT,
  language TEXT,
  status TEXT CHECK (status IN ('not_attempted', 'attempted', 'partially_solved', 'solved', 'optimal')) DEFAULT 'not_attempted',
  time_taken_minutes INTEGER,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User DSA Progress Summary
CREATE TABLE public.tech_dsa_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  problem_id UUID REFERENCES public.tech_dsa_problems(id) ON DELETE CASCADE NOT NULL,
  best_status TEXT CHECK (best_status IN ('not_attempted', 'attempted', 'partially_solved', 'solved', 'optimal')) DEFAULT 'not_attempted',
  attempt_count INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  is_bookmarked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

-- Topic attachments (notes, PDFs linked to topics)
CREATE TABLE public.tech_topic_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID REFERENCES public.tech_topics(id) ON DELETE CASCADE NOT NULL,
  attachment_type TEXT CHECK (attachment_type IN ('note', 'pdf', 'link', 'code', 'video')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Career Readiness Scores
CREATE TABLE public.tech_career_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  backend_score INTEGER DEFAULT 0,
  frontend_score INTEGER DEFAULT 0,
  devops_score INTEGER DEFAULT 0,
  cloud_score INTEGER DEFAULT 0,
  architecture_score INTEGER DEFAULT 0,
  dsa_score INTEGER DEFAULT 0,
  interview_score INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 0,
  weak_areas TEXT[],
  recommendations JSONB,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tech_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_track_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_interview_practice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_dsa_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_dsa_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_dsa_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_topic_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_career_readiness ENABLE ROW LEVEL SECURITY;

-- Public read policies for system data
CREATE POLICY "Anyone can view categories" ON public.tech_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view tracks" ON public.tech_tracks FOR SELECT USING (true);
CREATE POLICY "Anyone can view levels" ON public.tech_track_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can view modules" ON public.tech_modules FOR SELECT USING (true);
CREATE POLICY "Anyone can view topics" ON public.tech_topics FOR SELECT USING (true);
CREATE POLICY "Anyone can view subtopics" ON public.tech_subtopics FOR SELECT USING (true);
CREATE POLICY "Anyone can view system DSA problems" ON public.tech_dsa_problems FOR SELECT USING (true);
CREATE POLICY "Anyone can view system interview questions" ON public.tech_interview_questions FOR SELECT USING (is_system = true OR user_id = auth.uid());

-- User-specific policies
CREATE POLICY "Users manage own progress" ON public.tech_user_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own projects" ON public.tech_projects FOR ALL USING (auth.uid() = user_id OR is_public = true) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage project links" ON public.tech_project_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tech_projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "Users manage project docs" ON public.tech_project_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tech_projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "Users manage own questions" ON public.tech_interview_questions FOR ALL USING (user_id = auth.uid() OR is_system = true) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own practice" ON public.tech_interview_practice FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage DSA submissions" ON public.tech_dsa_submissions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage DSA progress" ON public.tech_dsa_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage topic attachments" ON public.tech_topic_attachments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage career readiness" ON public.tech_career_readiness FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_tech_tracks_category ON public.tech_tracks(category_id);
CREATE INDEX idx_tech_levels_track ON public.tech_track_levels(track_id);
CREATE INDEX idx_tech_modules_level ON public.tech_modules(level_id);
CREATE INDEX idx_tech_topics_module ON public.tech_topics(module_id);
CREATE INDEX idx_tech_progress_user ON public.tech_user_progress(user_id);
CREATE INDEX idx_tech_projects_user ON public.tech_projects(user_id);
CREATE INDEX idx_tech_interview_track ON public.tech_interview_questions(track_id);
CREATE INDEX idx_tech_dsa_category ON public.tech_dsa_problems(category);
CREATE INDEX idx_tech_dsa_progress_user ON public.tech_dsa_progress(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_tech_user_progress_updated_at BEFORE UPDATE ON public.tech_user_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tech_projects_updated_at BEFORE UPDATE ON public.tech_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tech_interview_practice_updated_at BEFORE UPDATE ON public.tech_interview_practice FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tech_dsa_progress_updated_at BEFORE UPDATE ON public.tech_dsa_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tech_career_readiness_updated_at BEFORE UPDATE ON public.tech_career_readiness FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();