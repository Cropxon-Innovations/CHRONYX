import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow } from "date-fns";

interface SyncHistoryItem {
  id: string;
  sync_type: string;
  emails_scanned: number;
  transactions_found: number;
  duplicates_detected: number;
  imported_count: number;
  sync_duration_ms: number | null;
  error_message: string | null;
  status: string;
  created_at: string;
}

const SyncHistoryList = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("financeflow_sync_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "partial":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "partial":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No sync history yet
      </div>
    );
  }

  const displayHistory = expanded ? history : history.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">
          Sync History
        </h4>
        {history.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 text-xs gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show All ({history.length})
              </>
            )}
          </Button>
        )}
      </div>

      <ScrollArea className={expanded ? "h-[300px]" : ""}>
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {displayHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5">
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">
                      {format(new Date(item.created_at), "MMM d, h:mm a")}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px]">
                      {item.sync_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {item.emails_scanned} scanned
                    </span>
                    <span>•</span>
                    <span>{item.transactions_found} found</span>
                    <span>•</span>
                    <span className="text-emerald-500">+{item.imported_count} imported</span>
                    {item.duplicates_detected > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-500">{item.duplicates_detected} duplicates</span>
                      </>
                    )}
                  </div>
                  {item.error_message && (
                    <p className="text-[11px] text-destructive mt-1 truncate">
                      {item.error_message}
                    </p>
                  )}
                  {item.sync_duration_ms && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Completed in {(item.sync_duration_ms / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};

export default SyncHistoryList;
