import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface TechCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
}

export interface TechTrack {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  difficulty_level: string;
  estimated_hours: number | null;
  prerequisites: string[] | null;
  career_relevance: string | null;
  display_order: number;
  is_active: boolean;
  is_premium: boolean;
}

export interface TechTopic {
  id: string;
  module_id: string;
  name: string;
  description: string | null;
  content: string | null;
  difficulty: string;
  importance_weight: number;
  interview_frequency: string;
  industry_relevance: string | null;
  display_order: number;
  estimated_minutes: number;
}

export interface TechUserProgress {
  id: string;
  user_id: string;
  topic_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'revised' | 'mastered';
  progress_percent: number;
  time_spent_minutes: number;
  revision_count: number;
  confidence_level: number;
  notes: string | null;
  last_studied_at: string | null;
  completed_at: string | null;
}

export interface TechProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tech_stack: string[] | null;
  github_url: string | null;
  live_url: string | null;
  design_notes: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'archived';
  progress_percent: number;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean;
  is_published_to_hub: boolean;
  hub_category: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TechInterviewQuestion {
  id: string;
  user_id: string | null;
  track_id: string | null;
  module_id: string | null;
  topic_id: string | null;
  question: string;
  hint: string | null;
  answer: string | null;
  difficulty: string;
  company_tags: string[] | null;
  custom_tags: string[] | null;
  is_system: boolean;
  is_public: boolean;
  frequency: string;
}

export interface TechDSAProblem {
  id: string;
  title: string;
  slug: string;
  description: string;
  input_format: string | null;
  output_format: string | null;
  constraints: string | null;
  examples: Record<string, unknown> | null;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  subcategory: string | null;
  company_tags: string[] | null;
  topic_tags: string[] | null;
  hints: string[] | null;
  solution: string | null;
  time_complexity: string | null;
  space_complexity: string | null;
  is_premium: boolean;
  display_order: number;
}

export interface CareerReadiness {
  id: string;
  user_id: string;
  backend_score: number;
  frontend_score: number;
  devops_score: number;
  cloud_score: number;
  architecture_score: number;
  dsa_score: number;
  interview_score: number;
  overall_score: number;
  weak_areas: string[] | null;
  recommendations: Record<string, unknown> | null;
}

export function useTechCategories() {
  return useQuery({
    queryKey: ["tech-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tech_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data as TechCategory[];
    },
  });
}

export function useTechTracks(categoryId?: string) {
  return useQuery({
    queryKey: ["tech-tracks", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("tech_tracks")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as TechTrack[];
    },
    enabled: true,
  });
}

export function useTechTrackWithDetails(trackId: string) {
  return useQuery({
    queryKey: ["tech-track-details", trackId],
    queryFn: async () => {
      // Get track
      const { data: track, error: trackError } = await supabase
        .from("tech_tracks")
        .select("*")
        .eq("id", trackId)
        .single();
      
      if (trackError) throw trackError;

      // Get levels
      const { data: levels, error: levelsError } = await supabase
        .from("tech_track_levels")
        .select("*")
        .eq("track_id", trackId)
        .order("level_order");
      
      if (levelsError) throw levelsError;

      // Get modules for each level
      const levelIds = levels.map(l => l.id);
      const { data: modules, error: modulesError } = await supabase
        .from("tech_modules")
        .select("*")
        .in("level_id", levelIds)
        .order("display_order");
      
      if (modulesError) throw modulesError;

      // Get topics for each module
      const moduleIds = modules.map(m => m.id);
      const { data: topics, error: topicsError } = await supabase
        .from("tech_topics")
        .select("*")
        .in("module_id", moduleIds)
        .order("display_order");
      
      if (topicsError) throw topicsError;

      return {
        track,
        levels,
        modules,
        topics,
      };
    },
    enabled: !!trackId,
  });
}

export function useTechUserProgress() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["tech-user-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("tech_user_progress")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as TechUserProgress[];
    },
    enabled: !!user?.id,
  });
}

export function useUpdateTopicProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: {
      topicId: string;
      status: TechUserProgress['status'];
      progressPercent?: number;
      timeSpentMinutes?: number;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tech_user_progress")
        .upsert({
          user_id: user.id,
          topic_id: update.topicId,
          status: update.status,
          progress_percent: update.progressPercent ?? (update.status === 'completed' ? 100 : 0),
          time_spent_minutes: update.timeSpentMinutes ?? 0,
          notes: update.notes,
          last_studied_at: new Date().toISOString(),
          completed_at: update.status === 'completed' ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,topic_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech-user-progress"] });
      queryClient.invalidateQueries({ queryKey: ["tech-career-readiness"] });
      toast({ title: "Progress updated!" });
    },
    onError: (error) => {
      toast({ title: "Failed to update progress", description: error.message, variant: "destructive" });
    },
  });
}

