export type UserRole = 'student' | 'faculty' | 'admin' | 'maintenance';
export type IssueUrgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';
export type UpdateType = 
  | 'created' 
  | 'comment' 
  | 'status_change' 
  | 'assignment' 
  | 'resolution' 
  | 'rejection' 
  | 'priority_change' 
  | 'duplicate_linked' 
  | 'reopened';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string | null;
  student_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface MaintenanceTeam {
  id: string;
  name: string;
  description: string | null;
  contact_email: string | null;
  created_at: string;
}

export interface Issue {
  id: string;
  created_by: string;
  title: string;
  description: string;
  category: string;
  building: string;
  room_location: string;
  urgency: IssueUrgency;
  status: IssueStatus;
  assigned_team_id: string | null;
  assigned_to: string | null;
  duplicate_of: string | null;
  rejection_reason: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface IssueWithCounts extends Issue {
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_role: UserRole | null;
  assignee_name: string | null;
  assigned_team_name: string | null;
  upvotes_count: number;
}

export interface IssueUpvote {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  author_id: string | null;
  update_type: UpdateType;
  message: string;
  old_value: string | null;
  new_value: string | null;
  is_internal: boolean;
  created_at: string;
  author?: Profile | null;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  issue_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface IssueFeedback {
  id: string;
  issue_id: string;
  user_id: string;
  rating: number;
  is_fixed: boolean;
  comment: string | null;
  created_at: string;
}
