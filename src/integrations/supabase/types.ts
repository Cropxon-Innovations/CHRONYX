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
