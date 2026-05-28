import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PRIORITY_META, TASK_TYPE_META, type TmPriority, type TmTask, type TmTaskStatus, type TmTaskType } from "./types";
import { useProjectMembers } from "@/hooks/useTaskManagement";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  task?: TmTask | null;
  defaultStatus?: TmTaskStatus;
  canEdit: boolean;
}

const emptyForm = {
  title: "",
  description: "",
  task_type: "task" as TmTaskType,
  status: "backlog" as TmTaskStatus,
  priority: "medium" as TmPriority,
  story_points: "" as string,
  assignee_id: "none" as string,
  due_date: "",
  start_date: "",
  time_estimate_hours: "" as string,
  time_spent_hours: "" as string,
  labels: "" as string,
};

export const TaskDialog = ({ open, onOpenChange, projectId, task, defaultStatus, canEdit }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: members } = useProjectMembers(projectId);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? "",
        task_type: task.task_type,
        status: task.status,
        priority: task.priority,
        story_points: task.story_points?.toString() ?? "",
        assignee_id: task.assignee_id ?? "none",
        due_date: task.due_date ?? "",
        start_date: task.start_date ?? "",
        time_estimate_hours: task.time_estimate_hours?.toString() ?? "",
        time_spent_hours: task.time_spent_hours?.toString() ?? "",
        labels: (task.labels ?? []).join(", "),
      });
    } else {
      setForm({ ...emptyForm, status: defaultStatus ?? "backlog" });
    }
  }, [task, defaultStatus, open]);

  const handleSubmit = async () => {
    if (!user || !form.title.trim()) {
      toast.error("Title required");
      return;
    }
    setLoading(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      task_type: form.task_type,
      status: form.status,
      priority: form.priority,
      story_points: form.story_points ? parseInt(form.story_points, 10) : null,
      assignee_id: form.assignee_id === "none" ? null : form.assignee_id,
      due_date: form.due_date || null,
      start_date: form.start_date || null,
      time_estimate_hours: form.time_estimate_hours ? parseFloat(form.time_estimate_hours) : null,
      time_spent_hours: form.time_spent_hours ? parseFloat(form.time_spent_hours) : 0,
      labels: form.labels.split(",").map((s) => s.trim()).filter(Boolean),
    };

    if (task) {
      const { error } = await supabase.from("tm_tasks").update(payload).eq("id", task.id);
      if (error) { setLoading(false); toast.error(error.message); return; }
      toast.success("Task updated");
    } else {
      const { error } = await supabase.from("tm_tasks").insert({
        ...payload,
        project_id: projectId,
        reporter_id: user.id,
        task_number: 0,
      });
      if (error) { setLoading(false); toast.error(error.message); return; }
      toast.success("Task created");
    }
    setLoading(false);
    qc.invalidateQueries({ queryKey: ["tm_tasks", projectId] });
    onOpenChange(false);
  };

  const readOnly = !canEdit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? `Edit task` : "New task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={readOnly} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} disabled={readOnly} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v as TmTaskType })} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPE_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>{m.icon} {m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TmPriority })} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TmTaskStatus })} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Story points</Label>
              <Input type="number" min={0} value={form.story_points} onChange={(e) => setForm({ ...form, story_points: e.target.value })} disabled={readOnly} />
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={form.assignee_id} onValueChange={(v) => setForm({ ...form, assignee_id: v })} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>{m.user_id.slice(0, 8)} · {m.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} disabled={readOnly} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} disabled={readOnly} />
            </div>
            <div className="space-y-1.5">
              <Label>Estimate (hrs)</Label>
              <Input type="number" step="0.5" min={0} value={form.time_estimate_hours} onChange={(e) => setForm({ ...form, time_estimate_hours: e.target.value })} disabled={readOnly} />
            </div>
            <div className="space-y-1.5">
              <Label>Time spent (hrs)</Label>
              <Input type="number" step="0.5" min={0} value={form.time_spent_hours} onChange={(e) => setForm({ ...form, time_spent_hours: e.target.value })} disabled={readOnly} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Labels</Label>
            <Input value={form.labels} onChange={(e) => setForm({ ...form, labels: e.target.value })} placeholder="frontend, urgent, q1" disabled={readOnly} />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          {!readOnly && <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving…" : task ? "Save" : "Create"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
