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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          diff: Json
          entity_id: string | null
          entity_type: string
          id: string
          ip: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          ip?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          active: boolean
          created_at: string
          mfa_required: boolean
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          mfa_required?: boolean
          role: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          mfa_required?: boolean
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          ai_prompt: string | null
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_prompt?: string | null
          category_id?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_prompt?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cta_clicks: {
        Row: {
          channel: string
          created_at: string
          id: string
          page_path: string | null
          van_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          page_path?: string | null
          van_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          page_path?: string | null
          van_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cta_clicks_van_id_fkey"
            columns: ["van_id"]
            isOneToOne: false
            referencedRelation: "vans"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          actor_id: string | null
          created_at: string
          data: Json
          event: string
          id: string
          lead_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          event: string
          id?: string
          lead_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          event?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          consent: Json
          contacted_at: string | null
          created_at: string
          device: Database["public"]["Enums"]["device_type"] | null
          duration: string | null
          email: string
          id: string
          ip_hash: string | null
          message: string | null
          name: string
          page_path: string | null
          payload: Json
          phone: string
          referrer: string | null
          source: string
          staff_notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["lead_status"]
          suburb: string | null
          utm: Json
          van_id: string | null
          van_slug_raw: string | null
        }
        Insert: {
          assigned_to?: string | null
          consent?: Json
          contacted_at?: string | null
          created_at?: string
          device?: Database["public"]["Enums"]["device_type"] | null
          duration?: string | null
          email: string
          id?: string
          ip_hash?: string | null
          message?: string | null
          name: string
          page_path?: string | null
          payload?: Json
          phone: string
          referrer?: string | null
          source?: string
          staff_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          suburb?: string | null
          utm?: Json
          van_id?: string | null
          van_slug_raw?: string | null
        }
        Update: {
          assigned_to?: string | null
          consent?: Json
          contacted_at?: string | null
          created_at?: string
          device?: Database["public"]["Enums"]["device_type"] | null
          duration?: string | null
          email?: string
          id?: string
          ip_hash?: string | null
          message?: string | null
          name?: string
          page_path?: string | null
          payload?: Json
          phone?: string
          referrer?: string | null
          source?: string
          staff_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          suburb?: string | null
          utm?: Json
          van_id?: string | null
          van_slug_raw?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_van_id_fkey"
            columns: ["van_id"]
            isOneToOne: false
            referencedRelation: "vans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      redirects: {
        Row: {
          code: number
          created_at: string
          from_path: string
          hits: number
          id: string
          to_path: string
        }
        Insert: {
          code?: number
          created_at?: string
          from_path: string
          hits?: number
          id?: string
          to_path: string
        }
        Update: {
          code?: number
          created_at?: string
          from_path?: string
          hits?: number
          id?: string
          to_path?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          is_approved: boolean
          quote: string
          rating: number
          review_date: string | null
          sort_order: number
          source: Database["public"]["Enums"]["testimonial_source"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          is_approved?: boolean
          quote: string
          rating: number
          review_date?: string | null
          sort_order?: number
          source?: Database["public"]["Enums"]["testimonial_source"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          quote?: string
          rating?: number
          review_date?: string | null
          sort_order?: number
          source?: Database["public"]["Enums"]["testimonial_source"]
          updated_at?: string
        }
        Relationships: []
      }
      van_images: {
        Row: {
          alt: string
          created_at: string
          id: string
          is_primary: boolean
          sort_order: number
          storage_path: string
          van_id: string
        }
        Insert: {
          alt: string
          created_at?: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          storage_path: string
          van_id: string
        }
        Update: {
          alt?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          storage_path?: string
          van_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "van_images_van_id_fkey"
            columns: ["van_id"]
            isOneToOne: false
            referencedRelation: "vans"
            referencedColumns: ["id"]
          },
        ]
      }
      vans: {
        Row: {
          body_type: string
          created_at: string
          deposit_amount: number | null
          description: string | null
          dimensions_verified: boolean
          features: string[]
          fuel: string
          height_mm: number | null
          id: string
          length_mm: number | null
          load_volume_m3: number | null
          make: string | null
          min_hire_days: number
          model: string | null
          name: string
          payload_kg: number | null
          price_monthly_from: number | null
          price_verified: boolean
          price_weekly_from: number
          registration: string | null
          roof: Database["public"]["Enums"]["roof_height"]
          seats: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["van_status"]
          summary: string | null
          tonnage: number
          transmission: string
          updated_at: string
          wheelbase_label: string
          wheelbase_mm: number | null
          width_mm: number | null
          year: number | null
        }
        Insert: {
          body_type: string
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          dimensions_verified?: boolean
          features?: string[]
          fuel?: string
          height_mm?: number | null
          id?: string
          length_mm?: number | null
          load_volume_m3?: number | null
          make?: string | null
          min_hire_days?: number
          model?: string | null
          name: string
          payload_kg?: number | null
          price_monthly_from?: number | null
          price_verified?: boolean
          price_weekly_from: number
          registration?: string | null
          roof: Database["public"]["Enums"]["roof_height"]
          seats?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["van_status"]
          summary?: string | null
          tonnage: number
          transmission?: string
          updated_at?: string
          wheelbase_label: string
          wheelbase_mm?: number | null
          width_mm?: number | null
          year?: number | null
        }
        Update: {
          body_type?: string
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          dimensions_verified?: boolean
          features?: string[]
          fuel?: string
          height_mm?: number | null
          id?: string
          length_mm?: number | null
          load_volume_m3?: number | null
          make?: string | null
          min_hire_days?: number
          model?: string | null
          name?: string
          payload_kg?: number | null
          price_monthly_from?: number | null
          price_verified?: boolean
          price_weekly_from?: number
          registration?: string | null
          roof?: Database["public"]["Enums"]["roof_height"]
          seats?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["van_status"]
          summary?: string | null
          tonnage?: number
          transmission?: string
          updated_at?: string
          wheelbase_label?: string
          wheelbase_mm?: number | null
          width_mm?: number | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_stale_leads: { Args: { p_months?: number }; Returns: number }
      create_lead_with_event: { Args: { p_lead: Json }; Returns: string }
      record_cta_click: {
        Args: { p_channel: string; p_page_path?: string; p_van_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      blog_status: "draft" | "scheduled" | "published"
      device_type: "mobile" | "desktop" | "tablet" | "unknown"
      lead_status: "new" | "contacted" | "quoted" | "won" | "lost" | "spam"
      roof_height: "standard" | "low" | "high"
      staff_role: "owner" | "admin" | "manager" | "hire_desk" | "content"
      testimonial_source: "google" | "facebook" | "direct"
      van_status: "draft" | "available" | "limited" | "unavailable"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      blog_status: ["draft", "scheduled", "published"],
      device_type: ["mobile", "desktop", "tablet", "unknown"],
      lead_status: ["new", "contacted", "quoted", "won", "lost", "spam"],
      roof_height: ["standard", "low", "high"],
      staff_role: ["owner", "admin", "manager", "hire_desk", "content"],
      testimonial_source: ["google", "facebook", "direct"],
      van_status: ["draft", "available", "limited", "unavailable"],
    },
  },
} as const
