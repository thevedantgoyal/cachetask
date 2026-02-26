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
      attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          id: string
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_audit_log: {
        Row: {
          action: string
          booking_id: string
          created_at: string
          details: Json | null
          id: string
          performed_by: string
        }
        Insert: {
          action: string
          booking_id: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by: string
        }
        Update: {
          action?: string
          booking_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_audit_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "room_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          created_at: string
          description: string | null
          evidence_type: string | null
          evidence_url: string | null
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_type?: string | null
          evidence_url?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          task_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_type?: string | null
          evidence_url?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          created_at: string
          id: string
          leave_type_id: string
          total: number
          updated_at: string
          used: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          leave_type_id: string
          total?: number
          updated_at?: string
          used?: number
          user_id: string
          year?: number
        }
        Update: {
          created_at?: string
          id?: string
          leave_type_id?: string
          total?: number
          updated_at?: string
          used?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          code: string
          color: string
          created_at: string
          default_days: number
          id: string
          name: string
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          default_days?: number
          id?: string
          name: string
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          default_days?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      leaves: {
        Row: {
          approved_at: string | null
          approver_comment: string | null
          approver_id: string | null
          attachment_url: string | null
          created_at: string
          days_count: number
          from_date: string
          half_day: boolean
          id: string
          leave_type_id: string
          reason: string
          status: string
          to_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approver_comment?: string | null
          approver_id?: string | null
          attachment_url?: string | null
          created_at?: string
          days_count: number
          from_date: string
          half_day?: boolean
          id?: string
          leave_type_id: string
          reason: string
          status?: string
          to_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approver_comment?: string | null
          approver_id?: string | null
          attachment_url?: string | null
          created_at?: string
          days_count?: number
          from_date?: string
          half_day?: boolean
          id?: string
          leave_type_id?: string
          reason?: string
          status?: string
          to_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_rooms: {
        Row: {
          capacity: number
          created_at: string
          created_by: string
          floor: string | null
          has_projector: boolean
          has_video_conferencing: boolean
          has_whiteboard: boolean
          id: string
          location: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          created_by: string
          floor?: string | null
          has_projector?: boolean
          has_video_conferencing?: boolean
          has_whiteboard?: boolean
          id?: string
          location: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          created_by?: string
          floor?: string | null
          has_projector?: boolean
          has_video_conferencing?: boolean
          has_whiteboard?: boolean
          id?: string
          location?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      metric_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          weight?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          category_id: string
          created_at: string
          evaluated_by: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          evaluated_by?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          evaluated_by?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "metric_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          job_title: string | null
          joining_date: string | null
          linkedin_url: string | null
          location: string | null
          manager_id: string | null
          other_social_links: Json | null
          phone: string | null
          profile_completed: boolean
          resume_url: string | null
          status: string | null
          team_id: string | null
          updated_at: string
          user_id: string
          work_hours: string | null
          working_status: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          job_title?: string | null
          joining_date?: string | null
          linkedin_url?: string | null
          location?: string | null
          manager_id?: string | null
          other_social_links?: Json | null
          phone?: string | null
          profile_completed?: boolean
          resume_url?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string
          user_id: string
          work_hours?: string | null
          working_status?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          job_title?: string | null
          joining_date?: string | null
          linkedin_url?: string | null
          location?: string | null
          manager_id?: string | null
          other_social_links?: Json | null
          phone?: string | null
          profile_completed?: boolean
          resume_url?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
          work_hours?: string | null
          working_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          project_type: string
          status: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          project_type?: string
          status?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          project_type?: string
          status?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_bookings: {
        Row: {
          booked_by: string
          booking_date: string
          cancellation_reason: string | null
          created_at: string
          end_time: string
          id: string
          meeting_type: string
          participants: string[] | null
          priority: string
          project_id: string | null
          purpose: string | null
          room_id: string
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          booked_by: string
          booking_date: string
          cancellation_reason?: string | null
          created_at?: string
          end_time: string
          id?: string
          meeting_type?: string
          participants?: string[] | null
          priority?: string
          project_id?: string | null
          purpose?: string | null
          room_id: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          booked_by?: string
          booking_date?: string
          cancellation_reason?: string | null
          created_at?: string
          end_time?: string
          id?: string
          meeting_type?: string
          participants?: string[] | null
          priority?: string
          project_id?: string | null
          purpose?: string | null
          room_id?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "meeting_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          created_at: string
          created_by: string
          id: string
          message: string
          scheduled_at: string
          send_email: boolean
          send_push: boolean
          sent_at: string | null
          status: string
          target_type: string
          target_value: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          message: string
          scheduled_at: string
          send_email?: boolean
          send_push?: boolean
          sent_at?: string | null
          status?: string
          target_type: string
          target_value?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          scheduled_at?: string
          send_email?: boolean
          send_push?: boolean
          sent_at?: string | null
          status?: string
          target_type?: string
          target_value?: string | null
          title?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          goal_level: number | null
          id: string
          last_updated: string | null
          name: string
          proficiency_level: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_level?: number | null
          id?: string
          last_updated?: string | null
          name: string
          proficiency_level?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          goal_level?: number | null
          id?: string
          last_updated?: string | null
          name?: string
          proficiency_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      task_activity_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          performed_by: string
          task_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by: string
          task_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          created_by: string | null
          dependency_type: string
          depends_on: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dependency_type?: string
          depends_on: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dependency_type?: string
          depends_on?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_evidence: {
        Row: {
          comment: string | null
          created_at: string
          evidence_type: string
          file_url: string
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          evidence_type?: string
          file_url: string
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          evidence_type?: string
          file_url?: string
          id?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_evidence_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tag_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          tag_id: string
          task_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          tag_id: string
          task_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tag_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "task_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tag_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          blocked_reason: string | null
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_deleted: boolean
          is_seen: boolean
          parent_task_id: string | null
          priority: string | null
          project_id: string | null
          reassigned_from: string | null
          reassignment_count: number
          reassignment_reason: string | null
          status: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_deleted?: boolean
          is_seen?: boolean
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          reassigned_from?: string | null
          reassignment_count?: number
          reassignment_reason?: string | null
          status?: string | null
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_deleted?: boolean
          is_seen?: boolean
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          reassigned_from?: string | null
          reassignment_count?: number
          reassignment_reason?: string | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reassigned_from_fkey"
            columns: ["reassigned_from"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lead_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          attachment_url: string | null
          created_at: string
          date: string
          description: string
          hours: number
          id: string
          project_id: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          date: string
          description: string
          hours: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          date?: string
          description?: string
          hours?: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_leave: {
        Args: { _approver_comment?: string; _leave_id: string }
        Returns: boolean
      }
      check_booking_conflict: {
        Args: {
          _booking_date: string
          _end_time: string
          _exclude_id?: string
          _room_id: string
          _start_time: string
        }
        Returns: {
          booked_by: string
          end_time: string
          id: string
          priority: string
          start_time: string
          title: string
        }[]
      }
      check_leave_overlap: {
        Args: {
          _exclude_id?: string
          _from_date: string
          _to_date: string
          _user_id: string
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          _message: string
          _metadata?: Json
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      get_user_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_of: {
        Args: { _employee_user_id: string; _manager_user_id: string }
        Returns: boolean
      }
      reject_leave: {
        Args: { _approver_comment?: string; _leave_id: string }
        Returns: boolean
      }
      setup_first_admin: {
        Args: { _setup_code: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "employee"
        | "team_lead"
        | "manager"
        | "hr"
        | "admin"
        | "organization"
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
      app_role: [
        "employee",
        "team_lead",
        "manager",
        "hr",
        "admin",
        "organization",
      ],
    },
  },
} as const
