import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, KanbanSquare, FileText, Users, Settings as SettingsIcon, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProject, useProjectTasks, useMyRole } from "@/hooks/useTaskManagement";
import { KanbanBoard } from "@/components/taskmgmt/KanbanBoard";
import { MembersPanel } from "@/components/taskmgmt/MembersPanel";
import { PagesPanel } from "@/components/taskmgmt/PagesPanel";
import { TaskDialog } from "@/components/taskmgmt/TaskDialog";
import { ProjectSettingsDialog } from "@/components/taskmgmt/ProjectSettingsDialog";
import { TASK_TYPE_META, PRIORITY_META, ROLE_META } from "@/components/taskmgmt/types";

const TaskProject = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId);
  const { data: tasks = [] } = useProjectTasks(projectId);
  const role = useMyRole(projectId);
  const canEdit = role === "owner" || role === "admin" || role === "editor";
  const canAdmin = role === "owner" || role === "admin";
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (isLoading) return <div className="p-8">Loading…</div>;
  if (!project) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground mb-4">Project not found or no access.</p>
      <Button asChild variant="outline"><Link to="/app/tasks"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1600px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link to="/app/tasks"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ background: project.color ?? "#3b82f6" }}
          >
            {project.project_key.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {project.name}
              {role && <Badge variant="outline" className="text-[10px]">{ROLE_META[role].label}</Badge>}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">{project.project_key}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canAdmin && (
            <Button variant="outline" size="icon" aria-label="Project settings" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />New task</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board"><KanbanSquare className="h-4 w-4 mr-1.5" />Board</TabsTrigger>
          <TabsTrigger value="backlog"><List className="h-4 w-4 mr-1.5" />Backlog</TabsTrigger>
          <TabsTrigger value="pages"><FileText className="h-4 w-4 mr-1.5" />Pages</TabsTrigger>
          <TabsTrigger value="members"><Users className="h-4 w-4 mr-1.5" />Team</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <KanbanBoard project={project} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="backlog" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 w-24">Key</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2 w-24">Type</th>
                    <th className="px-3 py-2 w-28">Status</th>
                    <th className="px-3 py-2 w-24">Priority</th>
                    <th className="px-3 py-2 w-16 text-center">SP</th>
                    <th className="px-3 py-2 w-28">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{project.project_key}-{t.task_number}</td>
                      <td className="px-3 py-2">{t.title}</td>
                      <td className="px-3 py-2">
                        <span style={{ color: TASK_TYPE_META[t.task_type].color }}>
                          {TASK_TYPE_META[t.task_type].icon} {TASK_TYPE_META[t.task_type].label}
                        </span>
                      </td>
                      <td className="px-3 py-2 capitalize text-xs">{t.status.replace("_", " ")}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: PRIORITY_META[t.priority].color }}>
                        {PRIORITY_META[t.priority].label}
                      </td>
                      <td className="px-3 py-2 text-center">{t.story_points ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">{t.due_date ?? "—"}</td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-muted-foreground py-8 text-xs">No tasks yet</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="mt-4">
          <PagesPanel project={project} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersPanel project={project} canAdmin={canAdmin} />
        </TabsContent>
      </Tabs>

      <TaskDialog open={createOpen} onOpenChange={setCreateOpen} projectId={project.id} canEdit={canEdit} />
      {canAdmin && (
        <ProjectSettingsDialog
          project={project}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          isOwner={role === "owner"}
        />
      )}
    </div>
  );
};

export default TaskProject;
