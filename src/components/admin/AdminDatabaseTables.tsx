import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Database, Search, Table2, Shield, Lock, 
  CheckCircle, AlertTriangle
} from "lucide-react";

// Comprehensive list of database tables organized by module
const databaseTables = {
  "Core": [
    { name: "profiles", hasRLS: true, description: "User profiles and metadata" },
    { name: "user_roles", hasRLS: true, description: "User role assignments" },
    { name: "subscriptions", hasRLS: true, description: "User subscription data" },
    { name: "payment_records", hasRLS: true, description: "Payment transaction records" },
    { name: "billing_addresses", hasRLS: true, description: "User billing addresses" },
    { name: "activity_logs", hasRLS: true, description: "User activity tracking" },
    { name: "login_history", hasRLS: true, description: "User login sessions" },
  ],
  "Admin": [
    { name: "admin_templates", hasRLS: true, description: "Admin published templates" },
    { name: "admin_activity_logs", hasRLS: true, description: "Admin action logs" },
    { name: "system_notifications", hasRLS: true, description: "System-wide notifications" },
    { name: "service_health", hasRLS: true, description: "Service health metrics" },
    { name: "pricing_config", hasRLS: true, description: "Pricing configuration" },
    { name: "platform_analytics", hasRLS: true, description: "Platform analytics data" },
    { name: "feature_usage_stats", hasRLS: true, description: "Feature usage statistics" },
  ],
  "Finance": [
    { name: "expenses", hasRLS: true, description: "User expense records" },
    { name: "income", hasRLS: true, description: "User income records" },
    { name: "budget_limits", hasRLS: true, description: "Budget categories" },
    { name: "loans", hasRLS: true, description: "Loan details" },
    { name: "emi_schedule", hasRLS: true, description: "EMI payment schedule" },
    { name: "emi_events", hasRLS: true, description: "EMI payment events" },
    { name: "investments", hasRLS: true, description: "Investment portfolio" },
    { name: "insurance_policies", hasRLS: true, description: "Insurance policies" },
  ],
  "Tax": [
    { name: "tax_profiles", hasRLS: true, description: "User tax profiles" },
    { name: "tax_calculations", hasRLS: true, description: "Tax calculation results" },
    { name: "tax_documents", hasRLS: true, description: "Tax document uploads" },
    { name: "deduction_rules", hasRLS: false, description: "Tax deduction rules" },
    { name: "taxyn_conversations", hasRLS: true, description: "Tax AI chat history" },
  ],
  "Study": [
    { name: "syllabi", hasRLS: true, description: "Course syllabi" },
    { name: "subjects", hasRLS: true, description: "Subject definitions" },
    { name: "units", hasRLS: true, description: "Study units" },
    { name: "topics", hasRLS: true, description: "Topic details" },
    { name: "study_sessions", hasRLS: true, description: "Study session tracking" },
    { name: "study_notes", hasRLS: true, description: "User study notes" },
    { name: "study_certificates", hasRLS: true, description: "Completion certificates" },
  ],
  "Library": [
    { name: "library_items", hasRLS: true, description: "Library content items" },
    { name: "content_purchases", hasRLS: true, description: "Content purchases" },
    { name: "content_ratings", hasRLS: true, description: "Content ratings" },
    { name: "content_comments", hasRLS: true, description: "Content comments" },
    { name: "chapter_summaries", hasRLS: true, description: "Chapter AI summaries" },
    { name: "creator_payouts", hasRLS: true, description: "Creator earnings" },
  ],
  "eAuthor": [
    { name: "books", hasRLS: true, description: "User authored books" },
    { name: "book_chapters", hasRLS: true, description: "Book chapters" },
    { name: "book_sections", hasRLS: true, description: "Chapter sections" },
    { name: "book_assets", hasRLS: true, description: "Book media assets" },
    { name: "book_reading_progress", hasRLS: true, description: "Reading progress" },
    { name: "book_highlights", hasRLS: true, description: "User highlights" },
    { name: "book_bookmarks", hasRLS: true, description: "User bookmarks" },
  ],
  "Documents": [
    { name: "documents", hasRLS: true, description: "User documents" },
    { name: "document_categories", hasRLS: true, description: "Document categories" },
    { name: "document_shares", hasRLS: true, description: "Document sharing" },
    { name: "education_records", hasRLS: true, description: "Education records" },
    { name: "education_documents", hasRLS: true, description: "Education documents" },
  ],
  "Business": [
    { name: "business_profiles", hasRLS: true, description: "Business profiles" },
    { name: "business_documents", hasRLS: true, description: "Business documents" },
    { name: "business_links", hasRLS: true, description: "Business social links" },
    { name: "invoices", hasRLS: true, description: "Business invoices" },
  ],
  "Social": [
    { name: "social_accounts", hasRLS: true, description: "Connected social accounts" },
    { name: "social_posts", hasRLS: true, description: "Scheduled social posts" },
    { name: "content_shares", hasRLS: true, description: "Content share links" },
  ],
  "Gamification": [
    { name: "user_rewards", hasRLS: true, description: "User reward points" },
    { name: "rewards_transactions", hasRLS: true, description: "Points transactions" },
    { name: "achievements", hasRLS: true, description: "User achievements" },
    { name: "daily_badges", hasRLS: true, description: "Daily activity badges" },
  ],
  "Auth & Security": [
    { name: "user_2fa", hasRLS: true, description: "2FA settings" },
    { name: "webauthn_credentials", hasRLS: true, description: "WebAuthn keys" },
    { name: "auth_challenges", hasRLS: true, description: "Auth challenges" },
    { name: "email_verification_tokens", hasRLS: true, description: "Email verification" },
    { name: "error_logs", hasRLS: true, description: "System error logs" },
  ],
  "Usage & Tracking": [
    { name: "usage_tracking", hasRLS: true, description: "Feature usage tracking" },
    { name: "plan_limits", hasRLS: false, description: "Plan usage limits" },
    { name: "ai_parsing_logs", hasRLS: true, description: "AI parsing history" },
    { name: "ai_category_patterns", hasRLS: true, description: "AI learned patterns" },
    { name: "auto_imported_transactions", hasRLS: true, description: "Gmail auto-imports" },
  ],
};

