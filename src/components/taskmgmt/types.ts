export type TmRole = "owner" | "admin" | "editor" | "reviewer" | "viewer";
export type TmTaskType = "epic" | "story" | "task" | "bug" | "subtask";
export type TmTaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";
export type TmPriority = "low" | "medium" | "high" | "urgent";
export type TmPageType = "doc" | "architecture" | "wiki" | "spec";

export interface TmProject {
  id: string;
  owner_id: string;
  name: string;
  project_key: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  archived: boolean;
  task_counter: number;
  created_at: string;
  updated_at: string;
}

export interface TmMember {
  id: string;
  project_id: string;
  user_id: string;
  role: TmRole;
  invited_by: string | null;
  created_at: string;
}

export interface TmColumn {
  id: string;
  project_id: string;
  name: string;
  status_key: TmTaskStatus;
  position: number;
  color: string | null;
}

export interface TmTask {
  id: string;
  project_id: string;
  task_number: number;
  title: string;
  description: string | null;
  task_type: TmTaskType;
  status: TmTaskStatus;
  priority: TmPriority;
  story_points: number | null;
  assignee_id: string | null;
  reporter_id: string;
  parent_task_id: string | null;
  due_date: string | null;
  start_date: string | null;
  time_estimate_hours: number | null;
  time_spent_hours: number;
  labels: string[];
  board_position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TmPage {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  content: string | null;
  page_type: TmPageType;
  diagram_data: unknown;
  created_by: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TmShareLink {
  id: string;
  project_id: string;
  token: string;
  role: TmRole;
  created_by: string;
  expires_at: string | null;
  uses_count: number;
  is_active: boolean;
  created_at: string;
}

export const TASK_TYPE_META: Record<TmTaskType, { label: string; color: string; icon: string }> = {
  epic:    { label: "Epic",    color: "#a855f7", icon: "⚡" },
  story:   { label: "Story",   color: "#22c55e", icon: "📗" },
  task:    { label: "Task",    color: "#3b82f6", icon: "✓" },
  bug:     { label: "Bug",     color: "#ef4444", icon: "🐞" },
  subtask: { label: "Subtask", color: "#06b6d4", icon: "↳" },
};

export const PRIORITY_META: Record<TmPriority, { label: string; color: string }> = {
  low:    { label: "Low",    color: "#94a3b8" },
  medium: { label: "Medium", color: "#3b82f6" },
  high:   { label: "High",   color: "#f59e0b" },
  urgent: { label: "Urgent", color: "#ef4444" },
};

export const ROLE_META: Record<TmRole, { label: string; description: string }> = {
  owner:    { label: "Owner",    description: "Full control, can delete project" },
  admin:    { label: "Admin",    description: "Manage members, edit everything" },
  editor:   { label: "Editor",   description: "Create & edit tasks, pages" },
  reviewer: { label: "Reviewer", description: "Comment + update own tasks" },
  viewer:   { label: "Viewer",   description: "Read-only" },
};
