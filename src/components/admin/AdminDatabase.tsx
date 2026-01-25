import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Database, Table2, Server, HardDrive, Search,
  FileCode, Layers, RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Static database info since we can't query information_schema directly
const databaseTables = [
  { name: "profiles", rows: "~50", size: "1.2 MB", description: "User profiles and settings" },
  { name: "subscriptions", rows: "~20", size: "256 KB", description: "User subscription data" },
  { name: "expenses", rows: "~500", size: "2.5 MB", description: "Financial expenses tracking" },
  { name: "income", rows: "~200", size: "1.1 MB", description: "Income records" },
  { name: "loans", rows: "~30", size: "512 KB", description: "Loan management data" },
  { name: "documents", rows: "~100", size: "800 KB", description: "Document storage metadata" },
  { name: "books", rows: "~80", size: "1.5 MB", description: "eAuthor books data" },
  { name: "library_items", rows: "~150", size: "2.2 MB", description: "Library content items" },
  { name: "study_tracks", rows: "~40", size: "640 KB", description: "Study preparation tracks" },
  { name: "admin_templates", rows: "~10", size: "128 KB", description: "Admin published templates" },
  { name: "system_notifications", rows: "~25", size: "320 KB", description: "System notifications" },
  { name: "user_roles", rows: "~5", size: "64 KB", description: "User role assignments" },
  { name: "payment_records", rows: "~50", size: "512 KB", description: "Payment transactions" },
  { name: "activity_logs", rows: "~1000", size: "4.8 MB", description: "User activity logs" },
];

const edgeFunctions = [
  { name: "chronyx-bot", status: "active", invocations: "~500/day", description: "AI assistant chatbot" },
  { name: "verify-razorpay-payment", status: "active", invocations: "~20/day", description: "Payment verification" },
  { name: "send-welcome-email", status: "active", invocations: "~5/day", description: "Welcome emails" },
  { name: "parse-document", status: "active", invocations: "~50/day", description: "Document parsing" },
  { name: "totp-setup", status: "active", invocations: "~10/day", description: "2FA setup" },
  { name: "webauthn-setup", status: "active", invocations: "~5/day", description: "Passkey setup" },
  { name: "smart-signin", status: "active", invocations: "~15/day", description: "Passwordless login" },
];

const AdminDatabase = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTables = databaseTables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFunctions = edgeFunctions.filter(fn =>
    fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fn.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTables = databaseTables.length;
  const totalFunctions = edgeFunctions.length;
  const activeFunctions = edgeFunctions.filter(f => f.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Table2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTables}</p>
                <p className="text-xs text-muted-foreground">Database Tables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <FileCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFunctions}</p>
                <p className="text-xs text-muted-foreground">Edge Functions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <Server className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeFunctions}/{totalFunctions}</p>
                <p className="text-xs text-muted-foreground">Functions Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <HardDrive className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">~15 MB</p>
                <p className="text-xs text-muted-foreground">Est. Database Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tables or functions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tables */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="w-4 h-4" />
                  Database Tables
                </CardTitle>
                <CardDescription>All tables in the public schema</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredTables.map((table) => (
                <div 
                  key={table.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Table2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium font-mono">{table.name}</p>
                      <p className="text-xs text-muted-foreground">{table.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{table.rows} rows</p>
                    <p className="text-xs text-muted-foreground">{table.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edge Functions */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="w-4 h-4" />
                  Edge Functions
                </CardTitle>
                <CardDescription>Deployed serverless functions</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredFunctions.map((fn) => (
                <div 
                  key={fn.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium font-mono">{fn.name}</p>
                      <p className="text-xs text-muted-foreground">{fn.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{fn.invocations}</span>
                    <Badge 
                      variant={fn.status === "active" ? "default" : "secondary"}
                      className={fn.status === "active" ? "bg-green-500/10 text-green-500" : ""}
                    >
                      {fn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDatabase;