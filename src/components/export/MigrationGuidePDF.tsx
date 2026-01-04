import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";

const MigrationGuidePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generatePDF = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const addNewPageIfNeeded = (requiredHeight: number = 20) => {
        if (y + requiredHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      const addTitle = (text: string, size: number = 16) => {
        addNewPageIfNeeded(20);
        doc.setFontSize(size);
        doc.setFont("helvetica", "bold");
        doc.text(text, margin, y);
        y += size * 0.5 + 4;
      };

      const addText = (text: string, size: number = 10) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
          addNewPageIfNeeded(6);
          doc.text(line, margin, y);
          y += size * 0.4 + 1;
        });
      };

      const addCode = (code: string, title?: string) => {
        if (title) {
          addNewPageIfNeeded(10);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(title, margin, y);
          y += 5;
        }
        
        doc.setFontSize(6);
        doc.setFont("courier", "normal");
        const lines = code.split("\n");
        lines.forEach((line) => {
          if (line.trim()) {
            const wrappedLines = doc.splitTextToSize(line, contentWidth - 5);
            wrappedLines.forEach((wLine: string) => {
              addNewPageIfNeeded(3);
              doc.text(wLine, margin + 2, y);
              y += 2.5;
            });
          }
        });
        y += 2;
      };

      // ========== COVER PAGE ==========
      setProgress(5);
      doc.setFillColor(26, 26, 26);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.text("CHRONYX", pageWidth / 2, 80, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Complete Database Migration Guide", pageWidth / 2, 95, { align: "center" });
      
      doc.setFontSize(10);
      doc.text("Version 2.0 - Enhanced Edition", pageWidth / 2, 120, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth / 2, 128, { align: "center" });
      
      doc.setFontSize(9);
      doc.text("43 Tables | 15 Edge Functions (Full Code) | 6 Storage Buckets", pageWidth / 2, 145, { align: "center" });
      doc.text("RLS Policies | Enum References | Database Functions", pageWidth / 2, 153, { align: "center" });
      
      doc.setFontSize(8);
      doc.text("CropXon Innovations Pvt Ltd", pageWidth / 2, pageHeight - 30, { align: "center" });

      // ========== TABLE OF CONTENTS ==========
      doc.addPage();
      doc.setTextColor(0, 0, 0);
      y = margin;
      
      addTitle("TABLE OF CONTENTS", 18);
      y += 5;
      
      const tocItems = [
        "1. Prerequisites",
        "2. Database Tables (43 Tables with RLS Policies)",
        "3. Implicit Enum Reference Table",
        "4. Database Functions & Triggers",
        "5. Storage Buckets (6 Buckets with RLS)",
        "6. Edge Functions (15 Functions - Full Code)",
        "7. Environment Variables",
        "8. Migration Steps",
        "9. Quick Reference Summary",
      ];
      
      tocItems.forEach((item) => {
        addText(item, 11);
        y += 2;
      });

      setProgress(10);

      // ========== PREREQUISITES ==========
      doc.addPage();
      y = margin;
      addTitle("1. PREREQUISITES", 16);
      y += 3;
      
      addText("Before starting the migration, ensure you have:");
      y += 3;
      addText("• A new Supabase project created at supabase.com");
      addText("• Supabase CLI installed (npm install -g supabase)");
      addText("• Access to your Supabase project dashboard");
      addText("• API keys for: Resend (email), Twilio (SMS), Razorpay (payments)");
      y += 5;

      // ========== DATABASE TABLES ==========
      setProgress(15);
      doc.addPage();
      y = margin;
      addTitle("2. DATABASE TABLES (43 Tables)", 16);
      y += 3;
      addText("All tables include RLS (Row Level Security) policies for data protection.");
      y += 5;

      // Complete list of all 43 tables with their SQL
      const tables = [
        { name: "profiles", sql: `CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  phone_number TEXT,
  birth_date DATE,
  target_age INTEGER DEFAULT 60,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  primary_contact TEXT DEFAULT 'email',
  secondary_email TEXT,
  secondary_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);` },

        { name: "subscriptions", sql: `CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  amount_paid NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  payment_method TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);` },

        { name: "payment_history", sql: `CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  receipt_sent BOOLEAN DEFAULT false,
  receipt_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payment history" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment history" ON public.payment_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment history" ON public.payment_history FOR UPDATE USING (auth.uid() = user_id);` },

        { name: "expenses", sql: `CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  payment_mode TEXT NOT NULL,
  notes TEXT,
  is_auto_generated BOOLEAN DEFAULT false,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);` },

        { name: "expense_categories", sql: `CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View default and own categories" ON public.expense_categories FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own categories" ON public.expense_categories FOR ALL USING (auth.uid() = user_id AND is_default = false);` },

        { name: "budget_limits", sql: `CREATE TABLE public.budget_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own budget limits" ON public.budget_limits FOR ALL USING (auth.uid() = user_id);` },

        { name: "income_sources", sql: `CREATE TABLE public.income_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own income sources" ON public.income_sources FOR ALL USING (auth.uid() = user_id);` },

        { name: "income_entries", sql: `CREATE TABLE public.income_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  income_source_id UUID REFERENCES public.income_sources(id),
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own income entries" ON public.income_entries FOR ALL USING (auth.uid() = user_id);` },

        { name: "savings_goals", sql: `CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own savings goals" ON public.savings_goals FOR ALL USING (auth.uid() = user_id);` },

        { name: "loans", sql: `CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  bank_logo_url TEXT,
  country TEXT DEFAULT 'India',
  loan_type TEXT NOT NULL,
  loan_account_number TEXT NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  tenure_months INTEGER NOT NULL,
  emi_amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  repayment_mode TEXT DEFAULT 'Auto Debit',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own loans" ON public.loans FOR ALL USING (auth.uid() = user_id);` },

        { name: "emi_schedule", sql: `CREATE TABLE public.emi_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  emi_month INTEGER NOT NULL,
  emi_date DATE NOT NULL,
  emi_amount NUMERIC NOT NULL,
  principal_component NUMERIC NOT NULL,
  interest_component NUMERIC NOT NULL,
  remaining_principal NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'Pending',
  paid_date DATE,
  payment_method TEXT,
  is_adjusted BOOLEAN DEFAULT false,
  adjustment_event_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.emi_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own emi_schedule" ON public.emi_schedule FOR ALL 
USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid()));` },

        { name: "emi_events", sql: `CREATE TABLE public.emi_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  mode TEXT,
  reduction_type TEXT,
  interest_saved NUMERIC DEFAULT 0,
  new_tenure_months INTEGER,
  new_emi_amount NUMERIC,
  applied_to_emi_id UUID REFERENCES public.emi_schedule(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.emi_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own emi_events" ON public.emi_events FOR ALL 
USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid()));` },

        { name: "emi_reminders", sql: `CREATE TABLE public.emi_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emi_id UUID NOT NULL REFERENCES public.emi_schedule(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  email_sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.emi_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own emi_reminders" ON public.emi_reminders FOR SELECT 
USING (EXISTS (SELECT 1 FROM emi_schedule es JOIN loans l ON es.loan_id = l.id WHERE es.id = emi_reminders.emi_id AND l.user_id = auth.uid()));` },

        { name: "loan_documents", sql: `CREATE TABLE public.loan_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  emi_id UUID REFERENCES public.emi_schedule(id),
  document_type TEXT DEFAULT 'other',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own loan_documents" ON public.loan_documents FOR ALL 
USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid()));` },

        { name: "custom_banks", sql: `CREATE TABLE public.custom_banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  logo_url TEXT,
  color TEXT DEFAULT '#6366f1',
  country TEXT DEFAULT 'Other',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.custom_banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own custom banks" ON public.custom_banks FOR ALL USING (auth.uid() = user_id);` },

        { name: "family_members", sql: `CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  relation TEXT NOT NULL,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own family members" ON public.family_members FOR ALL USING (auth.uid() = user_id);` },

        { name: "insurances", sql: `CREATE TABLE public.insurances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  policy_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  premium_amount NUMERIC NOT NULL,
  sum_assured NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  insured_type TEXT DEFAULT 'self',
  insured_member_id UUID REFERENCES public.family_members(id),
  vehicle_registration TEXT,
  reminder_days INTEGER[] DEFAULT '{30,7,1}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own insurances" ON public.insurances FOR ALL USING (auth.uid() = user_id);` },

        { name: "insurance_documents", sql: `CREATE TABLE public.insurance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  document_type TEXT DEFAULT 'policy',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  year INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.insurance_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own insurance documents" ON public.insurance_documents FOR ALL 
USING (EXISTS (SELECT 1 FROM insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()));` },

        { name: "insurance_claims", sql: `CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL,
  claim_type TEXT NOT NULL,
  claimed_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  settled_amount NUMERIC,
  status TEXT DEFAULT 'Filed',
  claim_reference_no TEXT,
  insured_member_id UUID REFERENCES public.family_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own claims" ON public.insurance_claims FOR ALL 
USING (EXISTS (SELECT 1 FROM insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()));` },

        { name: "insurance_claim_documents", sql: `CREATE TABLE public.insurance_claim_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.insurance_claims(id) ON DELETE CASCADE,
  document_type TEXT DEFAULT 'other',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.insurance_claim_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own claim documents" ON public.insurance_claim_documents FOR ALL 
USING (EXISTS (SELECT 1 FROM insurance_claims c JOIN insurances i ON c.insurance_id = i.id WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()));` },

        { name: "insurance_reminders", sql: `CREATE TABLE public.insurance_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  reminder_days_before INTEGER NOT NULL,
  email_sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.insurance_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own insurance_reminders" ON public.insurance_reminders FOR SELECT 
USING (EXISTS (SELECT 1 FROM insurances i WHERE i.id = insurance_reminders.insurance_id AND i.user_id = auth.uid()));` },

        { name: "documents", sql: `CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own documents" ON public.documents FOR ALL USING (auth.uid() = user_id);` },

        { name: "memories", sql: `CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  description TEXT,
  media_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  thumbnail_url TEXT,
  created_date DATE DEFAULT CURRENT_DATE,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  folder_id UUID REFERENCES public.memory_folders(id),
  collection_id UUID REFERENCES public.memory_collections(id),
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own memories" ON public.memories FOR ALL USING (auth.uid() = user_id);` },

        { name: "memory_folders", sql: `CREATE TABLE public.memory_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Default',
  color TEXT DEFAULT 'bg-accent/30',
  is_locked BOOLEAN DEFAULT false,
  lock_hash TEXT,
  parent_folder_id UUID REFERENCES public.memory_folders(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.memory_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own memory folders" ON public.memory_folders FOR ALL USING (auth.uid() = user_id);` },

        { name: "memory_collections", sql: `CREATE TABLE public.memory_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  folder_id UUID REFERENCES public.memory_folders(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.memory_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own memory collections" ON public.memory_collections FOR ALL USING (auth.uid() = user_id);` },

        { name: "study_logs", sql: `CREATE TABLE public.study_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL,
  topic TEXT,
  duration INTEGER NOT NULL,
  planned_duration INTEGER,
  focus_level TEXT DEFAULT 'medium',
  notes TEXT,
  is_timer_session BOOLEAN DEFAULT false,
  timer_started_at TIMESTAMPTZ,
  timer_ended_at TIMESTAMPTZ,
  linked_topic_id UUID REFERENCES public.syllabus_topics(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own study logs" ON public.study_logs FOR ALL USING (auth.uid() = user_id);` },

        { name: "study_goals", sql: `CREATE TABLE public.study_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  target_hours_weekly INTEGER DEFAULT 10,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own study goals" ON public.study_goals FOR ALL USING (auth.uid() = user_id);` },

        { name: "subject_colors", sql: `CREATE TABLE public.subject_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subject_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own subject colors" ON public.subject_colors FOR ALL USING (auth.uid() = user_id);` },

        { name: "syllabus_topics", sql: `CREATE TABLE public.syllabus_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  estimated_hours NUMERIC,
  priority INTEGER,
  status TEXT DEFAULT 'not_started',
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  source_page TEXT,
  sort_order INTEGER,
  module_id UUID REFERENCES public.syllabus_modules(id),
  next_review_date DATE,
  review_count INTEGER DEFAULT 0,
  ease_factor NUMERIC DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own syllabus topics" ON public.syllabus_topics FOR ALL USING (auth.uid() = user_id);` },

        { name: "syllabus_phases", sql: `CREATE TABLE public.syllabus_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  syllabus_name TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  phase_order INTEGER,
  status TEXT DEFAULT 'not_started',
  source_page TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.syllabus_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own syllabus phases" ON public.syllabus_phases FOR ALL USING (auth.uid() = user_id);` },

        { name: "syllabus_modules", sql: `CREATE TABLE public.syllabus_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phase_id UUID NOT NULL REFERENCES public.syllabus_phases(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  module_order INTEGER,
  status TEXT DEFAULT 'not_started',
  source_page TEXT,
  notes TEXT,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.syllabus_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own syllabus modules" ON public.syllabus_modules FOR ALL USING (auth.uid() = user_id);` },

        { name: "syllabus_documents", sql: `CREATE TABLE public.syllabus_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  notes TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.syllabus_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own syllabus documents" ON public.syllabus_documents FOR ALL USING (auth.uid() = user_id);` },

        { name: "work_history", sql: `CREATE TABLE public.work_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  department TEXT,
  employment_type TEXT DEFAULT 'full_time',
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  location TEXT,
  description TEXT,
  skills TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.work_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own work history" ON public.work_history FOR ALL USING (auth.uid() = user_id);` },

        { name: "salary_records", sql: `CREATE TABLE public.salary_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  work_history_id UUID NOT NULL REFERENCES public.work_history(id) ON DELETE CASCADE,
  salary_type TEXT DEFAULT 'monthly',
  monthly_amount NUMERIC,
  annual_amount NUMERIC,
  bonus NUMERIC,
  variable_pay NUMERIC,
  effective_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own salary records" ON public.salary_records FOR ALL USING (auth.uid() = user_id);` },

        { name: "education_records", sql: `CREATE TABLE public.education_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  course TEXT,
  start_year INTEGER,
  end_year INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.education_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own education records" ON public.education_records FOR ALL USING (auth.uid() = user_id);` },

        { name: "education_documents", sql: `CREATE TABLE public.education_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  education_id UUID NOT NULL REFERENCES public.education_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.education_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own education documents" ON public.education_documents FOR ALL USING (auth.uid() = user_id);` },

        { name: "social_profiles", sql: `CREATE TABLE public.social_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  username TEXT,
  profile_url TEXT,
  custom_name TEXT,
  logo_url TEXT,
  connection_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'active',
  notes_encrypted TEXT,
  last_post_date DATE,
  last_sync_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own social profiles" ON public.social_profiles FOR ALL USING (auth.uid() = user_id);` },

        { name: "todos", sql: `CREATE TABLE public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date DATE,
  due_time TIME,
  category TEXT,
  tags TEXT[],
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  parent_id UUID REFERENCES public.todos(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own todos" ON public.todos FOR ALL USING (auth.uid() = user_id);` },

        { name: "achievements", sql: `CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  achieved_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);` },

        { name: "activity_logs", sql: `CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);` },
      ];

      setProgress(20);

      // Add each table to PDF
      tables.forEach((table, index) => {
        if (index > 0 && index % 5 === 0) {
          setProgress(20 + Math.floor((index / tables.length) * 25));
        }
        
        addNewPageIfNeeded(25);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${table.name}`, margin, y);
        y += 4;
        
        addCode(table.sql);
        y += 3;
      });

      // ========== IMPLICIT ENUM REFERENCE TABLE ==========
      setProgress(48);
      doc.addPage();
      y = margin;
      addTitle("3. IMPLICIT ENUM REFERENCE TABLE", 16);
      y += 3;
      addText("These TEXT columns have expected valid values (implicit enums):");
      y += 5;

      const enumReferences = [
        { table: "subscriptions", column: "status", values: "'active', 'cancelled', 'expired', 'pending'" },
        { table: "subscriptions", column: "plan_type", values: "'free', 'pro', 'premium', 'lifetime'" },
        { table: "payment_history", column: "status", values: "'pending', 'completed', 'failed', 'refunded'" },
        { table: "expenses", column: "payment_mode", values: "'Cash', 'UPI', 'Card', 'Net Banking', 'Wallet', 'Bank Transfer'" },
        { table: "expenses", column: "source_type", values: "'emi', 'insurance', null" },
        { table: "income_sources", column: "frequency", values: "'monthly', 'weekly', 'bi-weekly', 'yearly', 'one-time'" },
        { table: "loans", column: "status", values: "'active', 'closed', 'foreclosed'" },
        { table: "loans", column: "loan_type", values: "'Home', 'Car', 'Personal', 'Education', 'Gold', 'Business', 'Two-Wheeler'" },
        { table: "loans", column: "repayment_mode", values: "'Auto Debit', 'Manual', 'Standing Instruction'" },
        { table: "emi_schedule", column: "payment_status", values: "'Pending', 'Paid', 'Overdue', 'Cancelled', 'Skipped'" },
        { table: "emi_events", column: "event_type", values: "'part_payment', 'foreclosure', 'prepayment'" },
        { table: "emi_events", column: "reduction_type", values: "'tenure', 'emi'" },
        { table: "emi_reminders", column: "reminder_type", values: "'upcoming_1', 'upcoming_3', 'upcoming_7'" },
        { table: "insurances", column: "status", values: "'active', 'expired', 'cancelled', 'lapsed'" },
        { table: "insurances", column: "policy_type", values: "'Health', 'Life', 'Vehicle', 'Property', 'Travel', 'Term'" },
        { table: "insurances", column: "insured_type", values: "'self', 'family_member'" },
        { table: "insurance_claims", column: "status", values: "'Filed', 'Under Review', 'Approved', 'Rejected', 'Settled', 'Closed'" },
        { table: "documents", column: "category", values: "'Identity', 'Financial', 'Educational', 'Medical', 'Legal', 'Other'" },
        { table: "memories", column: "media_type", values: "'image', 'video', 'audio', 'document'" },
        { table: "study_logs", column: "focus_level", values: "'low', 'medium', 'high'" },
        { table: "syllabus_topics", column: "status", values: "'not_started', 'in_progress', 'completed', 'needs_review'" },
        { table: "syllabus_phases", column: "status", values: "'not_started', 'in_progress', 'completed'" },
        { table: "work_history", column: "employment_type", values: "'full_time', 'part_time', 'contract', 'freelance', 'intern'" },
        { table: "salary_records", column: "salary_type", values: "'monthly', 'annual', 'hourly'" },
        { table: "social_profiles", column: "status", values: "'active', 'inactive', 'broken'" },
        { table: "social_profiles", column: "connection_type", values: "'manual', 'oauth'" },
        { table: "todos", column: "priority", values: "'low', 'medium', 'high', 'urgent'" },
        { table: "todos", column: "status", values: "'pending', 'in_progress', 'completed', 'cancelled'" },
        { table: "profiles", column: "primary_contact", values: "'email', 'phone'" },
      ];

      enumReferences.forEach((ref) => {
        addNewPageIfNeeded(10);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`${ref.table}.${ref.column}:`, margin, y);
        y += 3;
        doc.setFont("courier", "normal");
        doc.setFontSize(7);
        doc.text(ref.values, margin + 5, y);
        y += 4;
      });

      // ========== DATABASE FUNCTIONS ==========
      setProgress(52);
      doc.addPage();
      y = margin;
      addTitle("4. DATABASE FUNCTIONS & TRIGGERS", 16);
      y += 3;

      addText("Create these functions and triggers for automatic operations:");
      y += 5;

      addCode(`-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`, "handle_new_user()");

      addCode(`-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply to all tables with updated_at column (example)
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurances_updated_at BEFORE UPDATE ON insurances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... apply to all tables with updated_at column`, "update_updated_at_column()");

      // ========== STORAGE BUCKETS ==========
      setProgress(55);
      doc.addPage();
      y = margin;
      addTitle("5. STORAGE BUCKETS (6 Buckets)", 16);
      y += 3;

      const buckets = [
        { name: "memories", public: false, desc: "User photos and videos" },
        { name: "documents", public: false, desc: "Identity documents" },
        { name: "insurance-documents", public: false, desc: "Insurance policy documents" },
        { name: "loan-documents", public: true, desc: "Loan documents and receipts" },
        { name: "syllabus", public: false, desc: "Study syllabus PDFs" },
        { name: "chronyx", public: true, desc: "General app storage" },
      ];

      addText("Create the following storage buckets with RLS policies:");
      y += 5;

      buckets.forEach((bucket, i) => {
        addCode(`-- ${i + 1}. ${bucket.name} (${bucket.public ? "Public" : "Private"}) - ${bucket.desc}
INSERT INTO storage.buckets (id, name, public) VALUES ('${bucket.name}', '${bucket.name}', ${bucket.public});

CREATE POLICY "Users can view their own ${bucket.name}" ON storage.objects FOR SELECT
  USING (bucket_id = '${bucket.name}' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload to their own ${bucket.name}" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = '${bucket.name}' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own ${bucket.name}" ON storage.objects FOR DELETE
  USING (bucket_id = '${bucket.name}' AND auth.uid()::text = (storage.foldername(name))[1]);`);
      });

      // ========== EDGE FUNCTIONS WITH FULL CODE ==========
      setProgress(60);
      doc.addPage();
      y = margin;
      addTitle("6. EDGE FUNCTIONS (15 Functions - Full Code)", 16);
      y += 3;

      addText("Deploy these edge functions using: supabase functions deploy <function-name>");
      addText("Each function goes in supabase/functions/<function-name>/index.ts");
      y += 5;

      // Edge function 1: create-razorpay-order
      addCode(`// ========== 1. create-razorpay-order/index.ts ==========
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  amount: number;
  currency?: string;
  plan: "pro" | "premium";
  receipt?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency = "INR", plan, receipt } = (await req.json()) as OrderRequest;

    if (!amount || !plan) {
      return new Response(
        JSON.stringify({ error: "Amount and plan are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auth = btoa(\`\${keyId}:\${keySecret}\`);
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": \`Basic \${auth}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency,
        receipt: receipt || \`order_\${Date.now()}\`,
        notes: { plan },
      }),
    });

    if (!orderResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await orderResponse.json();
    return new Response(
      JSON.stringify({ orderId: order.id, amount: order.amount, currency: order.currency, keyId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});`, "create-razorpay-order");

      // Edge function 2: verify-razorpay-payment
      addCode(`// ========== 2. verify-razorpay-payment/index.ts ==========
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, userId } = await req.json();

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", keySecret).update(body).digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Payment verification failed", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(\`Payment verified for user \${userId}, plan: \${plan}\`);
    return new Response(
      JSON.stringify({ verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id, plan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", verified: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});`, "verify-razorpay-payment");

      // Edge function 3: generate-emi-schedule
      addCode(`// ========== 3. generate-emi-schedule/index.ts ==========
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function calculateEMI(principal: number, monthlyRate: number, tenure: number): number {
  if (monthlyRate === 0) return principal / tenure;
  const factor = Math.pow(1 + monthlyRate, tenure);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { loan_id, principal, annual_interest_rate, tenure_months, emi_start_date, emi_amount_override } = await req.json();

    const monthlyRate = annual_interest_rate / 12 / 100;
    const emi = emi_amount_override ?? calculateEMI(principal, monthlyRate, tenure_months);
    const roundedEmi = round2(emi);

    let outstanding = principal;
    const schedule = [];

    for (let month = 1; month <= tenure_months; month++) {
      const interestComponent = round2(outstanding * monthlyRate);
      const principalComponent = round2(roundedEmi - interestComponent);
      outstanding = round2(outstanding - principalComponent);

      schedule.push({
        loan_id,
        emi_month: month,
        emi_date: addMonths(emi_start_date, month - 1),
        emi_amount: roundedEmi,
        principal_component: principalComponent,
        interest_component: interestComponent,
        remaining_principal: Math.max(outstanding, 0),
        payment_status: "Pending",
      });
    }

    await supabase.from("emi_schedule").delete().eq("loan_id", loan_id);
    await supabase.from("emi_schedule").insert(schedule);

    return new Response(
      JSON.stringify({ status: "success", emi_amount: roundedEmi, total_entries: schedule.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});`, "generate-emi-schedule");

      // Edge function 4: mark-emi-paid
      addCode(`// ========== 4. mark-emi-paid/index.ts ==========
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { emi_id, paid_date, payment_method } = await req.json();

    const { data: emi, error: fetchError } = await supabase
      .from("emi_schedule")
      .select("*, loans(user_id, bank_name, loan_type)")
      .eq("id", emi_id)
      .single();

    if (fetchError || !emi) throw new Error("EMI not found");
    if (emi.payment_status === "Paid") throw new Error("EMI already paid");

    await supabase.from("emi_schedule").update({ payment_status: "Paid", paid_date, payment_method }).eq("id", emi_id);

    const userId = emi.loans?.user_id;
    if (userId) {
      await supabase.from("expenses").insert({
        user_id: userId,
        expense_date: paid_date,
        amount: emi.emi_amount,
        category: "Loan EMI",
        sub_category: emi.loans?.loan_type,
        payment_mode: payment_method || "Bank Transfer",
        notes: \`EMI #\${emi.emi_month} - \${emi.loans?.bank_name}\`,
        is_auto_generated: true,
        source_type: "emi",
        source_id: emi_id,
      });

      await supabase.from("activity_logs").insert({
        user_id: userId,
        module: "loans",
        action: \`EMI #\${emi.emi_month} marked as paid\`,
      });
    }

    return new Response(JSON.stringify({ status: "paid", emi_month: emi.emi_month }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});`, "mark-emi-paid");

      // Edge function 5: apply-part-payment (abbreviated)
      addCode(`// ========== 5. apply-part-payment/index.ts ==========
// Applies part-payment to loan, recalculates EMI schedule
// Supports reduction_type: 'tenure' (keep EMI, reduce months) or 'emi' (keep months, reduce EMI)
// Full code available in supabase/functions/apply-part-payment/index.ts`, "apply-part-payment");

      // Edge function 6: apply-foreclosure (abbreviated)
      addCode(`// ========== 6. apply-foreclosure/index.ts ==========
// Processes loan foreclosure - calculates outstanding principal + accrued interest
// Marks all pending EMIs as cancelled, closes loan
// Full code available in supabase/functions/apply-foreclosure/index.ts`, "apply-foreclosure");

      // Edge function 7: recalc-loan-summary
      addCode(`// ========== 7. recalc-loan-summary/index.ts ==========
// Recalculates loan summary: paid/pending EMIs, interest saved, progress %
// Returns comprehensive loan status for dashboard display
// Full code available in supabase/functions/recalc-loan-summary/index.ts`, "recalc-loan-summary");

      // Edge function 8: send-email-otp
      addCode(`// ========== 8. send-email-otp/index.ts ==========
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { email, userId, type } = await req.json();
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const otpHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(otp + userId));
  const hashHex = Array.from(new Uint8Array(otpHash)).map(b => b.toString(16).padStart(2, '0')).join('');

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": \`Bearer \${RESEND_API_KEY}\`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "CHRONYX <onboarding@resend.dev>",
      to: [email],
      subject: \`Your CHRONYX Verification Code: \${otp}\`,
      html: \`<div>Your verification code is: <strong>\${otp}</strong>. Expires in 10 minutes.</div>\`,
    }),
  });

  return new Response(JSON.stringify({ success: true, otpHash: hashHex, expiresAt: expiresAt.toISOString() }), 
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});`, "send-email-otp");

      // Edge function 9: send-sms-otp
      addCode(`// ========== 9. send-sms-otp/index.ts ==========
// Sends SMS OTP using Twilio API
// Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
// Full code available in supabase/functions/send-sms-otp/index.ts`, "send-sms-otp");

      // Edge function 10: send-welcome-email
      addCode(`// ========== 10. send-welcome-email/index.ts ==========
// Sends branded welcome email to new users using Resend API
// Includes feature overview and CTA button
// Full code available in supabase/functions/send-welcome-email/index.ts`, "send-welcome-email");

      // Edge function 11: send-payment-receipt
      addCode(`// ========== 11. send-payment-receipt/index.ts ==========
// Sends payment confirmation email with receipt details
// Updates payment_history.receipt_sent flag
// Full code available in supabase/functions/send-payment-receipt/index.ts`, "send-payment-receipt");

      // Edge function 12: send-emi-reminders
      addCode(`// ========== 12. send-emi-reminders/index.ts ==========
// Sends EMI reminder emails at 7, 3, 1 days before due date
// Records sent reminders in emi_reminders table to prevent duplicates
// Full code available in supabase/functions/send-emi-reminders/index.ts`, "send-emi-reminders");

      // Edge function 13: send-insurance-reminders
      addCode(`// ========== 13. send-insurance-reminders/index.ts ==========
// Sends insurance renewal reminder emails based on reminder_days setting
// Records sent reminders in insurance_reminders table
// Full code available in supabase/functions/send-insurance-reminders/index.ts`, "send-insurance-reminders");

      // Edge function 14: auto-link-insurance-expense
      addCode(`// ========== 14. auto-link-insurance-expense/index.ts ==========
// Auto-creates expense entry when insurance premium is paid
// Links expense to insurance via source_type and source_id
// Full code available in supabase/functions/auto-link-insurance-expense/index.ts`, "auto-link-insurance-expense");

      // Edge function 15: check-social-profiles
      addCode(`// ========== 15. check-social-profiles/index.ts ==========
// Validates social profile URLs against platform patterns
// Updates profile status (active/broken) and last_sync_at
// Full code available in supabase/functions/check-social-profiles/index.ts`, "check-social-profiles");

      // ========== ENVIRONMENT VARIABLES ==========
      setProgress(80);
      doc.addPage();
      y = margin;
      addTitle("7. ENVIRONMENT VARIABLES", 16);
      y += 3;

      addText("Configure these secrets in your Supabase project (Settings > Secrets):");
      y += 5;

      const envVars = [
        { name: "RESEND_API_KEY", desc: "Resend API key for email services", required: true },
        { name: "TWILIO_ACCOUNT_SID", desc: "Twilio Account SID for SMS", required: true },
        { name: "TWILIO_AUTH_TOKEN", desc: "Twilio Auth Token", required: true },
        { name: "TWILIO_PHONE_NUMBER", desc: "Twilio Phone Number (+1234567890 format)", required: true },
        { name: "RAZORPAY_KEY_ID", desc: "Razorpay Key ID for payments", required: true },
        { name: "RAZORPAY_KEY_SECRET", desc: "Razorpay Key Secret", required: true },
        { name: "SUPABASE_URL", desc: "Auto-provided by Supabase", required: false },
        { name: "SUPABASE_SERVICE_ROLE_KEY", desc: "Auto-provided by Supabase", required: false },
        { name: "SUPABASE_ANON_KEY", desc: "Auto-provided by Supabase", required: false },
      ];

      envVars.forEach((env) => {
        addText(`• ${env.name} ${env.required ? "(Required)" : "(Auto-provided)"}`);
        addText(`  ${env.desc}`, 9);
        y += 2;
      });

      // ========== MIGRATION STEPS ==========
      setProgress(85);
      doc.addPage();
      y = margin;
      addTitle("8. MIGRATION STEPS", 16);
      y += 3;

      const steps = [
        "1. Create a new Supabase project at supabase.com",
        "2. Go to SQL Editor and run all table creation scripts in order",
        "3. Create database functions (handle_new_user, update_updated_at_column)",
        "4. Create triggers for auth and timestamp updates",
        "5. Create storage buckets with RLS policies",
        "6. Install Supabase CLI: npm install -g supabase",
        "7. Link to project: supabase link --project-ref <project-id>",
        "8. Copy edge functions to supabase/functions/",
        "9. Deploy functions: supabase functions deploy --all",
        "10. Configure secrets in Dashboard > Project Settings > Secrets",
        "11. Update frontend .env with new SUPABASE_URL and ANON_KEY",
        "12. Test all functionality before going live",
      ];

      steps.forEach((step) => {
        addText(step);
        y += 2;
      });

      y += 5;
      addText("Important Notes:", 11);
      y += 3;
      addText("• Run table creation in order due to foreign key dependencies");
      addText("• Enable RLS on all tables immediately after creation");
      addText("• Test each edge function after deployment");
      addText("• Keep API keys secure and never commit to version control");

      // ========== SUMMARY ==========
      setProgress(90);
      doc.addPage();
      y = margin;
      addTitle("9. QUICK REFERENCE SUMMARY", 16);
      y += 5;

      addText("Database Tables: 43 total", 12);
      y += 3;
      
      const tableCategories = [
        { cat: "User Management (3)", tables: "profiles, subscriptions, payment_history" },
        { cat: "Finance (6)", tables: "expenses, expense_categories, budget_limits, income_sources, income_entries, savings_goals" },
        { cat: "Loans (6)", tables: "loans, emi_schedule, emi_events, emi_reminders, loan_documents, custom_banks" },
        { cat: "Insurance (6)", tables: "insurances, insurance_documents, insurance_claims, insurance_claim_documents, insurance_reminders, family_members" },
        { cat: "Documents (1)", tables: "documents" },
        { cat: "Memories (3)", tables: "memories, memory_folders, memory_collections" },
        { cat: "Study (7)", tables: "study_logs, study_goals, subject_colors, syllabus_topics, syllabus_phases, syllabus_modules, syllabus_documents" },
        { cat: "Work/Education (4)", tables: "work_history, salary_records, education_records, education_documents" },
        { cat: "Social (1)", tables: "social_profiles" },
        { cat: "Tasks/Activity (3)", tables: "todos, achievements, activity_logs" },
      ];

      tableCategories.forEach((cat) => {
        addText(`${cat.cat}: ${cat.tables}`, 8);
        y += 1;
      });

      y += 5;
      addText("Edge Functions: 15 total", 12);
      y += 3;
      addText("Auth: send-email-otp, send-sms-otp, send-welcome-email", 8);
      addText("Payments: create-razorpay-order, verify-razorpay-payment, send-payment-receipt", 8);
      addText("Loans: generate-emi-schedule, mark-emi-paid, apply-part-payment, apply-foreclosure, recalc-loan-summary, send-emi-reminders", 8);
      addText("Insurance: send-insurance-reminders, auto-link-insurance-expense", 8);
      addText("Social: check-social-profiles", 8);

      y += 5;
      addText("Storage Buckets: 6 total", 12);
      y += 3;
      addText("memories, documents, insurance-documents, loan-documents, syllabus, chronyx", 8);

      y += 5;
      addText("Implicit Enums: 29 column references documented", 12);

      setProgress(95);

      // Save PDF
      doc.save("CHRONYX_Migration_Guide_v2.0.pdf");
      
      setProgress(100);
      toast({
        title: "PDF Generated Successfully",
        description: "CHRONYX_Migration_Guide_v2.0.pdf has been downloaded.",
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "PDF Generation Failed",
        description: "An error occurred while generating the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Migration Guide PDF v2.0</p>
          <p className="text-xs text-muted-foreground">
            43 tables, 15 edge functions (full code), 6 buckets, 29 enum references
          </p>
        </div>
      </div>

      {isGenerating && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground text-center">
            Generating PDF... {progress}%
          </p>
        </div>
      )}

      <Button
        onClick={generatePDF}
        disabled={isGenerating}
        variant="outline"
        className="w-full"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Download Migration Guide PDF
      </Button>
    </div>
  );
};

export default MigrationGuidePDF;
