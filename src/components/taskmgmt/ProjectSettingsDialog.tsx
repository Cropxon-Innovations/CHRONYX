import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUpdateProject, useDeleteProject } from "@/hooks/useTaskManagement";
import type { TmProject } from "./types";

interface Props {
  project: TmProject;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isOwner: boolean;
}

export const ProjectSettingsDialog = ({ project, open, onOpenChange, isOwner }: Props) => {
  const navigate = useNavigate();
  const updateProject = useUpdateProject(project.id);
  const deleteProject = useDeleteProject();
  const [name, setName] = useState(project.name);
  const [key, setKey] = useState(project.project_key);
  const [description, setDescription] = useState(project.description ?? "");
  const [color, setColor] = useState(project.color ?? "#3b82f6");
  const [archived, setArchived] = useState(project.archived);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Re-sync form when reopened
  useEffect(() => {
    if (open) {
      setName(project.name);
      setKey(project.project_key);
      setDescription(project.description ?? "");
      setColor(project.color ?? "#3b82f6");
      setArchived(project.archived);
      setConfirmText("");
    }
  }, [open, project]);

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) {
      toast.error("Name and project key are required");
      return;
    }
    try {
      await updateProject.mutateAsync({
        name: name.trim(),
        project_key: key.trim().toUpperCase().slice(0, 8),
        description: description.trim() || null,
        color,
        archived,
      });
      toast.success("Project updated");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update project");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted");
      setConfirmOpen(false);
      onOpenChange(false);
      navigate("/app/tasks");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete project");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Project settings</DialogTitle>
            <DialogDescription>Edit details, archive, or delete this project.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ps-name">Name</Label>
              <Input id="ps-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ps-key">Key</Label>
                <Input
                  id="ps-key"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                />
                <p className="text-xs text-muted-foreground">Task prefix: {key || "PROJ"}-1</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ps-color">Color</Label>
                <Input id="ps-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ps-desc">Description</Label>
              <Textarea id="ps-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Archive project</p>
                <p className="text-xs text-muted-foreground">Hidden from active work, data is kept.</p>
              </div>
              <Switch checked={archived} onCheckedChange={setArchived} aria-label="Archive project" />
            </div>

            {isOwner && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Danger zone
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Permanently delete this project with all tasks, pages, columns, members, and share links.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    aria-label="Delete project"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateProject.isPending}>
              {updateProject.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All tasks, pages, board columns, members and share links in this
              project will be permanently deleted. Type <strong>{project.project_key}</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder={project.project_key}
            aria-label="Type the project key to confirm deletion"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== project.project_key || deleteProject.isPending}
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProject.isPending ? "Deleting…" : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
