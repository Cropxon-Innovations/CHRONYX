import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FolderPlus, Check, Sparkles, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { FolderIconPicker, getIconByName, getColorConfig, FOLDER_COLORS } from "./FolderIconPicker";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (data: { name: string; color: string; icon: string; isLocked?: boolean; password?: string }) => void;
  isLoading?: boolean;
  parentFolderName?: string;
  existingFolderNames?: string[];
}

// Default dark slate color (index 1 = Slate)
const DEFAULT_COLOR = FOLDER_COLORS[1]?.bg || "bg-slate-500/20";

export const CreateFolderDialog = ({
  open,
  onOpenChange,
  onCreateFolder,
  isLoading = false,
  parentFolderName,
  existingFolderNames = [],
}: CreateFolderDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [selectedIcon, setSelectedIcon] = useState("Default");
  const [enableLock, setEnableLock] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setSelectedColor(DEFAULT_COLOR);
      setSelectedIcon("Default");
      setEnableLock(false);
      setLockPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    }
  }, [open]);

  // Check for duplicate folder name
  const isDuplicateName = existingFolderNames.some(
    name => name.toLowerCase().trim() === folderName.toLowerCase().trim()
  );

  const handleCreate = () => {
    if (folderName.trim() && !isDuplicateName) {
      if (enableLock && lockPassword !== confirmPassword) {
        return; // Passwords don't match
      }
      onCreateFolder({
        name: folderName.trim(),
        color: selectedColor,
        icon: selectedIcon,
        isLocked: enableLock,
        password: enableLock ? lockPassword : undefined,
      });
    }
  };

  const isEmoji = selectedIcon.startsWith("emoji:");
  const colorConfig = getColorConfig(selectedColor);
  const passwordsMatch = !enableLock || (lockPassword === confirmPassword && lockPassword.length >= 4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              className={cn("text-base", isDuplicateName && "border-destructive")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && folderName.trim() && passwordsMatch && !isDuplicateName) {
                  handleCreate();
                }
              }}
            />
            {isDuplicateName && (
              <p className="text-xs text-destructive">A folder with this name already exists</p>
            )}
          </div>

          {/* Icon & Color Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Appearance (Optional)</Label>
            <FolderIconPicker
              selectedIcon={selectedIcon}
              selectedColor={selectedColor}
              onIconChange={setSelectedIcon}
              onColorChange={setSelectedColor}
            />
          </div>

          {/* Lock Folder Option */}
          <div className="space-y-3 p-3 rounded-lg bg-accent/20 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {enableLock ? (
                  <Lock className="w-4 h-4 text-amber-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-muted-foreground" />
                )}
                <Label htmlFor="enable-lock" className="text-sm font-medium cursor-pointer">
                  Lock this folder
                </Label>
              </div>
              <Switch
                id="enable-lock"
                checked={enableLock}
                onCheckedChange={setEnableLock}
              />
            </div>
            
            {enableLock && (
              <div className="space-y-3 pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Set Password (min 4 characters)</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password..."
                      value={lockPassword}
                      onChange={(e) => setLockPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Confirm Password</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {lockPassword && confirmPassword && lockPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords don't match</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview - Clean Mac-style folder only */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Preview
            </Label>
            <div className="flex justify-center py-4">
              {/* Mac-style folder - no background box */}
              <div className="relative w-[100px]">
                {/* Folder tab */}
                <div 
                  className="absolute top-0 left-2 w-10 h-4 rounded-t-lg"
                  style={{
                    background: `linear-gradient(180deg, ${colorConfig.hex} 0%, ${colorConfig.hex}cc 100%)`,
                  }}
                />
                
                {/* Folder body */}
                <div 
                  className="relative mt-3 rounded-xl overflow-hidden"
                  style={{
                    background: `linear-gradient(160deg, ${colorConfig.hex} 0%, ${colorConfig.hex}dd 40%, ${colorConfig.hex}bb 100%)`,
                    boxShadow: `0 4px 12px ${colorConfig.hex}40, inset 0 1px 0 ${colorConfig.hex}40`,
                  }}
                >
                  {/* Folder front flap effect */}
                  <div 
                    className="absolute inset-x-0 top-0 h-3 rounded-t-xl"
                    style={{
                      background: `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)`,
                    }}
                  />
                  
                  <div className="p-4 pt-5 flex flex-col items-center gap-2">
                    {/* Icon */}
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        "bg-white/20 backdrop-blur-sm",
                        enableLock && "blur-[2px]"
                      )}
                    >
                      {isEmoji ? (
                        <span className="text-2xl select-none">{selectedIcon.replace("emoji:", "")}</span>
                      ) : (
                        (() => {
                          const PreviewIcon = getIconByName(selectedIcon);
                          return <PreviewIcon className="w-5 h-5 text-white/90" />;
                        })()
                      )}
                    </div>
                  </div>
                  
                  {/* Lock overlay in preview */}
                  {enableLock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-amber-500/30 border border-amber-400/60 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-amber-300" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Folder name below */}
                <p className={cn(
                  "text-xs font-medium text-center mt-2 truncate",
                  enableLock && "opacity-70"
                )}>
                  {folderName || "Folder Name"}
                </p>
              </div>
            </div>
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
            disabled={!folderName.trim() || isLoading || !passwordsMatch || isDuplicateName}
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
