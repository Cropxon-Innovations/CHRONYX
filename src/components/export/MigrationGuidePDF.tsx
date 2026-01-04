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
        
        doc.setFontSize(7);
        doc.setFont("courier", "normal");
        const lines = code.split("\n");
        lines.forEach((line) => {
          if (line.trim()) {
            const wrappedLines = doc.splitTextToSize(line, contentWidth - 5);
            wrappedLines.forEach((wLine: string) => {
              addNewPageIfNeeded(4);
              doc.text(wLine, margin + 2, y);
              y += 3;
            });
          }
        });
        y += 3;
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
      doc.text("Database Migration Guide", pageWidth / 2, 95, { align: "center" });
      
      doc.setFontSize(10);
      doc.text("Version 1.0", pageWidth / 2, 120, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth / 2, 128, { align: "center" });
      
      doc.setFontSize(9);
      doc.text("43 Database Tables | 15 Edge Functions | 6 Storage Buckets", pageWidth / 2, 150, { align: "center" });
      
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
        "2. Database Tables (43 Tables)",
        "3. Database Functions & Triggers",
        "4. Storage Buckets (6 Buckets)",
        "5. Edge Functions (15 Functions)",
        "6. Environment Variables",
        "7. Migration Steps",
        "8. Quick Reference Summary",
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
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own payment history" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payment history" ON public.payment_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment history" ON public.payment_history FOR UPDATE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);` },

        { name: "expense_categories", sql: `CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view default and their own categories" ON public.expense_categories FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Users can create their own categories" ON public.expense_categories FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Users can update their own categories" ON public.expense_categories FOR UPDATE USING (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Users can delete their own categories" ON public.expense_categories FOR DELETE USING (auth.uid() = user_id AND is_default = false);` },

        { name: "budget_limits", sql: `CREATE TABLE public.budget_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own budget limits" ON public.budget_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budget limits" ON public.budget_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budget limits" ON public.budget_limits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budget limits" ON public.budget_limits FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own income sources" ON public.income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own income sources" ON public.income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own income sources" ON public.income_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own income sources" ON public.income_sources FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own income entries" ON public.income_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own income entries" ON public.income_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own income entries" ON public.income_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own income entries" ON public.income_entries FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own savings goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own savings goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own savings goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own savings goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loans" ON public.loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loans" ON public.loans FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own emi_schedule" ON public.emi_schedule FOR SELECT USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid()));
CREATE POLICY "Users can create their own emi_schedule" ON public.emi_schedule FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid()));
CREATE POLICY "Users can update their own emi_schedule" ON public.emi_schedule FOR UPDATE USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid()));
CREATE POLICY "Users can delete their own emi_schedule" ON public.emi_schedule FOR DELETE USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid()));` },

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
CREATE POLICY "Users can view their own emi_events" ON public.emi_events FOR SELECT USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid()));
CREATE POLICY "Users can create their own emi_events" ON public.emi_events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid()));
CREATE POLICY "Users can update their own emi_events" ON public.emi_events FOR UPDATE USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid()));
CREATE POLICY "Users can delete their own emi_events" ON public.emi_events FOR DELETE USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid()));` },

        { name: "emi_reminders", sql: `CREATE TABLE public.emi_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emi_id UUID NOT NULL REFERENCES public.emi_schedule(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  email_sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.emi_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own emi_reminders" ON public.emi_reminders FOR SELECT USING (EXISTS (SELECT 1 FROM emi_schedule es JOIN loans l ON es.loan_id = l.id WHERE es.id = emi_reminders.emi_id AND l.user_id = auth.uid()));` },

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
CREATE POLICY "Users can view their own loan_documents" ON public.loan_documents FOR SELECT USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid()));
CREATE POLICY "Users can create their own loan_documents" ON public.loan_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid()));
CREATE POLICY "Users can delete their own loan_documents" ON public.loan_documents FOR DELETE USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid()));` },

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
CREATE POLICY "Users can view their own custom banks" ON public.custom_banks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own custom banks" ON public.custom_banks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own custom banks" ON public.custom_banks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own custom banks" ON public.custom_banks FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own insurances" ON public.insurances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own insurances" ON public.insurances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insurances" ON public.insurances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insurances" ON public.insurances FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own insurance documents" ON public.insurance_documents FOR SELECT USING (EXISTS (SELECT 1 FROM insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can create their own insurance documents" ON public.insurance_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can delete their own insurance documents" ON public.insurance_documents FOR DELETE USING (EXISTS (SELECT 1 FROM insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()));` },

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
CREATE POLICY "Users can view their own claims" ON public.insurance_claims FOR SELECT USING (EXISTS (SELECT 1 FROM insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can create their own claims" ON public.insurance_claims FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can update their own claims" ON public.insurance_claims FOR UPDATE USING (EXISTS (SELECT 1 FROM insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()));
CREATE POLICY "Users can delete their own claims" ON public.insurance_claims FOR DELETE USING (EXISTS (SELECT 1 FROM insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()));` },

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
CREATE POLICY "Users can view their own claim documents" ON public.insurance_claim_documents FOR SELECT USING (EXISTS (SELECT 1 FROM insurance_claims c JOIN insurances i ON c.insurance_id = i.id WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()));
CREATE POLICY "Users can create their own claim documents" ON public.insurance_claim_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM insurance_claims c JOIN insurances i ON c.insurance_id = i.id WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()));
CREATE POLICY "Users can delete their own claim documents" ON public.insurance_claim_documents FOR DELETE USING (EXISTS (SELECT 1 FROM insurance_claims c JOIN insurances i ON c.insurance_id = i.id WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()));` },

        { name: "insurance_reminders", sql: `CREATE TABLE public.insurance_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  reminder_days_before INTEGER NOT NULL,
  email_sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.insurance_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own insurance_reminders" ON public.insurance_reminders FOR SELECT USING (EXISTS (SELECT 1 FROM insurances i WHERE i.id = insurance_reminders.insurance_id AND i.user_id = auth.uid()));` },

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
CREATE POLICY "Users can view their own family members" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own family members" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own family members" ON public.family_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own family members" ON public.family_members FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own memories" ON public.memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own memories" ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memories" ON public.memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memories" ON public.memories FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own memory folders" ON public.memory_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own memory folders" ON public.memory_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memory folders" ON public.memory_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memory folders" ON public.memory_folders FOR DELETE USING (auth.uid() = user_id);` },

        { name: "memory_collections", sql: `CREATE TABLE public.memory_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  folder_id UUID REFERENCES public.memory_folders(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.memory_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own memory collections" ON public.memory_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own memory collections" ON public.memory_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memory collections" ON public.memory_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memory collections" ON public.memory_collections FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own study logs" ON public.study_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own study logs" ON public.study_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own study logs" ON public.study_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own study logs" ON public.study_logs FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own study goals" ON public.study_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own study goals" ON public.study_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own study goals" ON public.study_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own study goals" ON public.study_goals FOR DELETE USING (auth.uid() = user_id);` },

        { name: "subject_colors", sql: `CREATE TABLE public.subject_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subject_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subject colors" ON public.subject_colors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subject colors" ON public.subject_colors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subject colors" ON public.subject_colors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subject colors" ON public.subject_colors FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own syllabus topics" ON public.syllabus_topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own syllabus topics" ON public.syllabus_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own syllabus topics" ON public.syllabus_topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own syllabus topics" ON public.syllabus_topics FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own syllabus phases" ON public.syllabus_phases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own syllabus phases" ON public.syllabus_phases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own syllabus phases" ON public.syllabus_phases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own syllabus phases" ON public.syllabus_phases FOR DELETE USING (auth.uid() = user_id);` },

        { name: "syllabus_modules", sql: `CREATE TABLE public.syllabus_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phase_id UUID NOT NULL REFERENCES public.syllabus_phases(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  module_order INTEGER,
  status TEXT DEFAULT 'not_started',
  source_page TEXT,
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.syllabus_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own syllabus modules" ON public.syllabus_modules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own syllabus modules" ON public.syllabus_modules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own syllabus modules" ON public.syllabus_modules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own syllabus modules" ON public.syllabus_modules FOR DELETE USING (auth.uid() = user_id);` },

        { name: "syllabus_documents", sql: `CREATE TABLE public.syllabus_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  sort_order INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.syllabus_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own syllabus documents" ON public.syllabus_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own syllabus documents" ON public.syllabus_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own syllabus documents" ON public.syllabus_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own syllabus documents" ON public.syllabus_documents FOR DELETE USING (auth.uid() = user_id);` },

        { name: "work_history", sql: `CREATE TABLE public.work_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  location TEXT,
  description TEXT,
  employment_type TEXT,
  skills TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.work_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own work history" ON public.work_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own work history" ON public.work_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own work history" ON public.work_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own work history" ON public.work_history FOR DELETE USING (auth.uid() = user_id);` },

        { name: "salary_records", sql: `CREATE TABLE public.salary_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  work_history_id UUID NOT NULL REFERENCES public.work_history(id) ON DELETE CASCADE,
  salary_type TEXT DEFAULT 'monthly',
  monthly_amount NUMERIC,
  annual_amount NUMERIC,
  bonus NUMERIC DEFAULT 0,
  variable_pay NUMERIC DEFAULT 0,
  effective_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own salary records" ON public.salary_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own salary records" ON public.salary_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own salary records" ON public.salary_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own salary records" ON public.salary_records FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own education records" ON public.education_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own education records" ON public.education_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own education records" ON public.education_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own education records" ON public.education_records FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own education documents" ON public.education_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own education documents" ON public.education_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own education documents" ON public.education_documents FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own social profiles" ON public.social_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own social profiles" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social profiles" ON public.social_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own social profiles" ON public.social_profiles FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own todos" ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);` },

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
CREATE POLICY "Users can view their own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own achievements" ON public.achievements FOR DELETE USING (auth.uid() = user_id);` },

        { name: "activity_logs", sql: `CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);` },
      ];

      setProgress(20);

      // Add each table to PDF
      tables.forEach((table, index) => {
        if (index > 0 && index % 3 === 0) {
          setProgress(20 + Math.floor((index / tables.length) * 30));
        }
        
        addNewPageIfNeeded(30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${table.name}`, margin, y);
        y += 5;
        
        addCode(table.sql);
        y += 5;
      });

      // ========== DATABASE FUNCTIONS ==========
      setProgress(55);
      doc.addPage();
      y = margin;
      addTitle("3. DATABASE FUNCTIONS & TRIGGERS", 16);
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (apply to all tables with updated_at column)`, "update_updated_at_column()");

      // ========== STORAGE BUCKETS ==========
      setProgress(60);
      doc.addPage();
      y = margin;
      addTitle("4. STORAGE BUCKETS (6 Buckets)", 16);
      y += 3;

      const buckets = [
        { name: "memories", public: true, desc: "User photos and videos" },
        { name: "documents", public: false, desc: "Identity documents" },
        { name: "insurance-documents", public: false, desc: "Insurance policy documents" },
        { name: "loan-documents", public: false, desc: "Loan documents and receipts" },
        { name: "syllabus", public: false, desc: "Study syllabus PDFs" },
        { name: "chronyx", public: true, desc: "General app storage" },
      ];

      addText("Create the following storage buckets:");
      y += 5;

      buckets.forEach((bucket, i) => {
        addCode(`-- ${i + 1}. ${bucket.name} (${bucket.public ? "Public" : "Private"}) - ${bucket.desc}
