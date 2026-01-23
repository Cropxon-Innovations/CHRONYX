import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, UserPlus, Edit2, FileText, Shield, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FamilyAuditLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  "Added member": UserPlus,
  "Updated member": Edit2,
  "Deleted member": Trash2,
  "Uploaded document": FileText,
  "Verified member": Shield,
};

export const FamilyAuditLog = ({ open, onOpenChange }: FamilyAuditLogProps) => {
  const { user } = useAuth();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["family-audit-log", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("family_audit_log")
        .select("*, family_members(full_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!user?.id,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Log
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted animate-pulse h-16" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => {
                const Icon = ACTION_ICONS[log.action] || Clock;
                
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {log.action}
                        </p>
                        {log.family_members?.full_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {log.family_members.full_name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
