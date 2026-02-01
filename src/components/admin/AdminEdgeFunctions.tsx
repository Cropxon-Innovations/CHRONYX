import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Zap, Search, RefreshCw, CheckCircle, Clock, 
  ExternalLink, Code, Activity
} from "lucide-react";
import { useDynamicEdgeFunctions } from "@/hooks/useAdminInfrastructure";

const functionCategories: Record<string, string> = {
  "ai-categorize": "AI",
  "analyze-note": "AI",
  "chronyx-bot": "AI",
  "dictionary": "AI",
  "explain-paragraph": "AI",
  "summarize-chapter": "AI",
  "taxyn-chat": "AI",
  "generate-noteflow-ai": "AI",
  "create-razorpay-order": "Payments",
  "razorpay-webhook": "Payments",
  "verify-razorpay-payment": "Payments",
  "send-invoice-email": "Payments",
  "send-payment-receipt": "Payments",
  "send-email-otp": "Auth",
  "send-sms-otp": "Auth",
  "send-password-reset": "Auth",
  "send-welcome-email": "Auth",
  "smart-signin": "Auth",
  "totp-setup": "Auth",
  "webauthn-setup": "Auth",
  "get-google-client-id": "Auth",
  "gmail-oauth-callback": "Gmail",
  "gmail-sync": "Gmail",
  "gmail-disconnect": "Gmail",
  "parse-syllabus": "Study",
  "generate-emi-schedule": "Loans",
  "mark-emi-paid": "Loans",
  "apply-foreclosure": "Loans",
  "apply-part-payment": "Loans",
  "recalc-loan-summary": "Loans",
  "send-emi-reminders": "Loans",
  "auto-link-insurance-expense": "Insurance",
  "send-insurance-reminders": "Insurance",
  "tax-audit": "Tax",
  "tax-calculate": "Tax",
  "tax-compare": "Tax",
  "tax-discover-deductions": "Tax",
  "tax-discover-income": "Tax",
  "tax-full-calculation": "Tax",
  "tax-generate-pdf": "Tax",
  "tax-recommend": "Tax",
  "social-publish": "Social",
  "social-sync": "Social",
  "check-social-profiles": "Social",
  "stock-prices": "Finance",
  "send-financial-report": "Finance",
  "send-weekly-task-summary": "Tasks",
  "send-contact-email": "System",
  "send-admin-message": "System",
  "send-redemption-notification": "System",
  "admin-infrastructure": "System",
};

const AdminEdgeFunctions = () => {
  const { data: edgeFunctions, isLoading, refetch, isRefetching } = useDynamicEdgeFunctions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const functionsList = edgeFunctions || [];
  const categories = [...new Set(Object.values(functionCategories))];

  const filteredFunctions = functionsList.filter(fn => {
    const fnName = typeof fn === 'string' ? fn : fn.name;
    const matchesSearch = fnName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || functionCategories[fnName] === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "AI": "bg-purple-500/10 text-purple-500",
      "Payments": "bg-green-500/10 text-green-500",
      "Auth": "bg-blue-500/10 text-blue-500",
      "Gmail": "bg-red-500/10 text-red-500",
      "Study": "bg-yellow-500/10 text-yellow-500",
      "Loans": "bg-orange-500/10 text-orange-500",
      "Insurance": "bg-cyan-500/10 text-cyan-500",
      "Tax": "bg-indigo-500/10 text-indigo-500",
      "Social": "bg-pink-500/10 text-pink-500",
      "Finance": "bg-emerald-500/10 text-emerald-500",
      "Tasks": "bg-amber-500/10 text-amber-500",
      "System": "bg-gray-500/10 text-gray-500",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{functionsList.length}</p>
                <p className="text-xs text-muted-foreground">Total Functions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{functionsList.length}</p>
                <p className="text-xs text-muted-foreground">Deployed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <Code className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground">All Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All ({functionsList.length})
        </Button>
        {categories.map(category => {
          const count = functionsList.filter(fn => {
            const fnName = typeof fn === 'string' ? fn : fn.name;
            return functionCategories[fnName] === category;
          }).length;
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category} ({count})
            </Button>
          );
        })}
      </div>

      {/* Functions Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Edge Functions
              </CardTitle>
              <CardDescription>
                All deployed serverless functions (dynamic)
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search functions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Function Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Runtime</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFunctions.map((fn) => {
                  const fnName = typeof fn === 'string' ? fn : fn.name;
                  return (
                    <TableRow key={fnName}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <code className="font-mono text-sm">{fnName}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(functionCategories[fnName] || "System")}>
                          {functionCategories[fnName] || "System"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          Deno
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <ExternalLink className="w-3 h-3" />
                          View Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredFunctions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No functions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEdgeFunctions;
