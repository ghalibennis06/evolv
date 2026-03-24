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
      activity_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
        }
        Relationships: []
      }
      admin_drinks: {
        Row: {
          available_until: string | null
          category: string
          created_at: string
          customizable: boolean | null
          customization_options: string[] | null
          description: string | null
          id: string
          image: string | null
          is_available: boolean
          is_bestseller: boolean | null
          is_new: boolean | null
          is_seasonal: boolean | null
          name: string
          price: number
          sort_order: number
          special_label: string | null
          tags: string[] | null
        }
        Insert: {
          available_until?: string | null
          category?: string
          created_at?: string
          customizable?: boolean | null
          customization_options?: string[] | null
          description?: string | null
          id?: string
          image?: string | null
          is_available?: boolean
          is_bestseller?: boolean | null
          is_new?: boolean | null
          is_seasonal?: boolean | null
          name: string
          price?: number
          sort_order?: number
          special_label?: string | null
          tags?: string[] | null
        }
        Update: {
          available_until?: string | null
          category?: string
          created_at?: string
          customizable?: boolean | null
          customization_options?: string[] | null
          description?: string | null
          id?: string
          image?: string | null
          is_available?: boolean
          is_bestseller?: boolean | null
          is_new?: boolean | null
          is_seasonal?: boolean | null
          name?: string
          price?: number
          sort_order?: number
          special_label?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      admin_journal: {
        Row: {
          action_by: string | null
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action_by?: string | null
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action_by?: string | null
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          class_day: string
          class_name: string
          class_time: string
          client_email: string
          client_name: string
          client_phone: string | null
          coach: string
          created_at: string
          drink_type: string | null
          id: string
          notes: string | null
          pack_id: string | null
          payment_intent_id: string | null
          payment_status: string | null
          status: string
          wants_drink: boolean | null
          wants_mat: boolean | null
        }
        Insert: {
          class_day: string
          class_name: string
          class_time: string
          client_email: string
          client_name: string
          client_phone?: string | null
          coach: string
          created_at?: string
          drink_type?: string | null
          id?: string
          notes?: string | null
          pack_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          status?: string
          wants_drink?: boolean | null
          wants_mat?: boolean | null
        }
        Update: {
          class_day?: string
          class_name?: string
          class_time?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          coach?: string
          created_at?: string
          drink_type?: string | null
          id?: string
          notes?: string | null
          pack_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          status?: string
          wants_drink?: boolean | null
          wants_mat?: boolean | null
        }
        Relationships: []
      }
      client_notes: {
        Row: {
          client_email: string
          created_at: string
          created_by: string | null
          id: string
          note: string
        }
        Insert: {
          client_email: string
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
        }
        Update: {
          client_email?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          bio: string
          certifications: string[] | null
          created_at: string
          gender: string | null
          id: string
          instagram: string | null
          is_active: boolean
          is_featured: boolean
          is_visible: boolean | null
          name: string
          photo: string | null
          priority_order: number | null
          role: string
          sort_order: number
          specialties: string[] | null
        }
        Insert: {
          bio?: string
          certifications?: string[] | null
          created_at?: string
          gender?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_visible?: boolean | null
          name: string
          photo?: string | null
          priority_order?: number | null
          role?: string
          sort_order?: number
          specialties?: string[] | null
        }
        Update: {
          bio?: string
          certifications?: string[] | null
          created_at?: string
          gender?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_visible?: boolean | null
          name?: string
          photo?: string | null
          priority_order?: number | null
          role?: string
          sort_order?: number
          specialties?: string[] | null
        }
        Relationships: []
      }
      code_creation_requests: {
        Row: {
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          credits_total: number
          id: string
          metadata: Json | null
          offer_id: string | null
          offer_name: string | null
          payment_method: string
          payment_status: string
          request_source: string | null
          request_status: string
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          credits_total?: number
          id?: string
          metadata?: Json | null
          offer_id?: string | null
          offer_name?: string | null
          payment_method?: string
          payment_status?: string
          request_source?: string | null
          request_status?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          credits_total?: number
          id?: string
          metadata?: Json | null
          offer_id?: string | null
          offer_name?: string | null
          payment_method?: string
          payment_status?: string
          request_source?: string | null
          request_status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          payment_intent_id: string | null
          payment_status: string | null
          product_id: string | null
          quantity: number | null
          status: string | null
          total_amount: number
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity?: number | null
          status?: string | null
          total_amount: number
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity?: number | null
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_usage_log: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          credit_refunded: boolean | null
          id: string
          pack_code: string
          pack_id: string | null
          session_date: string | null
          session_id: string | null
          session_time: string | null
          session_title: string | null
          used_at: string | null
          used_by_name: string | null
          used_by_phone: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          credit_refunded?: boolean | null
          id?: string
          pack_code: string
          pack_id?: string | null
          session_date?: string | null
          session_id?: string | null
          session_time?: string | null
          session_title?: string | null
          used_at?: string | null
          used_by_name?: string | null
          used_by_phone?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          credit_refunded?: boolean | null
          id?: string
          pack_code?: string
          pack_id?: string | null
          session_date?: string | null
          session_id?: string | null
          session_time?: string | null
          session_title?: string | null
          used_at?: string | null
          used_by_name?: string | null
          used_by_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pack_usage_log_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_usage_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      packs: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          credits_total: number
          credits_used: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          pack_code: string
          pack_type: string | null
          payment_intent_id: string | null
          payment_status: string | null
          stripe_session_id: string | null
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          credits_total?: number
          credits_used?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pack_code: string
          pack_type?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          credits_total?: number
          credits_used?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          pack_code?: string
          pack_type?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      pricing: {
        Row: {
          created_at: string
          cta_link: string
          cta_text: string
          description: string
          features: string[] | null
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          original_price: number | null
          price: number
          sessions_included: number | null
          sort_order: number
          validity_days: number | null
        }
        Insert: {
          created_at?: string
          cta_link?: string
          cta_text?: string
          description?: string
          features?: string[] | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          original_price?: number | null
          price?: number
          sessions_included?: number | null
          sort_order?: number
          validity_days?: number | null
        }
        Update: {
          created_at?: string
          cta_link?: string
          cta_text?: string
          description?: string
          features?: string[] | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          original_price?: number | null
          price?: number
          sessions_included?: number | null
          sort_order?: number
          validity_days?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          name: string
          price: number
          stripe_price_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          price: number
          stripe_price_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          price?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_participants: {
        Row: {
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          payment_status: string
          phone: string | null
          registered_at: string
          session_id: string
        }
        Insert: {
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          payment_status?: string
          phone?: string | null
          registered_at?: string
          session_id: string
        }
        Update: {
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          payment_status?: string
          phone?: string | null
          registered_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          capacity: number
          created_at: string
          date: string
          duration: number
          id: string
          instructor: string
          is_active: boolean
          level: string
          notes: string | null
          price: number
          time: string
          title: string
          type: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          date: string
          duration?: number
          id?: string
          instructor: string
          is_active?: boolean
          level?: string
          notes?: string | null
          price?: number
          time: string
          title: string
          type?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          date?: string
          duration?: number
          id?: string
          instructor?: string
          is_active?: boolean
          level?: string
          notes?: string | null
          price?: number
          time?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          id: string
          section: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          section: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          section?: string
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      waitlist: {
        Row: {
          class_day: string
          class_name: string
          class_time: string
          client_email: string
          client_name: string
          client_phone: string | null
          coach: string
          created_at: string
          id: string
          notes: string | null
          original_session_id: string | null
          payment_status: string | null
          status: string
        }
        Insert: {
          class_day: string
          class_name: string
          class_time: string
          client_email: string
          client_name: string
          client_phone?: string | null
          coach: string
          created_at?: string
          id?: string
          notes?: string | null
          original_session_id?: string | null
          payment_status?: string | null
          status?: string
        }
        Update: {
          class_day?: string
          class_name?: string
          class_time?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          coach?: string
          created_at?: string
          id?: string
          notes?: string | null
          original_session_id?: string | null
          payment_status?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "user"
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
      app_role: ["admin", "staff", "user"],
    },
  },
} as const