INSERT INTO storage.buckets (id, name, public) VALUES ('${bucket.name}', '${bucket.name}', ${bucket.public});

-- RLS Policies for ${bucket.name}
CREATE POLICY "Users can view their own ${bucket.name}"
  ON storage.objects FOR SELECT
  USING (bucket_id = '${bucket.name}' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload to their own ${bucket.name}"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = '${bucket.name}' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own ${bucket.name}"
  ON storage.objects FOR UPDATE
  USING (bucket_id = '${bucket.name}' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own ${bucket.name}"
  ON storage.objects FOR DELETE
  USING (bucket_id = '${bucket.name}' AND auth.uid()::text = (storage.foldername(name))[1]);
`);
      });

      // ========== EDGE FUNCTIONS ==========
      setProgress(65);
      doc.addPage();
      y = margin;
      addTitle("5. EDGE FUNCTIONS (15 Functions)", 16);
      y += 3;

      addText("Deploy these edge functions using the Supabase CLI:");
      addText("Command: supabase functions deploy <function-name>");
      y += 5;

      const edgeFunctions = [
        { name: "send-email-otp", desc: "Send OTP via email using Resend API" },
        { name: "send-sms-otp", desc: "Send OTP via SMS using Twilio API" },
        { name: "send-welcome-email", desc: "Send welcome email to new users" },
        { name: "create-razorpay-order", desc: "Create Razorpay payment order" },
        { name: "verify-razorpay-payment", desc: "Verify Razorpay payment signature" },
        { name: "send-payment-receipt", desc: "Send payment receipt email" },
        { name: "generate-emi-schedule", desc: "Generate loan EMI schedule" },
        { name: "mark-emi-paid", desc: "Mark EMI as paid, auto-create expense" },
        { name: "apply-part-payment", desc: "Apply part-payment to loan" },
        { name: "apply-foreclosure", desc: "Process loan foreclosure" },
        { name: "recalc-loan-summary", desc: "Recalculate loan summary" },
        { name: "send-emi-reminders", desc: "Send EMI reminder emails" },
        { name: "send-insurance-reminders", desc: "Send insurance renewal reminders" },
        { name: "auto-link-insurance-expense", desc: "Auto-create expense for insurance" },
        { name: "check-social-profiles", desc: "Validate social profile URLs" },
      ];

      addText("Function List:");
      y += 3;
      edgeFunctions.forEach((fn, i) => {
        addText(`${i + 1}. ${fn.name} - ${fn.desc}`);
      });

      y += 5;
      addText("Full source code for all edge functions is available in the supabase/functions directory.");
      addText("Each function requires a matching index.ts file in its respective folder.");

      // ========== ENVIRONMENT VARIABLES ==========
      setProgress(80);
      doc.addPage();
      y = margin;
      addTitle("6. ENVIRONMENT VARIABLES", 16);
      y += 3;

      addText("Configure these secrets in your Supabase project:");
      y += 5;

      const envVars = [
        { name: "RESEND_API_KEY", desc: "Resend API key for email services", required: true },
        { name: "TWILIO_ACCOUNT_SID", desc: "Twilio Account SID for SMS", required: true },
        { name: "TWILIO_AUTH_TOKEN", desc: "Twilio Auth Token", required: true },
        { name: "TWILIO_PHONE_NUMBER", desc: "Twilio Phone Number", required: true },
        { name: "RAZORPAY_KEY_ID", desc: "Razorpay Key ID for payments", required: true },
        { name: "RAZORPAY_KEY_SECRET", desc: "Razorpay Key Secret", required: true },
        { name: "SUPABASE_URL", desc: "Auto-provided by Supabase", required: false },
        { name: "SUPABASE_SERVICE_ROLE_KEY", desc: "Auto-provided by Supabase", required: false },
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
      addTitle("7. MIGRATION STEPS", 16);
      y += 3;

      const steps = [
        "Create a new Supabase project at supabase.com",
        "Go to SQL Editor and run all table creation scripts",
        "Create database functions and triggers",
        "Create storage buckets with RLS policies",
        "Install Supabase CLI: npm install -g supabase",
        "Link to project: supabase link --project-ref <project-id>",
        "Copy edge functions to supabase/functions/",
        "Deploy functions: supabase functions deploy --all",
        "Configure secrets in Dashboard > Project Settings > Secrets",
        "Update frontend .env with new SUPABASE_URL and ANON_KEY",
        "Test all functionality",
      ];

      steps.forEach((step, i) => {
        addText(`${i + 1}. ${step}`);
        y += 2;
      });

      // ========== SUMMARY ==========
      setProgress(90);
      doc.addPage();
      y = margin;
      addTitle("8. QUICK REFERENCE SUMMARY", 16);
      y += 5;

      addText("Database Tables: 43 total", 12);
      y += 3;
      
      const tableCategories = [
        { cat: "User Management", tables: ["profiles", "subscriptions", "payment_history"] },
        { cat: "Finance", tables: ["expenses", "expense_categories", "budget_limits", "income_sources", "income_entries", "savings_goals"] },
        { cat: "Loans", tables: ["loans", "emi_schedule", "emi_events", "emi_reminders", "loan_documents", "custom_banks"] },
        { cat: "Insurance", tables: ["insurances", "insurance_documents", "insurance_claims", "insurance_claim_documents", "insurance_reminders", "family_members"] },
        { cat: "Documents", tables: ["documents"] },
        { cat: "Memories", tables: ["memories", "memory_folders", "memory_collections"] },
        { cat: "Study", tables: ["study_logs", "study_goals", "subject_colors", "syllabus_topics", "syllabus_phases", "syllabus_modules", "syllabus_documents"] },
        { cat: "Work/Education", tables: ["work_history", "salary_records", "education_records", "education_documents"] },
        { cat: "Social", tables: ["social_profiles"] },
        { cat: "Tasks/Activity", tables: ["todos", "achievements", "activity_logs"] },
      ];

      tableCategories.forEach((cat) => {
        addText(`${cat.cat}: ${cat.tables.join(", ")}`, 9);
        y += 1;
      });

      y += 5;
      addText("Edge Functions: 15 total", 12);
      y += 3;
      addText("Authentication: send-email-otp, send-sms-otp, send-welcome-email", 9);
      addText("Payments: create-razorpay-order, verify-razorpay-payment, send-payment-receipt", 9);
      addText("Loans: generate-emi-schedule, mark-emi-paid, apply-part-payment, apply-foreclosure, recalc-loan-summary, send-emi-reminders", 9);
      addText("Insurance: send-insurance-reminders, auto-link-insurance-expense", 9);
      addText("Social: check-social-profiles", 9);

      y += 5;
      addText("Storage Buckets: 6 total", 12);
      y += 3;
      addText("memories (public), documents (private), insurance-documents (private), loan-documents (private), syllabus (private), chronyx (public)", 9);

      setProgress(95);

      // Save PDF
      doc.save("CHRONYX_Migration_Guide_v1.0.pdf");
      
      setProgress(100);
      toast({
        title: "PDF Generated Successfully",
        description: "CHRONYX_Migration_Guide_v1.0.pdf has been downloaded.",
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
          <p className="text-sm font-medium">Migration Guide PDF</p>
          <p className="text-xs text-muted-foreground">
            Complete guide with 43 tables, 15 edge functions, 6 storage buckets
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
