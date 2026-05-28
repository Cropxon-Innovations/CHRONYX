import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export const CreateProjectDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user || !name.trim() || !key.trim()) {
      toast.error("Name and project key are required");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("tm_projects").insert({
      owner_id: user.id,
      name: name.trim(),
      project_key: key.trim().toUpperCase().slice(0, 8),
      description: description.trim() || null,
      color,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Project created");
    qc.invalidateQueries({ queryKey: ["tm_projects"] });
    setName(""); setKey(""); setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Spin up a workspace for your tasks, pages, and team.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" value={name} onChange={(e) => {
              setName(e.target.value);
              if (!key) setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5));
            }} placeholder="Q1 Roadmap" />
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-key">Key</Label>
              <Input id="p-key" value={key} onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 8))} placeholder="PROJ" />
              <p className="text-xs text-muted-foreground">Used as prefix: {key || "PROJ"}-1</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-color">Color</Label>
              <Input id="p-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading}>{loading ? "Creating…" : "Create project"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
