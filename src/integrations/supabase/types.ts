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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_events: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          deal_id: string
          id: string
          kind: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          deal_id: string
          id?: string
          kind?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          deal_id?: string
          id?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_events_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_files: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          kind: string
          name: string
          path: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          kind?: string
          name: string
          path: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          kind?: string
          name?: string
          path?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_files_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_files_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number
          buyer_id: string
          commission: number
          created_at: string
          dispute_reason: string | null
          id: string
          listing_id: string
          offer_id: string | null
          payment_method: string | null
          payment_note: string | null
          payment_txid: string | null
          payout_paid_at: string | null
          payout_reference: string | null
          seller_id: string
          stage: Database["public"]["Enums"]["deal_stage"]
          transfer_notes: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          commission: number
          created_at?: string
          dispute_reason?: string | null
          id?: string
          listing_id: string
          offer_id?: string | null
          payment_method?: string | null
          payment_note?: string | null
          payment_txid?: string | null
          payout_paid_at?: string | null
          payout_reference?: string | null
          seller_id: string
          stage?: Database["public"]["Enums"]["deal_stage"]
          transfer_notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          commission?: number
          created_at?: string
          dispute_reason?: string | null
          id?: string
          listing_id?: string
          offer_id?: string | null
          payment_method?: string | null
          payment_note?: string | null
          payment_txid?: string | null
          payout_paid_at?: string | null
          payout_reference?: string | null
          seller_id?: string
          stage?: Database["public"]["Enums"]["deal_stage"]
          transfer_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reviews: {
        Row: {
          admin_note: string | null
          listing_id: string
          ownership_evidence: string
          ownership_method: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          listing_id: string
          ownership_evidence?: string
          ownership_method?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          listing_id?: string
          ownership_evidence?: string
          ownership_method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          age_years: number
          category: string
          created_at: string
          description: string
          ends_at: string | null
          featured: boolean
          id: string
          images: string[]
          monthly_profit: number
          monthly_revenue: number
          monthly_traffic: number
          price: number
          sale_type: string
          seller_id: string | null
          seller_name: string | null
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          summary: string
          title: string
          updated_at: string
          url: string | null
          verified: string[]
        }
        Insert: {
          age_years?: number
          category: string
          created_at?: string
          description?: string
          ends_at?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          monthly_profit?: number
          monthly_revenue?: number
          monthly_traffic?: number
          price: number
          sale_type?: string
          seller_id?: string | null
          seller_name?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          summary: string
          title: string
          updated_at?: string
          url?: string | null
          verified?: string[]
        }
        Update: {
          age_years?: number
          category?: string
          created_at?: string
          description?: string
          ends_at?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          monthly_profit?: number
          monthly_revenue?: number
          monthly_traffic?: number
          price?: number
          sale_type?: string
          seller_id?: string | null
          seller_name?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          summary?: string
          title?: string
          updated_at?: string
          url?: string | null
          verified?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          binance_pay_id: string
          id: number
          updated_at: string
          usdt_bep20_address: string
          usdt_trc20_address: string
        }
        Insert: {
          binance_pay_id?: string
          id?: number
          updated_at?: string
          usdt_bep20_address?: string
          usdt_trc20_address?: string
        }
        Update: {
          binance_pay_id?: string
          id?: number
          updated_at?: string
          usdt_bep20_address?: string
          usdt_trc20_address?: string
        }
        Relationships: []
      }
      payout_details: {
        Row: {
          account: string
          method: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account: string
          method?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string
          method?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reason: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reason: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          commission_rate: number
          id: number
          support_email: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          id?: number
          support_email?: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          id?: number
          support_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          body: string
          created_at: string
          id: string
          reply: string | null
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          reply?: string | null
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          reply?: string | null
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "moderator" | "user"
      deal_stage:
        | "agreement"
        | "payment_submitted"
        | "payment_verified"
        | "transferring"
        | "delivered"
        | "completed"
        | "disputed"
        | "refunded"
        | "cancelled"
      listing_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "in_progress"
        | "sold"
        | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
      deal_stage: [
        "agreement",
        "payment_submitted",
        "payment_verified",
        "transferring",
        "delivered",
        "completed",
        "disputed",
        "refunded",
        "cancelled",
      ],
      listing_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "in_progress",
        "sold",
        "suspended",
      ],
    },
  },
} as const
