// Database types matching Supabase schema

export type UserRole = 'parent' | 'admin';

export type AdmissionStatus = 'submitted' | 'approved' | 'rejected';

export type PaymentStatus = 'pending_upload' | 'under_verification' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string | null;
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
  // Parent info
  parent_full_name: string;
  parent_phone: string;
  // Fee info
  total_fee: number;
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
}
