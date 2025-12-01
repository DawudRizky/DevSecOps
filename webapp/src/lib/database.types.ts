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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'Manager' | 'Member'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'Manager' | 'Member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'Manager' | 'Member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          deadline: string | null
          status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          deadline?: string | null
          status?: 'Planning' | 'In Progress' | 'Completed' | 'On Hold'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          deadline?: string | null
          status?: 'Planning' | 'In Progress' | 'Completed' | 'On Hold'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'Manager' | 'Member'
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'Manager' | 'Member'
          joined_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'Manager' | 'Member'
          joined_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string
          assigned_to: string | null
          status: 'Todo' | 'In Progress' | 'Review' | 'Done'
          priority: 'Low' | 'Medium' | 'High' | 'Urgent'
          due_date: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string
          assigned_to?: string | null
          status?: 'Todo' | 'In Progress' | 'Review' | 'Done'
          priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
          due_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string
          assigned_to?: string | null
          status?: 'Todo' | 'In Progress' | 'Review' | 'Done'
          priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
          due_date?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          project_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          project_id: string
          uploaded_by: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          uploaded_by: string
          file_name: string
          file_url: string
          file_size?: number
          file_type: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          uploaded_by?: string
          file_name?: string
          file_url?: string
          file_size?: number
          file_type?: string
          created_at?: string
        }
      }
      timeline_events: {
        Row: {
          id: string
          project_id: string
          user_id: string
          event_type: 'project' | 'task' | 'message' | 'file'
          event_action: 'created' | 'updated' | 'deleted' | 'uploaded' | 'completed'
          event_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          event_type: 'project' | 'task' | 'message' | 'file'
          event_action: 'created' | 'updated' | 'deleted' | 'uploaded' | 'completed'
          event_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          event_type?: 'project' | 'task' | 'message' | 'file'
          event_action?: 'created' | 'updated' | 'deleted' | 'uploaded' | 'completed'
          event_data?: Json
          created_at?: string
        }
      }
    }
  }
}
