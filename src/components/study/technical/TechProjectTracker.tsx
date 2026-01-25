import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plus, FolderGit2, Github, ExternalLink, Calendar, 
  MoreVertical, Edit, Trash2, Share2, Upload, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTechProjects, useCreateProject, useUpdateProject, TechProject } from "@/hooks/useTechCareer";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  planned: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
  in_progress: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  archived: 'bg-muted text-muted-foreground',
};

export default function TechProjectTracker() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<TechProject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tech_stack: '',
    github_url: '',
    live_url: '',
    status: 'planned' as TechProject['status'],
    progress_percent: 0,
  });

  const { data: projects, isLoading } = useTechProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const handleSubmit = () => {
    const projectData = {
      name: formData.name,
      description: formData.description,
      tech_stack: formData.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
      github_url: formData.github_url || null,
      live_url: formData.live_url || null,
      status: formData.status,
      progress_percent: formData.progress_percent,
      design_notes: null,
      start_date: null,
      end_date: null,
      is_public: false,
      is_published_to_hub: false,
      hub_category: null,
      cover_image_url: null,
    };

    if (editingProject) {
      updateProject.mutate({ id: editingProject.id, ...projectData });
    } else {
      createProject.mutate(projectData);
    }

    setIsDialogOpen(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      tech_stack: '',
      github_url: '',
      live_url: '',
      status: 'planned',
      progress_percent: 0,
    });
  };

  const openEditDialog = (project: TechProject) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      tech_stack: project.tech_stack?.join(', ') || '',
      github_url: project.github_url || '',
      live_url: project.live_url || '',
      status: project.status,
      progress_percent: project.progress_percent,
    });
    setIsDialogOpen(true);
  };

  const projectsByStatus = {
    in_progress: projects?.filter(p => p.status === 'in_progress') || [],
    planned: projects?.filter(p => p.status === 'planned') || [],
    completed: projects?.filter(p => p.status === 'completed') || [],
    archived: projects?.filter(p => p.status === 'archived') || [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Project Portfolio</h2>
          <p className="text-sm text-muted-foreground">
            Track and showcase your technical projects
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Project Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Awesome Project"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this project do?"
                />
              </div>
              <div>
                <Label>Tech Stack (comma-separated)</Label>
                <Input
                  value={formData.tech_stack}
                  onChange={(e) => setFormData(prev => ({ ...prev, tech_stack: e.target.value }))}
                  placeholder="React, TypeScript, Node.js, PostgreSQL"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GitHub URL</Label>
                  <Input
                    value={formData.github_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <Label>Live URL</Label>
                  <Input
                    value={formData.live_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, live_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as TechProject['status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Progress: {formData.progress_percent}%</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress_percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, progress_percent: parseInt(e.target.value) }))}
                    className="mt-2"
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={!formData.name}>
                {editingProject ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-48" />
            </Card>
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderGit2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-1">No Projects Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your technical projects
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* In Progress */}
          {projectsByStatus.in_progress.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                In Progress ({projectsByStatus.in_progress.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectsByStatus.in_progress.map((project, index) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    index={index}
                    onEdit={openEditDialog}
                    onUpdate={updateProject.mutate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Planned */}
          {projectsByStatus.planned.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-500" />
                Planned ({projectsByStatus.planned.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectsByStatus.planned.map((project, index) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    index={index}
                    onEdit={openEditDialog}
                    onUpdate={updateProject.mutate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {projectsByStatus.completed.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed ({projectsByStatus.completed.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectsByStatus.completed.map((project, index) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    index={index}
                    onEdit={openEditDialog}
                    onUpdate={updateProject.mutate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ 
  project, 
  index, 
  onEdit,
  onUpdate 
}: { 
  project: TechProject; 
  index: number;
  onEdit: (p: TechProject) => void;
  onUpdate: (data: { id: string } & Partial<TechProject>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{project.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Publish to Hub
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onUpdate({ id: project.id, status: 'archived' })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {project.tech_stack.slice(0, 4).map((tech, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {project.tech_stack.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{project.tech_stack.length - 4}
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress_percent}%</span>
            </div>
            <Progress value={project.progress_percent} className="h-1.5" />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className={statusColors[project.status]}>
              {project.status === 'in_progress' ? 'In Progress' : 
               project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
            <div className="flex gap-1">
              {project.github_url && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => window.open(project.github_url!, '_blank')}
                >
                  <Github className="h-4 w-4" />
                </Button>
              )}
              {project.live_url && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => window.open(project.live_url!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
