
-- Fix PRIVILEGE_ESCALATION on tech_interview_questions: split ALL policy
DROP POLICY IF EXISTS "Users manage own questions" ON public.tech_interview_questions;
CREATE POLICY "Users insert own questions" ON public.tech_interview_questions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own questions" ON public.tech_interview_questions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own questions" ON public.tech_interview_questions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Restrict public read of content_comments to authenticated users
DROP POLICY IF EXISTS "Anyone can view comments" ON public.content_comments;
CREATE POLICY "Authenticated users can view comments" ON public.content_comments
  FOR SELECT TO authenticated USING (true);

-- Restrict public read of content_ratings to authenticated users
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.content_ratings;
CREATE POLICY "Authenticated users can view ratings" ON public.content_ratings
  FOR SELECT TO authenticated USING (true);

-- Remove overly-broad SELECT on tax_deductions (owner-scoped policy already exists)
DROP POLICY IF EXISTS "Deductions readable by authenticated users" ON public.tax_deductions;
