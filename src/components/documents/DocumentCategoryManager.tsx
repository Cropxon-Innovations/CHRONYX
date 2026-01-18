import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  FileText, 
  CreditCard, 
  Car, 
  Home, 
  Heart, 
  Shield, 
  GraduationCap,
  Briefcase,
  Receipt,
  Plane,
  Baby,
  Stethoscope,
  Landmark,
  Scale,
  Building2,
  Trash2,
  Edit2,
  Settings
} from "lucide-react";

const ICON_OPTIONS = [
  { id: "FileText", icon: FileText, label: "Document" },
  { id: "CreditCard", icon: CreditCard, label: "Card" },
  { id: "Car", icon: Car, label: "Vehicle" },
  { id: "Home", icon: Home, label: "Property" },
  { id: "Heart", icon: Heart, label: "Personal" },
  { id: "Shield", icon: Shield, label: "Insurance" },
  { id: "GraduationCap", icon: GraduationCap, label: "Education" },
  { id: "Briefcase", icon: Briefcase, label: "Work" },
  { id: "Receipt", icon: Receipt, label: "Financial" },
  { id: "Plane", icon: Plane, label: "Travel" },
  { id: "Baby", icon: Baby, label: "Family" },
  { id: "Stethoscope", icon: Stethoscope, label: "Medical" },
  { id: "Landmark", icon: Landmark, label: "Government" },
  { id: "Scale", icon: Scale, label: "Legal" },
  { id: "Building2", icon: Building2, label: "Business" },
];

const COLOR_OPTIONS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#3b82f6",
];

interface DocumentCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
}

interface DocumentCategoryManagerProps {
  onCategorySelect?: (category: DocumentCategory) => void;
}

export const getIconComponent = (iconId: string) => {
  const iconOption = ICON_OPTIONS.find(opt => opt.id === iconId);
  return iconOption?.icon || FileText;
};

const DocumentCategoryManager = ({ onCategorySelect }: DocumentCategoryManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "FileText",
    color: "#6366f1"
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["document-categories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("*")
        .eq("user_id", user?.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as DocumentCategory[];
    },
    enabled: !!user?.id
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("document_categories").insert({
        user_id: user?.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        sort_order: categories.length
      });
      if (error) {
        if (error.code === "23505") {
          throw new Error("Category with this name already exists");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Category created" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("document_categories")
        .update({
          name: data.name,
          icon: data.icon,
          color: data.color
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      setEditingCategory(null);
      resetForm();
      toast({ title: "Category updated" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      toast({ title: "Category deleted" });
    }
  });

  const resetForm = () => {
    setFormData({ name: "", icon: "FileText", color: "#6366f1" });
  };

  const openEdit = (category: DocumentCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color
    });
  };

  const handleSave = () => {
    if (editingCategory) {
      updateMutation.mutate({ ...formData, id: editingCategory.id });
    } else {
      addMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Document Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Categories List */}
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-2">
              {categories.map((category) => {
                const IconComponent = getIconComponent(category.icon);
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <IconComponent className="h-4 w-4" style={{ color: category.color }} />
                      </div>
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this category?")) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom categories yet
                </p>
              )}
            </div>
          </ScrollArea>

          {/* Add/Edit Form */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-medium">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h4>

            <div>
              <Label>Category Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Vehicle Documents"
              />
            </div>

            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {ICON_OPTIONS.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: id }))}
                    className={`p-2 rounded-lg transition-all ${
                      formData.icon === id 
                        ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                        : "bg-muted/30 hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      formData.color === color ? "scale-110 ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {editingCategory && (
                <Button 
                  variant="outline" 
                  onClick={() => { setEditingCategory(null); resetForm(); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleSave}
                disabled={!formData.name || addMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {editingCategory ? "Update" : "Add Category"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentCategoryManager;
