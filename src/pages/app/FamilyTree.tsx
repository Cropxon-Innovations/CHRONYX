import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Download,
  Settings,
  Shield,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Eye,
  Clock,
  FileText,
  Award,
  ChevronRight,
} from "lucide-react";
import { FamilyTreeVisualization } from "@/components/family/FamilyTreeVisualization";
import { AddMemberDialog } from "@/components/family/AddMemberDialog";
import { MemberDetailPanel } from "@/components/family/MemberDetailPanel";
import { CertifiedExportDialog } from "@/components/family/CertifiedExportDialog";
import { DemoDataGenerator } from "@/components/family/DemoDataGenerator";
import { FamilyAuditLog } from "@/components/family/FamilyAuditLog";

export interface FamilyMember {
  id: string;
  user_id: string;
  full_name: string;
  relationship: string;
  gender?: string | null;
  date_of_birth?: string | null;
  place_of_birth?: string | null;
  date_of_death?: string | null;
  place_of_death?: string | null;
  notes?: string | null;
  parent_id?: string | null;
  spouse_id?: string | null;
  is_root: boolean;
  generation_level: number;
  photo_url?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  documents?: FamilyDocument[];
}

export interface FamilyDocument {
  id: string;
  member_id: string;
  document_type: "aadhaar" | "pan" | "passport" | "voter_id" | "birth_certificate" | "other";
  document_number?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  verification_status: "not_added" | "added" | "verified";
  verified_at?: string | null;
  created_at: string;
}

const FamilyTree = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [zoom, setZoom] = useState(1);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [addToParentId, setAddToParentId] = useState<string | null>(null);

  // Fetch family members
  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ["family-members", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: membersData, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", user.id)
        .order("generation_level", { ascending: true });
      
      if (error) throw error;

      // Fetch documents for each member
      const membersWithDocs = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: docs } = await supabase
            .from("family_documents")
            .select("*")
            .eq("member_id", member.id);
          
          return { ...member, documents: docs || [] };
        })
      );

      return membersWithDocs as FamilyMember[];
    },
    enabled: !!user?.id,
  });

  // Log activity
  const logActivity = useCallback(async (action: string, memberId?: string, details?: any) => {
    if (!user?.id) return;
    
    await supabase.from("family_audit_log").insert({
      user_id: user.id,
      member_id: memberId,
      action,
      action_details: details,
    });
  }, [user?.id]);

  // Verify member
  const verifyMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("family_members")
        .update({ is_verified: true })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      toast.success("Member verified!");
    },
  });

  // Stats
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const verifiedMembers = members.filter(m => m.is_verified).length;
    const generations = new Set(members.map(m => m.generation_level)).size;
    const documentsAdded = members.reduce((sum, m) => sum + (m.documents?.length || 0), 0);
    
    return { totalMembers, verifiedMembers, generations, documentsAdded };
  }, [members]);

  const handleAddMember = (parentId?: string) => {
    setAddToParentId(parentId || null);
    setShowAddDialog(true);
  };

  const handleMemberClick = (member: FamilyMember) => {
    setSelectedMember(member);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Chronyx Life – Family Tree
                </h1>
                <p className="text-sm text-muted-foreground">
                  Build, verify, and certify your complete family lineage
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <DemoDataGenerator 
                onSuccess={() => refetch()} 
                hasExistingData={members.length > 0} 
              />
              <Button variant="outline" size="sm" onClick={() => setShowAuditLog(true)}>
                <Clock className="w-4 h-4 mr-2" />
                Activity Log
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                <Award className="w-4 h-4 mr-2" />
                Certified Export
              </Button>
              <Button onClick={() => handleAddMember()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="text-2xl font-semibold text-foreground">{stats.totalMembers}</div>
              <div className="text-xs text-muted-foreground">Family Members</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="text-2xl font-semibold text-green-600">{stats.verifiedMembers}</div>
              <div className="text-xs text-muted-foreground">Verified Members</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="text-2xl font-semibold text-foreground">{stats.generations}</div>
              <div className="text-xs text-muted-foreground">Generations</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="text-2xl font-semibold text-foreground">{stats.documentsAdded}</div>
              <div className="text-xs text-muted-foreground">Documents Added</div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 2}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetZoom}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="w-3 h-3" />
              Private & Encrypted
            </Badge>
          </div>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="relative overflow-auto min-h-[60vh] p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading family tree...</p>
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Start Your Family Tree</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Begin by adding yourself as the root member, then add your parents, spouse, children, and extended family.
              </p>
              <Button onClick={() => handleAddMember()} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Yourself
              </Button>
            </div>
          </div>
        ) : (
          <FamilyTreeVisualization
            members={members}
            zoom={zoom}
            onMemberClick={handleMemberClick}
            onAddChild={handleAddMember}
            selectedMemberId={selectedMember?.id}
          />
        )}
      </div>

      {/* Member Detail Panel */}
      <AnimatePresence>
        {selectedMember && (
          <MemberDetailPanel
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onUpdate={() => {
              refetch();
              logActivity("Updated member", selectedMember.id);
            }}
            onVerify={() => verifyMutation.mutate(selectedMember.id)}
          />
        )}
      </AnimatePresence>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        parentId={addToParentId}
        existingMembers={members}
        onSuccess={() => {
          refetch();
          logActivity("Added member");
        }}
      />

      {/* Certified Export Dialog */}
      <CertifiedExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        members={members}
      />

      {/* Audit Log */}
      <FamilyAuditLog
        open={showAuditLog}
        onOpenChange={setShowAuditLog}
      />
    </div>
  );
};

export default FamilyTree;
