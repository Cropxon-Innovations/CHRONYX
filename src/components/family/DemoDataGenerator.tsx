import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Sparkles, Users, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DemoDataGeneratorProps {
  onSuccess: () => void;
  hasExistingData: boolean;
}

export const DemoDataGenerator = ({ onSuccess, hasExistingData }: DemoDataGeneratorProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const generateDemoData = async () => {
    if (!user?.id) return;

    setIsGenerating(true);
    try {
      // Clear existing demo data first
      await supabase
        .from("family_members")
        .delete()
        .eq("user_id", user.id);

      // Generation 0: Self (Root)
      const { data: self, error: selfError } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          full_name: "Rahul Kumar Sharma",
          relationship: "Self",
          gender: "Male",
          date_of_birth: "1990-03-15",
          place_of_birth: "New Delhi, India",
          is_root: true,
          generation_level: 0,
          is_verified: true,
          notes: "DEMO - Primary account holder",
        })
        .select()
        .single();

      if (selfError) throw selfError;

      // Spouse
      const { data: spouse } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          full_name: "Priya Sharma",
          relationship: "Spouse",
          gender: "Female",
          date_of_birth: "1992-07-22",
          place_of_birth: "Mumbai, Maharashtra",
          is_root: false,
          generation_level: 0,
          is_verified: true,
          notes: "DEMO - Spouse",
        })
        .select()
        .single();

      // Children (Generation +1)
      const { data: son } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          full_name: "Arjun Sharma",
          relationship: "Son",
          gender: "Male",
          date_of_birth: "2018-11-05",
          place_of_birth: "Bangalore, Karnataka",
          parent_id: self?.id,
          is_root: false,
          generation_level: 1,
          is_verified: false,
          notes: "DEMO - Son (requires identity verification)",
        })
        .select()
        .single();

      const { data: daughter } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          full_name: "Ananya Sharma",
          relationship: "Daughter",
          gender: "Female",
          date_of_birth: "2021-04-12",
          place_of_birth: "Bangalore, Karnataka",
          parent_id: self?.id,
          is_root: false,
          generation_level: 1,
          is_verified: false,
          notes: "DEMO - Daughter (too young for identity docs)",
        })
        .select()
        .single();

      // Parents (Generation -1)
      const { data: father } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          full_name: "Ramesh Sharma",
          relationship: "Father",
          gender: "Male",
          date_of_birth: "1958-09-10",
          place_of_birth: "Jaipur, Rajasthan",
          is_root: false,
          generation_level: -1,
          is_verified: true,
          notes: "DEMO - Father (verified)",
        })
        .select()
        .single();

      const { data: mother } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          full_name: "Sunita Sharma",
          relationship: "Mother",
          gender: "Female",
          date_of_birth: "1962-02-28",
          place_of_birth: "Lucknow, Uttar Pradesh",
          is_root: false,
          generation_level: -1,
          is_verified: true,
          notes: "DEMO - Mother (verified)",
        })
        .select()
        .single();

      // Grandparents (Generation -2)
      await supabase.from("family_members").insert([
        {
          user_id: user.id,
          full_name: "Late Shri Mohan Lal Sharma",
          relationship: "Grandfather (Paternal)",
          gender: "Male",
          date_of_birth: "1930-01-01",
          place_of_birth: "Jaipur, Rajasthan",
          date_of_death: "2010-06-15",
          place_of_death: "Jaipur, Rajasthan",
          is_root: false,
          generation_level: -2,
          is_verified: true,
          notes: "DEMO - Paternal Grandfather (deceased, pre-1980 - no ID required)",
        },
        {
          user_id: user.id,
          full_name: "Kamla Devi Sharma",
          relationship: "Grandmother (Paternal)",
          gender: "Female",
          date_of_birth: "1935-05-20",
          place_of_birth: "Jodhpur, Rajasthan",
          is_root: false,
          generation_level: -2,
          is_verified: true,
          notes: "DEMO - Paternal Grandmother (pre-1980 - no ID required)",
        },
        {
          user_id: user.id,
          full_name: "Late Shri Prakash Gupta",
          relationship: "Grandfather (Maternal)",
          gender: "Male",
          date_of_birth: "1932-08-14",
          place_of_birth: "Lucknow, Uttar Pradesh",
          date_of_death: "2015-12-01",
          place_of_death: "Lucknow, Uttar Pradesh",
          is_root: false,
          generation_level: -2,
          is_verified: false,
          notes: "DEMO - Maternal Grandfather (deceased, unverified)",
        },
        {
          user_id: user.id,
          full_name: "Shanti Devi Gupta",
          relationship: "Grandmother (Maternal)",
          gender: "Female",
          date_of_birth: "1938-11-30",
          place_of_birth: "Varanasi, Uttar Pradesh",
          is_root: false,
          generation_level: -2,
          is_verified: false,
          notes: "DEMO - Maternal Grandmother (unverified)",
        },
      ]);

      // Siblings
      await supabase.from("family_members").insert([
        {
          user_id: user.id,
          full_name: "Amit Sharma",
          relationship: "Brother",
          gender: "Male",
          date_of_birth: "1987-06-18",
          place_of_birth: "New Delhi, India",
          is_root: false,
          generation_level: 0,
          is_verified: false,
          notes: "DEMO - Elder Brother (pending verification)",
        },
        {
          user_id: user.id,
          full_name: "Meera Sharma",
          relationship: "Sister",
          gender: "Female",
          date_of_birth: "1993-12-25",
          place_of_birth: "New Delhi, India",
          is_root: false,
          generation_level: 0,
          is_verified: true,
          notes: "DEMO - Younger Sister (verified)",
        },
      ]);

      // Add sample documents for verified members
      if (self?.id) {
        await supabase.from("family_documents").insert([
          {
            user_id: user.id,
            member_id: self.id,
            document_type: "aadhaar",
            document_number: "XXXX-XXXX-1234",
            verification_status: "verified",
            notes: "DEMO - Aadhaar Card",
          },
          {
            user_id: user.id,
            member_id: self.id,
            document_type: "pan",
            document_number: "ABCDE1234F",
            verification_status: "verified",
            notes: "DEMO - PAN Card",
          },
        ]);
      }

      if (spouse?.id) {
        await supabase.from("family_documents").insert({
          user_id: user.id,
          member_id: spouse.id,
          document_type: "aadhaar",
          document_number: "XXXX-XXXX-5678",
          verification_status: "added",
          notes: "DEMO - Aadhaar Card (pending verification)",
        });
      }

      if (son?.id) {
        await supabase.from("family_documents").insert({
          user_id: user.id,
          member_id: son.id,
          document_type: "birth_certificate",
          verification_status: "added",
          notes: "DEMO - Birth Certificate",
        });
      }

      // Log activity
      await supabase.from("family_audit_log").insert({
        user_id: user.id,
        action: "Generated demo family data",
        action_details: { type: "demo_generation", members_created: 12 },
      });

      toast.success("Demo family tree created!", {
        description: "12 family members across 3 generations with sample documents.",
      });

      setShowDialog(false);
      onSuccess();
    } catch (error) {
      console.error("Error generating demo data:", error);
      toast.error("Failed to generate demo data");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearDemoData = async () => {
    if (!user?.id) return;

    setIsGenerating(true);
    try {
      // Delete all family documents first
      await supabase.from("family_documents").delete().eq("user_id", user.id);
      // Delete all family members
      await supabase.from("family_members").delete().eq("user_id", user.id);

      toast.success("Demo data cleared");
      setShowClearConfirm(false);
      onSuccess();
    } catch (error) {
      console.error("Error clearing demo data:", error);
      toast.error("Failed to clear demo data");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate Demo
          <Badge variant="secondary" className="text-[10px] px-1.5">DEMO</Badge>
        </Button>

        {hasExistingData && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Generate Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Generate Demo Family Tree
            </DialogTitle>
            <DialogDescription>
              Create a sample 3-generation family tree for demonstration purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2">What will be created:</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <strong>Generation 0:</strong> Self, Spouse, Siblings (4 members)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <strong>Generation -1:</strong> Father, Mother (2 members)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <strong>Generation -2:</strong> Grandparents (4 members)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <strong>Generation +1:</strong> Children (2 members)
                </li>
              </ul>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>Note:</strong> This will replace any existing family data.
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              <strong>Mixed verification statuses:</strong>
              <ul className="mt-1 space-y-0.5 ml-4">
                <li>• 6 verified members with documents</li>
                <li>• 6 unverified members (pending)</li>
                <li>• Sample identity documents (Aadhaar, PAN, Birth Certificate)</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={generateDemoData} disabled={isGenerating} className="flex-1 gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Demo Data
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Family Tree Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all family members and documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearDemoData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
