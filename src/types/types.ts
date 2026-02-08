// Database types matching Supabase schema

export type UserRole = 'parent' | 'admin';

export type AdmissionStatus = 'submitted' | 'approved' | 'rejected';

export type PaymentStatus = 'pending_upload' | 'under_verification' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  parent_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  class: string;
  academic_year: string;
  assigned_teacher: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  residential_address?: string;
  correspondence_address?: string;
  religion?: string;
  caste?: string;
  mother_phone?: string;
  mother_email?: string;
  father_phone?: string;
  father_email?: string;
  preferred_whatsapp?: string;
  previous_school?: string;
  language_known?: string;
  medical_conditions: string | null;
  allergies: string | null;
  created_at: string;
  updated_at: string;
}

export interface Admission {
  id: string;
  student_id: string;
  parent_id: string;
  admission_date: string;
  status: AdmissionStatus;
  total_fee: number;
  uploaded_files?: Record<string, string>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  admission_id: string;
  parent_id: string;
  amount: number;
  payment_date: string;
  receipt_url: string | null;
  status: PaymentStatus;
  payment_type: 'initial' | 'installment';
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_type: 'upcoming' | 'past';
  photos: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
  announcement_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface StudentWithAdmission extends Student {
  admission?: Admission;
}

export interface AdmissionWithStudent extends Admission {
  student?: Student;
}

export interface PaymentWithAdmission extends Payment {
  admission?: AdmissionWithStudent;
}

// Form types
export interface AdmissionFormData {
  // Student info
  student_full_name: string;
  date_of_birth: string;
  gender: string;
  class: string;
  academic_year: string;
  medical_conditions?: string;
  allergies?: string;
  // Emergency contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  // Parent & Address info
  residential_address: string;
  correspondence_address: string;
  religion?: string;
  caste?: string;
  mother_phone: string;
  mother_email?: string;
  father_phone: string;
  father_email?: string;
  preferred_whatsapp: string;
  previous_school?: string;
  // Fee info
  total_fee: number;
  uploaded_files?: Record<string, string>;
}

export interface PaymentFormData {
  admission_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'initial' | 'installment';
  receipt_file?: File;
}

export interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_type: 'upcoming' | 'past';
  photo_files?: File[];
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
  announcement_date: string;
}

// Help & Feedback types
export interface HelpQuery {
  id: string;
  parent_id: string;
  subject: string;
  message: string;
  attachment_url: string | null;
  status: 'open' | 'replied' | 'closed';
  created_at: string;
  updated_at: string;
  parent?: Profile;
}

export interface QueryFormData {
  subject: string;
  message: string;
  attachment_file?: File;
}

// Dashboard summary types

export interface ParentDashboardSummary {
  students: StudentWithAdmission[];
  totalFees: number;
  paidAmount: number;
  remainingBalance: number;
  upcomingEvents: Event[];
  recentAnnouncements: Announcement[];
}

export interface AdminDashboardSummary {
  totalStudents: number;
  pendingAdmissions: number;
  pendingPayments: number;
  totalRevenue: number;
  recentAdmissions: AdmissionWithStudent[];
  recentPayments: PaymentWithAdmission[];
  totalQueries?: number;
}
