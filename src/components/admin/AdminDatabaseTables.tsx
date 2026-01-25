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
  CheckCircle, AlertTriangle, RefreshCw
} from "lucide-react";
import { useInfrastructureStats } from "@/hooks/useAdminData";

// Complete list of all 179 database tables organized by module
const databaseTables: Record<string, { name: string; hasRLS: boolean; description: string }[]> = {
  "Core": [
    { name: "profiles", hasRLS: true, description: "User profiles and metadata" },
    { name: "user_roles", hasRLS: true, description: "User role assignments" },
    { name: "subscriptions", hasRLS: true, description: "User subscription data" },
    { name: "payment_records", hasRLS: true, description: "Payment transaction records" },
    { name: "payment_history", hasRLS: true, description: "Payment history log" },
    { name: "payment_events", hasRLS: true, description: "Payment webhook events" },
    { name: "billing_addresses", hasRLS: true, description: "User billing addresses" },
    { name: "activity_logs", hasRLS: true, description: "User activity tracking" },
    { name: "login_history", hasRLS: true, description: "User login sessions" },
    { name: "notes", hasRLS: true, description: "User notes" },
    { name: "todos", hasRLS: true, description: "User todos" },
  ],
  "Admin": [
    { name: "admin_templates", hasRLS: true, description: "Admin published templates" },
    { name: "admin_activity_logs", hasRLS: true, description: "Admin action logs" },
    { name: "system_notifications", hasRLS: true, description: "System-wide notifications" },
    { name: "user_notification_status", hasRLS: true, description: "User notification read status" },
    { name: "service_health", hasRLS: true, description: "Service health metrics" },
    { name: "pricing_config", hasRLS: true, description: "Pricing configuration" },
    { name: "platform_analytics", hasRLS: true, description: "Platform analytics data" },
    { name: "feature_usage_stats", hasRLS: true, description: "Feature usage statistics" },
    { name: "plan_limits", hasRLS: false, description: "Plan usage limits" },
    { name: "error_logs", hasRLS: true, description: "System error logs" },
  ],
  "Finance": [
    { name: "expenses", hasRLS: true, description: "User expense records" },
    { name: "expense_categories", hasRLS: true, description: "Expense categories" },
    { name: "income_entries", hasRLS: true, description: "User income records" },
    { name: "income_sources", hasRLS: true, description: "Income sources" },
    { name: "income_components", hasRLS: true, description: "Income components" },
    { name: "budget_limits", hasRLS: true, description: "Budget categories" },
    { name: "savings_goals", hasRLS: true, description: "Savings goals" },
    { name: "financial_goals", hasRLS: true, description: "Financial goals" },
    { name: "goal_contributions", hasRLS: true, description: "Goal contributions" },
    { name: "goal_milestones", hasRLS: true, description: "Goal milestones" },
    { name: "custom_banks", hasRLS: true, description: "Custom bank accounts" },
    { name: "invoices", hasRLS: true, description: "User invoices" },
    { name: "salary_records", hasRLS: true, description: "Salary records" },
  ],
  "Loans & EMI": [
    { name: "loans", hasRLS: true, description: "Loan details" },
    { name: "loan_documents", hasRLS: true, description: "Loan documents" },
    { name: "emi_schedule", hasRLS: true, description: "EMI payment schedule" },
    { name: "emi_events", hasRLS: true, description: "EMI payment events" },
    { name: "emi_reminders", hasRLS: true, description: "EMI reminders" },
  ],
  "Insurance": [
    { name: "insurances", hasRLS: true, description: "Insurance policies" },
    { name: "insurance_documents", hasRLS: true, description: "Insurance documents" },
    { name: "insurance_claims", hasRLS: true, description: "Insurance claims" },
    { name: "insurance_claim_documents", hasRLS: true, description: "Claim documents" },
    { name: "insurance_reminders", hasRLS: true, description: "Premium reminders" },
    { name: "insurance_providers", hasRLS: false, description: "Insurance providers" },
    { name: "insurance_provider_categories", hasRLS: false, description: "Provider categories" },
  ],
  "Investments": [
    { name: "stock_holdings", hasRLS: true, description: "Stock portfolio" },
    { name: "user_assets", hasRLS: true, description: "User assets" },
  ],
  "Tax": [
    { name: "tax_profiles", hasRLS: true, description: "User tax profiles" },
    { name: "tax_computations", hasRLS: true, description: "Tax computations" },
    { name: "tax_deductions", hasRLS: true, description: "Tax deductions" },
    { name: "tax_documents", hasRLS: true, description: "Tax document uploads" },
    { name: "tax_filings", hasRLS: true, description: "Tax filing records" },
    { name: "tax_audit_log", hasRLS: true, description: "Tax audit logs" },
    { name: "tax_slabs", hasRLS: false, description: "Tax slabs" },
    { name: "deduction_rules", hasRLS: false, description: "Tax deduction rules" },
    { name: "exemption_rules", hasRLS: false, description: "Tax exemption rules" },
    { name: "nyaya_chat_history", hasRLS: true, description: "Tax AI chat history" },
  ],
  "Study": [
    { name: "study_subjects", hasRLS: true, description: "Study subjects" },
    { name: "study_chapters", hasRLS: true, description: "Study chapters" },
    { name: "study_modules", hasRLS: true, description: "Study modules" },
    { name: "study_logs", hasRLS: true, description: "Study session tracking" },
    { name: "study_goals", hasRLS: true, description: "Study goals" },
    { name: "study_certificates", hasRLS: true, description: "Completion certificates" },
    { name: "study_leaderboard", hasRLS: true, description: "Study leaderboard" },
    { name: "study_explanations", hasRLS: true, description: "AI explanations" },
    { name: "study_exam_categories", hasRLS: true, description: "Exam categories" },
    { name: "study_exam_templates", hasRLS: true, description: "Exam templates" },
    { name: "study_template_drafts", hasRLS: true, description: "Template drafts" },
    { name: "study_template_stages", hasRLS: true, description: "Template stages" },
    { name: "study_user_subscriptions", hasRLS: true, description: "User template subscriptions" },
    { name: "study_user_topic_progress", hasRLS: true, description: "Topic progress" },
    { name: "user_study_templates", hasRLS: true, description: "User study templates" },
    { name: "subject_colors", hasRLS: true, description: "Subject color preferences" },
    { name: "nova_study_chats", hasRLS: true, description: "Nova AI chats" },
    { name: "nova_study_messages", hasRLS: true, description: "Nova AI messages" },
  ],
  "Syllabus": [
    { name: "syllabus_topics", hasRLS: true, description: "Syllabus topics" },
    { name: "syllabus_modules", hasRLS: true, description: "Syllabus modules" },
    { name: "syllabus_phases", hasRLS: true, description: "Syllabus phases" },
    { name: "syllabus_documents", hasRLS: true, description: "Syllabus documents" },
    { name: "syllabus_attachments", hasRLS: true, description: "Syllabus attachments" },
  ],
  "Exams": [
    { name: "exam_master", hasRLS: true, description: "Exam master data" },
    { name: "exam_syllabus", hasRLS: true, description: "Exam syllabi" },
    { name: "exam_pattern", hasRLS: true, description: "Exam patterns" },
    { name: "exam_cutoffs", hasRLS: true, description: "Exam cutoffs" },
    { name: "exam_toppers", hasRLS: true, description: "Exam toppers" },
    { name: "exam_pyq", hasRLS: true, description: "Previous year questions" },
    { name: "exam_pyq_attempts", hasRLS: true, description: "PYQ attempts" },
    { name: "exam_notes", hasRLS: true, description: "Exam notes" },
    { name: "exam_study_schedule", hasRLS: true, description: "Study schedules" },
  ],
  "Technical Careers": [
    { name: "tech_career_tracks", hasRLS: true, description: "Career tracks" },
    { name: "tech_career_modules", hasRLS: true, description: "Career modules" },
    { name: "tech_career_topics", hasRLS: true, description: "Career topics" },
    { name: "tech_career_resources", hasRLS: true, description: "Learning resources" },
    { name: "tech_career_progress", hasRLS: true, description: "Career progress" },
    { name: "tech_career_readiness", hasRLS: true, description: "Readiness scores" },
    { name: "tech_projects", hasRLS: true, description: "User projects" },
    { name: "task_templates", hasRLS: true, description: "Task templates" },
  ],
  "Library": [
    { name: "library_items", hasRLS: true, description: "Library content items" },
    { name: "library_bookmarks", hasRLS: true, description: "Library bookmarks" },
    { name: "library_highlights", hasRLS: true, description: "Library highlights" },
    { name: "library_purchases", hasRLS: true, description: "Library purchases" },
    { name: "library_shares", hasRLS: true, description: "Library shares" },
    { name: "content_purchases", hasRLS: true, description: "Content purchases" },
    { name: "content_ratings", hasRLS: true, description: "Content ratings" },
    { name: "content_comments", hasRLS: true, description: "Content comments" },
    { name: "content_shares", hasRLS: true, description: "Content sharing" },
    { name: "chapter_summaries", hasRLS: true, description: "Chapter AI summaries" },
    { name: "reading_state", hasRLS: true, description: "Reading state" },
    { name: "reading_sessions", hasRLS: true, description: "Reading sessions" },
    { name: "reading_highlights", hasRLS: true, description: "Reading highlights" },
    { name: "vocabulary_items", hasRLS: true, description: "Vocabulary items" },
    { name: "creator_payouts", hasRLS: true, description: "Creator earnings" },
    { name: "creator_payment_settings", hasRLS: true, description: "Creator payment settings" },
  ],
  "eAuthor": [
    { name: "books", hasRLS: true, description: "User authored books" },
    { name: "book_chapters", hasRLS: true, description: "Book chapters" },
    { name: "book_sections", hasRLS: true, description: "Chapter sections" },
    { name: "book_assets", hasRLS: true, description: "Book media assets" },
    { name: "book_reading_progress", hasRLS: true, description: "Reading progress" },
    { name: "book_reading_analytics", hasRLS: true, description: "Reading analytics" },
    { name: "book_highlights", hasRLS: true, description: "User highlights" },
    { name: "book_bookmarks", hasRLS: true, description: "User bookmarks" },
    { name: "book_comments", hasRLS: true, description: "Book comments" },
    { name: "book_chapter_versions", hasRLS: true, description: "Chapter versions" },
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
    { name: "business_links", hasRLS: true, description: "Business links" },
  ],
  "Family": [
    { name: "family_members", hasRLS: true, description: "Family members" },
    { name: "family_documents", hasRLS: true, description: "Family documents" },
    { name: "family_tree_exports", hasRLS: true, description: "Family tree exports" },
    { name: "family_audit_log", hasRLS: true, description: "Family audit log" },
  ],
  "Memories": [
    { name: "memories", hasRLS: true, description: "User memories" },
    { name: "memory_folders", hasRLS: true, description: "Memory folders" },
    { name: "memory_collections", hasRLS: true, description: "Memory collections" },
  ],
  "Social": [
    { name: "social_profiles", hasRLS: true, description: "Social profiles" },
    { name: "social_posts", hasRLS: true, description: "Social posts" },
    { name: "social_drafts", hasRLS: true, description: "Social drafts" },
    { name: "social_publish_queue", hasRLS: true, description: "Publish queue" },
    { name: "social_published", hasRLS: true, description: "Published content" },
    { name: "social_integrations", hasRLS: true, description: "Social integrations" },
    { name: "social_platform_config", hasRLS: false, description: "Platform config" },
  ],
  "Gmail Integration": [
    { name: "gmail_sync_settings", hasRLS: true, description: "Gmail sync settings" },
    { name: "gmail_import_logs", hasRLS: true, description: "Gmail import logs" },
    { name: "auto_imported_transactions", hasRLS: true, description: "Auto-imported transactions" },
    { name: "financeflow_sync_history", hasRLS: true, description: "Sync history" },
    { name: "financeflow_corrections", hasRLS: true, description: "Corrections" },
    { name: "finance_report_subscriptions", hasRLS: true, description: "Report subscriptions" },
  ],
  "AI & Usage": [
    { name: "ai_parsing_logs", hasRLS: true, description: "AI parsing history" },
    { name: "ai_category_patterns", hasRLS: true, description: "AI learned patterns" },
    { name: "usage_tracking", hasRLS: true, description: "Feature usage tracking" },
  ],
  "Rewards & Achievements": [
    { name: "achievements", hasRLS: true, description: "User achievements" },
    { name: "daily_badges", hasRLS: true, description: "Daily activity badges" },
    { name: "user_rewards", hasRLS: true, description: "User reward points" },
    { name: "rewards_transactions", hasRLS: true, description: "Rewards transactions" },
    { name: "redemption_requests", hasRLS: true, description: "Redemption requests" },
  ],
  "Auth & Security": [
    { name: "user_2fa", hasRLS: true, description: "2FA settings" },
    { name: "webauthn_credentials", hasRLS: true, description: "WebAuthn keys" },
    { name: "auth_challenges", hasRLS: true, description: "Auth challenges" },
    { name: "email_verification_tokens", hasRLS: true, description: "Email verification" },
    { name: "password_reset_tokens", hasRLS: true, description: "Password reset tokens" },
  ],
};

const AdminDatabaseTables = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const { data: infraStats, refetch, isRefetching } = useInfrastructureStats();

  const allTables = Object.entries(databaseTables).flatMap(([module, tables]) =>
    tables.map(t => ({ ...t, module }))
  );

  // Use actual count from infrastructure or fallback to local list
  const totalTables = infraStats?.databaseTables || allTables.length;
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
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Shield className="w-5 h-5 text-emerald-500" />
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
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allTables.filter(t => !t.hasRLS).length}</p>
                <p className="text-xs text-muted-foreground">Without RLS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Tables
              </CardTitle>
              <CardDescription>
                All {totalTables} tables organized by module
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Module Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!selectedModule ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedModule(null)}
            >
              All
            </Button>
            {modules.map(module => (
              <Button
                key={module}
                variant={selectedModule === module ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedModule(module)}
              >
                {module}
              </Button>
            ))}
          </div>

          {/* Tables List */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>RLS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table, idx) => (
                  <TableRow key={`${table.module}-${table.name}-${idx}`}>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {table.name}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{table.module}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {table.description}
                    </TableCell>
                    <TableCell>
                      {table.hasRLS ? (
                        <Badge className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredTables.length} of {allTables.length} documented tables
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDatabaseTables;
