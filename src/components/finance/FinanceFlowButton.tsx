import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail, Loader2, FlaskConical } from "lucide-react";
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
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      checkConnection();
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
        className="gap-2 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5"
      >
        <Sparkles className="w-4 h-4 text-red-500" />
        <span>FinanceFlow AI</span>
        <Badge variant="outline" className="text-[9px] py-0 px-1 bg-red-500/10 text-red-500 border-red-500/30">
          <FlaskConical className="w-2.5 h-2.5 mr-0.5" />
          BETA
        </Badge>
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
