import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  User,
  Calendar,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  Shield,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FamilyMember, FamilyDocument } from "@/pages/app/FamilyTree";
import { format } from "date-fns";

const DOCUMENT_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "passport", label: "Passport" },
  { value: "voter_id", label: "Voter ID" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "other", label: "Other" },
];

interface MemberDetailPanelProps {
  member: FamilyMember;
  onClose: () => void;
  onUpdate: () => void;
  onVerify: () => void;
  onDelete?: () => void;
}

export const MemberDetailPanel = ({
  member,
  onClose,
  onUpdate,
  onVerify,
  onDelete,
}: MemberDetailPanelProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    full_name: member.full_name,
    date_of_birth: member.date_of_birth || "",
    place_of_birth: member.place_of_birth || "",
    date_of_death: member.date_of_death || "",
    place_of_death: member.place_of_death || "",
    notes: member.notes || "",
  });

  // Document upload state
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("family_members")
        .update({
          full_name: editData.full_name,
          date_of_birth: editData.date_of_birth || null,
          place_of_birth: editData.place_of_birth || null,
          date_of_death: editData.date_of_death || null,
          place_of_death: editData.place_of_death || null,
          notes: editData.notes || null,
        })
        .eq("id", member.id);

      if (error) throw error;

      toast.success("Member updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Failed to update member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!user?.id || !docType) {
      toast.error("Please select a document type");
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = null;
      let fileName = null;

      if (docFile) {
        const filePath = `${user.id}/${member.id}/${Date.now()}_${docFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("family-documents")
          .upload(filePath, docFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("family-documents")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = docFile.name;
      }

      const { error } = await supabase.from("family_documents").insert({
        user_id: user.id,
        member_id: member.id,
        document_type: docType,
        document_number: docNumber || null,
        file_url: fileUrl,
        file_name: fileName,
        verification_status: fileUrl ? "added" : "not_added",
      });

      if (error) throw error;

      toast.success("Document added successfully");
      setShowDocUpload(false);
      setDocType("");
      setDocNumber("");
      setDocFile(null);
      onUpdate();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const needsIdentity = member.date_of_birth && new Date(member.date_of_birth).getFullYear() >= 1980;
  const hasDocuments = member.documents && member.documents.length > 0;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Member Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Profile Section */}
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
              member.gender === "Male" ? "bg-blue-100 text-blue-600" :
              member.gender === "Female" ? "bg-pink-100 text-pink-600" :
              "bg-muted text-muted-foreground"
            }`}>
              {member.photo_url ? (
                <img src={member.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <h3 className="mt-3 text-xl font-semibold text-foreground">
              {isEditing ? (
                <Input
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="text-center"
                />
              ) : (
                member.full_name
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{member.relationship}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge 
                variant={member.is_verified ? "default" : "outline"}
                className={member.is_verified ? "bg-green-500/10 text-green-600" : ""}
              >
                {member.is_verified ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</>
                ) : (
                  <><AlertCircle className="w-3 h-3 mr-1" /> Pending Verification</>
                )}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Personal Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Personal Details</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
              >
                {isEditing ? (
                  <><Save className="w-4 h-4 mr-1" /> Save</>
                ) : (
                  <><Edit2 className="w-4 h-4 mr-1" /> Edit</>
                )}
              </Button>
            </div>

            <div className="grid gap-3">
              {/* Date of Birth */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.date_of_birth}
                      onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                      className="h-8 mt-1"
                    />
                  ) : (
                    <p className="text-sm text-foreground">
                      {member.date_of_birth ? format(new Date(member.date_of_birth), "PPP") : "Not specified"}
                    </p>
                  )}
                </div>
              </div>

              {/* Place of Birth */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Place of Birth</p>
                  {isEditing ? (
                    <Input
                      value={editData.place_of_birth}
                      onChange={(e) => setEditData({ ...editData, place_of_birth: e.target.value })}
                      className="h-8 mt-1"
                    />
                  ) : (
                    <p className="text-sm text-foreground">
                      {member.place_of_birth || "Not specified"}
                    </p>
                  )}
                </div>
              </div>

              {/* Date of Death (if applicable) */}
              {(member.date_of_death || isEditing) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Date of Death</p>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.date_of_death}
                        onChange={(e) => setEditData({ ...editData, date_of_death: e.target.value })}
                        className="h-8 mt-1"
                      />
                    ) : (
                      <p className="text-sm text-foreground">
                        {member.date_of_death ? format(new Date(member.date_of_death), "PPP") : "—"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Identity Documents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Identity Documents</h4>
              <Button variant="outline" size="sm" onClick={() => setShowDocUpload(true)}>
                <Upload className="w-4 h-4 mr-1" /> Add Document
              </Button>
            </div>

            {needsIdentity && !hasDocuments && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Required:</strong> At least one identity document is required for members born after 1980.
                </p>
              </div>
            )}

            {hasDocuments ? (
              <div className="space-y-2">
                {member.documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                      </p>
                      {doc.document_number && (
                        <p className="text-xs text-muted-foreground">
                          •••• {doc.document_number.slice(-4)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={doc.verification_status === "verified" ? "default" : "outline"}
                      className={
                        doc.verification_status === "verified" ? "bg-green-500/10 text-green-600" :
                        doc.verification_status === "added" ? "bg-blue-500/10 text-blue-600" : ""
                      }
                    >
                      {doc.verification_status === "verified" ? "Verified" :
                       doc.verification_status === "added" ? "Uploaded" : "Not Added"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents added yet</p>
              </div>
            )}

            {/* Document Upload Form */}
            {showDocUpload && (
              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Document number (optional)"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                />

                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowDocUpload(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleDocumentUpload} disabled={isUploading} className="flex-1">
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Verification */}
          {!member.is_verified && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Verification</h4>
              <Button
                onClick={onVerify}
                className="w-full gap-2"
                disabled={needsIdentity && !hasDocuments}
              >
                <Shield className="w-4 h-4" />
                Request Verification
              </Button>
              {needsIdentity && !hasDocuments && (
                <p className="text-xs text-muted-foreground text-center">
                  Add at least one identity document to request verification
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Danger Zone - Delete */}
          {onDelete && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
              <Button
                variant="destructive"
                onClick={onDelete}
                className="w-full gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Member
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                This will permanently remove this member and all their documents
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
