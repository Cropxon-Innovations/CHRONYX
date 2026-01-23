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
      ai_category_patterns: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          last_used_at: string | null
          merchant_pattern: string
          suggested_category: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          merchant_pattern: string
          suggested_category: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          merchant_pattern?: string
          suggested_category?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_parsing_logs: {
        Row: {
          confidence_score: number | null
          cost_estimate: number | null
          created_at: string
          error_message: string | null
          id: string
          input_snippet: string | null
          model_used: string | null
          output_summary: string | null
          parse_type: string
          source: string
          success: boolean
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_snippet?: string | null
          model_used?: string | null
          output_summary?: string | null
          parse_type: string
          source?: string
          success?: boolean
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_snippet?: string | null
          model_used?: string | null
          output_summary?: string | null
          parse_type?: string
          source?: string
          success?: boolean
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      auth_challenges: {
        Row: {
          challenge: string
          challenge_type: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          challenge: string
          challenge_type: string
          created_at?: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          challenge?: string
          challenge_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      auto_imported_transactions: {
        Row: {
          amount: number
          confidence_score: number | null
          created_at: string
          currency: string | null
          dedupe_hash: string | null
          duplicate_of_id: string | null
          email_snippet: string | null
          email_subject: string | null
          gmail_message_id: string
          gmail_thread_id: string | null
          id: string
          is_duplicate: boolean | null
          is_overridden: boolean | null
          is_processed: boolean | null
          learned_category: string | null
          linked_expense_id: string | null
          merchant_name: string | null
          needs_review: boolean | null
          overridden_at: string | null
          override_reason: string | null
          payment_mode: string | null
          raw_extracted_data: Json | null
          review_reason: string | null
          source_platform: string | null
          transaction_date: string
          transaction_type: string | null
          updated_at: string
          user_id: string
          user_verified: boolean | null
        }
        Insert: {
          amount: number
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          dedupe_hash?: string | null
          duplicate_of_id?: string | null
          email_snippet?: string | null
          email_subject?: string | null
          gmail_message_id: string
          gmail_thread_id?: string | null
          id?: string
          is_duplicate?: boolean | null
          is_overridden?: boolean | null
          is_processed?: boolean | null
          learned_category?: string | null
          linked_expense_id?: string | null
          merchant_name?: string | null
          needs_review?: boolean | null
          overridden_at?: string | null
          override_reason?: string | null
          payment_mode?: string | null
          raw_extracted_data?: Json | null
          review_reason?: string | null
          source_platform?: string | null
          transaction_date: string
          transaction_type?: string | null
          updated_at?: string
          user_id: string
          user_verified?: boolean | null
        }
        Update: {
          amount?: number
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          dedupe_hash?: string | null
          duplicate_of_id?: string | null
          email_snippet?: string | null
          email_subject?: string | null
          gmail_message_id?: string
          gmail_thread_id?: string | null
          id?: string
          is_duplicate?: boolean | null
          is_overridden?: boolean | null
          is_processed?: boolean | null
          learned_category?: string | null
          linked_expense_id?: string | null
          merchant_name?: string | null
          needs_review?: boolean | null
          overridden_at?: string | null
          override_reason?: string | null
          payment_mode?: string | null
          raw_extracted_data?: Json | null
          review_reason?: string | null
          source_platform?: string | null
          transaction_date?: string
          transaction_type?: string | null
          updated_at?: string
          user_id?: string
          user_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_imported_transactions_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_imported_transactions_linked_expense_id_fkey"
            columns: ["linked_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string | null
          created_at: string
          full_name: string
          gstin: string | null
          id: string
          is_default: boolean | null
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string | null
          created_at?: string
          full_name: string
          gstin?: string | null
          id?: string
          is_default?: boolean | null
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string | null
          created_at?: string
          full_name?: string
          gstin?: string | null
          id?: string
          is_default?: boolean | null
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      book_assets: {
        Row: {
          alt_text: string | null
          book_id: string
          caption: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
        }
        Insert: {
          alt_text?: string | null
          book_id: string
          caption?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
        }
        Update: {
          alt_text?: string | null
          book_id?: string
          caption?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_assets_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_bookmarks: {
        Row: {
          book_id: string
          chapter_id: string | null
          created_at: string
          id: string
          note: string | null
          position: number | null
          user_id: string
        }
        Insert: {
          book_id: string
          chapter_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          position?: number | null
          user_id: string
        }
        Update: {
          book_id?: string
          chapter_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          position?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_bookmarks_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_bookmarks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "book_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      book_chapter_versions: {
        Row: {
          change_description: string | null
          chapter_id: string
          content: Json
          created_at: string
          id: string
          version_number: number
          word_count: number | null
        }
        Insert: {
          change_description?: string | null
          chapter_id: string
          content: Json
          created_at?: string
          id?: string
          version_number?: number
          word_count?: number | null
        }
        Update: {
          change_description?: string | null
          chapter_id?: string
          content?: Json
          created_at?: string
          id?: string
          version_number?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_chapter_versions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "book_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      book_chapters: {
        Row: {
          book_id: string
          content: Json | null
          created_at: string
          id: string
          notes: string | null
          order_index: number
          reading_time_minutes: number | null
          status: string | null
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          book_id: string
          content?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          order_index?: number
          reading_time_minutes?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          book_id?: string
          content?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          order_index?: number
          reading_time_minutes?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_comments: {
        Row: {
          chapter_id: string
          content: string
          created_at: string
          id: string
          is_resolved: boolean | null
          position_end: number | null
          position_start: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          content: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          position_end?: number | null
          position_start?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          content?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          position_end?: number | null
          position_start?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "book_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      book_highlights: {
        Row: {
          book_id: string
          chapter_id: string | null
          color: string | null
          created_at: string
          end_offset: number
          id: string
          note: string | null
          start_offset: number
          text_content: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter_id?: string | null
          color?: string | null
          created_at?: string
          end_offset: number
          id?: string
          note?: string | null
          start_offset: number
          text_content: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter_id?: string | null
          color?: string | null
          created_at?: string
          end_offset?: number
          id?: string
          note?: string | null
          start_offset?: number
          text_content?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_highlights_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_highlights_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "book_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      book_reading_analytics: {
        Row: {
          book_id: string
          chapter_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          pages_read: number | null
          session_end: string | null
          session_start: string
          user_id: string
          words_read: number | null
        }
        Insert: {
          book_id: string
          chapter_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          pages_read?: number | null
          session_end?: string | null
          session_start?: string
          user_id: string
          words_read?: number | null
        }
        Update: {
          book_id?: string
          chapter_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          pages_read?: number | null
          session_end?: string | null
          session_start?: string
          user_id?: string
          words_read?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_reading_analytics_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reading_analytics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "book_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      book_reading_progress: {
        Row: {
          book_id: string
          created_at: string
          current_chapter_id: string | null
          current_position: number | null
          id: string
          last_read_at: string | null
          progress_percentage: number | null
          reading_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          current_chapter_id?: string | null
          current_position?: number | null
          id?: string
          last_read_at?: string | null
          progress_percentage?: number | null
          reading_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          current_chapter_id?: string | null
          current_position?: number | null
          id?: string
          last_read_at?: string | null
          progress_percentage?: number | null
          reading_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reading_progress_current_chapter_id_fkey"
            columns: ["current_chapter_id"]
            isOneToOne: false
            referencedRelation: "book_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      book_sections: {
        Row: {
          chapter_id: string
          content: Json | null
          created_at: string
          id: string
          order_index: number
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          chapter_id: string
          content?: Json | null
          created_at?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          chapter_id?: string
          content?: Json | null
          created_at?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_sections_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "book_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author_name: string | null
          cover_template: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          genre: string | null
          id: string
          is_public: boolean | null
          language: string | null
          published_at: string | null
          reading_time_minutes: number | null
          settings: Json | null
          status: string | null
          subtitle: string | null
          title: string
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          author_name?: string | null
          cover_template?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean | null
          language?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          settings?: Json | null
          status?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          author_name?: string | null
          cover_template?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean | null
          language?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          settings?: Json | null
          status?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          word_count?: number | null
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
      business_documents: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_verified: boolean | null
          issue_date: string | null
          issuing_authority: string | null
          metadata: Json | null
          reference_number: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          metadata?: Json | null
          reference_number?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          metadata?: Json | null
          reference_number?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_links: {
        Row: {
          business_id: string
          created_at: string
          icon: string | null
          id: string
          label: string | null
          platform: string
          url: string
        }
        Insert: {
          business_id: string
          created_at?: string
          icon?: string | null
          id?: string
          label?: string | null
          platform: string
          url: string
        }
        Update: {
          business_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          label?: string | null
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_links_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          annual_revenue: number | null
          business_address: string | null
          business_name: string
          business_type: string
          cin: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          employee_count: number | null
          gstin: string | null
          huminex_workspace_id: string | null
          id: string
          incorporation_date: string | null
          industry: string | null
          legal_name: string | null
          logo_url: string | null
          pan: string | null
          phone: string | null
          pincode: string | null
          registered_address: string | null
          registration_number: string | null
          state: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          business_address?: string | null
          business_name: string
          business_type: string
          cin?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          employee_count?: number | null
          gstin?: string | null
          huminex_workspace_id?: string | null
          id?: string
          incorporation_date?: string | null
          industry?: string | null
          legal_name?: string | null
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          registered_address?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          business_address?: string | null
          business_name?: string
          business_type?: string
          cin?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          employee_count?: number | null
          gstin?: string | null
          huminex_workspace_id?: string | null
          id?: string
          incorporation_date?: string | null
          industry?: string | null
          legal_name?: string | null
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          registered_address?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      chapter_summaries: {
        Row: {
          chapter_index: number
          created_at: string
          id: string
          library_item_id: string
          summary_text: string
          summary_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_index: number
          created_at?: string
          id?: string
          library_item_id: string
          summary_text: string
          summary_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_index?: number
          created_at?: string
          id?: string
          library_item_id?: string
          summary_text?: string
          summary_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_summaries_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_shares: {
        Row: {
          access_count: number
          content_id: string
          content_type: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          recipient_email: string | null
          share_method: string
          share_token: string
          user_id: string
        }
        Insert: {
          access_count?: number
          content_id: string
          content_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          recipient_email?: string | null
          share_method: string
          share_token: string
          user_id: string
        }
        Update: {
          access_count?: number
          content_id?: string
          content_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          recipient_email?: string | null
          share_method?: string
          share_token?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          payout_details: Json | null
          payout_method: string | null
          processed_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payout_details?: Json | null
          payout_method?: string | null
          processed_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payout_details?: Json | null
          payout_method?: string | null
          processed_at?: string | null
          status?: string | null
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
      daily_badges: {
        Row: {
          badge_date: string
          badge_icon: string | null
          badge_name: string
          badge_type: string
          created_at: string
          description: string | null
          id: string
          points: number | null
          user_id: string
        }
        Insert: {
          badge_date?: string
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number | null
          user_id: string
        }
        Update: {
          badge_date?: string
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number | null
          user_id?: string
        }
        Relationships: []
      }
      document_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      document_shares: {
        Row: {
          access_type: string | null
          created_at: string
          document_id: string
          expires_at: string | null
          id: string
          shared_by: string
          shared_with_email: string
          shared_with_user_id: string | null
        }
        Insert: {
          access_type?: string | null
          created_at?: string
          document_id: string
          expires_at?: string | null
          id?: string
          shared_by: string
          shared_with_email: string
          shared_with_user_id?: string | null
        }
        Update: {
          access_type?: string | null
          created_at?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          shared_by?: string
          shared_with_email?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          document_type: string
          expiry_date: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_locked: boolean | null
          issue_date: string | null
          notes: string | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          document_type: string
          expiry_date?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_locked?: boolean | null
          issue_date?: string | null
          notes?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          document_type?: string
          expiry_date?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_locked?: boolean | null
          issue_date?: string | null
          notes?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      education_documents: {
        Row: {
          created_at: string
          document_type: string
          education_id: string
          file_url: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          education_id: string
          file_url: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          education_id?: string
          file_url?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_documents_education_id_fkey"
            columns: ["education_id"]
            isOneToOne: false
            referencedRelation: "education_records"
            referencedColumns: ["id"]
          },
        ]
      }
      education_records: {
        Row: {
          course: string | null
          created_at: string
          degree: string
          end_year: number | null
          id: string
          institution: string
          notes: string | null
          start_year: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course?: string | null
          created_at?: string
          degree: string
          end_year?: number | null
          id?: string
          institution: string
          notes?: string | null
          start_year?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course?: string | null
          created_at?: string
          degree?: string
          end_year?: number | null
          id?: string
          institution?: string
          notes?: string | null
          start_year?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_hash: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_hash: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          user_id?: string
          verified_at?: string | null
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
      error_logs: {
        Row: {
          created_at: string
          endpoint: string | null
          error_code: string | null
          error_message: string
          error_type: string
          id: string
          request_payload: Json | null
          resolved: boolean
          resolved_at: string | null
          severity: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          error_code?: string | null
          error_message: string
          error_type: string
          id?: string
          request_payload?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          error_code?: string | null
          error_message?: string
          error_type?: string
          id?: string
          request_payload?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          confidence_score: number | null
          created_at: string
          expense_date: string
          gmail_import_id: string | null
          id: string
          is_auto_generated: boolean | null
          is_overridden: boolean | null
          merchant_name: string | null
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
          confidence_score?: number | null
          created_at?: string
          expense_date?: string
          gmail_import_id?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_overridden?: boolean | null
          merchant_name?: string | null
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
          confidence_score?: number | null
          created_at?: string
          expense_date?: string
          gmail_import_id?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_overridden?: boolean | null
          merchant_name?: string | null
          notes?: string | null
          payment_mode?: string
          source_id?: string | null
          source_type?: string | null
          sub_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_gmail_import_id_fkey"
            columns: ["gmail_import_id"]
            isOneToOne: false
            referencedRelation: "auto_imported_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      family_audit_log: {
        Row: {
          action: string
          action_details: Json | null
          created_at: string
          document_id: string | null
          id: string
          ip_address: string | null
          member_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          action_details?: Json | null
          created_at?: string
          document_id?: string | null
          id?: string
          ip_address?: string | null
          member_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          action_details?: Json | null
          created_at?: string
          document_id?: string | null
          id?: string
          ip_address?: string | null
          member_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_audit_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "family_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_audit_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string
          file_name: string | null
          file_url: string | null
          id: string
          member_id: string
          notes: string | null
          updated_at: string
          upload_date: string | null
          user_id: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          member_id: string
          notes?: string | null
          updated_at?: string
          upload_date?: string | null
          user_id: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          updated_at?: string
          upload_date?: string | null
          user_id?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_documents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          date_of_death: string | null
          full_name: string
          gender: string | null
          generation_level: number | null
          id: string
          is_root: boolean | null
          is_verified: boolean | null
          notes: string | null
          parent_id: string | null
          photo_url: string | null
          place_of_birth: string | null
          place_of_death: string | null
          position_x: number | null
          position_y: number | null
          relationship: string
          spouse_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          full_name: string
          gender?: string | null
          generation_level?: number | null
          id?: string
          is_root?: boolean | null
          is_verified?: boolean | null
          notes?: string | null
          parent_id?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          place_of_death?: string | null
          position_x?: number | null
          position_y?: number | null
          relationship: string
          spouse_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          full_name?: string
          gender?: string | null
          generation_level?: number | null
          id?: string
          is_root?: boolean | null
          is_verified?: boolean | null
          notes?: string | null
          parent_id?: string | null
          photo_url?: string | null
          place_of_birth?: string | null
          place_of_death?: string | null
          position_x?: number | null
          position_y?: number | null
          relationship?: string
          spouse_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_spouse_id_fkey"
            columns: ["spouse_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_tree_exports: {
        Row: {
          certificate_id: string
          created_at: string
          export_format: string
          file_url: string | null
          generated_at: string
          generation_count: number | null
          id: string
          member_count: number | null
          user_id: string
        }
        Insert: {
          certificate_id: string
          created_at?: string
          export_format?: string
          file_url?: string | null
          generated_at?: string
          generation_count?: number | null
          id?: string
          member_count?: number | null
          user_id: string
        }
        Update: {
          certificate_id?: string
          created_at?: string
          export_format?: string
          file_url?: string | null
          generated_at?: string
          generation_count?: number | null
          id?: string
          member_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      finance_report_subscriptions: {
        Row: {
          created_at: string
          delivery_method: string
          id: string
          is_enabled: boolean | null
          last_sent_at: string | null
          next_scheduled_at: string | null
          report_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_method: string
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          next_scheduled_at?: string | null
          report_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_method?: string
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          next_scheduled_at?: string | null
          report_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financeflow_corrections: {
        Row: {
          corrected_value: Json | null
          correction_type: string
          created_at: string
          id: string
          original_transaction_id: string | null
          original_value: Json | null
          user_id: string
        }
        Insert: {
          corrected_value?: Json | null
          correction_type: string
          created_at?: string
          id?: string
          original_transaction_id?: string | null
          original_value?: Json | null
          user_id: string
        }
        Update: {
          corrected_value?: Json | null
          correction_type?: string
          created_at?: string
          id?: string
          original_transaction_id?: string | null
          original_value?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeflow_corrections_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "auto_imported_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      financeflow_sync_history: {
        Row: {
          created_at: string
          duplicates_detected: number
          emails_scanned: number
          error_message: string | null
          id: string
          imported_count: number
          status: string
          sync_duration_ms: number | null
          sync_type: string
          transactions_found: number
          user_id: string
        }
        Insert: {
          created_at?: string
          duplicates_detected?: number
          emails_scanned?: number
          error_message?: string | null
          id?: string
          imported_count?: number
          status?: string
          sync_duration_ms?: number | null
          sync_type?: string
          transactions_found?: number
          user_id: string
        }
        Update: {
          created_at?: string
          duplicates_detected?: number
          emails_scanned?: number
          error_message?: string | null
          id?: string
          imported_count?: number
          status?: string
          sync_duration_ms?: number | null
          sync_type?: string
          transactions_found?: number
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          auto_track: boolean
          category: string
          color: string | null
          completed_at: string | null
          created_at: string
          currency: string
          current_amount: number
          description: string | null
          icon: string | null
          id: string
          linked_accounts: string[] | null
          priority: string
          status: string
          target_amount: number
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_track?: boolean
          category: string
          color?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          linked_accounts?: string[] | null
          priority?: string
          status?: string
          target_amount: number
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_track?: boolean
          category?: string
          color?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          linked_accounts?: string[] | null
          priority?: string
          status?: string
          target_amount?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gmail_import_logs: {
        Row: {
          action: string
          created_at: string
          email_subject: string | null
          error_message: string | null
          gmail_message_id: string | null
          id: string
          metadata: Json | null
          source: string
          success: boolean
          transaction_amount: number | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          email_subject?: string | null
          error_message?: string | null
          gmail_message_id?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          success?: boolean
          transaction_amount?: number | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          email_subject?: string | null
          error_message?: string | null
          gmail_message_id?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          success?: boolean
          transaction_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      gmail_sync_settings: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          daily_import_count: number | null
          daily_import_date: string | null
          gmail_email: string | null
          id: string
          is_enabled: boolean
          is_paused: boolean | null
          last_auto_sync_at: string | null
          last_history_id: string | null
          last_sync_at: string | null
          refresh_token_encrypted: string | null
          scan_days: number | null
          scan_folders: Json | null
          scan_mode: string | null
          sync_frequency_minutes: number | null
          sync_status: string | null
          token_expires_at: string | null
          total_synced_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          daily_import_count?: number | null
          daily_import_date?: string | null
          gmail_email?: string | null
          id?: string
          is_enabled?: boolean
          is_paused?: boolean | null
          last_auto_sync_at?: string | null
          last_history_id?: string | null
          last_sync_at?: string | null
          refresh_token_encrypted?: string | null
          scan_days?: number | null
          scan_folders?: Json | null
          scan_mode?: string | null
          sync_frequency_minutes?: number | null
          sync_status?: string | null
          token_expires_at?: string | null
          total_synced_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          daily_import_count?: number | null
          daily_import_date?: string | null
          gmail_email?: string | null
          id?: string
          is_enabled?: boolean
          is_paused?: boolean | null
          last_auto_sync_at?: string | null
          last_history_id?: string | null
          last_sync_at?: string | null
          refresh_token_encrypted?: string | null
          scan_days?: number | null
          scan_folders?: Json | null
          scan_mode?: string | null
          sync_frequency_minutes?: number | null
          sync_status?: string | null
          token_expires_at?: string | null
          total_synced_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_contributions: {
        Row: {
          amount: number
          created_at: string
          goal_id: string
          id: string
          note: string | null
          source: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
          source?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "financial_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_milestones: {
        Row: {
          achieved_at: string | null
          created_at: string
          goal_id: string
          id: string
          target_percentage: number
          title: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string
          goal_id: string
          id?: string
          target_percentage: number
          title: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          target_percentage?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "financial_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      income_entries: {
        Row: {
          amount: number
          confidence_score: number | null
          created_at: string
          gmail_import_id: string | null
          id: string
          income_date: string
          income_source_id: string | null
          is_auto_generated: boolean | null
          merchant_name: string | null
          notes: string | null
          source_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          confidence_score?: number | null
          created_at?: string
          gmail_import_id?: string | null
          id?: string
          income_date?: string
          income_source_id?: string | null
          is_auto_generated?: boolean | null
          merchant_name?: string | null
          notes?: string | null
          source_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          confidence_score?: number | null
          created_at?: string
          gmail_import_id?: string | null
          id?: string
          income_date?: string
          income_source_id?: string | null
          is_auto_generated?: boolean | null
          merchant_name?: string | null
          notes?: string | null
          source_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_entries_gmail_import_id_fkey"
            columns: ["gmail_import_id"]
            isOneToOne: false
            referencedRelation: "auto_imported_transactions"
            referencedColumns: ["id"]
          },
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
      insurance_provider_categories: {
        Row: {
          created_at: string
          id: string
          policy_type: string
          provider_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          policy_type: string
          provider_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          policy_type?: string
          provider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_provider_categories_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          short_name: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          short_name?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          short_name?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
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
          document_url: string | null
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
          document_url?: string | null
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
          document_url?: string | null
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
      invoices: {
        Row: {
          amount: number
          billing_address: string | null
          billing_email: string | null
          billing_name: string | null
          company_address: string | null
          company_gstin: string | null
          company_name: string
          created_at: string
          currency: string
          customer_address: string | null
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          due_date: string | null
          gstin: string | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_pdf_url: string | null
          metadata: Json | null
          notes: string | null
          paid_at: string | null
          paid_date: string | null
          payment_history_id: string | null
          pdf_url: string | null
          plan_type: string
          status: string
          subscription_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          company_address?: string | null
          company_gstin?: string | null
          company_name?: string
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          due_date?: string | null
          gstin?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_pdf_url?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          paid_date?: string | null
          payment_history_id?: string | null
          pdf_url?: string | null
          plan_type: string
          status?: string
          subscription_id?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          company_address?: string | null
          company_gstin?: string | null
          company_name?: string
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          due_date?: string | null
          gstin?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_pdf_url?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          paid_date?: string | null
          payment_history_id?: string | null
          pdf_url?: string | null
          plan_type?: string
          status?: string
          subscription_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_payment_history_id_fkey"
            columns: ["payment_history_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      library_bookmarks: {
        Row: {
          created_at: string
          id: string
          library_item_id: string
          page_number: number
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          library_item_id: string
          page_number: number
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          library_item_id?: string
          page_number?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_bookmarks_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      library_highlights: {
        Row: {
          color: string | null
          created_at: string
          end_offset: number | null
          id: string
          library_item_id: string
          note: string | null
          page_number: number | null
          start_offset: number | null
          text_content: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          end_offset?: number | null
          id?: string
          library_item_id: string
          note?: string | null
          page_number?: number | null
          start_offset?: number | null
          text_content: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          end_offset?: number | null
          id?: string
          library_item_id?: string
          note?: string | null
          page_number?: number | null
          start_offset?: number | null
          text_content?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_highlights_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      library_items: {
        Row: {
          author: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          file_size: number | null
          file_url: string
          format: string
          id: string
          is_archived: boolean | null
          is_locked: boolean | null
          is_paid: boolean | null
          is_public: boolean | null
          is_shared: boolean | null
          lock_hash: string | null
          notes: string | null
          price: number | null
          share_token: string | null
          tags: string[] | null
          title: string
          total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          file_size?: number | null
          file_url: string
          format?: string
          id?: string
          is_archived?: boolean | null
          is_locked?: boolean | null
          is_paid?: boolean | null
          is_public?: boolean | null
          is_shared?: boolean | null
          lock_hash?: string | null
          notes?: string | null
          price?: number | null
          share_token?: string | null
          tags?: string[] | null
          title: string
          total_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          file_size?: number | null
          file_url?: string
          format?: string
          id?: string
          is_archived?: boolean | null
          is_locked?: boolean | null
          is_paid?: boolean | null
          is_public?: boolean | null
          is_shared?: boolean | null
          lock_hash?: string | null
          notes?: string | null
          price?: number | null
          share_token?: string | null
          tags?: string[] | null
          title?: string
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_purchases: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          library_item_id: string
          payment_reference: string | null
          payment_status: string | null
          seller_id: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          library_item_id: string
          payment_reference?: string | null
          payment_status?: string | null
          seller_id: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          library_item_id?: string
          payment_reference?: string | null
          payment_status?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_purchases_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      library_shares: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          library_item_id: string
          permission: string | null
          shared_by: string
          shared_with_email: string | null
          shared_with_user_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          library_item_id: string
          permission?: string | null
          shared_by: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          library_item_id?: string
          permission?: string | null
          shared_by?: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_shares_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
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
      memories: {
        Row: {
          collection_id: string | null
          created_at: string
          created_date: string
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          folder_id: string | null
          id: string
          is_locked: boolean | null
          media_type: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          created_date?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          folder_id?: string | null
          id?: string
          is_locked?: boolean | null
          media_type: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          created_date?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          folder_id?: string | null
          id?: string
          is_locked?: boolean | null
          media_type?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "memory_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "memory_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_collections: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_collections_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "memory_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_folders: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_locked: boolean | null
          lock_hash: string | null
          name: string
          parent_folder_id: string | null
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_locked?: boolean | null
          lock_hash?: string | null
          name: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_locked?: boolean | null
          lock_hash?: string | null
          name?: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "memory_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          color: string | null
          content: string | null
          content_json: Json | null
          created_at: string
          date_confidence: string | null
          emotion: string | null
          folder: string | null
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          linked_entities: Json | null
          location: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          color?: string | null
          content?: string | null
          content_json?: Json | null
          created_at?: string
          date_confidence?: string | null
          emotion?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          linked_entities?: Json | null
          location?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          color?: string | null
          content?: string | null
          content_json?: Json | null
          created_at?: string
          date_confidence?: string | null
          emotion?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          linked_entities?: Json | null
          location?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          payment_history_id: string | null
          processed_at: string | null
          razorpay_event_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json
          payment_history_id?: string | null
          processed_at?: string | null
          razorpay_event_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          payment_history_id?: string | null
          processed_at?: string | null
          razorpay_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_history_id_fkey"
            columns: ["payment_history_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          bank_reference: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          notes: Json | null
          payment_method: string | null
          payment_method_details: Json | null
          plan_type: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          receipt_sent: boolean | null
          receipt_sent_at: string | null
          refund_amount: number | null
          refund_id: string | null
          refunded_at: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          notes?: Json | null
          payment_method?: string | null
          payment_method_details?: Json | null
          plan_type: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          receipt_sent?: boolean | null
          receipt_sent_at?: string | null
          refund_amount?: number | null
          refund_id?: string | null
          refunded_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          notes?: Json | null
          payment_method?: string | null
          payment_method_details?: Json | null
          plan_type?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          receipt_sent?: boolean | null
          receipt_sent_at?: string | null
          refund_amount?: number | null
          refund_id?: string | null
          refunded_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_subscription"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          billing_address: string
          billing_city: string
          billing_gstin: string | null
          billing_name: string
          billing_pincode: string
          billing_state: string
          created_at: string
          currency: string | null
          id: string
          invoice_number: string | null
          invoice_sent_at: string | null
          plan: string
          razorpay_order_id: string
          razorpay_payment_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_address: string
          billing_city: string
          billing_gstin?: string | null
          billing_name: string
          billing_pincode: string
          billing_state: string
          created_at?: string
          currency?: string | null
          id?: string
          invoice_number?: string | null
          invoice_sent_at?: string | null
          plan: string
          razorpay_order_id: string
          razorpay_payment_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_address?: string
          billing_city?: string
          billing_gstin?: string | null
          billing_name?: string
          billing_pincode?: string
          billing_state?: string
          created_at?: string
          currency?: string | null
          id?: string
          invoice_number?: string | null
          invoice_sent_at?: string | null
          plan?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          ai_parsing_per_month: number
          created_at: string
          features: Json | null
          gmail_imports_per_month: number
          id: string
          is_active: boolean
          ocr_scans_per_month: number
          plan_type: string
          price_inr: number
          price_usd: number
          storage_gb: number
          trial_duration_days: number | null
          updated_at: string
          yearly_price_inr: number | null
          yearly_price_usd: number | null
        }
        Insert: {
          ai_parsing_per_month?: number
          created_at?: string
          features?: Json | null
          gmail_imports_per_month?: number
          id?: string
          is_active?: boolean
          ocr_scans_per_month?: number
          plan_type: string
          price_inr?: number
          price_usd?: number
          storage_gb?: number
          trial_duration_days?: number | null
          updated_at?: string
          yearly_price_inr?: number | null
          yearly_price_usd?: number | null
        }
        Update: {
          ai_parsing_per_month?: number
          created_at?: string
          features?: Json | null
          gmail_imports_per_month?: number
          id?: string
          is_active?: boolean
          ocr_scans_per_month?: number
          plan_type?: string
          price_inr?: number
          price_usd?: number
          storage_gb?: number
          trial_duration_days?: number | null
          updated_at?: string
          yearly_price_inr?: number | null
          yearly_price_usd?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio_updated_at: string | null
          birth_date: string | null
          blood_group: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          height_cm: number | null
          id: string
          phone_number: string | null
          phone_verified: boolean | null
          primary_contact: string | null
          secondary_email: string | null
          secondary_phone: string | null
          target_age: number | null
          updated_at: string | null
          username: string | null
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio_updated_at?: string | null
          birth_date?: string | null
          blood_group?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          height_cm?: number | null
          id: string
          phone_number?: string | null
          phone_verified?: boolean | null
          primary_contact?: string | null
          secondary_email?: string | null
          secondary_phone?: string | null
          target_age?: number | null
          updated_at?: string | null
          username?: string | null
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio_updated_at?: string | null
          birth_date?: string | null
          blood_group?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          height_cm?: number | null
          id?: string
          phone_number?: string | null
          phone_verified?: boolean | null
          primary_contact?: string | null
          secondary_email?: string | null
          secondary_phone?: string | null
          target_age?: number | null
          updated_at?: string | null
          username?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      reading_highlights: {
        Row: {
          color: string | null
          created_at: string
          id: string
          item_id: string
          note: string | null
          page_number: number
          position_data: Json | null
          text_snippet: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          item_id: string
          note?: string | null
          page_number: number
          position_data?: Json | null
          text_snippet?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          item_id?: string
          note?: string | null
          page_number?: number
          position_data?: Json | null
          text_snippet?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_highlights_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sessions: {
        Row: {
          duration_minutes: number | null
          end_time: string | null
          id: string
          library_item_id: string
          pages_read: number | null
          start_time: string
          user_id: string
        }
        Insert: {
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          library_item_id: string
          pages_read?: number | null
          start_time?: string
          user_id: string
        }
        Update: {
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          library_item_id?: string
          pages_read?: number | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_state: {
        Row: {
          completed_at: string | null
          created_at: string
          font_size: number | null
          id: string
          item_id: string
          last_page: number | null
          last_read_at: string | null
          progress_percent: number | null
          reading_mode: string | null
          theme: string | null
          total_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          font_size?: number | null
          id?: string
          item_id: string
          last_page?: number | null
          last_read_at?: string | null
          progress_percent?: number | null
          reading_mode?: string | null
          theme?: string | null
          total_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          font_size?: number | null
          id?: string
          item_id?: string
          last_page?: number | null
          last_read_at?: string | null
          progress_percent?: number | null
          reading_mode?: string | null
          theme?: string | null
          total_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_state_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      redemption_requests: {
        Row: {
          amount_rupees: number
          created_at: string
          id: string
          notes: string | null
          payment_details: Json | null
          payment_method: string
          points_to_redeem: number
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_rupees: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method: string
          points_to_redeem: number
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_rupees?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string
          points_to_redeem?: number
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      rewards_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      salary_records: {
        Row: {
          annual_amount: number | null
          bonus: number | null
          created_at: string
          effective_date: string | null
          id: string
          monthly_amount: number | null
          notes: string | null
          salary_type: string
          updated_at: string
          user_id: string
          variable_pay: number | null
          work_history_id: string
        }
        Insert: {
          annual_amount?: number | null
          bonus?: number | null
          created_at?: string
          effective_date?: string | null
          id?: string
          monthly_amount?: number | null
          notes?: string | null
          salary_type?: string
          updated_at?: string
          user_id: string
          variable_pay?: number | null
          work_history_id: string
        }
        Update: {
          annual_amount?: number | null
          bonus?: number | null
          created_at?: string
          effective_date?: string | null
          id?: string
          monthly_amount?: number | null
          notes?: string | null
          salary_type?: string
          updated_at?: string
          user_id?: string
          variable_pay?: number | null
          work_history_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_work_history_id_fkey"
            columns: ["work_history_id"]
            isOneToOne: false
            referencedRelation: "work_history"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          deadline: string | null
          goal_name: string
          id: string
          is_active: boolean
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_name: string
          id?: string
          is_active?: boolean
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_name?: string
          id?: string
          is_active?: boolean
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content_text: string
          created_at: string
          id: string
          media_attachments: Json | null
          notes: string | null
          platform_content: Json | null
          post_type: string
          preview_data: Json | null
          preview_generated_at: string | null
          rejection_reason: string | null
          requires_approval: boolean | null
          scheduled_at: string | null
          status: string
          tags: string[] | null
          target_platforms: string[]
          timezone: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content_text: string
          created_at?: string
          id?: string
          media_attachments?: Json | null
          notes?: string | null
          platform_content?: Json | null
          post_type?: string
          preview_data?: Json | null
          preview_generated_at?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          scheduled_at?: string | null
          status?: string
          tags?: string[] | null
          target_platforms?: string[]
          timezone?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content_text?: string
          created_at?: string
          id?: string
          media_attachments?: Json | null
          notes?: string | null
          platform_content?: Json | null
          post_type?: string
          preview_data?: Json | null
          preview_generated_at?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          scheduled_at?: string | null
          status?: string
          tags?: string[] | null
          target_platforms?: string[]
          timezone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_integrations: {
        Row: {
          access_token_encrypted: string | null
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          connection_type: string
          created_at: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          platform: string
          platform_avatar_url: string | null
          platform_display_name: string | null
          platform_metadata: Json | null
          platform_user_id: string | null
          platform_username: string | null
          refresh_token_encrypted: string | null
          scopes: string[] | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          connection_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          platform: string
          platform_avatar_url?: string | null
          platform_display_name?: string | null
          platform_metadata?: Json | null
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          connection_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          platform?: string
          platform_avatar_url?: string | null
          platform_display_name?: string | null
          platform_metadata?: Json | null
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_platform_config: {
        Row: {
          api_docs_url: string | null
          color: string | null
          created_at: string
          developer_portal_url: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          max_media_size_mb: number | null
          max_post_length: number | null
          notes: string | null
          oauth_authorize_url: string | null
          oauth_scopes: string[] | null
          oauth_token_url: string | null
          platform: string
          rate_limit_requests: number | null
          rate_limit_window_seconds: number | null
          supports_api_key: boolean | null
          supports_media_types: string[] | null
          supports_oauth: boolean | null
          supports_publish: boolean | null
          supports_read: boolean | null
          supports_schedule: boolean | null
          updated_at: string
        }
        Insert: {
          api_docs_url?: string | null
          color?: string | null
          created_at?: string
          developer_portal_url?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_media_size_mb?: number | null
          max_post_length?: number | null
          notes?: string | null
          oauth_authorize_url?: string | null
          oauth_scopes?: string[] | null
          oauth_token_url?: string | null
          platform: string
          rate_limit_requests?: number | null
          rate_limit_window_seconds?: number | null
          supports_api_key?: boolean | null
          supports_media_types?: string[] | null
          supports_oauth?: boolean | null
          supports_publish?: boolean | null
          supports_read?: boolean | null
          supports_schedule?: boolean | null
          updated_at?: string
        }
        Update: {
          api_docs_url?: string | null
          color?: string | null
          created_at?: string
          developer_portal_url?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_media_size_mb?: number | null
          max_post_length?: number | null
          notes?: string | null
          oauth_authorize_url?: string | null
          oauth_scopes?: string[] | null
          oauth_token_url?: string | null
          platform?: string
          rate_limit_requests?: number | null
          rate_limit_window_seconds?: number | null
          supports_api_key?: boolean | null
          supports_media_types?: string[] | null
          supports_oauth?: boolean | null
          supports_publish?: boolean | null
          supports_read?: boolean | null
          supports_schedule?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          comments_count: number | null
          content_preview: string | null
          content_text: string | null
          engagement_rate: number | null
          fetched_at: string
          hashtags: string[] | null
          id: string
          integration_id: string | null
          likes_count: number | null
          media_urls: Json | null
          mentions: string[] | null
          platform: string
          platform_metadata: Json | null
          platform_permalink: string | null
          platform_post_id: string
          post_type: string
          posted_at: string
          shares_count: number | null
          thumbnails: Json | null
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          content_preview?: string | null
          content_text?: string | null
          engagement_rate?: number | null
          fetched_at?: string
          hashtags?: string[] | null
          id?: string
          integration_id?: string | null
          likes_count?: number | null
          media_urls?: Json | null
          mentions?: string[] | null
          platform: string
          platform_metadata?: Json | null
          platform_permalink?: string | null
          platform_post_id: string
          post_type?: string
          posted_at: string
          shares_count?: number | null
          thumbnails?: Json | null
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          content_preview?: string | null
          content_text?: string | null
          engagement_rate?: number | null
          fetched_at?: string
          hashtags?: string[] | null
          id?: string
          integration_id?: string | null
          likes_count?: number | null
          media_urls?: Json | null
          mentions?: string[] | null
          platform?: string
          platform_metadata?: Json | null
          platform_permalink?: string | null
          platform_post_id?: string
          post_type?: string
          posted_at?: string
          shares_count?: number | null
          thumbnails?: Json | null
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "social_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_profiles: {
        Row: {
          connection_type: string
          created_at: string
          custom_name: string | null
          id: string
          last_post_date: string | null
          last_sync_at: string | null
          logo_url: string | null
          notes_encrypted: string | null
          platform: string
          profile_url: string | null
          sort_order: number | null
          status: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          connection_type?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          last_post_date?: string | null
          last_sync_at?: string | null
          logo_url?: string | null
          notes_encrypted?: string | null
          platform: string
          profile_url?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          connection_type?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          last_post_date?: string | null
          last_sync_at?: string | null
          logo_url?: string | null
          notes_encrypted?: string | null
          platform?: string
          profile_url?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      social_publish_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          draft_id: string
          id: string
          integration_id: string
          last_error: string | null
          max_retries: number | null
          next_retry_at: string | null
          platform: string
          priority: number | null
          published_id: string | null
          retry_count: number | null
          scheduled_at: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          draft_id: string
          id?: string
          integration_id: string
          last_error?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          platform: string
          priority?: number | null
          published_id?: string | null
          retry_count?: number | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          draft_id?: string
          id?: string
          integration_id?: string
          last_error?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          platform?: string
          priority?: number | null
          published_id?: string | null
          retry_count?: number | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_publish_queue_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "social_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_publish_queue_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "social_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_publish_queue_published_id_fkey"
            columns: ["published_id"]
            isOneToOne: false
            referencedRelation: "social_published"
            referencedColumns: ["id"]
          },
        ]
      }
      social_published: {
        Row: {
          content_snapshot: string | null
          created_at: string
          draft_id: string | null
          error_message: string | null
          id: string
          initial_metrics: Json | null
          integration_id: string | null
          latest_metrics: Json | null
          media_snapshot: Json | null
          metrics_updated_at: string | null
          platform: string
          platform_permalink: string | null
          platform_post_id: string | null
          published_at: string
          retry_count: number | null
          status: string
          user_id: string
        }
        Insert: {
          content_snapshot?: string | null
          created_at?: string
          draft_id?: string | null
          error_message?: string | null
          id?: string
          initial_metrics?: Json | null
          integration_id?: string | null
          latest_metrics?: Json | null
          media_snapshot?: Json | null
          metrics_updated_at?: string | null
          platform: string
          platform_permalink?: string | null
          platform_post_id?: string | null
          published_at?: string
          retry_count?: number | null
          status?: string
          user_id: string
        }
        Update: {
          content_snapshot?: string | null
          created_at?: string
          draft_id?: string | null
          error_message?: string | null
          id?: string
          initial_metrics?: Json | null
          integration_id?: string | null
          latest_metrics?: Json | null
          media_snapshot?: Json | null
          metrics_updated_at?: string | null
          platform?: string
          platform_permalink?: string | null
          platform_post_id?: string | null
          published_at?: string
          retry_count?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_published_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "social_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_published_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "social_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_holdings: {
        Row: {
          average_price: number
          created_at: string
          current_price: number | null
          exchange: string
          id: string
          last_price_update: string | null
          name: string | null
          quantity: number
          sector: string | null
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          average_price: number
          created_at?: string
          current_price?: number | null
          exchange?: string
          id?: string
          last_price_update?: string | null
          name?: string | null
          quantity: number
          sector?: string | null
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          average_price?: number
          created_at?: string
          current_price?: number | null
          exchange?: string
          id?: string
          last_price_update?: string | null
          name?: string | null
          quantity?: number
          sector?: string | null
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_chapters: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "study_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_explanations: {
        Row: {
          chapter_index: number | null
          created_at: string
          explanation_text: string
          id: string
          library_item_id: string | null
          original_text: string
          paragraph_hash: string | null
          user_id: string
        }
        Insert: {
          chapter_index?: number | null
          created_at?: string
          explanation_text: string
          id?: string
          library_item_id?: string | null
          original_text: string
          paragraph_hash?: string | null
          user_id: string
        }
        Update: {
          chapter_index?: number | null
          created_at?: string
          explanation_text?: string
          id?: string
          library_item_id?: string | null
          original_text?: string
          paragraph_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_explanations_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
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
      study_modules: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_modules_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "study_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      study_subjects: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_default: boolean
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
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
      subscriptions: {
        Row: {
          amount_paid: number
          cancelled_at: string | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          is_trial: boolean | null
          payment_method: string | null
          plan_type: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          started_at: string
          status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          is_trial?: boolean | null
          payment_method?: string | null
          plan_type: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          is_trial?: boolean | null
          payment_method?: string | null
          plan_type?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      syllabus_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          notes: string | null
          progress_percentage: number
          sort_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number
          file_type: string
          file_url: string
          id?: string
          notes?: string | null
          progress_percentage?: number
          sort_order?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          progress_percentage?: number
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      syllabus_modules: {
        Row: {
          created_at: string
          id: string
          module_name: string
          module_order: number | null
          notes: string | null
          phase_id: string
          source_page: string | null
          status: string | null
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_name: string
          module_order?: number | null
          notes?: string | null
          phase_id: string
          source_page?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_name?: string
          module_order?: number | null
          notes?: string | null
          phase_id?: string
          source_page?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_modules_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "syllabus_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_phases: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          phase_name: string
          phase_order: number | null
          source_page: string | null
          status: string | null
          syllabus_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          phase_name: string
          phase_order?: number | null
          source_page?: string | null
          status?: string | null
          syllabus_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          phase_name?: string
          phase_order?: number | null
          source_page?: string | null
          status?: string | null
          syllabus_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      syllabus_topics: {
        Row: {
          chapter_id: string | null
          chapter_name: string
          completed_at: string | null
          created_at: string | null
          ease_factor: number | null
          estimated_hours: number | null
          id: string
          interval_days: number | null
          is_completed: boolean | null
          module_id: string | null
          next_review_date: string | null
          notes: string | null
          priority: number | null
          review_count: number | null
          sort_order: number | null
          source_page: string | null
          status: string | null
          subject: string
          subject_id: string | null
          time_spent_minutes: number | null
          topic_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          chapter_name: string
          completed_at?: string | null
          created_at?: string | null
          ease_factor?: number | null
          estimated_hours?: number | null
          id?: string
          interval_days?: number | null
          is_completed?: boolean | null
          module_id?: string | null
          next_review_date?: string | null
          notes?: string | null
          priority?: number | null
          review_count?: number | null
          sort_order?: number | null
          source_page?: string | null
          status?: string | null
          subject: string
          subject_id?: string | null
          time_spent_minutes?: number | null
          topic_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          chapter_name?: string
          completed_at?: string | null
          created_at?: string | null
          ease_factor?: number | null
          estimated_hours?: number | null
          id?: string
          interval_days?: number | null
          is_completed?: boolean | null
          module_id?: string | null
          next_review_date?: string | null
          notes?: string | null
          priority?: number | null
          review_count?: number | null
          sort_order?: number | null
          source_page?: string | null
          status?: string | null
          subject?: string
          subject_id?: string | null
          time_spent_minutes?: number | null
          topic_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "study_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "syllabus_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "study_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          created_at: string
          default_priority: string | null
          description: string | null
          icon: string | null
          id: string
          is_recurring: boolean | null
          name: string
          recurrence_days: number[] | null
          recurrence_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_priority?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_recurring?: boolean | null
          name: string
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_priority?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          category: string | null
          created_at: string | null
          date: string
          duration_hours: number | null
          end_time: string | null
          id: string
          is_recurring: boolean | null
          linked_topic_id: string | null
          parent_recurring_id: string | null
          priority: string | null
          recurrence_days: number[] | null
          recurrence_type: string | null
          start_time: string | null
          status: string
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date?: string
          duration_hours?: number | null
          end_time?: string | null
          id?: string
          is_recurring?: boolean | null
          linked_topic_id?: string | null
          parent_recurring_id?: string | null
          priority?: string | null
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          start_time?: string | null
          status?: string
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string
          duration_hours?: number | null
          end_time?: string | null
          id?: string
          is_recurring?: boolean | null
          linked_topic_id?: string | null
          parent_recurring_id?: string | null
          priority?: string | null
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          start_time?: string | null
          status?: string
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_linked_topic_id_fkey"
            columns: ["linked_topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_parent_recurring_id_fkey"
            columns: ["parent_recurring_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          created_at: string
          id: string
          last_used_at: string
          usage_count: number
          usage_month: string
          usage_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string
          usage_count?: number
          usage_month: string
          usage_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string
          usage_count?: number
          usage_month?: string
          usage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_2fa: {
        Row: {
          backup_codes_hash: string[] | null
          backup_codes_used: number
          created_at: string
          id: string
          last_2fa_at: string | null
          totp_enabled: boolean
          totp_secret_encrypted: string | null
          totp_verified_at: string | null
          updated_at: string
          user_id: string
          webauthn_enabled: boolean
        }
        Insert: {
          backup_codes_hash?: string[] | null
          backup_codes_used?: number
          created_at?: string
          id?: string
          last_2fa_at?: string | null
          totp_enabled?: boolean
          totp_secret_encrypted?: string | null
          totp_verified_at?: string | null
          updated_at?: string
          user_id: string
          webauthn_enabled?: boolean
        }
        Update: {
          backup_codes_hash?: string[] | null
          backup_codes_used?: number
          created_at?: string
          id?: string
          last_2fa_at?: string | null
          totp_enabled?: boolean
          totp_secret_encrypted?: string | null
          totp_verified_at?: string | null
          updated_at?: string
          user_id?: string
          webauthn_enabled?: boolean
        }
        Relationships: []
      }
      user_action_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          module: string
          source: string
          success: boolean
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module: string
          source?: string
          success?: boolean
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module?: string
          source?: string
          success?: boolean
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_assets: {
        Row: {
          account_number_mask: string | null
          address: string | null
          asset_name: string
          bank_name: string | null
          broker_platform: string | null
          category_code: string
          created_at: string
          currency: string | null
          current_value: number | null
          description: string | null
          id: string
          interest_rate: number | null
          is_active: boolean | null
          isin: string | null
          last_valuation_date: string | null
          maturity_date: string | null
          metadata: Json | null
          notes: string | null
          ownership_percent: number | null
          policy_number: string | null
          premium_amount: number | null
          purchase_date: string | null
          purchase_value: number | null
          quantity: number | null
          rental_income: number | null
          subcategory: string
          sum_assured: number | null
          symbol: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number_mask?: string | null
          address?: string | null
          asset_name: string
          bank_name?: string | null
          broker_platform?: string | null
          category_code: string
          created_at?: string
          currency?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          isin?: string | null
          last_valuation_date?: string | null
          maturity_date?: string | null
          metadata?: Json | null
          notes?: string | null
          ownership_percent?: number | null
          policy_number?: string | null
          premium_amount?: number | null
          purchase_date?: string | null
          purchase_value?: number | null
          quantity?: number | null
          rental_income?: number | null
          subcategory: string
          sum_assured?: number | null
          symbol?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number_mask?: string | null
          address?: string | null
          asset_name?: string
          bank_name?: string | null
          broker_platform?: string | null
          category_code?: string
          created_at?: string
          currency?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          isin?: string | null
          last_valuation_date?: string | null
          maturity_date?: string | null
          metadata?: Json | null
          notes?: string | null
          ownership_percent?: number | null
          policy_number?: string | null
          premium_amount?: number | null
          purchase_date?: string | null
          purchase_value?: number | null
          quantity?: number | null
          rental_income?: number | null
          subcategory?: string
          sum_assured?: number | null
          symbol?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          available_points: number | null
          created_at: string
          id: string
          lifetime_earnings_rupees: number | null
          redeemed_points: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number | null
          created_at?: string
          id?: string
          lifetime_earnings_rupees?: number | null
          redeemed_points?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number | null
          created_at?: string
          id?: string
          lifetime_earnings_rupees?: number | null
          redeemed_points?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vault_items: {
        Row: {
          category: string | null
          created_at: string
          encrypted_data: string
          icon: string | null
          id: string
          last_accessed_at: string | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          encrypted_data: string
          icon?: string | null
          id?: string
          last_accessed_at?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          encrypted_data?: string
          icon?: string | null
          id?: string
          last_accessed_at?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          antonyms: string[] | null
          created_at: string
          examples: Json | null
          id: string
          language: string
          last_seen_at: string | null
          lookup_count: number | null
          meaning: string
          phonetic: string | null
          source_ref_id: string | null
          source_type: string | null
          synonyms: string[] | null
          translation_language: string | null
          translation_text: string | null
          user_id: string
          word: string
        }
        Insert: {
          antonyms?: string[] | null
          created_at?: string
          examples?: Json | null
          id?: string
          language?: string
          last_seen_at?: string | null
          lookup_count?: number | null
          meaning: string
          phonetic?: string | null
          source_ref_id?: string | null
          source_type?: string | null
          synonyms?: string[] | null
          translation_language?: string | null
          translation_text?: string | null
          user_id: string
          word: string
        }
        Update: {
          antonyms?: string[] | null
          created_at?: string
          examples?: Json | null
          id?: string
          language?: string
          last_seen_at?: string | null
          lookup_count?: number | null
          meaning?: string
          phonetic?: string | null
          source_ref_id?: string | null
          source_type?: string | null
          synonyms?: string[] | null
          translation_language?: string | null
          translation_text?: string | null
          user_id?: string
          word?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          device_type: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "study_leaderboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      weekly_study_schedule: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          subject: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          subject: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          subject?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_study_schedule_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      work_documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string
          id: string
          title: string
          user_id: string
          work_history_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          title: string
          user_id: string
          work_history_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          title?: string
          user_id?: string
          work_history_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_documents_work_history_id_fkey"
            columns: ["work_history_id"]
            isOneToOne: false
            referencedRelation: "work_history"
            referencedColumns: ["id"]
          },
        ]
      }
      work_history: {
        Row: {
          company_name: string
          created_at: string
          employment_type: string
          end_date: string | null
          id: string
          is_current: boolean | null
          notes: string | null
          role: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          employment_type?: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          role: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          employment_type?: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          role?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      study_leaderboard: {
        Row: {
          avatar_url: string | null
          completed_topics: number | null
          current_streak: number | null
          display_name: string | null
          study_hours: number | null
          total_points: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_reward_points: {
        Args: {
          p_description?: string
          p_points: number
          p_reference_id?: string
          p_reference_type?: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      check_usage_limit: {
        Args: { p_plan_type: string; p_usage_type: string; p_user_id: string }
        Returns: Json
      }
      generate_invoice_number: { Args: never; Returns: string }
      increment_usage: {
        Args: { p_count?: number; p_usage_type: string; p_user_id: string }
        Returns: undefined
      }
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
