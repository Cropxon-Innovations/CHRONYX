export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achieved_at: string
          category: string
          created_at: string | null
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          module: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          module: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_limits: {
        Row: {
          category: string
          created_at: string
          id: string
          monthly_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          monthly_limit: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_banks: {
        Row: {
          color: string
          country: string
          created_at: string
          full_name: string
          id: string
          logo_url: string | null
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          logo_url?: string | null
          name: string
          user_id: string
        }
        Update: {
          color?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          logo_url?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      emi_events: {
        Row: {
          amount: number
          applied_to_emi_id: string | null
          created_at: string | null
          event_date: string
          event_type: string
          id: string
          interest_saved: number | null
          loan_id: string
          mode: string | null
          new_emi_amount: number | null
          new_tenure_months: number | null
          notes: string | null
          reduction_type: string | null
        }
        Insert: {
          amount: number
          applied_to_emi_id?: string | null
          created_at?: string | null
          event_date: string
          event_type: string
          id?: string
          interest_saved?: number | null
          loan_id: string
          mode?: string | null
          new_emi_amount?: number | null
          new_tenure_months?: number | null
          notes?: string | null
          reduction_type?: string | null
        }
        Update: {
          amount?: number
          applied_to_emi_id?: string | null
          created_at?: string | null
          event_date?: string
          event_type?: string
          id?: string
          interest_saved?: number | null
          loan_id?: string
          mode?: string | null
          new_emi_amount?: number | null
          new_tenure_months?: number | null
          notes?: string | null
          reduction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emi_events_applied_to_emi_id_fkey"
            columns: ["applied_to_emi_id"]
            isOneToOne: false
            referencedRelation: "emi_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emi_events_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      emi_reminders: {
        Row: {
          email_sent_to: string
          emi_id: string
          id: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          email_sent_to: string
          emi_id: string
          id?: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          email_sent_to?: string
          emi_id?: string
          id?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emi_reminders_emi_id_fkey"
            columns: ["emi_id"]
            isOneToOne: false
            referencedRelation: "emi_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      emi_schedule: {
        Row: {
          adjustment_event_id: string | null
          created_at: string | null
          emi_amount: number
          emi_date: string
          emi_month: number
          id: string
          interest_component: number
          is_adjusted: boolean | null
          loan_id: string
          paid_date: string | null
          payment_method: string | null
          payment_status: string | null
          principal_component: number
          remaining_principal: number
        }
        Insert: {
          adjustment_event_id?: string | null
          created_at?: string | null
          emi_amount: number
          emi_date: string
          emi_month: number
          id?: string
          interest_component: number
          is_adjusted?: boolean | null
          loan_id: string
          paid_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          principal_component: number
          remaining_principal: number
        }
        Update: {
          adjustment_event_id?: string | null
          created_at?: string | null
          emi_amount?: number
          emi_date?: string
          emi_month?: number
          id?: string
          interest_component?: number
          is_adjusted?: boolean | null
          loan_id?: string
          paid_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          principal_component?: number
          remaining_principal?: number
        }
        Relationships: [
          {
            foreignKeyName: "emi_schedule_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          expense_date: string
          id: string
          is_auto_generated: boolean | null
          notes: string | null
          payment_mode: string
          source_id: string | null
          source_type: string | null
          sub_category: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          expense_date?: string
          id?: string
          is_auto_generated?: boolean | null
          notes?: string | null
          payment_mode: string
          source_id?: string | null
          source_type?: string | null
          sub_category?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          expense_date?: string
          id?: string
          is_auto_generated?: boolean | null
          notes?: string | null
          payment_mode?: string
          source_id?: string | null
          source_type?: string | null
          sub_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          notes: string | null
          relation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          id?: string
          notes?: string | null
          relation: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          relation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          income_date: string
          income_source_id: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          income_date?: string
          income_source_id?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          income_date?: string
          income_source_id?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_entries_income_source_id_fkey"
            columns: ["income_source_id"]
            isOneToOne: false
            referencedRelation: "income_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sources: {
        Row: {
          category: string
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          notes: string | null
          source_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          source_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          source_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_claim_documents: {
        Row: {
          claim_id: string
          document_type: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          claim_id: string
          document_type?: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          claim_id?: string
          document_type?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claim_documents_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "insurance_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          approved_amount: number | null
          claim_date: string
          claim_reference_no: string | null
          claim_type: string
          claimed_amount: number
          created_at: string
          id: string
          insurance_id: string
          insured_member_id: string | null
          notes: string | null
          settled_amount: number | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          claim_date: string
          claim_reference_no?: string | null
          claim_type: string
          claimed_amount: number
          created_at?: string
          id?: string
          insurance_id: string
          insured_member_id?: string | null
          notes?: string | null
          settled_amount?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          claim_date?: string
          claim_reference_no?: string | null
          claim_type?: string
          claimed_amount?: number
          created_at?: string
          id?: string
          insurance_id?: string
          insured_member_id?: string | null
          notes?: string | null
          settled_amount?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_insured_member_id_fkey"
            columns: ["insured_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_documents: {
        Row: {
          document_type: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          insurance_id: string
          uploaded_at: string
          year: number | null
        }
        Insert: {
          document_type?: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          insurance_id: string
          uploaded_at?: string
          year?: number | null
        }
        Update: {
          document_type?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          insurance_id?: string
          uploaded_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_documents_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_reminders: {
        Row: {
          email_sent_to: string
          id: string
          insurance_id: string
          reminder_days_before: number
          sent_at: string
        }
        Insert: {
          email_sent_to: string
          id?: string
          insurance_id: string
          reminder_days_before: number
          sent_at?: string
        }
        Update: {
          email_sent_to?: string
          id?: string
          insurance_id?: string
          reminder_days_before?: number
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_reminders_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
        ]
      }
      insurances: {
        Row: {
          created_at: string
          id: string
          insured_member_id: string | null
          insured_type: string
          notes: string | null
          policy_name: string
          policy_number: string
          policy_type: string
          premium_amount: number
          provider: string
          reminder_days: number[] | null
          renewal_date: string
          start_date: string
          status: string
          sum_assured: number
          updated_at: string
          user_id: string
          vehicle_registration: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          insured_member_id?: string | null
          insured_type?: string
          notes?: string | null
          policy_name: string
          policy_number: string
          policy_type: string
          premium_amount: number
          provider: string
          reminder_days?: number[] | null
          renewal_date: string
          start_date: string
          status?: string
          sum_assured: number
          updated_at?: string
          user_id: string
          vehicle_registration?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          insured_member_id?: string | null
          insured_type?: string
          notes?: string | null
          policy_name?: string
          policy_number?: string
          policy_type?: string
          premium_amount?: number
          provider?: string
          reminder_days?: number[] | null
          renewal_date?: string
          start_date?: string
          status?: string
          sum_assured?: number
          updated_at?: string
          user_id?: string
          vehicle_registration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurances_insured_member_id_fkey"
            columns: ["insured_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_documents: {
        Row: {
          document_type: string | null
          emi_id: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          loan_id: string
          uploaded_at: string | null
        }
        Insert: {
          document_type?: string | null
          emi_id?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          loan_id: string
          uploaded_at?: string | null
        }
        Update: {
          document_type?: string | null
          emi_id?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          loan_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_documents_emi_id_fkey"
            columns: ["emi_id"]
            isOneToOne: false
            referencedRelation: "emi_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          bank_logo_url: string | null
          bank_name: string
          country: string
          created_at: string | null
          emi_amount: number
          id: string
          interest_rate: number
          loan_account_number: string
          loan_type: string
          notes: string | null
          principal_amount: number
          repayment_mode: string | null
          start_date: string
          status: string | null
          tenure_months: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_logo_url?: string | null
          bank_name: string
          country?: string
          created_at?: string | null
          emi_amount: number
          id?: string
          interest_rate: number
          loan_account_number: string
          loan_type: string
          notes?: string | null
          principal_amount: number
          repayment_mode?: string | null
          start_date: string
          status?: string | null
          tenure_months: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_logo_url?: string | null
          bank_name?: string
          country?: string
          created_at?: string | null
          emi_amount?: number
          id?: string
          interest_rate?: number
          loan_account_number?: string
          loan_type?: string
          notes?: string | null
          principal_amount?: number
          repayment_mode?: string | null
          start_date?: string
          status?: string | null
          tenure_months?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          target_age: number | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          target_age?: number | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          target_age?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      study_goals: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string
          subject: string
          target_hours_weekly: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string
          subject: string
          target_hours_weekly?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string
          subject?: string
          target_hours_weekly?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_logs: {
        Row: {
          created_at: string | null
          date: string
          duration: number
          focus_level: string | null
          id: string
          is_timer_session: boolean | null
          linked_topic_id: string | null
          notes: string | null
          planned_duration: number | null
          subject: string
          timer_ended_at: string | null
          timer_started_at: string | null
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          duration: number
          focus_level?: string | null
          id?: string
          is_timer_session?: boolean | null
          linked_topic_id?: string | null
          notes?: string | null
          planned_duration?: number | null
          subject: string
          timer_ended_at?: string | null
          timer_started_at?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          duration?: number
          focus_level?: string | null
          id?: string
          is_timer_session?: boolean | null
          linked_topic_id?: string | null
          notes?: string | null
          planned_duration?: number | null
          subject?: string
          timer_ended_at?: string | null
          timer_started_at?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_logs_linked_topic_id_fkey"
            columns: ["linked_topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_colors: {
        Row: {
          color: string
          created_at: string | null
          id: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      syllabus_topics: {
        Row: {
          chapter_name: string
          completed_at: string | null
          created_at: string | null
          ease_factor: number | null
          estimated_hours: number | null
          id: string
          interval_days: number | null
          is_completed: boolean | null
          next_review_date: string | null
          notes: string | null
          priority: number | null
          review_count: number | null
          sort_order: number | null
          subject: string
          topic_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_name: string
          completed_at?: string | null
          created_at?: string | null
          ease_factor?: number | null
          estimated_hours?: number | null
          id?: string
          interval_days?: number | null
          is_completed?: boolean | null
          next_review_date?: string | null
          notes?: string | null
          priority?: number | null
          review_count?: number | null
          sort_order?: number | null
          subject: string
          topic_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_name?: string
          completed_at?: string | null
          created_at?: string | null
          ease_factor?: number | null
          estimated_hours?: number | null
          id?: string
          interval_days?: number | null
          is_completed?: boolean | null
          next_review_date?: string | null
          notes?: string | null
          priority?: number | null
          review_count?: number | null
          sort_order?: number | null
          subject?: string
          topic_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          created_at: string | null
          date: string
          id: string
          status: string
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          status?: string
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          status?: string
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
