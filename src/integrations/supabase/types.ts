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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_resource_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_resource_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_resource_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      advertisement_banners: {
        Row: {
          created_at: string
          description: string | null
          display_pages: string[] | null
          id: string
          image_url: string
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_pages?: string[] | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_pages?: string[] | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          properties: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          admin_review_notes: string | null
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_confirmed_at: string | null
          client_id: string
          commission_rate: number | null
          created_at: string | null
          escrow_commission_amount: number | null
          escrow_final_amount: number | null
          escrow_held_amount: number | null
          escrow_initial_amount: number | null
          escrow_locked_at: string | null
          evidence_notes: string | null
          evidence_submitted_at: string | null
          evidence_urls: string[] | null
          final_payment_released: boolean | null
          id: string
          initial_payment_released: boolean | null
          job_details: string | null
          paid_at: string | null
          payment_status: string | null
          photographer_id: string
          refund_amount: number | null
          refund_status: string | null
          refunded_at: string | null
          service_id: string
          status: string | null
          total_amount: number
          updated_at: string | null
          work_completed_at: string | null
          work_started_at: string | null
        }
        Insert: {
          admin_review_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_confirmed_at?: string | null
          client_id: string
          commission_rate?: number | null
          created_at?: string | null
          escrow_commission_amount?: number | null
          escrow_final_amount?: number | null
          escrow_held_amount?: number | null
          escrow_initial_amount?: number | null
          escrow_locked_at?: string | null
          evidence_notes?: string | null
          evidence_submitted_at?: string | null
          evidence_urls?: string[] | null
          final_payment_released?: boolean | null
          id?: string
          initial_payment_released?: boolean | null
          job_details?: string | null
          paid_at?: string | null
          payment_status?: string | null
          photographer_id: string
          refund_amount?: number | null
          refund_status?: string | null
          refunded_at?: string | null
          service_id: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
          work_completed_at?: string | null
          work_started_at?: string | null
        }
        Update: {
          admin_review_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_confirmed_at?: string | null
          client_id?: string
          commission_rate?: number | null
          created_at?: string | null
          escrow_commission_amount?: number | null
          escrow_final_amount?: number | null
          escrow_held_amount?: number | null
          escrow_initial_amount?: number | null
          escrow_locked_at?: string | null
          evidence_notes?: string | null
          evidence_submitted_at?: string | null
          evidence_urls?: string[] | null
          final_payment_released?: boolean | null
          id?: string
          initial_payment_released?: boolean | null
          job_details?: string | null
          paid_at?: string | null
          payment_status?: string | null
          photographer_id?: string
          refund_amount?: number | null
          refund_status?: string | null
          refunded_at?: string | null
          service_id?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          work_completed_at?: string | null
          work_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      chargebacks: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          flagged_reason: string | null
          gateway: string | null
          gateway_reference: string | null
          id: string
          notes: string | null
          order_id: string | null
          reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          flagged_reason?: string | null
          gateway?: string | null
          gateway_reference?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          flagged_reason?: string | null
          gateway?: string | null
          gateway_reference?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          body: string
          booking_id: string
          client_id: string
          client_ip: string | null
          client_signature: string | null
          client_signed_at: string | null
          created_at: string
          id: string
          photographer_id: string
          photographer_ip: string | null
          photographer_signature: string | null
          photographer_signed_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          booking_id: string
          client_id: string
          client_ip?: string | null
          client_signature?: string | null
          client_signed_at?: string | null
          created_at?: string
          id?: string
          photographer_id: string
          photographer_ip?: string | null
          photographer_signature?: string | null
          photographer_signed_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          booking_id?: string
          client_id?: string
          client_ip?: string | null
          client_signature?: string | null
          client_signed_at?: string | null
          created_at?: string
          id?: string
          photographer_id?: string
          photographer_ip?: string | null
          photographer_signature?: string | null
          photographer_signed_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          code: string
          is_active: boolean
          name: string
          rate_to_usd: number
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          is_active?: boolean
          name: string
          rate_to_usd: number
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          is_active?: boolean
          name?: string
          rate_to_usd?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_notes: string | null
          booking_id: string
          created_at: string
          description: string | null
          evidence_urls: string[]
          id: string
          raised_by: string
          raised_by_role: string
          reason: string
          resolution: string | null
          resolution_amount: number | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          booking_id: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[]
          id?: string
          raised_by: string
          raised_by_role: string
          reason: string
          resolution?: string | null
          resolution_amount?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[]
          id?: string
          raised_by?: string
          raised_by_role?: string
          reason?: string
          resolution?: string | null
          resolution_amount?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          api_key: string | null
          created_at: string
          from_email: string | null
          from_name: string | null
          id: string
          is_enabled: boolean | null
          provider: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_enabled?: boolean | null
          provider?: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_enabled?: boolean | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      galleries: {
        Row: {
          approved_at: string | null
          booking_id: string
          client_id: string
          cover_image_url: string | null
          created_at: string
          delivered_at: string | null
          id: string
          message: string | null
          photographer_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          booking_id: string
          client_id: string
          cover_image_url?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          message?: string | null
          photographer_id: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          booking_id?: string
          client_id?: string
          cover_image_url?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          message?: string | null
          photographer_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          caption: string | null
          client_notes: string | null
          created_at: string
          gallery_id: string
          id: string
          image_url: string
          is_approved: boolean
          is_favorite: boolean
          position: number
          updated_at: string
        }
        Insert: {
          caption?: string | null
          client_notes?: string | null
          created_at?: string
          gallery_id: string
          id?: string
          image_url: string
          is_approved?: boolean
          is_favorite?: boolean
          position?: number
          updated_at?: string
        }
        Update: {
          caption?: string | null
          client_notes?: string | null
          created_at?: string
          gallery_id?: string
          id?: string
          image_url?: string
          is_approved?: boolean
          is_favorite?: boolean
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_duration_seconds: number | null
          attachment_type: string | null
          attachment_url: string | null
          booking_id: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          attachment_duration_seconds?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          booking_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          attachment_duration_seconds?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          booking_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      microsites: {
        Row: {
          about: string | null
          contact_email: string | null
          created_at: string
          headline: string | null
          hero_image_url: string | null
          id: string
          instagram: string | null
          is_published: boolean
          photographer_id: string
          slug: string
          theme_color: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          about?: string | null
          contact_email?: string | null
          created_at?: string
          headline?: string | null
          hero_image_url?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          photographer_id: string
          slug: string
          theme_color?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          about?: string | null
          contact_email?: string | null
          created_at?: string
          headline?: string | null
          hero_image_url?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          photographer_id?: string
          slug?: string
          theme_color?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          event_key: string
          id: string
          is_enabled: boolean
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          event_key: string
          id?: string
          is_enabled?: boolean
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          event_key?: string
          id?: string
          is_enabled?: boolean
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string
          commission_amount: number
          created_at: string | null
          id: string
          shipping_address: Json | null
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          commission_amount: number
          created_at?: string | null
          id?: string
          shipping_address?: Json | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          commission_amount?: number
          created_at?: string | null
          id?: string
          shipping_address?: Json | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_gateway_settings: {
        Row: {
          created_at: string
          display_name: string
          gateway_name: string
          id: string
          is_active: boolean
          settings: Json | null
          test_mode: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          gateway_name: string
          id?: string
          is_active?: boolean
          settings?: Json | null
          test_mode?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          gateway_name?: string
          id?: string
          is_active?: boolean
          settings?: Json | null
          test_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payment_schedules: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          due_at: string | null
          id: string
          installment_number: number
          paid_at: string | null
          percentage: number
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          installment_number: number
          paid_at?: string | null
          percentage: number
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          installment_number?: number
          paid_at?: string | null
          percentage?: number
          status?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string
          id: string
          paystack_account_id: string | null
          stripe_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          paystack_account_id?: string | null
          stripe_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          paystack_account_id?: string | null
          stripe_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_methods: {
        Row: {
          created_at: string
          details: Json
          id: string
          is_default: boolean
          is_verified: boolean
          method_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean
          is_verified?: boolean
          method_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean
          is_verified?: boolean
          method_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          approval_batch_id: string | null
          approved_at: string | null
          approved_by: string | null
          booking_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          payment_method: string | null
          payout_type: string
          photographer_id: string
          released_at: string | null
          released_by: string | null
          status: string
          transaction_reference: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approval_batch_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          payout_type: string
          photographer_id: string
          released_at?: string | null
          released_by?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approval_batch_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          payout_type?: string
          photographer_id?: string
          released_at?: string | null
          released_by?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      photographer_availability: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          is_available: boolean
          notes: string | null
          photographer_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          is_available?: boolean
          notes?: string | null
          photographer_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          photographer_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      photographer_profiles: {
        Row: {
          avg_response_minutes: number | null
          created_at: string | null
          gear: string[] | null
          id: string
          is_approved: boolean | null
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          on_time_delivery_rate: number | null
          portfolio_images: string[] | null
          service_radius_km: number | null
          social_links: Json | null
          specialties: string[] | null
          total_completed_bookings: number
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          avg_response_minutes?: number | null
          created_at?: string | null
          gear?: string[] | null
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          on_time_delivery_rate?: number | null
          portfolio_images?: string[] | null
          service_radius_km?: number | null
          social_links?: Json | null
          specialties?: string[] | null
          total_completed_bookings?: number
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          avg_response_minutes?: number | null
          created_at?: string | null
          gear?: string[] | null
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          on_time_delivery_rate?: number | null
          portfolio_images?: string[] | null
          service_radius_km?: number | null
          social_links?: Json | null
          specialties?: string[] | null
          total_completed_bookings?: number
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      photographer_verifications: {
        Row: {
          created_at: string
          document_type: string
          document_urls: string[]
          full_name: string
          id: string
          photographer_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          selfie_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          document_urls?: string[]
          full_name: string
          id?: string
          photographer_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          document_urls?: string[]
          full_name?: string
          id?: string
          photographer_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string
          flagged_reason: string | null
          id: string
          image_url: string
          moderated_at: string | null
          moderation_notes: string | null
          moderator_id: string | null
          photographer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string
          flagged_reason?: string | null
          id?: string
          image_url: string
          moderated_at?: string | null
          moderation_notes?: string | null
          moderator_id?: string | null
          photographer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string
          flagged_reason?: string | null
          id?: string
          image_url?: string
          moderated_at?: string | null
          moderation_notes?: string | null
          moderator_id?: string | null
          photographer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          digital_file_url: string | null
          id: string
          images: string[] | null
          inventory_count: number | null
          is_active: boolean | null
          is_digital: boolean | null
          photographer_id: string
          price: number
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          digital_file_url?: string | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          is_active?: boolean | null
          is_digital?: boolean | null
          photographer_id: string
          price: number
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          digital_file_url?: string | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          is_active?: boolean | null
          is_digital?: boolean | null
          photographer_id?: string
          price?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          location: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          location?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          budget: number | null
          client_id: string
          converted_booking_id: string | null
          created_at: string
          deliverables: string | null
          duration_hours: number | null
          expires_at: string | null
          id: string
          location: string | null
          party_size: number | null
          photographer_id: string
          preferred_date: string | null
          reference_urls: string[] | null
          service_id: string | null
          shoot_type: string
          special_requirements: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id: string
          converted_booking_id?: string | null
          created_at?: string
          deliverables?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          location?: string | null
          party_size?: number | null
          photographer_id: string
          preferred_date?: string | null
          reference_urls?: string[] | null
          service_id?: string | null
          shoot_type: string
          special_requirements?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string
          converted_booking_id?: string | null
          created_at?: string
          deliverables?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          location?: string | null
          party_size?: number | null
          photographer_id?: string
          preferred_date?: string | null
          reference_urls?: string[] | null
          service_id?: string | null
          shoot_type?: string
          special_requirements?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_responses: {
        Row: {
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          message: string | null
          photographer_id: string
          price: number
          quote_request_id: string
          status: string
        }
        Insert: {
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          photographer_id: string
          price: number
          quote_request_id: string
          status?: string
        }
        Update: {
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          photographer_id?: string
          price?: number
          quote_request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_responses_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_public: boolean | null
          moderated_at: string | null
          moderation_notes: string | null
          moderator_id: string | null
          order_id: string | null
          photographer_id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_public?: boolean | null
          moderated_at?: string | null
          moderation_notes?: string | null
          moderator_id?: string | null
          order_id?: string | null
          photographer_id: string
          rating: number
          reviewer_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_public?: boolean | null
          moderated_at?: string | null
          moderation_notes?: string | null
          moderator_id?: string | null
          order_id?: string | null
          photographer_id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_search_alerts: {
        Row: {
          created_at: string
          id: string
          matched_count: number
          payload: Json | null
          saved_search_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          matched_count?: number
          payload?: Json | null
          saved_search_id: string
        }
        Update: {
          created_at?: string
          id?: string
          matched_count?: number
          payload?: Json | null
          saved_search_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_search_alerts_saved_search_id_fkey"
            columns: ["saved_search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alert_frequency: string
          created_at: string
          criteria: Json
          id: string
          is_paused: boolean
          last_alert_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_frequency?: string
          created_at?: string
          criteria?: Json
          id?: string
          is_paused?: boolean
          last_alert_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_frequency?: string
          created_at?: string
          criteria?: Json
          id?: string
          is_paused?: boolean
          last_alert_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reminders: {
        Row: {
          booking_id: string | null
          created_at: string
          event_key: string
          id: string
          payload: Json | null
          send_at: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          event_key: string
          id?: string
          payload?: Json | null
          send_at: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          event_key?: string
          id?: string
          payload?: Json | null
          send_at?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          booking_mode: string
          created_at: string | null
          deposit_percentage: number
          description: string | null
          duration_hours: number | null
          id: string
          installment_count: number
          is_active: boolean | null
          photographer_id: string
          price: number
          title: string
          updated_at: string | null
        }
        Insert: {
          booking_mode?: string
          created_at?: string | null
          deposit_percentage?: number
          description?: string | null
          duration_hours?: number | null
          id?: string
          installment_count?: number
          is_active?: boolean | null
          photographer_id: string
          price: number
          title: string
          updated_at?: string | null
        }
        Update: {
          booking_mode?: string
          created_at?: string | null
          deposit_percentage?: number
          description?: string | null
          duration_hours?: number | null
          id?: string
          installment_count?: number
          is_active?: boolean | null
          photographer_id?: string
          price?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          id: string
          label_url: string | null
          order_id: string
          ship_to: Json | null
          shipped_at: string | null
          status: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          label_url?: string | null
          order_id: string
          ship_to?: Json | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          label_url?: string | null
          order_id?: string
          ship_to?: Json | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          country_code: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          rate_percent: number
          region_code: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          rate_percent?: number
          region_code?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          rate_percent?: number
          region_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_active_dispute: { Args: { _booking_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "client" | "photographer"
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
      app_role: ["admin", "client", "photographer"],
    },
  },
} as const
