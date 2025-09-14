export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'candidate' | 'recruiter' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'candidate' | 'recruiter' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'candidate' | 'recruiter' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          user_id: string | null
          first_name: string
          last_name: string
          email: string
          phone: string | null
          resume_url: string | null
          resume_text: string | null
          linkedin_url: string | null
          skills: string[] | null
          experience_years: number | null
          current_position: string | null
          status: 'applied' | 'screening' | 'interviewed' | 'passed' | 'rejected'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          resume_url?: string | null
          resume_text?: string | null
          linkedin_url?: string | null
          skills?: string[] | null
          experience_years?: number | null
          current_position?: string | null
          status?: 'applied' | 'screening' | 'interviewed' | 'passed' | 'rejected'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          resume_url?: string | null
          resume_text?: string | null
          linkedin_url?: string | null
          skills?: string[] | null
          experience_years?: number | null
          current_position?: string | null
          status?: 'applied' | 'screening' | 'interviewed' | 'passed' | 'rejected'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_positions: {
        Row: {
          id: string
          title: string
          department: string | null
          description: string | null
          requirements: string[] | null
          skills: string[] | null
          experience_level: string | null
          salary_range: string | null
          location: string | null
          is_active: boolean | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          department?: string | null
          description?: string | null
          requirements?: string[] | null
          skills?: string[] | null
          experience_level?: string | null
          salary_range?: string | null
          location?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          department?: string | null
          description?: string | null
          requirements?: string[] | null
          skills?: string[] | null
          experience_level?: string | null
          salary_range?: string | null
          location?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          candidate_id: string
          job_position_id: string
          status: 'applied' | 'screening' | 'interviewed' | 'passed' | 'rejected'
          applied_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          candidate_id: string
          job_position_id: string
          status?: 'applied' | 'screening' | 'interviewed' | 'passed' | 'rejected'
          applied_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          candidate_id?: string
          job_position_id?: string
          status?: 'applied' | 'screening' | 'interviewed' | 'passed' | 'rejected'
          applied_at?: string
          notes?: string | null
        }
      }
      interviews: {
        Row: {
          id: string
          application_id: string
          candidate_id: string
          job_position_id: string
          recruiter_id: string | null
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          duration_minutes: number | null
          vapi_call_id: string | null
          transcript: string | null
          audio_url: string | null
          ai_summary: string | null
          ai_score: number | null
          strengths: string[] | null
          weaknesses: string[] | null
          questions_asked: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          candidate_id: string
          job_position_id: string
          recruiter_id?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          vapi_call_id?: string | null
          transcript?: string | null
          audio_url?: string | null
          ai_summary?: string | null
          ai_score?: number | null
          strengths?: string[] | null
          weaknesses?: string[] | null
          questions_asked?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          candidate_id?: string
          job_position_id?: string
          recruiter_id?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          vapi_call_id?: string | null
          transcript?: string | null
          audio_url?: string | null
          ai_summary?: string | null
          ai_score?: number | null
          strengths?: string[] | null
          weaknesses?: string[] | null
          questions_asked?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      interview_feedback: {
        Row: {
          id: string
          interview_id: string
          recruiter_id: string | null
          rating: number | null
          feedback: string | null
          recommendation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          interview_id: string
          recruiter_id?: string | null
          rating?: number | null
          feedback?: string | null
          recommendation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          interview_id?: string
          recruiter_id?: string | null
          rating?: number | null
          feedback?: string | null
          recommendation?: string | null
          created_at?: string
        }
      }
      ai_prompts: {
        Row: {
          id: string
          job_position_id: string | null
          role_title: string
          system_prompt: string
          question_prompts: string[] | null
          evaluation_criteria: string | null
          is_active: boolean | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_position_id?: string | null
          role_title: string
          system_prompt: string
          question_prompts?: string[] | null
          evaluation_criteria?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_position_id?: string | null
          role_title?: string
          system_prompt?: string
          question_prompts?: string[] | null
          evaluation_criteria?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'candidate' | 'recruiter' | 'admin'
      interview_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
      candidate_status: 'applied' | 'screening' | 'interviewed' | 'passed' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}