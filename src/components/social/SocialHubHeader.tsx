import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plug,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  Zap,
} from "lucide-react";
import type { SocialIntegration, SocialDraft, PublishQueueItem } from "./SocialHubTypes";

interface SocialHubHeaderProps {
  integrations: SocialIntegration[];
  drafts: SocialDraft[];
  queueItems: PublishQueueItem[];
}

export const SocialHubHeader = ({
  integrations,
  drafts,
  queueItems,
}: SocialHubHeaderProps) => {
  const connectedCount = integrations.filter((i) => i.status === "connected").length;
  const pendingApprovalCount = drafts.filter((d) => d.status === "pending_approval").length;
  const scheduledCount = drafts.filter((d) => d.status === "scheduled").length;
  const publishedCount = queueItems.filter((q) => q.status === "completed").length;

  const stats = [
    {
      label: "Connected",
      value: connectedCount,
      icon: Plug,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      label: "Pending Approval",
      value: pendingApprovalCount,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Scheduled",
      value: scheduledCount,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Published",
      value: publishedCount,
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
  ];

  return (
    <div className="mb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border p-6 md:p-8 mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Social Hub
              </h1>
              <p className="text-muted-foreground text-sm">
                Automated Social Publishing Platform
              </p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground max-w-2xl">
            Connect your social accounts, compose posts, schedule publishing, and manage everything from one place. 
            Cross-post to multiple platforms with a single click.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`${stat.bgColor} ${stat.borderColor} border`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
