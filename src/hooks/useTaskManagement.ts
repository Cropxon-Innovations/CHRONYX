import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TmProject, TmTask, TmColumn, TmMember, TmPage, TmShareLink, TmRole, TmTaskStatus } from "@/components/taskmgmt/types";

export const useProjects = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tm_projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TmProject[];
    },
  });
};

export const useProject = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["tm_project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_projects")
        .select("*")
        .eq("id", projectId!)
        .maybeSingle();
      if (error) throw error;
      return data as TmProject | null;
    },
  });

export const useProjectColumns = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["tm_columns", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_board_columns")
        .select("*")
        .eq("project_id", projectId!)
        .order("position");
      if (error) throw error;
      return data as TmColumn[];
    },
  });

export const useProjectTasks = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["tm_tasks", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tasks")
        .select("*")
        .eq("project_id", projectId!)
        .order("board_position");
      if (error) throw error;
      return data as TmTask[];
    },
  });

export const useProjectMembers = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["tm_members", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_project_members")
        .select("*")
        .eq("project_id", projectId!);
      if (error) throw error;
      return data as TmMember[];
    },
  });

export const useProjectPages = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["tm_pages", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_pages")
        .select("*")
        .eq("project_id", projectId!)
        .order("position");
      if (error) throw error;
      return data as TmPage[];
    },
  });

export const useShareLinks = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["tm_share_links", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_project_share_links")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TmShareLink[];
    },
  });

export const useMyRole = (projectId: string | undefined): TmRole | null => {
  const { user } = useAuth();
  const { data: project } = useProject(projectId);
  const { data: members } = useProjectMembers(projectId);
  if (!user || !project) return null;
  if (project.owner_id === user.id) return "owner";
  const m = members?.find((x) => x.user_id === user.id);
  return m?.role ?? null;
};

export const useUpdateTask = (projectId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TmTask> }) => {
      const { error } = await supabase.from("tm_tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tm_tasks", projectId] }),
  });
};

export const useMoveTask = (projectId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, position }: { id: string; status: TmTaskStatus; position: number }) => {
      const { error } = await supabase
        .from("tm_tasks")
        .update({ status, board_position: position })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status, position }) => {
      await qc.cancelQueries({ queryKey: ["tm_tasks", projectId] });
      const prev = qc.getQueryData<TmTask[]>(["tm_tasks", projectId]);
      if (prev) {
        qc.setQueryData<TmTask[]>(["tm_tasks", projectId],
          prev.map((t) => (t.id === id ? { ...t, status, board_position: position } : t))
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tm_tasks", projectId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tm_tasks", projectId] }),
  });
};

export const useUpdateProject = (projectId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<TmProject, "name" | "project_key" | "description" | "color" | "archived" | "icon">>) => {
      const { error } = await supabase.from("tm_projects").update(patch).eq("id", projectId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tm_project", projectId] });
      qc.invalidateQueries({ queryKey: ["tm_projects"] });
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("tm_projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tm_projects"] });
    },
  });
};
