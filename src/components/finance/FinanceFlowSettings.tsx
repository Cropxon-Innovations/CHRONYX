import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  RefreshCw, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  AlertTriangle,
  Trash2,
  Eye,
  FlaskConical
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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

interface GmailSettings {
  id: string;
  is_enabled: boolean;
  gmail_email: string | null;
  last_sync_at: string | null;
  sync_status: string;
  total_synced_count: number;
}

const FinanceFlowSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<GmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("gmail_sync_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching Gmail settings:", error);
    }
    
    setSettings(data);
    setLoading(false);
  };

  const handleConnectGmail = async () => {
    if (!user) return;
    
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
      
      const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email");
      
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

  const handleSync = async () => {
    if (!user || syncing) return;
    
    setSyncing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("gmail-sync", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const result = response.data;
      
      toast({
        title: "Sync Complete",
        description: `Processed ${result.processed} emails. Imported ${result.imported} new transactions. Found ${result.duplicates} duplicates.`,
      });
      
      fetchSettings();
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync Gmail. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("gmail-disconnect", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setSettings(null);
      setDisconnectDialogOpen(false);
      
      toast({
        title: "Gmail Disconnected",
        description: "Your Gmail account has been disconnected and tokens revoked.",
      });
    } catch (error: any) {
      console.error("Disconnect error:", error);
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect Gmail.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    if (!settings) return <XCircle className="w-4 h-4 text-muted-foreground" />;
    
    switch (settings.sync_status) {
      case "connected":
      case "idle":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "syncing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "error":
      case "token_expired":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
                <Sparkles className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">FinanceFlow AI</CardTitle>
                  <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 border-red-500/30">
                    <FlaskConical className="w-3 h-3 mr-1" />
                    BETA
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Auto-detect purchases from Gmail receipts
                </CardDescription>
              </div>
            </div>
            {settings?.is_enabled && (
              <div className="flex items-center gap-1.5">
                {getStatusIcon()}
                <span className="text-xs text-muted-foreground capitalize">
                  {settings.sync_status === "idle" ? "Connected" : settings.sync_status}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Feature Description */}
          <Alert className="bg-muted/30 border-muted">
            <Eye className="w-4 h-4" />
            <AlertDescription className="text-xs">
              FinanceFlow uses <strong>read-only</strong> Gmail access to detect invoices & receipts. 
              We only store parsed metadata (amount, merchant, date) — never full email content.
            </AlertDescription>
          </Alert>
          
          {/* Connection Status */}
          {!settings?.is_enabled ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Shield className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Privacy First</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Read-only access (gmail.readonly scope)</li>
                    <li>• Only transactional emails are scanned</li>
                    <li>• You can disconnect anytime</li>
                    <li>• Manual entries always take priority</li>
                  </ul>
                </div>
              </div>
              
              <Button 
                onClick={handleConnectGmail} 
                className="w-full gap-2"
                variant="vyom"
              >
                <Mail className="w-4 h-4" />
                Connect Gmail
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Account */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{settings.gmail_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {settings.total_synced_count} transactions imported
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDisconnectDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Last Sync */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last synced</span>
                <span className="font-medium">
                  {settings.last_sync_at 
                    ? format(new Date(settings.last_sync_at), "MMM d, h:mm a")
                    : "Never"
                  }
                </span>
              </div>
              
              <Separator />
              
              {/* Sync Button */}
              <Button 
                onClick={handleSync} 
                disabled={syncing}
                variant="outline"
                className="w-full gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
              
              {/* Token Expired Warning */}
              {settings.sync_status === "token_expired" && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    Gmail access has expired. Please reconnect your account.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Gmail?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke FinanceFlow's access to your Gmail and stop auto-importing transactions.
              Previously imported expenses will remain in your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FinanceFlowSettings;