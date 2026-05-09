
-- 1. Restrict DELETE on payment_history to admins only
CREATE POLICY "Only admins can delete payment history"
ON public.payment_history
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 2. Tighten error_logs INSERT
DROP POLICY IF EXISTS "Service can insert error logs" ON public.error_logs;
CREATE POLICY "Users can insert their own error logs"
ON public.error_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Recreate study_leaderboard view with security_invoker
DROP VIEW IF EXISTS public.study_leaderboard;
CREATE VIEW public.study_leaderboard
WITH (security_invoker = true) AS
 SELECT p.id AS user_id,
    p.display_name,
    p.avatar_url,
    p.username,
    COALESCE(topic_stats.completed_count, 0::bigint) AS completed_topics,
    COALESCE(topic_stats.total_points, 0::bigint) AS total_points,
    COALESCE(topic_stats.total_hours, 0::numeric)::numeric(10,1) AS study_hours,
    COALESCE(streak_stats.current_streak, 0::bigint) AS current_streak
   FROM profiles p
     LEFT JOIN ( SELECT syllabus_topics.user_id,
            count(*) FILTER (WHERE syllabus_topics.is_completed = true) AS completed_count,
            count(*) FILTER (WHERE syllabus_topics.is_completed = true) * 10 AS total_points,
            COALESCE(sum(syllabus_topics.time_spent_minutes)::numeric / 60.0, 0::numeric) AS total_hours
           FROM syllabus_topics
          GROUP BY syllabus_topics.user_id) topic_stats ON p.id = topic_stats.user_id
     LEFT JOIN ( SELECT syllabus_topics.user_id,
            count(DISTINCT date(syllabus_topics.completed_at)) AS current_streak
           FROM syllabus_topics
          WHERE syllabus_topics.completed_at >= (CURRENT_DATE - '30 days'::interval) AND syllabus_topics.is_completed = true
          GROUP BY syllabus_topics.user_id) streak_stats ON p.id = streak_stats.user_id;

-- 4. Move pg_net out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
