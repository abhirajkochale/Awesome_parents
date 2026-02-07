import { supabase } from './supabase';
import type {
  Profile,
  Student,
  Admission,
  Payment,
  Event,
  Announcement,
  AdmissionFormData,
  PaymentFormData,
  EventFormData,
  AnnouncementFormData,
  StudentWithAdmission,
  AdmissionWithStudent,
  PaymentWithAdmission,
  ParentDashboardSummary,
  AdminDashboardSummary,
} from '@/types';

// Profile API
export const profileApi = {
  getCurrentProfile: async (): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  updateProfile: async (id: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  getAllProfiles: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  updateUserRole: async (userId: string, role: 'parent' | 'admin'): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    
    if (error) throw error;
  },
};

// Student API
export const studentApi = {
  getMyStudents: async (): Promise<StudentWithAdmission[]> => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        admission:admissions(*)
      `)
      .eq('parent_id', user.data.user?.id || '')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data.map(s => ({
      ...s,
      admission: Array.isArray(s.admission) ? s.admission[0] : s.admission
    })) : [];
  },

  getAllStudents: async (): Promise<StudentWithAdmission[]> => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        admission:admissions(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data.map(s => ({
      ...s,
      admission: Array.isArray(s.admission) ? s.admission[0] : s.admission
    })) : [];
  },

  createStudent: async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> => {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateStudent: async (id: string, updates: Partial<Student>): Promise<Student> => {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Admission API
export const admissionApi = {
  getMyAdmissions: async (): Promise<AdmissionWithStudent[]> => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('admissions')
      .select(`
        *,
        student:students(*)
      `)
      .eq('parent_id', user.data.user?.id || '')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data.map(a => ({
      ...a,
      student: Array.isArray(a.student) ? a.student[0] : a.student
    })) : [];
  },

  getAllAdmissions: async (): Promise<AdmissionWithStudent[]> => {
    const { data, error } = await supabase
      .from('admissions')
      .select(`
        *,
        student:students(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data.map(a => ({
      ...a,
      student: Array.isArray(a.student) ? a.student[0] : a.student
    })) : [];
  },

  getPendingAdmissions: async (): Promise<AdmissionWithStudent[]> => {
    const { data, error } = await supabase
      .from('admissions')
      .select(`
        *,
        student:students(*)
      `)
      .eq('status', 'submitted')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data.map(a => ({
      ...a,
      student: Array.isArray(a.student) ? a.student[0] : a.student
    })) : [];
  },

  createAdmission: async (formData: AdmissionFormData): Promise<{ student: Student; admission: Admission }> => {
    const user = await supabase.auth.getUser();
    const parentId = user.data.user?.id;
    
    if (!parentId) throw new Error('User not authenticated');

    // Update parent profile
    await supabase
      .from('profiles')
      .update({
        full_name: formData.parent_full_name || null,
        phone: formData.parent_phone || null,
      })
      .eq('id', parentId);

    // Create student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        parent_id: parentId,
        full_name: formData.student_full_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        class: formData.class,
        academic_year: formData.academic_year,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        medical_conditions: formData.medical_conditions || null,
        allergies: formData.allergies || null,
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // Create admission
    const { data: admission, error: admissionError } = await supabase
      .from('admissions')
      .insert({
        student_id: student.id,
        parent_id: parentId,
        total_fee: formData.total_fee,
        status: 'submitted',
      })
      .select()
      .single();

    if (admissionError) throw admissionError;

    return { student, admission };
  },

  updateAdmissionStatus: async (
    id: string,
    status: 'submitted' | 'approved' | 'rejected',
    notes?: string
  ): Promise<Admission> => {
    const { data, error } = await supabase
      .from('admissions')
      .update({ status, notes: notes || null })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Payment API
export const paymentApi = {
  getMyPayments: async (): Promise<PaymentWithAdmission[]> => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        admission:admissions(
          *,
          student:students(*)
        )
      `)
      .eq('parent_id', user.data.user?.id || '')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data.map(p => ({
      ...p,
      admission: Array.isArray(p.admission) ? {
        ...p.admission[0],
        student: Array.isArray(p.admission[0]?.student) ? p.admission[0].student[0] : p.admission[0]?.student
      } : p.admission
    })) : [];
  },

  getPaymentsByAdmission: async (admissionId: string): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('admission_id', admissionId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  getAllPayments: async (): Promise<PaymentWithAdmission[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        admission:admissions(
          *,
          student:students(*)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data.map(p => ({
      ...p,
      admission: Array.isArray(p.admission) ? {
        ...p.admission[0],
        student: Array.isArray(p.admission[0]?.student) ? p.admission[0].student[0] : p.admission[0]?.student
      } : p.admission
    })) : [];
  },

  getPendingPayments: async (): Promise<PaymentWithAdmission[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        admission:admissions(
          *,
          student:students(*)
        )
      `)
      .eq('status', 'under_verification')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data.map(p => ({
      ...p,
      admission: Array.isArray(p.admission) ? {
        ...p.admission[0],
        student: Array.isArray(p.admission[0]?.student) ? p.admission[0].student[0] : p.admission[0]?.student
      } : p.admission
    })) : [];
  },

  createPayment: async (formData: PaymentFormData, receiptUrl?: string): Promise<Payment> => {
    const user = await supabase.auth.getUser();
    const parentId = user.data.user?.id;
    
    if (!parentId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('payments')
      .insert({
        admission_id: formData.admission_id,
        parent_id: parentId,
        amount: formData.amount,
        payment_date: formData.payment_date,
        payment_type: formData.payment_type,
        receipt_url: receiptUrl || null,
        status: receiptUrl ? 'under_verification' : 'pending_upload',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updatePaymentReceipt: async (id: string, receiptUrl: string): Promise<Payment> => {
    const { data, error } = await supabase
      .from('payments')
      .update({
        receipt_url: receiptUrl,
        status: 'under_verification',
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  verifyPayment: async (
    id: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<Payment> => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('payments')
      .update({
        status,
        verification_notes: notes || null,
        verified_by: user.data.user?.id || null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  getPaymentSummary: async (admissionId: string) => {
    const { data: admission, error: admError } = await supabase
      .from('admissions')
      .select('total_fee')
      .eq('id', admissionId)
      .maybeSingle();

    if (admError) throw admError;

    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('admission_id', admissionId);

    if (payError) throw payError;

    const totalFee = admission?.total_fee || 0;
    const paidAmount = Array.isArray(payments)
      ? payments
          .filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + Number(p.amount), 0)
      : 0;

    return {
      totalFee,
      paidAmount,
      remainingBalance: totalFee - paidAmount,
    };
  },
};

// Event API
export const eventApi = {
  getAllEvents: async (): Promise<Event[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  getUpcomingEvents: async (): Promise<Event[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_type', 'upcoming')
      .order('event_date', { ascending: true })
      .limit(5);
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  getPastEvents: async (): Promise<Event[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_type', 'past')
      .order('event_date', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  createEvent: async (formData: EventFormData, photoUrls: string[]): Promise<Event> => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        event_type: formData.event_type,
        photos: photoUrls,
        created_by: user.data.user?.id || '',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateEvent: async (id: string, updates: Partial<Event>): Promise<Event> => {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Announcement API
export const announcementApi = {
  getAllAnnouncements: async (): Promise<Announcement[]> => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('priority', { ascending: true })
      .order('announcement_date', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  getRecentAnnouncements: async (limit = 5): Promise<Announcement[]> => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('priority', { ascending: true })
      .order('announcement_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  createAnnouncement: async (formData: AnnouncementFormData): Promise<Announcement> => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        announcement_date: formData.announcement_date,
        created_by: user.data.user?.id || '',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateAnnouncement: async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Dashboard API
export const dashboardApi = {
  getParentDashboard: async (): Promise<ParentDashboardSummary> => {
    const students = await studentApi.getMyStudents();
    const payments = await paymentApi.getMyPayments();
    const upcomingEvents = await eventApi.getUpcomingEvents();
    const recentAnnouncements = await announcementApi.getRecentAnnouncements();

    const totalFees = students.reduce((sum, s) => sum + Number(s.admission?.total_fee || 0), 0);
    const paidAmount = payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      students,
      totalFees,
      paidAmount,
      remainingBalance: totalFees - paidAmount,
      upcomingEvents,
      recentAnnouncements,
    };
  },

  getAdminDashboard: async (): Promise<AdminDashboardSummary> => {
    const allStudents = await studentApi.getAllStudents();
    const pendingAdmissions = await admissionApi.getPendingAdmissions();
    const pendingPayments = await paymentApi.getPendingPayments();
    const allPayments = await paymentApi.getAllPayments();
    const recentAdmissions = await admissionApi.getAllAdmissions();

    const totalRevenue = allPayments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalStudents: allStudents.length,
      pendingAdmissions: pendingAdmissions.length,
      pendingPayments: pendingPayments.length,
      totalRevenue,
      recentAdmissions: recentAdmissions.slice(0, 5),
      recentPayments: allPayments.slice(0, 5),
    };
  },
};

// Storage API
export const storageApi = {
  uploadReceipt: async (file: File, paymentId: string): Promise<string> => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    
    if (!userId) throw new Error('User not authenticated');

    // Compress image if needed
    const compressedFile = await compressImage(file);
    
    const fileExt = compressedFile.name.split('.').pop();
    const fileName = `${userId}/${paymentId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('app-9gq4xbatbncx_receipts_images')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('app-9gq4xbatbncx_receipts_images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  uploadEventPhotos: async (files: File[]): Promise<string[]> => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    
    if (!userId) throw new Error('User not authenticated');

    const uploadPromises = files.map(async (file) => {
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('app-9gq4xbatbncx_events_images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('app-9gq4xbatbncx_events_images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    });

    return Promise.all(uploadPromises);
  },
};

// Image compression helper
async function compressImage(file: File): Promise<File> {
  const MAX_SIZE = 1024 * 1024; // 1MB
  
  if (file.size <= MAX_SIZE) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize to max 1080p
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/webp',
          0.8
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
