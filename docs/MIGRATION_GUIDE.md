# CHRONYX - Complete Migration Guide

This document provides step-by-step instructions to migrate your CHRONYX data from Lovable Cloud to your own Supabase account.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Tables](#database-tables)
3. [Storage Buckets](#storage-buckets)
4. [Edge Functions](#edge-functions)
5. [Environment Variables](#environment-variables)
6. [Migration Steps](#migration-steps)

---

## Prerequisites

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and keys:
   - Project URL: `https://[project-id].supabase.co`
   - Anon Key: Found in Settings → API
   - Service Role Key: Found in Settings → API (keep secret!)
3. Install Supabase CLI: `npm install -g supabase`

---

## Database Tables

### Complete Schema SQL

Run the following SQL in your Supabase SQL Editor to create all tables:

```sql
-- =====================================================
-- CHRONYX DATABASE SCHEMA
-- Version: 1.0
-- Last Updated: 2025-01-04
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- Stores user profile information
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  birth_date DATE,
  target_age INTEGER DEFAULT 60,
  primary_contact TEXT DEFAULT 'email',
  secondary_email TEXT,
  secondary_phone TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 2. ACHIEVEMENTS TABLE
-- Tracks user achievements and milestones
-- =====================================================
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  achieved_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON public.achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements" ON public.achievements
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. ACTIVITY LOGS TABLE
-- Logs all user activities across modules
-- =====================================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. BUDGET LIMITS TABLE
-- Manages monthly budget limits per category
-- =====================================================
CREATE TABLE public.budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budget limits" ON public.budget_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget limits" ON public.budget_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget limits" ON public.budget_limits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget limits" ON public.budget_limits
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. CUSTOM BANKS TABLE
-- User-defined banks for loan tracking
-- =====================================================
CREATE TABLE public.custom_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  logo_url TEXT,
  country TEXT DEFAULT 'Other',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.custom_banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom banks" ON public.custom_banks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom banks" ON public.custom_banks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom banks" ON public.custom_banks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom banks" ON public.custom_banks
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. DOCUMENTS TABLE
-- Stores identity and important documents
-- =====================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. EDUCATION RECORDS TABLE
-- Tracks educational history
-- =====================================================
CREATE TABLE public.education_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can view their own education records" ON public.education_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own education records" ON public.education_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education records" ON public.education_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education records" ON public.education_records
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 8. EDUCATION DOCUMENTS TABLE
-- Documents linked to education records
-- =====================================================
CREATE TABLE public.education_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_id UUID NOT NULL REFERENCES public.education_records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.education_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own education documents" ON public.education_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own education documents" ON public.education_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education documents" ON public.education_documents
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 9. EXPENSE CATEGORIES TABLE
-- Default and custom expense categories
-- =====================================================
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view default and their own categories" ON public.expense_categories
  FOR SELECT USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" ON public.expense_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own categories" ON public.expense_categories
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own categories" ON public.expense_categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Insert default categories
INSERT INTO public.expense_categories (name, is_default) VALUES
  ('Food & Dining', true),
  ('Transportation', true),
  ('Shopping', true),
  ('Entertainment', true),
  ('Bills & Utilities', true),
  ('Healthcare', true),
  ('Education', true),
  ('Travel', true),
  ('Personal Care', true),
  ('Groceries', true),
  ('Rent', true),
  ('Insurance', true),
  ('EMI', true),
  ('Investment', true),
  ('Other', true);

-- =====================================================
-- 10. EXPENSES TABLE
-- Tracks all expenses
-- =====================================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  payment_mode TEXT NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  is_auto_generated BOOLEAN DEFAULT false,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 11. FAMILY MEMBERS TABLE
-- Stores family member information for insurance
-- =====================================================
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relation TEXT NOT NULL,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own family members" ON public.family_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own family members" ON public.family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members" ON public.family_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members" ON public.family_members
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 12. INCOME SOURCES TABLE
-- Defines sources of income
-- =====================================================
CREATE TABLE public.income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own income sources" ON public.income_sources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own income sources" ON public.income_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income sources" ON public.income_sources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income sources" ON public.income_sources
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 13. INCOME ENTRIES TABLE
-- Records individual income entries
-- =====================================================
CREATE TABLE public.income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_source_id UUID REFERENCES public.income_sources(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  income_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own income entries" ON public.income_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own income entries" ON public.income_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income entries" ON public.income_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income entries" ON public.income_entries
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 14. INSURANCES TABLE
-- Stores insurance policy information
-- =====================================================
CREATE TABLE public.insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  premium_amount NUMERIC NOT NULL,
  sum_assured NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  insured_type TEXT DEFAULT 'self',
  insured_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  vehicle_registration TEXT,
  status TEXT DEFAULT 'active',
  reminder_days INTEGER[] DEFAULT '{30,7,1}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insurances" ON public.insurances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insurances" ON public.insurances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insurances" ON public.insurances
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insurances" ON public.insurances
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 15. INSURANCE CLAIMS TABLE
-- Tracks insurance claims
-- =====================================================
CREATE TABLE public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  insured_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  claim_type TEXT NOT NULL,
  claim_reference_no TEXT,
  claimed_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  settled_amount NUMERIC,
  claim_date DATE NOT NULL,
  status TEXT DEFAULT 'Filed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claims" ON public.insurance_claims
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own claims" ON public.insurance_claims
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own claims" ON public.insurance_claims
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own claims" ON public.insurance_claims
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM insurances WHERE insurances.id = insurance_claims.insurance_id AND insurances.user_id = auth.uid()
  ));

-- =====================================================
-- 16. INSURANCE DOCUMENTS TABLE
-- Documents linked to insurance policies
-- =====================================================
CREATE TABLE public.insurance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  document_type TEXT DEFAULT 'policy',
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  year INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.insurance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insurance documents" ON public.insurance_documents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own insurance documents" ON public.insurance_documents
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own insurance documents" ON public.insurance_documents
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM insurances WHERE insurances.id = insurance_documents.insurance_id AND insurances.user_id = auth.uid()
  ));

-- =====================================================
-- 17. INSURANCE CLAIM DOCUMENTS TABLE
-- Documents linked to insurance claims
-- =====================================================
CREATE TABLE public.insurance_claim_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.insurance_claims(id) ON DELETE CASCADE,
  document_type TEXT DEFAULT 'other',
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.insurance_claim_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claim documents" ON public.insurance_claim_documents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM insurance_claims c JOIN insurances i ON c.insurance_id = i.id
    WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own claim documents" ON public.insurance_claim_documents
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM insurance_claims c JOIN insurances i ON c.insurance_id = i.id
    WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own claim documents" ON public.insurance_claim_documents
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM insurance_claims c JOIN insurances i ON c.insurance_id = i.id
    WHERE c.id = insurance_claim_documents.claim_id AND i.user_id = auth.uid()
  ));

-- =====================================================
-- 18. INSURANCE REMINDERS TABLE
-- Tracks sent insurance reminders
-- =====================================================
CREATE TABLE public.insurance_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  reminder_days_before INTEGER NOT NULL,
  email_sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.insurance_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insurance_reminders" ON public.insurance_reminders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM insurances i WHERE i.id = insurance_reminders.insurance_id AND i.user_id = auth.uid()
  ));

-- =====================================================
-- 19. LOANS TABLE
-- Stores loan information
-- =====================================================
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_logo_url TEXT,
  loan_account_number TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  tenure_months INTEGER NOT NULL,
  emi_amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  repayment_mode TEXT DEFAULT 'Auto Debit',
  status TEXT DEFAULT 'active',
  country TEXT DEFAULT 'India',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loans" ON public.loans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans" ON public.loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans" ON public.loans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans" ON public.loans
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 20. EMI SCHEDULE TABLE
-- Stores EMI payment schedule
-- =====================================================
CREATE TABLE public.emi_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  emi_month INTEGER NOT NULL,
  emi_date DATE NOT NULL,
  emi_amount NUMERIC NOT NULL,
  principal_component NUMERIC NOT NULL,
  interest_component NUMERIC NOT NULL,
  remaining_principal NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'Pending',
  payment_method TEXT,
  paid_date DATE,
  is_adjusted BOOLEAN DEFAULT false,
  adjustment_event_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.emi_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emi_schedule" ON public.emi_schedule
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own emi_schedule" ON public.emi_schedule
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own emi_schedule" ON public.emi_schedule
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own emi_schedule" ON public.emi_schedule
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = emi_schedule.loan_id AND loans.user_id = auth.uid()
  ));

-- =====================================================
-- 21. EMI EVENTS TABLE
-- Tracks part payments, foreclosure events
-- =====================================================
CREATE TABLE public.emi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  mode TEXT,
  reduction_type TEXT,
  new_emi_amount NUMERIC,
  new_tenure_months INTEGER,
  interest_saved NUMERIC DEFAULT 0,
  applied_to_emi_id UUID REFERENCES public.emi_schedule(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.emi_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emi_events" ON public.emi_events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own emi_events" ON public.emi_events
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own emi_events" ON public.emi_events
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own emi_events" ON public.emi_events
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = emi_events.loan_id AND loans.user_id = auth.uid()
  ));

-- =====================================================
-- 22. EMI REMINDERS TABLE
-- Tracks sent EMI reminders
-- =====================================================
CREATE TABLE public.emi_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emi_id UUID NOT NULL REFERENCES public.emi_schedule(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  email_sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.emi_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emi_reminders" ON public.emi_reminders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM emi_schedule es JOIN loans l ON es.loan_id = l.id
    WHERE es.id = emi_reminders.emi_id AND l.user_id = auth.uid()
  ));

-- =====================================================
-- 23. LOAN DOCUMENTS TABLE
-- Documents linked to loans
-- =====================================================
CREATE TABLE public.loan_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  emi_id UUID REFERENCES public.emi_schedule(id) ON DELETE SET NULL,
  document_type TEXT DEFAULT 'other',
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loan_documents" ON public.loan_documents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own loan_documents" ON public.loan_documents
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own loan_documents" ON public.loan_documents
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM loans WHERE loans.id = loan_documents.loan_id AND loans.user_id = auth.uid()
  ));

-- =====================================================
-- 24. MEMORIES TABLE
-- Stores photos and videos
-- =====================================================
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL,
  file_size INTEGER,
  created_date DATE DEFAULT CURRENT_DATE,
  folder_id UUID,
  collection_id UUID,
  is_locked BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memories" ON public.memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON public.memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON public.memories
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 25. MEMORY FOLDERS TABLE
-- Organizes memories into folders
-- =====================================================
CREATE TABLE public.memory_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.memory_folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT 'bg-accent/30',
  icon TEXT DEFAULT 'Default',
  sort_order INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  lock_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.memory_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memory folders" ON public.memory_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory folders" ON public.memory_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory folders" ON public.memory_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory folders" ON public.memory_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Add foreign key after table creation
ALTER TABLE public.memories 
  ADD CONSTRAINT memories_folder_id_fkey 
  FOREIGN KEY (folder_id) REFERENCES public.memory_folders(id) ON DELETE SET NULL;

-- =====================================================
-- 26. MEMORY COLLECTIONS TABLE
-- Groups memories into collections
-- =====================================================
CREATE TABLE public.memory_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  folder_id UUID REFERENCES public.memory_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.memory_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memory collections" ON public.memory_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory collections" ON public.memory_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory collections" ON public.memory_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory collections" ON public.memory_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Add foreign key after table creation
ALTER TABLE public.memories 
  ADD CONSTRAINT memories_collection_id_fkey 
  FOREIGN KEY (collection_id) REFERENCES public.memory_collections(id) ON DELETE SET NULL;

-- =====================================================
-- 27. SAVINGS GOALS TABLE
-- Tracks savings goals
-- =====================================================
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own savings goals" ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings goals" ON public.savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals" ON public.savings_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals" ON public.savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 28. SOCIAL PROFILES TABLE
-- Tracks social media profiles
-- =====================================================
CREATE TABLE public.social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT,
  custom_name TEXT,
  profile_url TEXT,
  logo_url TEXT,
  connection_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'active',
  last_post_date DATE,
  last_sync_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  notes_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own social profiles" ON public.social_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social profiles" ON public.social_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social profiles" ON public.social_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social profiles" ON public.social_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 29. SUBSCRIPTIONS TABLE
-- Tracks user subscriptions
-- =====================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  amount_paid NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 30. PAYMENT HISTORY TABLE
-- Tracks all payment transactions
-- =====================================================
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
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

CREATE POLICY "Users can view their own payment history" ON public.payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment history" ON public.payment_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment history" ON public.payment_history
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 31. WORK HISTORY TABLE
-- Tracks employment history
-- =====================================================
CREATE TABLE public.work_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  employment_type TEXT DEFAULT 'Full-time',
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.work_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work history" ON public.work_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own work history" ON public.work_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work history" ON public.work_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work history" ON public.work_history
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 32. SALARY RECORDS TABLE
-- Tracks salary history
-- =====================================================
CREATE TABLE public.salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can view their own salary records" ON public.salary_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own salary records" ON public.salary_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salary records" ON public.salary_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salary records" ON public.salary_records
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 33. STUDY GOALS TABLE
-- Tracks study goals
-- =====================================================
CREATE TABLE public.study_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  target_hours_weekly INTEGER DEFAULT 10,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study goals" ON public.study_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study goals" ON public.study_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study goals" ON public.study_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study goals" ON public.study_goals
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 34. SYLLABUS TOPICS TABLE
-- Tracks syllabus topics for study
-- =====================================================
CREATE TABLE public.syllabus_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID,
  topic_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  estimated_hours NUMERIC,
  actual_hours NUMERIC DEFAULT 0,
  deadline DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own syllabus topics" ON public.syllabus_topics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus topics" ON public.syllabus_topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus topics" ON public.syllabus_topics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus topics" ON public.syllabus_topics
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 35. STUDY LOGS TABLE
-- Tracks study sessions
-- =====================================================
CREATE TABLE public.study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT,
  duration INTEGER NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  focus_level TEXT DEFAULT 'medium',
  notes TEXT,
  planned_duration INTEGER,
  is_timer_session BOOLEAN DEFAULT false,
  timer_started_at TIMESTAMPTZ,
  timer_ended_at TIMESTAMPTZ,
  linked_topic_id UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study logs" ON public.study_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study logs" ON public.study_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study logs" ON public.study_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study logs" ON public.study_logs
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 36. SUBJECT COLORS TABLE
-- Custom colors for study subjects
-- =====================================================
CREATE TABLE public.subject_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subject_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subject colors" ON public.subject_colors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subject colors" ON public.subject_colors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subject colors" ON public.subject_colors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subject colors" ON public.subject_colors
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 37. SYLLABUS DOCUMENTS TABLE
-- Uploaded syllabus PDFs
-- =====================================================
CREATE TABLE public.syllabus_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  sort_order INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.syllabus_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own syllabus documents" ON public.syllabus_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus documents" ON public.syllabus_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus documents" ON public.syllabus_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus documents" ON public.syllabus_documents
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 38. SYLLABUS PHASES TABLE
-- Phases within a syllabus
-- =====================================================
CREATE TABLE public.syllabus_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.syllabus_documents(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  phase_order INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.syllabus_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own syllabus phases" ON public.syllabus_phases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus phases" ON public.syllabus_phases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus phases" ON public.syllabus_phases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus phases" ON public.syllabus_phases
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 39. SYLLABUS MODULES TABLE
-- Modules within phases
-- =====================================================
CREATE TABLE public.syllabus_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES public.syllabus_phases(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  module_order INTEGER,
  source_page TEXT,
  status TEXT DEFAULT 'pending',
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.syllabus_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own syllabus modules" ON public.syllabus_modules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own syllabus modules" ON public.syllabus_modules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own syllabus modules" ON public.syllabus_modules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own syllabus modules" ON public.syllabus_modules
  FOR DELETE USING (auth.uid() = user_id);

-- Add foreign key for syllabus_topics.module_id
ALTER TABLE public.syllabus_topics 
  ADD CONSTRAINT syllabus_topics_module_id_fkey 
  FOREIGN KEY (module_id) REFERENCES public.syllabus_modules(id) ON DELETE CASCADE;

-- =====================================================
-- 40. TODOS TABLE
-- Task management
-- =====================================================
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  parent_id UUID REFERENCES public.todos(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own todos" ON public.todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON public.todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON public.todos
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budget_limits_updated_at BEFORE UPDATE ON public.budget_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_education_records_updated_at BEFORE UPDATE ON public.education_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_income_sources_updated_at BEFORE UPDATE ON public.income_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_income_entries_updated_at BEFORE UPDATE ON public.income_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurances_updated_at BEFORE UPDATE ON public.insurances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memory_folders_updated_at BEFORE UPDATE ON public.memory_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memory_collections_updated_at BEFORE UPDATE ON public.memory_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_social_profiles_updated_at BEFORE UPDATE ON public.social_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_history_updated_at BEFORE UPDATE ON public.payment_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_history_updated_at BEFORE UPDATE ON public.work_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_salary_records_updated_at BEFORE UPDATE ON public.salary_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_study_goals_updated_at BEFORE UPDATE ON public.study_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_syllabus_topics_updated_at BEFORE UPDATE ON public.syllabus_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_study_logs_updated_at BEFORE UPDATE ON public.study_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subject_colors_updated_at BEFORE UPDATE ON public.subject_colors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_syllabus_documents_updated_at BEFORE UPDATE ON public.syllabus_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_syllabus_phases_updated_at BEFORE UPDATE ON public.syllabus_phases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_syllabus_modules_updated_at BEFORE UPDATE ON public.syllabus_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## Storage Buckets

Create the following storage buckets in your Supabase project:

### 1. Memories Bucket (Private)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('memories', 'memories', false);

-- Policies
CREATE POLICY "Users can view their own memory files"
ON storage.objects FOR SELECT
USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own memory files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own memory files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own memory files"
ON storage.objects FOR DELETE
USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 2. Documents Bucket (Private)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Policies
CREATE POLICY "Users can view their own document files"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own document files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own document files"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Insurance Documents Bucket (Private)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('insurance-documents', 'insurance-documents', false);

-- Policies
CREATE POLICY "Users can view their own insurance document files"
ON storage.objects FOR SELECT
USING (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own insurance document files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own insurance document files"
ON storage.objects FOR DELETE
USING (bucket_id = 'insurance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Loan Documents Bucket (Public)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('loan-documents', 'loan-documents', true);

-- Policies
CREATE POLICY "Users can view their own loan document files"
ON storage.objects FOR SELECT
USING (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own loan document files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own loan document files"
ON storage.objects FOR DELETE
USING (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Syllabus Bucket (Private)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('syllabus', 'syllabus', false);

-- Policies
CREATE POLICY "Users can view their own syllabus files"
ON storage.objects FOR SELECT
USING (bucket_id = 'syllabus' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own syllabus files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'syllabus' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own syllabus files"
ON storage.objects FOR DELETE
USING (bucket_id = 'syllabus' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 6. Chronyx Bucket (Public - for app assets)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('chronyx', 'chronyx', true);
```

---

## Edge Functions

Copy these edge functions to your Supabase project's `supabase/functions` directory:

### 1. send-email-otp
Sends OTP via email for verification.

```typescript
// supabase/functions/send-email-otp/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
  userId: string;
  type: "verify" | "login";
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, type }: SendOtpRequest = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Create hash for client-side verification
    const encoder = new TextEncoder();
    const data = encoder.encode(otp + userId);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otpHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Chronyx</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-bottom: 16px;">Your Verification Code</h2>
          <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Chronyx <onboarding@resend.dev>",
        to: [email],
        subject: `Your Chronyx verification code: ${otp}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend error:", error);
      throw new Error("Failed to send email");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully",
        otpHash,
        expiresAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
```

### 2. send-sms-otp
Sends OTP via SMS using Twilio.

```typescript
// supabase/functions/send-sms-otp/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone;
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: twilioPhone,
        Body: `Your Chronyx verification code is: ${otp}. Valid for 10 minutes.`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Twilio error:", error);
      throw new Error("Failed to send SMS");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully",
        otpHash,
        expiresAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 3. send-welcome-email
Sends welcome email to new users.

```typescript
// supabase/functions/send-welcome-email/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const displayName = name || "there";

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Chronyx!</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hey ${displayName}! 👋</h2>
          <p style="color: #4b5563;">We're thrilled to have you on board. Chronyx helps you track your life's journey with powerful tools for:</p>
          <ul style="color: #4b5563;">
            <li>📊 Expense & Income Tracking</li>
            <li>🏦 Loan & EMI Management</li>
            <li>🛡️ Insurance Portfolio</li>
            <li>📸 Memory Vault</li>
            <li>📚 Study Tracker</li>
            <li>✅ Todo Management</li>
          </ul>
          <p style="color: #4b5563;">Start exploring and make the most of your time!</p>
          <a href="https://chronyx.app/dashboard" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">Go to Dashboard</a>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Chronyx <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to Chronyx! 🎉",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to send welcome email");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
```

### 4. generate-emi-schedule
Generates EMI schedule for loans.

*(See full implementation in project files)*

### 5. mark-emi-paid
Marks an EMI as paid and creates expense entry.

*(See full implementation in project files)*

### 6. apply-part-payment
Applies part payment to a loan.

*(See full implementation in project files)*

### 7. apply-foreclosure
Handles loan foreclosure.

*(See full implementation in project files)*

### 8. recalc-loan-summary
Recalculates loan summary after payments.

*(See full implementation in project files)*

### 9. send-emi-reminders
Sends email reminders for upcoming EMIs.

*(See full implementation in project files)*

### 10. send-insurance-reminders
Sends email reminders for insurance renewals.

*(See full implementation in project files)*

### 11. auto-link-insurance-expense
Auto-creates expense when insurance premium is paid.

*(See full implementation in project files)*

### 12. check-social-profiles
Checks status of linked social profiles.

*(See full implementation in project files)*

### 13. create-razorpay-order
Creates Razorpay order for payments.

*(See full implementation in project files)*

### 14. verify-razorpay-payment
Verifies Razorpay payment signature.

*(See full implementation in project files)*

### 15. send-payment-receipt
Sends payment receipt email.

*(See full implementation in project files)*

---

## Environment Variables

Set these secrets in your Supabase project (Settings → Edge Functions → Secrets):

| Secret Name | Description |
|-------------|-------------|
| `RESEND_API_KEY` | API key from Resend for sending emails |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token for SMS |
| `TWILIO_PHONE_NUMBER` | Twilio phone number for sending SMS |
| `RAZORPAY_KEY_ID` | Razorpay Key ID for payments |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret for payments |

---

## Migration Steps

### Step 1: Create New Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys

### Step 2: Run Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Copy the entire schema SQL from above
3. Execute the SQL

### Step 3: Create Storage Buckets
1. Go to Storage in Supabase Dashboard
2. Create each bucket as specified above
3. Apply the storage policies

### Step 4: Deploy Edge Functions
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_ID`
4. Create functions directory and copy function files
5. Deploy: `supabase functions deploy`

### Step 5: Configure Secrets
1. Go to Settings → Edge Functions → Secrets
2. Add all required environment variables

### Step 6: Configure Authentication
1. Go to Authentication → Providers
2. Enable Email provider
3. Enable Google OAuth (if needed)
4. Configure email templates

### Step 7: Update Frontend
1. Update `.env` file with new credentials:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

### Step 8: Export Data (Optional)
To export existing data from Lovable Cloud:
1. Use the Supabase Data API to fetch all records
2. Export to JSON/CSV
3. Import to new project using INSERT statements

---

## Data Table Summary

| Table Name | Description | RLS |
|------------|-------------|-----|
| profiles | User profiles | ✅ |
| achievements | User achievements | ✅ |
| activity_logs | Activity logging | ✅ |
| budget_limits | Monthly budget limits | ✅ |
| custom_banks | User-defined banks | ✅ |
| documents | Identity documents | ✅ |
| education_records | Education history | ✅ |
| education_documents | Education documents | ✅ |
| expense_categories | Expense categories | ✅ |
| expenses | Expense entries | ✅ |
| family_members | Family members | ✅ |
| income_sources | Income sources | ✅ |
| income_entries | Income entries | ✅ |
| insurances | Insurance policies | ✅ |
| insurance_claims | Insurance claims | ✅ |
| insurance_documents | Insurance documents | ✅ |
| insurance_claim_documents | Claim documents | ✅ |
| insurance_reminders | Sent reminders | ✅ |
| loans | Loan records | ✅ |
| emi_schedule | EMI schedule | ✅ |
| emi_events | Loan events | ✅ |
| emi_reminders | EMI reminders | ✅ |
| loan_documents | Loan documents | ✅ |
| memories | Photos/videos | ✅ |
| memory_folders | Memory organization | ✅ |
| memory_collections | Memory collections | ✅ |
| savings_goals | Savings goals | ✅ |
| social_profiles | Social media links | ✅ |
| subscriptions | User subscriptions | ✅ |
| payment_history | Payment records | ✅ |
| work_history | Employment history | ✅ |
| salary_records | Salary history | ✅ |
| study_goals | Study goals | ✅ |
| syllabus_topics | Syllabus topics | ✅ |
| study_logs | Study sessions | ✅ |
| subject_colors | Subject colors | ✅ |
| syllabus_documents | Syllabus PDFs | ✅ |
| syllabus_phases | Study phases | ✅ |
| syllabus_modules | Study modules | ✅ |
| todos | Task management | ✅ |

---

## Support

For questions about migration, please refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

*Document generated for CHRONYX - Version 1.0*
*Last Updated: January 2025*
