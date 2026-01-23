-- Create study_leaderboard view for efficient queries
CREATE OR REPLACE VIEW public.study_leaderboard AS
SELECT 
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  p.username,
  COALESCE(topic_stats.completed_count, 0) as completed_topics,
  COALESCE(topic_stats.total_points, 0) as total_points,
  COALESCE(topic_stats.total_hours, 0)::numeric(10,1) as study_hours,
  COALESCE(streak_stats.current_streak, 0) as current_streak
FROM public.profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE is_completed = true) as completed_count,
    COUNT(*) FILTER (WHERE is_completed = true) * 10 as total_points,
    COALESCE(SUM(time_spent_minutes) / 60.0, 0) as total_hours
  FROM public.syllabus_topics
  GROUP BY user_id
) topic_stats ON p.id = topic_stats.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(DISTINCT DATE(completed_at)) as current_streak
  FROM public.syllabus_topics
  WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days'
    AND is_completed = true
  GROUP BY user_id
) streak_stats ON p.id = streak_stats.user_id;