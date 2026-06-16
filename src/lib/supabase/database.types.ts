/**
 * Database type definitions
 * Auto-generated from Supabase schema (starter version)
 * Run: npx supabase gen types typescript --project-id xxx > database.types.ts
 */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'teacher' | 'student' | 'parent' | 'member' | 'public'
          status: 'active' | 'inactive' | 'suspended'
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'teacher' | 'student' | 'parent' | 'member' | 'public'
          status?: 'active' | 'inactive' | 'suspended'
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'teacher' | 'student' | 'parent' | 'member' | 'public'
          status?: 'active' | 'inactive' | 'suspended'
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          published_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          published_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          published_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
        }
      }
      media: {
        Row: {
          id: string
          filename: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          alt_text: string | null
          width: number | null
          height: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          filename: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          alt_text?: string | null
          width?: number | null
          height?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          filename?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          alt_text?: string | null
          width?: number | null
          height?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          title: string
          slug: string
          content: string | null
          excerpt: string | null
          meta_title: string | null
          meta_description: string | null
          featured_image_id: string | null
          status: 'draft' | 'published' | 'archived'
          published_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content?: string | null
          excerpt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          featured_image_id?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string | null
          excerpt?: string | null
          meta_title?: string | null
          meta_description?: string | null
          featured_image_id?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
