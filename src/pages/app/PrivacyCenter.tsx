import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Database,
  Cloud,
  FileText,
  Image,
  CreditCard,
  Heart,
  Users,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Trash2,
  Download,
  Clock,
  Key,
  Smartphone,
  Globe,
  AlertCircle,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DataConnection {
  id: string;
  name: string;
  icon: any;
  status: 'connected' | 'disconnected' | 'error';
  description: string;
  lastAccessed?: string;
  dataStored: string;
  permissions: string[];
  canRevoke: boolean;
}

interface DataCategory {
  id: string;
  name: string;
  icon: any;
  count: number;
  lastUpdated?: string;
  encrypted: boolean;
}

const PrivacyCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [dataCategories, setDataCategories] = useState<DataCategory[]>([]);
  const [gmailSettings, setGmailSettings] = useState<any>(null);

  useEffect(() => {
    if (user) fetchPrivacyData();
  }, [user]);

  const fetchPrivacyData = async () => {
    if (!user) return;
    
    try {
      // Fetch Gmail sync settings
      const { data: gmail } = await supabase
        .from("gmail_sync_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setGmailSettings(gmail);

      // Fetch data counts
      const [
        expenses,
        income,
        documents,
        memories,
        notes,
        loans,
        insurances,
        familyMembers,
        libraryItems,
        todos,
      ] = await Promise.all([
        supabase.from("expenses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("income_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("memories").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("loans").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("insurances").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("family_members").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("library_items").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("todos").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      // Set connections
      const connectionsList: DataConnection[] = [
        {
          id: "gmail",
          name: "Gmail (FinanceFlow)",
          icon: Mail,
          status: gmail?.is_enabled ? 'connected' : 'disconnected',
          description: "Read-only access to transaction emails",
          lastAccessed: gmail?.last_sync_at,
          dataStored: `${gmail?.total_synced_count || 0} transactions synced`,
          permissions: ["Read emails (read-only)", "Search emails"],
          canRevoke: true,
        },
      ];

      // Set data categories
      const categories: DataCategory[] = [
        { id: "expenses", name: "Expenses", icon: CreditCard, count: expenses.count || 0, encrypted: false },
        { id: "income", name: "Income", icon: CreditCard, count: income.count || 0, encrypted: false },
        { id: "documents", name: "Documents", icon: FileText, count: documents.count || 0, encrypted: true },
        { id: "memories", name: "Memories", icon: Image, count: memories.count || 0, encrypted: false },
        { id: "notes", name: "Notes", icon: FileText, count: notes.count || 0, encrypted: false },
        { id: "loans", name: "Loans & EMI", icon: CreditCard, count: loans.count || 0, encrypted: false },
        { id: "insurance", name: "Insurance", icon: Heart, count: insurances.count || 0, encrypted: false },
        { id: "family", name: "Family Tree", icon: Users, count: familyMembers.count || 0, encrypted: false },
        { id: "library", name: "Library", icon: FileText, count: libraryItems.count || 0, encrypted: false },
        { id: "todos", name: "Tasks", icon: FileText, count: todos.count || 0, encrypted: false },
      ];

      setConnections(connectionsList);
      setDataCategories(categories);
    } catch (error) {
      console.error("Error fetching privacy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("gmail-disconnect", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast({
        title: "Gmail Disconnected",
        description: "Your Gmail connection has been revoked.",
      });

      fetchPrivacyData();
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Gmail. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalDataPoints = dataCategories.reduce((sum, cat) => sum + cat.count, 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Privacy & Data Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete transparency over your data and permissions
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export All Data
        </Button>
      </div>

      {/* Trust Banner */}
      <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/10">
              <Lock className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Your Data is Protected</h3>
              <p className="text-sm text-muted-foreground">
                All data is encrypted, stored securely, and never shared with third parties.
                You have full control over what Chronyx can access.
              </p>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              <Lock className="w-3 h-3 mr-1" />
              Secure
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Connected Services
            </CardTitle>
            <CardDescription>
              External services that have access to your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connections.map((conn) => {
              const Icon = conn.icon;
              
              return (
                <div
                  key={conn.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    conn.status === 'connected' 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-muted/30 border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        conn.status === 'connected' ? "bg-emerald-500/10" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          conn.status === 'connected' ? "text-emerald-500" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{conn.name}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] h-5",
                              conn.status === 'connected' 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                                : "text-muted-foreground"
                            )}
                          >
                            {conn.status === 'connected' ? (
                              <><CheckCircle2 className="w-3 h-3 mr-1" />Connected</>
                            ) : 'Disconnected'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{conn.description}</p>
                        
                        {conn.status === 'connected' && (
                          <>
                            <div className="mt-3 space-y-1">
                              <p className="text-xs text-muted-foreground">Permissions granted:</p>
                              <div className="flex flex-wrap gap-1">
                                {conn.permissions.map((perm, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                                    {perm}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Database className="w-3 h-3" />
                                {conn.dataStored}
                              </span>
                              {conn.lastAccessed && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Last: {formatDistanceToNow(new Date(conn.lastAccessed), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {conn.canRevoke && conn.status === 'connected' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will disconnect {conn.name} from Chronyx. Your synced data will be preserved, 
                              but new data will not be imported.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDisconnectGmail}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke Access
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}

            {connections.filter(c => c.status === 'disconnected').length === connections.length && (
              <div className="text-center py-6 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No external services connected</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Stored */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              Your Data in Chronyx
            </CardTitle>
            <CardDescription>
              Overview of all data stored in your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total Data Points</span>
                <span className="text-lg font-bold text-primary">{totalDataPoints.toLocaleString()}</span>
              </div>
              <Progress value={Math.min((totalDataPoints / 10000) * 100, 100)} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Free tier: 10,000 data points
              </p>
            </div>

            <ScrollArea className="h-[280px] pr-2">
              <div className="space-y-2">
                {dataCategories.map((cat) => {
                  const Icon = cat.icon;
                  
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat.encrypted && (
                              <span className="inline-flex items-center gap-1 text-emerald-500">
                                <Lock className="w-3 h-3" />
                                Encrypted
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {cat.count.toLocaleString()}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Biometric Login</p>
                  <p className="text-xs text-muted-foreground">Use fingerprint or face ID</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Session Timeout</p>
                  <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">30 min</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Data Deletion</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can request complete deletion of your account and all associated data. 
                    This action is irreversible.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    Request Account Deletion
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">Data Retention Policy</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Active data is retained indefinitely while account is active</li>
                <li>• Deleted items are removed within 30 days</li>
                <li>• Backups are retained for 90 days</li>
                <li>• Analytics data is anonymized after 1 year</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyCenter;
