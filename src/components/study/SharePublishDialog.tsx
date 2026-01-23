import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2,
  Globe,
  Lock,
  Copy,
  Check,
  DollarSign,
  Users,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { LibraryItem } from "./LibraryGrid";

interface SharePublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LibraryItem;
  onUpdate: () => void;
}

export const SharePublishDialog = ({
  open,
  onOpenChange,
  item,
  onUpdate,
}: SharePublishDialogProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"share" | "publish">("share");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Share settings
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  const [shareLink, setShareLink] = useState("");
  
  // Publish settings
  const [isPublic, setIsPublic] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");

  const generateShareLink = async () => {
    if (!user || !item) return;
    setIsLoading(true);
    
    try {
      const token = crypto.randomUUID();
      const { error } = await supabase
        .from("library_items")
        .update({
          is_shared: true,
          share_token: token,
        })
        .eq("id", item.id);
      
      if (error) throw error;
      
      const link = `${window.location.origin}/shared/${token}`;
      setShareLink(link);
      setShareEnabled(true);
      toast.success("Share link generated!");
      onUpdate();
    } catch (error) {
      console.error("Error generating share link:", error);
      toast.error("Failed to generate share link");
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard!");
    }
  };

  const revokeShare = async () => {
    if (!user || !item) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("library_items")
        .update({
          is_shared: false,
          share_token: null,
        })
        .eq("id", item.id);
      
      if (error) throw error;
      
      setShareLink("");
      setShareEnabled(false);
      toast.success("Share link revoked");
      onUpdate();
    } catch (error) {
      console.error("Error revoking share:", error);
      toast.error("Failed to revoke share link");
    } finally {
      setIsLoading(false);
    }
  };

  const publishToHub = async () => {
    if (!user || !item) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("library_items")
        .update({
          is_public: true,
          is_paid: isPaid,
          price: isPaid ? parseFloat(price) || 0 : 0,
          category: category,
          notes: description,
        })
        .eq("id", item.id);
      
      if (error) throw error;
      
      setIsPublic(true);
      toast.success("Published to Knowledge Hub! 🎉");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error publishing:", error);
      toast.error("Failed to publish");
    } finally {
      setIsLoading(false);
    }
  };

  const unpublish = async () => {
    if (!user || !item) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("library_items")
        .update({
          is_public: false,
          is_paid: false,
          price: 0,
        })
        .eq("id", item.id);
      
      if (error) throw error;
      
      setIsPublic(false);
      toast.success("Unpublished from Knowledge Hub");
      onUpdate();
    } catch (error) {
      console.error("Error unpublishing:", error);
      toast.error("Failed to unpublish");
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: "technology", label: "Technology" },
    { value: "interview", label: "Interview Prep" },
    { value: "personal", label: "Personal Growth" },
    { value: "education", label: "Education" },
    { value: "business", label: "Business" },
    { value: "creative", label: "Creative Writing" },
    { value: "general", label: "General" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share & Publish
          </DialogTitle>
          <DialogDescription>
            Share privately or publish to the Knowledge Hub
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "share" | "publish")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share" className="gap-2">
              <Lock className="w-4 h-4" />
              Private Share
            </TabsTrigger>
            <TabsTrigger value="publish" className="gap-2">
              <Globe className="w-4 h-4" />
              Publish to Hub
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4 pt-4">
            {/* Share Link Section */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Share Link</span>
                </div>
                {shareEnabled && (
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                )}
              </div>
              
              {shareLink ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={shareLink}
                      readOnly
                      className="bg-background text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyLink}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={revokeShare}
                    className="text-destructive hover:text-destructive"
                    disabled={isLoading}
                  >
                    Revoke Access
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={generateShareLink}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Share2 className="w-4 h-4 mr-2" />
                  )}
                  Generate Share Link
                </Button>
              )}
            </div>

            {/* Share Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Allow download</span>
                </div>
                <Switch
                  checked={allowDownload}
                  onCheckedChange={setAllowDownload}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Apply watermark</span>
                </div>
                <Badge variant="outline" className="text-xs">Always On</Badge>
              </div>
            </div>

            {/* Share with specific user */}
            <div className="space-y-2">
              <Label>Share with specific user (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="bg-card"
                />
                <Button variant="outline" disabled={!shareEmail}>
                  <Users className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="publish" className="space-y-4 pt-4">
            {/* Publish Status */}
            <div className={cn(
              "p-4 rounded-xl border",
              isPublic 
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-muted/30 border-border"
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Knowledge Hub</span>
                </div>
                <Badge variant={isPublic ? "default" : "secondary"}>
                  {isPublic ? "Published" : "Not Published"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPublic 
                  ? "Your book is visible in the Knowledge Hub"
                  : "Make your book discoverable by the community"}
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={category === cat.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(cat.value)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your book..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-card resize-none"
                rows={3}
              />
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Paid content</span>
                </div>
                <Switch
                  checked={isPaid}
                  onCheckedChange={setIsPaid}
                />
              </div>
              
              {isPaid && (
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-card"
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll receive 80% of the sale price
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === "publish" && (
            isPublic ? (
              <Button
                variant="destructive"
                onClick={unpublish}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Unpublish
              </Button>
            ) : (
              <Button
                onClick={publishToHub}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Publish to Hub
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