export function useTechProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tech-projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("tech_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TechProject[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: Omit<TechProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tech_projects")
        .insert({
          ...project,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech-projects"] });
      toast({ title: "Project created!" });
    },
    onError: (error) => {
      toast({ title: "Failed to create project", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TechProject> & { id: string }) => {
      const { data, error } = await supabase
        .from("tech_projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech-projects"] });
      toast({ title: "Project updated!" });
    },
    onError: (error) => {
      toast({ title: "Failed to update project", description: error.message, variant: "destructive" });
    },
  });
}

export function useTechInterviewQuestions(filters?: {
  trackId?: string;
  moduleId?: string;
  topicId?: string;
  difficulty?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tech-interview-questions", filters, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("tech_interview_questions")
        .select("*")
        .or(`is_system.eq.true,user_id.eq.${user?.id || ''}`);

      if (filters?.trackId) query = query.eq("track_id", filters.trackId);
      if (filters?.moduleId) query = query.eq("module_id", filters.moduleId);
      if (filters?.topicId) query = query.eq("topic_id", filters.topicId);
      if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);

      const { data, error } = await query;
      if (error) throw error;
      return data as TechInterviewQuestion[];
    },
  });
}

export function useCreateInterviewQuestion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Omit<TechInterviewQuestion, 'id' | 'user_id' | 'is_system'>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tech_interview_questions")
        .insert({
          ...question,
          user_id: user.id,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech-interview-questions"] });
      toast({ title: "Question added!" });
    },
    onError: (error) => {
      toast({ title: "Failed to add question", description: error.message, variant: "destructive" });
    },
  });
}

export function useTechDSAProblems(filters?: {
  category?: string;
  difficulty?: string;
}) {
  return useQuery({
    queryKey: ["tech-dsa-problems", filters],
    queryFn: async () => {
      let query = supabase
        .from("tech_dsa_problems")
        .select("*")
        .order("display_order");

      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);

      const { data, error } = await query;
      if (error) throw error;
      return data as TechDSAProblem[];
    },
  });
}

export function useTechDSAProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tech-dsa-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("tech_dsa_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useCareerReadiness() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tech-career-readiness", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("tech_career_readiness")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CareerReadiness | null;
    },
    enabled: !!user?.id,
  });
}

export function useCalculateCareerReadiness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Get all progress data
      const { data: progress } = await supabase
        .from("tech_user_progress")
        .select("*, tech_topics!inner(module_id, tech_modules!inner(level_id, tech_track_levels!inner(track_id, tech_tracks!inner(category_id, tech_categories!inner(slug)))))")
        .eq("user_id", user.id);

      // Calculate scores per category
      const scores: Record<string, { completed: number; total: number }> = {};
      
      progress?.forEach((p: any) => {
        const categorySlug = p.tech_topics?.tech_modules?.tech_track_levels?.tech_tracks?.tech_categories?.slug;
        if (!categorySlug) return;
        
        if (!scores[categorySlug]) {
          scores[categorySlug] = { completed: 0, total: 0 };
        }
        scores[categorySlug].total++;
        if (p.status === 'completed' || p.status === 'mastered') {
          scores[categorySlug].completed++;
        }
      });

      const calculateScore = (slug: string) => {
        const s = scores[slug];
        return s ? Math.round((s.completed / s.total) * 100) : 0;
      };

      const readinessData = {
        user_id: user.id,
        backend_score: calculateScore('backend'),
        frontend_score: calculateScore('frontend'),
        devops_score: calculateScore('devops'),
        cloud_score: calculateScore('cloud'),
        architecture_score: calculateScore('architecture'),
        dsa_score: calculateScore('dsa'),
        interview_score: 0, // Calculate from interview practice
        overall_score: 0,
        weak_areas: [] as string[],
        calculated_at: new Date().toISOString(),
      };

      // Calculate overall
      const allScores = [
        readinessData.backend_score,
        readinessData.frontend_score,
        readinessData.devops_score,
        readinessData.cloud_score,
        readinessData.architecture_score,
        readinessData.dsa_score,
      ].filter(s => s > 0);
      
      readinessData.overall_score = allScores.length > 0 
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;

      // Find weak areas
      if (readinessData.backend_score < 50) readinessData.weak_areas.push('Backend');
      if (readinessData.frontend_score < 50) readinessData.weak_areas.push('Frontend');
      if (readinessData.devops_score < 50) readinessData.weak_areas.push('DevOps');
      if (readinessData.dsa_score < 50) readinessData.weak_areas.push('DSA');

      const { data, error } = await supabase
        .from("tech_career_readiness")
        .upsert(readinessData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech-career-readiness"] });
    },
  });
}
