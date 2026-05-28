import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderKanban, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/useTaskManagement";
import { CreateProjectDialog } from "@/components/taskmgmt/CreateProjectDialog";
import { motion } from "framer-motion";

const TaskManagement = () => {
  const { data: projects = [], isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FolderKanban className="h-7 w-7 text-primary" />
            Task Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Jira-style boards for your projects — tasks, pages, architecture, and team.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New project
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first project to start managing tasks.</p>
            <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create project</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={`/app/tasks/${p.id}`}>
                <Card className="h-full hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ background: p.color ?? "#3b82f6" }}
                        >
                          {p.project_key.slice(0, 2)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{p.name}</CardTitle>
                          <CardDescription className="text-xs font-mono">{p.project_key}</CardDescription>
                        </div>
                      </div>
                      {p.archived && <Badge variant="outline">Archived</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{p.task_counter} tasks</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default TaskManagement;
