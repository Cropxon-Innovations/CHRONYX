import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, MessageSquare, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectColumns, useProjectTasks, useMoveTask } from "@/hooks/useTaskManagement";
import { TASK_TYPE_META, PRIORITY_META, type TmTask, type TmTaskStatus, type TmProject } from "./types";
import { TaskDialog } from "./TaskDialog";
import { cn } from "@/lib/utils";

interface Props { project: TmProject; canEdit: boolean; }

export const KanbanBoard = ({ project, canEdit }: Props) => {
  const { data: columns = [] } = useProjectColumns(project.id);
  const { data: tasks = [] } = useProjectTasks(project.id);
  const moveTask = useMoveTask(project.id);
  const [editingTask, setEditingTask] = useState<TmTask | null>(null);
  const [creatingStatus, setCreatingStatus] = useState<TmTaskStatus | null>(null);
  const [dragOver, setDragOver] = useState<TmTaskStatus | null>(null);

  const tasksByCol = useMemo(() => {
    const map: Record<string, TmTask[]> = {};
    for (const c of columns) map[c.status_key] = [];
    for (const t of tasks) (map[t.status] ??= []).push(t);
    return map;
  }, [columns, tasks]);

  const handleDrop = (e: React.DragEvent, status: TmTaskStatus) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    const newPos = (tasksByCol[status]?.length ?? 0);
    moveTask.mutate({ id, status, position: newPos });
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {columns.map((col) => {
          const colTasks = tasksByCol[col.status_key] ?? [];
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.status_key); }}
              onDragLeave={() => setDragOver((s) => (s === col.status_key ? null : s))}
              onDrop={(e) => handleDrop(e, col.status_key)}
              className={cn(
                "flex-shrink-0 w-[300px] rounded-xl border bg-muted/30 transition-colors",
                dragOver === col.status_key && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: col.color ?? "#64748b" }} />
                  <h3 className="font-semibold text-sm">{col.name}</h3>
                  <span className="text-xs text-muted-foreground">{colTasks.length}</span>
                </div>
                {canEdit && (
                  <Button variant="ghost" size="icon-sm" onClick={() => setCreatingStatus(col.status_key)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="p-2 space-y-2 min-h-[120px]">
                {colTasks.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    draggable={canEdit}
                    onDragStart={(e: any) => e.dataTransfer.setData("text/plain", t.id)}
                    onClick={() => setEditingTask(t)}
                    className="group bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5 text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <span style={{ color: TASK_TYPE_META[t.task_type].color }}>{TASK_TYPE_META[t.task_type].icon}</span>
                        {project.project_key}-{t.task_number}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5" style={{ borderColor: PRIORITY_META[t.priority].color, color: PRIORITY_META[t.priority].color }}>
                        {PRIORITY_META[t.priority].label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium leading-snug line-clamp-2">{t.title}</p>
                    {t.labels?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.labels.slice(0, 3).map((l) => (
                          <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{l}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {t.story_points != null && (
                          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-muted font-semibold">
                            {t.story_points}
                          </span>
                        )}
                        {t.due_date && (
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{t.due_date}</span>
                        )}
                      </div>
                      {t.assignee_id && (
                        <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" />{t.assignee_id.slice(0, 6)}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 text-center py-6">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDialog
        open={!!editingTask}
        onOpenChange={(v) => !v && setEditingTask(null)}
        projectId={project.id}
        task={editingTask}
        canEdit={canEdit}
      />
      <TaskDialog
        open={!!creatingStatus}
        onOpenChange={(v) => !v && setCreatingStatus(null)}
        projectId={project.id}
        defaultStatus={creatingStatus ?? undefined}
        canEdit={canEdit}
      />
    </>
  );
};
