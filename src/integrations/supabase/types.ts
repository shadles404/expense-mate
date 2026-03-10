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
      admin_sub_users: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          is_active: boolean
          sub_user_id: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          sub_user_id: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sub_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          category: Database["public"]["Enums"]["expense_category"]
          category_id: string | null
          created_at: string
          description: string
          id: string
          price: number
          project_id: string
          quantity: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["expense_category"]
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          price?: number
          project_id: string
          quantity?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["expense_category"]
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          price?: number
          project_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          default_payment_terms: string | null
          id: string
          include_signature_line: boolean | null
          invoice_prefix: string | null
          logo_url: string | null
          next_invoice_number: number | null
          tax_enabled: boolean | null
          tax_rate: number | null
          thank_you_message: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          default_payment_terms?: string | null
          id?: string
          include_signature_line?: boolean | null
          invoice_prefix?: string | null
          logo_url?: string | null
          next_invoice_number?: number | null
          tax_enabled?: boolean | null
          tax_rate?: number | null
          thank_you_message?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          default_payment_terms?: string | null
          id?: string
          include_signature_line?: boolean | null
          invoice_prefix?: string | null
          logo_url?: string | null
          next_invoice_number?: number | null
          tax_enabled?: boolean | null
          tax_rate?: number | null
          thank_you_message?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_name: string | null
          created_at: string
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          project_id: string
          status: string | null
          subtotal: number
          tax_amount: number | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          project_id: string
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          project_id?: string
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      job_activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          job_id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          job_id: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          job_id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_activity_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_notes: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          job_location: string | null
          job_title: string
          job_type: Database["public"]["Enums"]["job_type"]
          map_link: string | null
          person_name: string
          reminder_enabled: boolean
          reminder_minutes_before: number | null
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          job_location?: string | null
          job_title: string
          job_type?: Database["public"]["Enums"]["job_type"]
          map_link?: string | null
          person_name: string
          reminder_enabled?: boolean
          reminder_minutes_before?: number | null
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          job_location?: string | null
          job_title?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          map_link?: string | null
          person_name?: string
          reminder_enabled?: boolean
          reminder_minutes_before?: number | null
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      module_permissions: {
        Row: {
          access_level: string
          created_at: string
          granted_by: string | null
          id: string
          module_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          module_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          module_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          amount_paid: number
          budget: number | null
          created_at: string
          id: string
          payment_due_date: string | null
          payment_status: Database["public"]["Enums"]["payment_project_status"]
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_paid?: number
          budget?: number | null
          created_at?: string
          id?: string
          payment_due_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_project_status"]
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          budget?: number | null
          created_at?: string
          id?: string
          payment_due_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_project_status"]
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tiktok_advertisers: {
        Row: {
          ad_types: Database["public"]["Enums"]["ad_type"][]
          agreement_end_date: string | null
          agreement_start_date: string | null
          category: string | null
          completed_videos: number
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          salary: number
          target_videos: number
          targets_locked: boolean
          tiktok_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_types?: Database["public"]["Enums"]["ad_type"][]
          agreement_end_date?: string | null
          agreement_start_date?: string | null
          category?: string | null
          completed_videos?: number
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          salary?: number
          target_videos?: number
          targets_locked?: boolean
          tiktok_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_types?: Database["public"]["Enums"]["ad_type"][]
          agreement_end_date?: string | null
          agreement_start_date?: string | null
          category?: string | null
          completed_videos?: number
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          salary?: number
          target_videos?: number
          targets_locked?: boolean
          tiktok_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tiktok_deliveries: {
        Row: {
          advertiser_id: string
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          submission_date: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          video_link: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          submission_date?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          video_link: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          submission_date?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          video_link?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_deliveries_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "tiktok_advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_delivery_records: {
        Row: {
          advertiser_id: string
          created_at: string
          delivery_date: string
          delivery_person_name: string
          delivery_time: string
          id: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["delivery_record_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          delivery_date?: string
          delivery_person_name: string
          delivery_time?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["delivery_record_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          delivery_date?: string
          delivery_person_name?: string
          delivery_time?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["delivery_record_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_delivery_records_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "tiktok_advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_monthly_reports: {
        Row: {
          active_influencers: number
          created_at: string
          id: string
          reached_target: number
          report_data: Json | null
          report_month: string
          total_completed_videos: number
          total_deliveries: number
          total_influencers: number
          total_payments_made: number
          total_payments_pending: number
          total_target_videos: number
          unreached_target: number
          user_id: string
        }
        Insert: {
          active_influencers?: number
          created_at?: string
          id?: string
          reached_target?: number
          report_data?: Json | null
          report_month: string
          total_completed_videos?: number
          total_deliveries?: number
          total_influencers?: number
          total_payments_made?: number
          total_payments_pending?: number
          total_target_videos?: number
          unreached_target?: number
          user_id: string
        }
        Update: {
          active_influencers?: number
          created_at?: string
          id?: string
          reached_target?: number
          report_data?: Json | null
          report_month?: string
          total_completed_videos?: number
          total_deliveries?: number
          total_influencers?: number
          total_payments_made?: number
          total_payments_pending?: number
          total_target_videos?: number
          unreached_target?: number
          user_id?: string
        }
        Relationships: []
      }
      tiktok_payment_history: {
        Row: {
          advertiser_id: string
          campaign_month: string
          completed_videos: number
          created_at: string
          id: string
          payment_amount: number
          payment_date: string | null
          payment_status: string
          target_videos: number
          user_id: string
        }
        Insert: {
          advertiser_id: string
          campaign_month: string
          completed_videos?: number
          created_at?: string
          id?: string
          payment_amount?: number
          payment_date?: string | null
          payment_status?: string
          target_videos?: number
          user_id: string
        }
        Update: {
          advertiser_id?: string
          campaign_month?: string
          completed_videos?: number
          created_at?: string
          id?: string
          payment_amount?: number
          payment_date?: string | null
          payment_status?: string
          target_videos?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_payment_history_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "tiktok_advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_payments: {
        Row: {
          advertiser_id: string
          amount: number
          approved_at: string | null
          approved_by: string | null
          campaign_month: string | null
          completed_videos: number | null
          created_at: string
          id: string
          notes: string | null
          payment_date: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          total_target_videos: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          advertiser_id: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          campaign_month?: string | null
          completed_videos?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          total_target_videos?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          advertiser_id?: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          campaign_month?: string | null
          completed_videos?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          total_target_videos?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_payments_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "tiktok_advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_product_deliveries: {
        Row: {
          advertiser_id: string
          company_name: string | null
          created_at: string
          date_sent: string
          delivery_person: string | null
          id: string
          notes: string | null
          payment_status: string
          price: number
          product_name: string
          quantity: number
          status: Database["public"]["Enums"]["product_delivery_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          advertiser_id: string
          company_name?: string | null
          created_at?: string
          date_sent?: string
          delivery_person?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          price?: number
          product_name: string
          quantity?: number
          status?: Database["public"]["Enums"]["product_delivery_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          advertiser_id?: string
          company_name?: string | null
          created_at?: string
          date_sent?: string
          delivery_person?: string | null
          id?: string
          notes?: string | null
          payment_status?: string
          price?: number
          product_name?: string
          quantity?: number
          status?: Database["public"]["Enums"]["product_delivery_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_product_deliveries_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "tiktok_advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_section_permissions: {
        Row: {
          access_level: string
          created_at: string
          granted_by: string | null
          id: string
          section_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          section_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          section_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tiktok_settings: {
        Row: {
          created_at: string
          currency: string | null
          default_contract_type:
            | Database["public"]["Enums"]["contract_type"]
            | null
          default_platform: Database["public"]["Enums"]["platform_type"] | null
          delivery_budget: number | null
          id: string
          monthly_influencer_budget: number | null
          tax_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          default_contract_type?:
            | Database["public"]["Enums"]["contract_type"]
            | null
          default_platform?: Database["public"]["Enums"]["platform_type"] | null
          delivery_budget?: number | null
          id?: string
          monthly_influencer_budget?: number | null
          tax_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          default_contract_type?:
            | Database["public"]["Enums"]["contract_type"]
            | null
          default_platform?: Database["public"]["Enums"]["platform_type"] | null
          delivery_budget?: number | null
          id?: string
          monthly_influencer_budget?: number | null
          tax_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tiktok_tracking_history: {
        Row: {
          advertiser_id: string
          completed_videos: number
          created_at: string
          id: string
          reached_target: boolean
          target_videos: number
          tracking_month: string
          user_id: string
        }
        Insert: {
          advertiser_id: string
          completed_videos?: number
          created_at?: string
          id?: string
          reached_target?: boolean
          target_videos?: number
          tracking_month: string
          user_id: string
        }
        Update: {
          advertiser_id?: string
          completed_videos?: number
          created_at?: string
          id?: string
          reached_target?: boolean
          target_videos?: number
          tracking_month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_tracking_history_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "tiktok_advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_user_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_sub_user_of: { Args: { _admin_id: string }; Returns: boolean }
    }
    Enums: {
      ad_type: "Milk" | "Makeup" | "Perfume" | "Cream" | "Skincare" | "Other"
      app_role: "admin" | "moderator" | "user"
      contract_type: "Full-time" | "Part-time" | "Freelance" | "Contract"
      delivery_record_status: "pending" | "completed" | "cancelled"
      delivery_status: "pending" | "approved" | "rejected"
      expense_category:
        | "Materials"
        | "Labor"
        | "Marketing"
        | "Equipment"
        | "Transportation"
        | "Utilities"
        | "Wedding"
        | "Other"
      job_status: "pending" | "completed" | "overdue" | "cancelled"
      job_type:
        | "meeting"
        | "delivery"
        | "inspection"
        | "support"
        | "maintenance"
        | "consultation"
        | "other"
      payment_project_status: "unpaid" | "partially_paid" | "paid"
      payment_status: "paid" | "unpaid" | "pending" | "suspended"
      platform_type: "TikTok" | "Instagram" | "YouTube" | "Facebook" | "Other"
      product_delivery_status: "pending" | "sent" | "returned"
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
    Enums: {
      ad_type: ["Milk", "Makeup", "Perfume", "Cream", "Skincare", "Other"],
      app_role: ["admin", "moderator", "user"],
      contract_type: ["Full-time", "Part-time", "Freelance", "Contract"],
      delivery_record_status: ["pending", "completed", "cancelled"],
      delivery_status: ["pending", "approved", "rejected"],
      expense_category: [
        "Materials",
        "Labor",
        "Marketing",
        "Equipment",
        "Transportation",
        "Utilities",
        "Wedding",
        "Other",
      ],
      job_status: ["pending", "completed", "overdue", "cancelled"],
      job_type: [
        "meeting",
        "delivery",
        "inspection",
        "support",
        "maintenance",
        "consultation",
        "other",
      ],
      payment_project_status: ["unpaid", "partially_paid", "paid"],
      payment_status: ["paid", "unpaid", "pending", "suspended"],
      platform_type: ["TikTok", "Instagram", "YouTube", "Facebook", "Other"],
      product_delivery_status: ["pending", "sent", "returned"],
    },
  },
} as const
