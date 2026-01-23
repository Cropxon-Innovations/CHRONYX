import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Upload } from "lucide-react";
import type { FamilyMember } from "@/pages/app/FamilyTree";

const RELATIONSHIPS = [
  "Self",
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandfather (Paternal)",
  "Grandmother (Paternal)",
  "Grandfather (Maternal)",
  "Grandmother (Maternal)",
  "Uncle",
  "Aunt",
  "Nephew",
  "Niece",
  "Cousin",
  "Other",
];

const GENDERS = ["Male", "Female", "Other"];

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
  existingMembers: FamilyMember[];
  onSuccess: () => void;
}

export const AddMemberDialog = ({
  open,
  onOpenChange,
  parentId,
  existingMembers,
  onSuccess,
}: AddMemberDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    relationship: "",
    gender: "",
    date_of_birth: "",
    place_of_birth: "",
    notes: "",
  });

  const hasRoot = existingMembers.some(m => m.is_root || m.relationship === "Self");

  const handleSubmit = async () => {
    if (!user?.id || !formData.full_name || !formData.relationship) {
      toast.error("Name and relationship are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const isRoot = formData.relationship === "Self" && !hasRoot;
      
      // Calculate generation level
      let generationLevel = 0;
      if (parentId) {
        const parent = existingMembers.find(m => m.id === parentId);
        if (parent) {
          generationLevel = parent.generation_level + 1;
        }
      } else if (formData.relationship === "Father" || formData.relationship === "Mother") {
        generationLevel = -1;
      } else if (formData.relationship.includes("Grandfather") || formData.relationship.includes("Grandmother")) {
        generationLevel = -2;
      }

      const { error } = await supabase.from("family_members").insert({
        user_id: user.id,
        full_name: formData.full_name,
        relationship: formData.relationship,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        place_of_birth: formData.place_of_birth || null,
        notes: formData.notes || null,
        parent_id: parentId,
        is_root: isRoot,
        generation_level: generationLevel,
      });

      if (error) throw error;

      toast.success("Family member added successfully!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add family member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      relationship: "",
      gender: "",
      date_of_birth: "",
      place_of_birth: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Add a new member to your family tree. Name and relationship are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Photo placeholder */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label>Relationship *</Label>
            <Select
              value={formData.relationship}
              onValueChange={(value) => setFormData({ ...formData, relationship: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((rel) => (
                  <SelectItem key={rel} value={rel} disabled={rel === "Self" && hasRoot}>
                    {rel} {rel === "Self" && hasRoot && "(Already added)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender (optional)" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          {/* Place of Birth */}
          <div className="space-y-2">
            <Label htmlFor="pob">Place of Birth</Label>
            <Input
              id="pob"
              value={formData.place_of_birth}
              onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
              placeholder="City, State, Country"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information (optional)"
              rows={3}
            />
          </div>

          {/* Info about identity */}
          {formData.date_of_birth && new Date(formData.date_of_birth).getFullYear() >= 1980 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> For members born after 1980, identity documents (Aadhaar, PAN, etc.) are recommended for verification.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Adding..." : "Add Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
