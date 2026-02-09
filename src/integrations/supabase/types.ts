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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      knowledgebase_articles: {
        Row: {
          body: string
          category_id: number | null
          created_at: string | null
          created_by: string | null
          id: string
          tags: string[] | null
          title: string
        }
        Insert: {
          body: string
          category_id?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          tags?: string[] | null
          title: string
        }
        Update: {
          body?: string
          category_id?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledgebase_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledgebase_articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      ticket_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          ticket_id: string
          uploaded_at: string
          uploaded_by: string
          uploaded_context: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          ticket_id: string
          uploaded_at?: string
          uploaded_by: string
          uploaded_context?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          ticket_id?: string
          uploaded_at?: string
          uploaded_by?: string
          uploaded_context?: string | null
        }
        Relationships: []
      }
      ticket_audit_log: {
        Row: {
          action: string | null
          changed_by: string | null
          id: string
          meta: Json | null
          ticket_id: string | null
          timestamp: string | null
        }
        Insert: {
          action?: string | null
          changed_by?: string | null
          id?: string
          meta?: Json | null
          ticket_id?: string | null
          timestamp?: string | null
        }
        Update: {
          action?: string | null
          changed_by?: string | null
          id?: string
          meta?: Json | null
          ticket_id?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          comment: string
          comment_by: string | null
          created_at: string | null
          id: string
          ticket_id: string | null
        }
        Insert: {
          comment: string
          comment_by?: string | null
          created_at?: string | null
          id?: string
          ticket_id?: string | null
        }
        Update: {
          comment?: string
          comment_by?: string | null
          created_at?: string | null
          id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_comment_by_fkey"
            columns: ["comment_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_counters: {
        Row: {
          category_id: number
          next_number: number
        }
        Insert: {
          category_id: number
          next_number?: number
        }
        Update: {
          category_id?: number
          next_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_counters_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_kb_links: {
        Row: {
          kb_id: string | null
          ticket_id: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          kb_id?: string | null
          ticket_id?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          kb_id?: string | null
          ticket_id?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_kb_links_kb_id_fkey"
            columns: ["kb_id"]
            isOneToOne: false
            referencedRelation: "knowledgebase_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_kb_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_kb_links_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category_id: number | null
          created_at: string | null
          created_by: string | null
          description: string
          display_id: string | null
          id: string
          is_l3: boolean | null
          resolved_at: string | null
          sla_deadline: string | null
          status: string | null
          title: string
          urgency_id: number | null
        }
        Insert: {
          assigned_to?: string | null
          category_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          display_id?: string | null
          id?: string
          is_l3?: boolean | null
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string | null
          title: string
          urgency_id?: number | null
        }
        Update: {
          assigned_to?: string | null
          category_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          display_id?: string | null
          id?: string
          is_l3?: boolean | null
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string | null
          title?: string
          urgency_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_urgency_id_fkey"
            columns: ["urgency_id"]
            isOneToOne: false
            referencedRelation: "urgency_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      urgency_levels: {
        Row: {
          id: number
          label: string | null
          sla_hours: number
        }
        Insert: {
          id?: number
          label?: string | null
          sla_hours: number
        }
        Update: {
          id?: number
          label?: string | null
          sla_hours?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          enabled: boolean | null
          id: string
          name: string
          role_id: number | null
          status: string | null
          team_id: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          enabled?: boolean | null
          id?: string
          name: string
          role_id?: number | null
          status?: string | null
          team_id?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          enabled?: boolean | null
          id?: string
          name?: string
          role_id?: number | null
          status?: string | null
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_ticket_number: {
        Args: { p_category_id: number }
        Returns: number
      }
      reassign_ticket: {
        Args: { changed_by: string; new_user: string; ticket: string }
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
