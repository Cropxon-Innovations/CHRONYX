import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import FinanceFlowPreviewDialog from "./FinanceFlowPreviewDialog";

interface FinanceFlowButtonProps {
  onImportComplete?: () => void;
}

const FinanceFlowButton = ({ onImportComplete }: FinanceFlowButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user) {
      checkConnection();
      fetchPendingCount();
    }
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("gmail_sync_settings")
      .select("is_enabled")
      .eq("user_id", user.id)
      .single();
    
    setIsConnected(data?.is_enabled || false);
    setLoading(false);
  };

  const fetchPendingCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from("auto_imported_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_processed", false)
      .eq("is_duplicate", false);
    
    setPendingCount(count || 0);
  };

  const handleClick = async () => {
    if (!user) return;

    if (isConnected) {
      // Show preview dialog
      setShowPreview(true);
    } else {
      // Connect Gmail
      await connectGmail();
    }
  };

  const connectGmail = async () => {
    try {
      // Get client ID from edge function
      const { data, error } = await supabase.functions.invoke("get-google-client-id");
      
      if (error || !data?.client_id) {
        toast({
          title: "Configuration Error",
          description: "Google OAuth is not configured. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      const clientId = data.client_id;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const redirectUri = `${supabaseUrl}/functions/v1/gmail-oauth-callback`;
      const state = btoa(JSON.stringify({ user_id: user.id }));
      
      const scope = encodeURIComponent(
        "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email"
      );
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error("OAuth error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate Gmail connection.",
        variant: "destructive",
      });
    }
  };

  const handleImportComplete = () => {
    setShowPreview(false);
    setPendingCount(0);
    onImportComplete?.();
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleClick}
        className="relative gap-2 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5 overflow-hidden"
      >
        {/* Pulse animation when there are pending items */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-red-500 rounded-md"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <Sparkles className="w-4 h-4 text-red-500" />
        <span>FinanceFlow AI</span>
        <Badge variant="outline" className="text-[9px] py-0 px-1 bg-red-500/10 text-red-500 border-red-500/30">
          <FlaskConical className="w-2.5 h-2.5 mr-0.5" />
          BETA
        </Badge>
        
        {/* Pending count badge */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1.5 -right-1.5"
            >
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      <FinanceFlowPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        onImportComplete={handleImportComplete}
      />
    </>
  );
};

export default FinanceFlowButton;
