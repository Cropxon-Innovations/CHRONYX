import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MoreVertical,
  Send,
  Calendar,
  FileText,
  AlertCircle,
  Trash2,
  Edit,
  Image as ImageIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { getPlatformIcon, getPlatformColor } from "./PlatformIcons";
import type { SocialDraft, PlatformConfig } from "./SocialHubTypes";

interface ApprovalQueueProps {
  drafts: SocialDraft[];
  platformConfigs: PlatformConfig[];
  onApprove: (draftId: string) => void;
  onReject: (draftId: string, reason: string) => void;
  onDelete: (draftId: string) => void;
  onEdit: (draft: SocialDraft) => void;
  onPreview: (draft: SocialDraft) => void;
  isProcessing?: boolean;
}

export const ApprovalQueue = ({
  drafts,
  platformConfigs,
  onApprove,
  onReject,
  onDelete,
  onEdit,
  onPreview,
  isProcessing = false,
}: ApprovalQueueProps) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingDrafts = drafts.filter((d) => d.status === "pending_approval");
  const approvedDrafts = drafts.filter((d) => d.status === "approved" || d.status === "scheduled");
  const otherDrafts = drafts.filter(
    (d) => !["pending_approval", "approved", "scheduled"].includes(d.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            <Calendar className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      case "published":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <Send className="h-3 w-3 mr-1" />
            Published
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <FileText className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
    }
  };

  const handleReject = () => {
    if (selectedDraftId) {
      onReject(selectedDraftId, rejectReason);
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedDraftId(null);
    }
  };

  const renderDraftCard = (draft: SocialDraft) => (
    <Card key={draft.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(draft.status)}
              {draft.scheduled_at && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(draft.scheduled_at), "MMM d, h:mm a")}
                </span>
              )}
            </div>

            {/* Content preview */}
            <p className="text-sm line-clamp-3 mb-2">{draft.content_text}</p>

            {/* Target platforms */}
            <div className="flex flex-wrap gap-1 mb-2">
              {draft.target_platforms.map((platform) => {
                const Icon = getPlatformIcon(platform);
                const color = getPlatformColor(platform);
                const config = platformConfigs.find((c) => c.platform === platform);
                return (
                  <Badge key={platform} variant="secondary" className="text-xs gap-1">
                    <Icon className="h-3 w-3" style={{ color }} />
                    {config?.display_name || platform}
                  </Badge>
                );
              })}
            </div>

            {/* Media indicator */}
            {draft.media_attachments.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {draft.media_attachments.length} media attached
              </span>
            )}

            {/* Rejection reason */}
            {draft.rejection_reason && (
              <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Rejected: {draft.rejection_reason}
              </div>
            )}

            {/* Timestamps */}
            <p className="text-xs text-muted-foreground mt-2">
              Created {formatDistanceToNow(new Date(draft.created_at), { addSuffix: true })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {draft.status === "pending_approval" && (
              <>
                <Button
                  size="sm"
                  onClick={() => onApprove(draft.id)}
                  disabled={isProcessing}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedDraftId(draft.id);
                    setRejectDialogOpen(true);
                  }}
                  disabled={isProcessing}
                  className="text-destructive border-destructive/50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => onPreview(draft)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(draft)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(draft.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Pending Approval */}
      {pendingDrafts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Approval ({pendingDrafts.length})
          </h3>
          <ScrollArea className="h-[300px]">
            {pendingDrafts.map(renderDraftCard)}
          </ScrollArea>
        </div>
      )}

      {/* Approved/Scheduled */}
      {approvedDrafts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Ready to Publish ({approvedDrafts.length})
          </h3>
          <ScrollArea className="h-[200px]">
            {approvedDrafts.map(renderDraftCard)}
          </ScrollArea>
        </div>
      )}

      {/* Other drafts */}
      {otherDrafts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Other ({otherDrafts.length})
          </h3>
          <ScrollArea className="h-[200px]">
            {otherDrafts.map(renderDraftCard)}
          </ScrollArea>
        </div>
      )}

      {drafts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="font-medium">No drafts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a post to see it here for approval
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Post</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
