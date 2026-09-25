export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          owner_id: string
          title: string
          starts_at: string
          capacity: number
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          starts_at: string
          capacity: number
          created_at?: string
        }
        Update: {
          title?: string
          starts_at?: string
          capacity?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
