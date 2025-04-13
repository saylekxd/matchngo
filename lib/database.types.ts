export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          opportunity_id: string
          expert_id: string
          message: string | null
          status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          expert_id: string
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          expert_id?: string
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_expert_id_fkey"
            columns: ["expert_id"]
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      expert_profiles: {
        Row: {
          id: string
          profile_id: string
          expertise_areas: string[]
          years_experience: number | null
          education: Json
          certifications: Json
          location: Json
          availability: Json
          hourly_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          expertise_areas: string[]
          years_experience?: number | null
          education?: Json
          certifications?: Json
          location?: Json
          availability?: Json
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          expertise_areas?: string[]
          years_experience?: number | null
          education?: Json
          certifications?: Json
          location?: Json
          availability?: Json
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_profiles_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ngo_profiles: {
        Row: {
          id: string
          profile_id: string
          organization_name: string
          website: string | null
          mission_statement: string | null
          founded_year: number | null
          country: string
          city: string
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          organization_name: string
          website?: string | null
          mission_statement?: string | null
          founded_year?: number | null
          country: string
          city: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          organization_name?: string
          website?: string | null
          mission_statement?: string | null
          founded_year?: number | null
          country?: string
          city?: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_profiles_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      opportunities: {
        Row: {
          id: string
          ngo_id: string
          title: string
          description: string
          required_expertise: string[]
          location: Json
          location_name: string
          start_date: string
          end_date: string
          compensation: Json
          status: 'draft' | 'open' | 'in_progress' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ngo_id: string
          title: string
          description: string
          required_expertise: string[]
          location?: Json
          location_name: string
          start_date: string
          end_date: string
          compensation: Json
          status?: 'draft' | 'open' | 'in_progress' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ngo_id?: string
          title?: string
          description?: string
          required_expertise?: string[]
          location?: Json
          location_name?: string
          start_date?: string
          end_date?: string
          compensation?: Json
          status?: 'draft' | 'open' | 'in_progress' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_ngo_id_fkey"
            columns: ["ngo_id"]
            referencedRelation: "ngo_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          role: 'ngo' | 'expert'
          full_name: string
          bio: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'ngo' | 'expert'
          full_name: string
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'ngo' | 'expert'
          full_name?: string
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          opportunity_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_opportunity_id_fkey"
            columns: ["opportunity_id"]
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_opportunities: {
        Row: {
          id: string
          expert_id: string
          opportunity_id: string
          created_at: string
        }
        Insert: {
          id?: string
          expert_id: string
          opportunity_id: string
          created_at?: string
        }
        Update: {
          id?: string
          expert_id?: string
          opportunity_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_expert_id_fkey"
            columns: ["expert_id"]
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      application_status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
      opportunity_status: 'draft' | 'open' | 'in_progress' | 'closed'
      user_role: 'ngo' | 'expert'
    }
    CompositeTypes: {}
  }
}