const AdminDatabaseTables = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const allTables = Object.entries(databaseTables).flatMap(([module, tables]) =>
    tables.map(t => ({ ...t, module }))
  );

  const totalTables = allTables.length;
  const tablesWithRLS = allTables.filter(t => t.hasRLS).length;
  const modules = Object.keys(databaseTables);

  const filteredTables = allTables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = !selectedModule || table.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTables}</p>
                <p className="text-xs text-muted-foreground">Total Tables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tablesWithRLS}</p>
                <p className="text-xs text-muted-foreground">With RLS</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <Table2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{modules.length}</p>
                <p className="text-xs text-muted-foreground">Modules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <CheckCircle className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground">All Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Filter */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedModule === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedModule(null)}
          >
            All ({totalTables})
          </Button>
          {modules.map(module => {
            const count = databaseTables[module as keyof typeof databaseTables].length;
            return (
              <Button
                key={module}
                variant={selectedModule === module ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedModule(module)}
                className="whitespace-nowrap"
              >
                {module} ({count})
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Tables List */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Tables
              </CardTitle>
              <CardDescription>
                All database tables organized by module
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>RLS Status</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table) => (
                  <TableRow key={table.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Table2 className="w-4 h-4 text-muted-foreground" />
                        <code className="font-mono text-sm">{table.name}</code>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {table.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{table.module}</Badge>
                    </TableCell>
                    <TableCell>
                      {table.hasRLS ? (
                        <Badge className="bg-green-500/10 text-green-600 gap-1">
                          <Lock className="w-3 h-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-600 gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Public
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDatabaseTables;
