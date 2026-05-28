import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, UserPlus, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectMembers, useShareLinks } from "@/hooks/useTaskManagement";
import { ROLE_META, type TmRole, type TmProject } from "./types";

interface Props { project: TmProject; canAdmin: boolean; }

export const MembersPanel = ({ project, canAdmin }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: members = [] } = useProjectMembers(project.id);
  const { data: links = [] } = useShareLinks(project.id);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TmRole>("editor");
  const [linkRole, setLinkRole] = useState<TmRole>("viewer");
  const [busy, setBusy] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("tm_invite_member_by_email", {
      _project_id: project.id, _email: email.trim(), _role: inviteRole,
    });
    setBusy(false);
    const result = data as { ok: boolean; error?: string } | null;
    if (error || !result?.ok) {
      toast.error(result?.error === "user_not_found" ? "No Chronyx account with that email" : (error?.message ?? "Failed"));
      return;
    }
    toast.success("Member added");
    setEmail("");
    qc.invalidateQueries({ queryKey: ["tm_members", project.id] });
  };

  const handleCreateLink = async () => {
    if (!user) return;
    setBusy(true);
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("tm_project_share_links").insert({
      project_id: project.id, token, role: linkRole, created_by: user.id,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["tm_share_links", project.id] });
    toast.success("Share link created");
  };

  const linkUrl = (token: string) => `${window.location.origin}/app/tasks/join/${token}`;

  const removeMember = async (id: string) => {
    const { error } = await supabase.from("tm_project_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tm_members", project.id] });
  };

  const updateMemberRole = async (id: string, role: TmRole) => {
    const { error } = await supabase.from("tm_project_members").update({ role }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tm_members", project.id] });
  };

  const toggleLink = async (id: string, is_active: boolean) => {
    await supabase.from("tm_project_share_links").update({ is_active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["tm_share_links", project.id] });
  };

  return (
    <div className="space-y-6">
      {canAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Invite by email</CardTitle>
            <CardDescription>They must have a Chronyx account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2">
              <Input placeholder="teammate@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TmRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["admin","editor","reviewer","viewer"] as TmRole[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={busy}>Invite</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="h-4 w-4" /> Share links</CardTitle>
            <CardDescription>Anyone signed in who opens the link gets the chosen role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={linkRole} onValueChange={(v) => setLinkRole(v as TmRole)}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["admin","editor","reviewer","viewer"] as TmRole[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateLink} disabled={busy}>Generate link</Button>
            </div>
            <div className="space-y-2">
              {links.map((l) => (
                <div key={l.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                  <Badge variant="outline">{ROLE_META[l.role].label}</Badge>
                  <code className="text-xs truncate flex-1">{linkUrl(l.token)}</code>
                  <span className="text-xs text-muted-foreground">{l.uses_count} uses</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => { navigator.clipboard.writeText(linkUrl(l.token)); toast.success("Copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => toggleLink(l.id, !l.is_active)}>
                    {l.is_active ? "Disable" : "Enable"}
                  </Button>
                </div>
              ))}
              {links.length === 0 && <p className="text-xs text-muted-foreground">No share links yet.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((m) => {
            const isOwner = m.user_id === project.owner_id;
            return (
              <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-md border">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{m.user_id === user?.id ? "You" : m.user_id.slice(0, 8) + "…"}</span>
                  <span className="text-xs text-muted-foreground">{ROLE_META[m.role].description}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner || !canAdmin ? (
                    <Badge>{ROLE_META[m.role].label}</Badge>
                  ) : (
                    <Select value={m.role} onValueChange={(v) => updateMemberRole(m.id, v as TmRole)}>
                      <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["admin","editor","reviewer","viewer"] as TmRole[]).map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {!isOwner && canAdmin && (
                    <Button variant="ghost" size="icon-sm" onClick={() => removeMember(m.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
