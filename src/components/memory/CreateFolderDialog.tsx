import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { FolderPlus, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { FolderIconPicker, getIconByName, getColorConfig, FOLDER_COLORS } from "./FolderIconPicker";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (data: { name: string; color: string; icon: string }) => void;
  isLoading?: boolean;
  parentFolderName?: string;
}

export const CreateFolderDialog = ({
  open,
  onOpenChange,
  onCreateFolder,
  isLoading = false,
  parentFolderName,
}: CreateFolderDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].bg);
  const [selectedIcon, setSelectedIcon] = useState("Default");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFolderName("");
      setSelectedColor(FOLDER_COLORS[0].bg);
      setSelectedIcon("Default");
    }
  }, [open]);

  const handleCreate = () => {
    if (folderName.trim()) {
      onCreateFolder({
        name: folderName.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });
    }
  };

  const isEmoji = selectedIcon.startsWith("emoji:");
  const colorConfig = getColorConfig(selectedColor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-primary" />
            {parentFolderName ? `Create Subfolder in "${parentFolderName}"` : "Create New Folder"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          {/* Folder Name */}
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-sm font-medium">
              Folder Name
            </Label>
            <Input
              ref={inputRef}
              id="folder-name"
              placeholder="Enter folder name..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && folderName.trim()) {
                  handleCreate();
                }
              }}
            />
          </div>

          {/* Icon & Color Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Appearance</Label>
            <FolderIconPicker
              selectedIcon={selectedIcon}
              selectedColor={selectedColor}
              onIconChange={setSelectedIcon}
              onColorChange={setSelectedColor}
            />
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Preview
            </Label>
            <Card className={cn(
              "transition-all duration-300",
              colorConfig.bg,
              colorConfig.border,
              "border"
            )}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-background/60 flex items-center justify-center",
                  colorConfig.border
                )}>
                  {isEmoji ? (
                    <span className="text-2xl">{selectedIcon.replace("emoji:", "")}</span>
                  ) : (
                    (() => {
                      const PreviewIcon = getIconByName(selectedIcon);
                      return <PreviewIcon className={cn("w-6 h-6", colorConfig.text)} />;
                    })()
                  )}
                </div>
                <div>
                  <span className="text-base font-medium block">
                    {folderName || "Folder Name"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {colorConfig.name} • {isEmoji ? "Emoji" : selectedIcon}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!folderName.trim() || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>Creating...</>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Folder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Trigger button component for convenience
export const CreateFolderButton = ({ 
  onClick, 
  variant = "default",
  size = "default",
  className 
}: { 
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) => {
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={onClick}
      className={className}
    >
      <FolderPlus className="w-4 h-4 mr-2" />
      Create Folder
    </Button>
  );
};
