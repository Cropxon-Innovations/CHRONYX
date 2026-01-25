-- OPSC Exam Preparation Module Schema

-- Exam Types Enum
CREATE TYPE exam_type AS ENUM ('opsc', 'upsc', 'state_psc');
CREATE TYPE exam_stage AS ENUM ('prelims', 'mains', 'interview');
CREATE TYPE content_status AS ENUM ('not_started', 'in_progress', 'completed', 'revised');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE pyq_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Master Exams Table
CREATE TABLE public.exam_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type exam_type NOT NULL,
  exam_name TEXT NOT NULL,
  exam_year TEXT NOT NULL,
  conducting_body TEXT,
  notification_date DATE,
  application_start DATE,
  application_end DATE,
  prelims_date DATE,
  mains_date DATE,
  interview_start DATE,
  interview_end DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exam Pattern Table
CREATE TABLE public.exam_pattern (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exam_master(id) ON DELETE CASCADE,
  stage exam_stage NOT NULL,
  paper_name TEXT NOT NULL,
  paper_code TEXT,
  total_marks INTEGER NOT NULL,
  passing_marks INTEGER,
  is_qualifying BOOLEAN DEFAULT false,
  negative_marking BOOLEAN DEFAULT false,
  negative_marking_value DECIMAL(3,2),
  num_questions INTEGER,
  duration_minutes INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exam Syllabus Structure
CREATE TABLE public.exam_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exam_master(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stage exam_stage NOT NULL,
  paper_name TEXT,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  parent_id UUID REFERENCES public.exam_syllabus(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  status content_status DEFAULT 'not_started',
  progress_percent INTEGER DEFAULT 0,
  notes TEXT,
  estimated_hours DECIMAL(5,2) DEFAULT 1,
  actual_hours DECIMAL(5,2) DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  last_revised_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Syllabus Attachments (Notes, PDFs, Links)
CREATE TABLE public.syllabus_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID REFERENCES public.exam_syllabus(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('note', 'pdf', 'link', 'answer')),
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  external_url TEXT,
  tags TEXT[],
  is_core_note BOOLEAN DEFAULT false,
  is_revision_note BOOLEAN DEFAULT false,
  is_final_note BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Study Timetable
CREATE TABLE public.exam_study_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.exam_master(id) ON DELETE CASCADE,
  syllabus_id UUID REFERENCES public.exam_syllabus(id) ON DELETE SET NULL,
  schedule_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  title TEXT NOT NULL,
  description TEXT,
  priority priority_level DEFAULT 'medium',
  status content_status DEFAULT 'not_started',
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Previous Year Questions
CREATE TABLE public.exam_pyq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exam_master(id) ON DELETE CASCADE,
  stage exam_stage NOT NULL,
  paper_name TEXT,
  year INTEGER NOT NULL,
  question_number INTEGER,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  marks INTEGER,
  difficulty pyq_difficulty DEFAULT 'medium',
  is_frequently_asked BOOLEAN DEFAULT false,
  related_syllabus_ids UUID[],
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User PYQ Attempts
CREATE TABLE public.exam_pyq_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pyq_id UUID REFERENCES public.exam_pyq(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  time_taken_seconds INTEGER,
  notes TEXT,
  is_weak_area BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- Toppers Data
CREATE TABLE public.exam_toppers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exam_master(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  name TEXT NOT NULL,
  optional_subject TEXT,
  attempt_number INTEGER,
  prelims_score DECIMAL(6,2),
  mains_score DECIMAL(6,2),
  interview_score DECIMAL(6,2),
  total_score DECIMAL(6,2),
  photo_url TEXT,
  strategy_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cut-off Data
CREATE TABLE public.exam_cutoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exam_master(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  stage exam_stage NOT NULL,
  cutoff_marks DECIMAL(6,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Study Notes Library
CREATE TABLE public.exam_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.exam_master(id) ON DELETE CASCADE,
  syllabus_id UUID REFERENCES public.exam_syllabus(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  content_json JSONB,
  file_url TEXT,
  file_type TEXT,
  tags TEXT[],
  note_category TEXT CHECK (note_category IN ('prelims', 'gs1', 'gs2', 'gs3', 'gs4', 'optional', 'revision', 'current_affairs')),
  is_core_note BOOLEAN DEFAULT false,
  is_revision_note BOOLEAN DEFAULT false,
  is_final_note BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Chat History for Nyaya Bot
CREATE TABLE public.nyaya_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.exam_master(id) ON DELETE SET NULL,
  syllabus_id UUID REFERENCES public.exam_syllabus(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exam_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_pattern ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_study_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_pyq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_pyq_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_toppers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_cutoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nyaya_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_master
CREATE POLICY "Users can view all exams" ON public.exam_master FOR SELECT USING (true);
CREATE POLICY "Users can create their own exams" ON public.exam_master FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exams" ON public.exam_master FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exams" ON public.exam_master FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for exam_pattern (public read, admin write via user_id null)
CREATE POLICY "Anyone can view exam patterns" ON public.exam_pattern FOR SELECT USING (true);

-- RLS Policies for exam_syllabus
CREATE POLICY "Users can view their syllabus" ON public.exam_syllabus FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their syllabus" ON public.exam_syllabus FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their syllabus" ON public.exam_syllabus FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their syllabus" ON public.exam_syllabus FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for syllabus_attachments
CREATE POLICY "Users can view their attachments" ON public.syllabus_attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their attachments" ON public.syllabus_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their attachments" ON public.syllabus_attachments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their attachments" ON public.syllabus_attachments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for exam_study_schedule
CREATE POLICY "Users can view their schedules" ON public.exam_study_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their schedules" ON public.exam_study_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their schedules" ON public.exam_study_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their schedules" ON public.exam_study_schedule FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for exam_pyq (public read)
CREATE POLICY "Anyone can view PYQs" ON public.exam_pyq FOR SELECT USING (true);

-- RLS Policies for exam_pyq_attempts
CREATE POLICY "Users can view their attempts" ON public.exam_pyq_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their attempts" ON public.exam_pyq_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their attempts" ON public.exam_pyq_attempts FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for exam_toppers (public read)
CREATE POLICY "Anyone can view toppers" ON public.exam_toppers FOR SELECT USING (true);

-- RLS Policies for exam_cutoffs (public read)
CREATE POLICY "Anyone can view cutoffs" ON public.exam_cutoffs FOR SELECT USING (true);

-- RLS Policies for exam_notes
CREATE POLICY "Users can view their notes" ON public.exam_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their notes" ON public.exam_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their notes" ON public.exam_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their notes" ON public.exam_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for nyaya_chat_history
CREATE POLICY "Users can view their chat history" ON public.nyaya_chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create chat messages" ON public.nyaya_chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their chat history" ON public.nyaya_chat_history FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_exam_syllabus_user_exam ON public.exam_syllabus(user_id, exam_id);
CREATE INDEX idx_exam_syllabus_parent ON public.exam_syllabus(parent_id);
CREATE INDEX idx_exam_schedule_user_date ON public.exam_study_schedule(user_id, schedule_date);
CREATE INDEX idx_exam_pyq_exam_stage ON public.exam_pyq(exam_id, stage);
CREATE INDEX idx_exam_notes_user_exam ON public.exam_notes(user_id, exam_id);
CREATE INDEX idx_nyaya_chat_user ON public.nyaya_chat_history(user_id, created_at);

-- Triggers for updated_at
CREATE TRIGGER update_exam_master_updated_at BEFORE UPDATE ON public.exam_master FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exam_syllabus_updated_at BEFORE UPDATE ON public.exam_syllabus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_syllabus_attachments_updated_at BEFORE UPDATE ON public.syllabus_attachments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exam_study_schedule_updated_at BEFORE UPDATE ON public.exam_study_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exam_notes_updated_at BEFORE UPDATE ON public.exam_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();