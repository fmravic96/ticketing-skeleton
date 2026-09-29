export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          email: string | null
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          email?: string | null
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          organization_id: string
          user_id: string
          role: "owner" | "admin" | "member"
          created_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          role: "owner" | "admin" | "member"
          created_at?: string
        }
        Update: {
          role?: "owner" | "admin" | "member"
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: "admin" | "member"
          invited_by: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role: "admin" | "member"
          invited_by: string
          created_at?: string
        }
        Update: {
          role?: "admin" | "member"
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          venue: string | null
          starts_at: string
          ends_at: string | null
          capacity: number
          status: "draft" | "published"
          image_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description?: string | null
          venue?: string | null
          starts_at: string
          ends_at?: string | null
          capacity: number
          status?: "draft" | "published"
          image_path?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          venue?: string | null
          starts_at?: string
          ends_at?: string | null
          capacity?: number
          status?: "draft" | "published"
          image_path?: string | null
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          id: string
          event_id: string
          name: string
          price_cents: number
          quantity: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          price_cents: number
          quantity: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          price_cents?: number
          quantity?: number
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_organization: {
        Args: { org_name: string }
        Returns: string
      }
      invite_member: {
        Args: { org_id: string; member_email: string; member_role: string }
        Returns: string
      }
      set_member_role: {
        Args: { org_id: string; member_id: string; new_role: string }
        Returns: undefined
      }
      remove_member: {
        Args: { org_id: string; member_id: string }
        Returns: undefined
      }
      revoke_invite: {
        Args: { invite_id: string }
        Returns: undefined
      }
      save_event: {
        Args: {
          event_id: string | null
          org_id: string
          event_title: string
          event_description: string
          event_venue: string
          event_starts_at: string
          event_ends_at: string | null
          event_capacity: number
          event_status: string
          tickets: { name: string; price_cents: number; quantity: number }[]
          event_image_path: string | null
        }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
