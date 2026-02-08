import { supabase } from './supabase';
import type {
    Profile,
    Student,
    Admission,
    Payment,
    Event,
    Announcement,
    StudentWithAdmission,
    AdmissionWithStudent,
    PaymentWithAdmission,
    ParentDashboardSummary,
    AdminDashboardSummary,
    AdmissionFormData,
    PaymentFormData,
    EventFormData,
    AnnouncementFormData,
    HelpQuery,
    QueryFormData,
} from '@/types';

// Helper to get current user ID
const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
};

export const supabaseApi = {
    // Profile
    getCurrentProfile: async (): Promise<Profile | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error) throw error;
        if (data) return data;

        // Fallback: Create profile if missing (e.g. if trigger failed or pre-existing user)
        const metadata = user.user_metadata || {};
        const newProfile = {
            id: user.id,
            email: user.email,
            username: metadata.username || user.email?.split('@')[0] || 'user',
            full_name: metadata.full_name || metadata.username || 'User',
            role: (metadata.role as 'parent' | 'admin') || 'parent',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

        if (createError) {
            // If error is 409 (Conflict), it means the profile exists (likely created by trigger)
            // So we should try to fetch it again
            if (createError.code === '23505') { // Postgres unique violation code
                const { data: retryData, error: retryError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (retryData) return retryData;
                if (retryError) console.error('Failed to fetch profile after conflict:', retryError);
            } else {
                console.error('Failed to auto-create profile:', createError);
            }
            return null;
        }
        return createdProfile;
    },

    getAllProfiles: async (): Promise<Profile[]> => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data;
    },

    updateUserRole: async (userId: string, role: 'parent' | 'admin'): Promise<void> => {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        if (error) throw error;
    },

    deleteProfile: async (userId: string): Promise<void> => {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;
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

    // Students
    getMyStudents: async (): Promise<StudentWithAdmission[]> => {
        const userId = await getCurrentUserId();

        // Fetch students
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('parent_id', userId);

        if (studentsError) throw studentsError;
        if (!students) return [];

        // Fetch admissions for these students
        const studentIds = students.map(s => s.id);
        const { data: admissions, error: admissionsError } = await supabase
            .from('admissions')
            .select('*')
            .in('student_id', studentIds);

        if (admissionsError) throw admissionsError;

        // Merge
        return students.map(student => ({
            ...student,
            admission: admissions?.find(a => a.student_id === student.id),
        }));
    },

    getAllStudents: async (): Promise<StudentWithAdmission[]> => {
        const { data: students, error: studentsError } = await supabase.from('students').select('*');
        if (studentsError) throw studentsError;
        if (!students) return [];

        const { data: admissions, error: admissionsError } = await supabase.from('admissions').select('*');
        if (admissionsError) throw admissionsError;

        return students.map(student => ({
            ...student,
            admission: admissions?.find(a => a.student_id === student.id),
        }));
    },

    createStudent: async (studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> => {
        const { data, error } = await supabase
            .from('students')
            .insert([studentData])
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

    // Admissions
    getMyAdmissions: async (): Promise<AdmissionWithStudent[]> => {
        const userId = await getCurrentUserId();

        const { data: admissions, error: admissionsError } = await supabase
            .from('admissions')
            .select('*, students(*)')
            .eq('parent_id', userId);

        if (admissionsError) throw admissionsError;

        // Transform because Supabase returns { students: {...} } 
        // but our type expects student: {...} (singular, and flattened or nested appropriately)
        // Actually the join 'students(*)' returns an object or array depending on relation. 
        // Here student_id is many-to-one (admissions->students), so it should return property 'students' as single object.

        return (admissions || []).map((a: any) => ({
            ...a,
            student: a.students,
        }));
    },

    getAllAdmissions: async (): Promise<AdmissionWithStudent[]> => {
        const { data: admissions, error } = await supabase
            .from('admissions')
            .select('*, students(*)'); // Join with students table

        if (error) throw error;

        return (admissions || []).map((a: any) => ({
            ...a,
            student: a.students,
        }));
    },

    getPendingAdmissions: async (): Promise<AdmissionWithStudent[]> => {
        const { data: admissions, error } = await supabase
            .from('admissions')
            .select('*, students(*)')
            .eq('status', 'submitted');

        if (error) throw error;

        return (admissions || []).map((a: any) => ({
            ...a,
            student: a.students,
        }));
    },

    createAdmission: async (formData: AdmissionFormData): Promise<{ student: Student; admission: Admission }> => {
        const userId = await getCurrentUserId();

        // 1. Create Student
        const studentData = {
            parent_id: userId,
            full_name: formData.student_full_name,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender,
            class: formData.class, // Note: 'class' is a reserved keyword in some contexts but okay as object property
            academic_year: formData.academic_year,
            assigned_teacher: null, // assigned later
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_phone: formData.emergency_contact_phone,
            emergency_contact_relationship: formData.emergency_contact_relationship,
            medical_conditions: formData.medical_conditions || null,
            allergies: formData.allergies || null,
            // New fields
            residential_address: formData.residential_address,
            correspondence_address: formData.correspondence_address,
            religion: formData.religion || null,
            caste: formData.caste || null,
            mother_phone: formData.mother_phone,
            mother_email: formData.mother_email || null,
            father_phone: formData.father_phone,
            father_email: formData.father_email || null,
            preferred_whatsapp: formData.preferred_whatsapp,
            previous_school: formData.previous_school || null,
        };

        const { data: student, error: studentError } = await supabase
            .from('students')
            .insert([studentData])
            .select()
            .single();

        if (studentError) throw studentError;

        // 2. Create Admission
        const admissionData = {
            student_id: student.id,
            parent_id: userId,
            admission_date: new Date().toISOString(),
            status: 'submitted',
            total_fee: 0,
            uploaded_files: formData.uploaded_files,
            notes: null
        };

        // Calculate generic fee based on class for now to satisfy not null constraint
        const fees: Record<string, number> = {
            'Nursery': 25000,
            'L.K.G.': 30000,
            'U.K.G.': 32000,
            'Class 1': 35000,
        };
        // Use provided total_fee or fallback to calculation if missing (though it should be provided)
        const estimatedFee = formData.total_fee || fees[formData.class] || 20000;

        const { data: admission, error: admissionError } = await supabase
            .from('admissions')
            .insert([{ ...admissionData, total_fee: estimatedFee }])
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
            .update({ status, notes })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Payments
    getMyPayments: async (): Promise<PaymentWithAdmission[]> => {
        const userId = await getCurrentUserId();

        const { data: payments, error } = await supabase
            .from('payments')
            .select(`
        *,
        admissions (
          *,
          students (*)
        )
      `)
            .eq('parent_id', userId);

        if (error) throw error;

        return (payments || []).map((p: any) => ({
            ...p,
            admission: p.admissions ? {
                ...p.admissions,
                student: p.admissions.students
            } : undefined
        }));
    },

    getPaymentsByAdmission: async (admissionId: string): Promise<Payment[]> => {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('admission_id', admissionId);

        if (error) throw error;
        return data;
    },

    getAllPayments: async (): Promise<PaymentWithAdmission[]> => {
        const { data: payments, error } = await supabase
            .from('payments')
            .select(`
        *,
        admissions (
          *,
          students (*)
        )
      `);

        if (error) throw error;

        return (payments || []).map((p: any) => ({
            ...p,
            admission: p.admissions ? {
                ...p.admissions,
                student: p.admissions.students
            } : undefined
        }));
    },

    getPendingPayments: async (): Promise<PaymentWithAdmission[]> => {
        const { data: payments, error } = await supabase
            .from('payments')
            .select(`
        *,
        admissions (
          *,
          students (*)
        )
      `)
            .eq('status', 'under_verification');

        if (error) throw error;

        return (payments || []).map((p: any) => ({
            ...p,
            admission: p.admissions ? {
                ...p.admissions,
                student: p.admissions.students
            } : undefined
        }));
    },

    createPayment: async (formData: PaymentFormData, receiptUrl?: string): Promise<Payment> => {
        const userId = await getCurrentUserId();

        const paymentData = {
            admission_id: formData.admission_id,
            parent_id: userId,
            amount: formData.amount,
            payment_date: formData.payment_date,
            receipt_url: receiptUrl || null,
            status: receiptUrl ? 'under_verification' : 'pending_upload',
            payment_type: formData.payment_type,
        };

        const { data, error } = await supabase
            .from('payments')
            .insert([paymentData])
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
                status: 'under_verification'
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
        const userId = await getCurrentUserId(); // Admin verifying
        const { data, error } = await supabase
            .from('payments')
            .update({
                status,
                verification_notes: notes,
                verified_by: userId,
                verified_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getPaymentSummary: async (admissionId: string) => {
        // Determine total fee from admission
        const { data: admission, error: admError } = await supabase
            .from('admissions')
            .select('total_fee')
            .eq('id', admissionId)
            .single();

        if (admError) throw admError;

        // Sum details from approved payments
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('amount')
            .eq('admission_id', admissionId)
            .eq('status', 'approved');

        if (payError) throw payError;

        const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalFee = Number(admission.total_fee);

        return {
            totalFee,
            paidAmount,
            remainingBalance: totalFee - paidAmount
        };
    },

    // Events
    getAllEvents: async (): Promise<Event[]> => {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    getUpcomingEvents: async (): Promise<Event[]> => {
        // Filter events where event_date >= today
        const today = new Date().toISOString();
        const { data, error } = await supabase
            .from('events')
            .select('*')
            //.eq('event_type', 'upcoming') // Using event_type column if maintained
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(5);

        if (error) throw error;
        return data;
    },

    getPastEvents: async (): Promise<Event[]> => {
        const today = new Date().toISOString();
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .lt('event_date', today)
            .order('event_date', { ascending: false });

        if (error) throw error;
        return data;
    },

    createEvent: async (formData: EventFormData, photoUrls: string[]): Promise<Event> => {
        const userId = await getCurrentUserId();
        const eventData = {
            title: formData.title,
            description: formData.description,
            event_date: formData.event_date,
            event_type: formData.event_type,
            photos: photoUrls,
            created_by: userId
        };

        const { data, error } = await supabase
            .from('events')
            .insert([eventData])
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

    // Announcements
    getAllAnnouncements: async (): Promise<Announcement[]> => {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    getRecentAnnouncements: async (limit = 5): Promise<Announcement[]> => {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    createAnnouncement: async (formData: AnnouncementFormData): Promise<Announcement> => {
        const userId = await getCurrentUserId();
        const dataToInsert = {
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            announcement_date: formData.announcement_date,
            created_by: userId
        };

        const { data, error } = await supabase
            .from('announcements')
            .insert([dataToInsert])
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
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
    },

    // Dashboard Aggregation
    getParentDashboard: async (): Promise<ParentDashboardSummary> => {


        // We can reuse other methods or call specialized RPCs. 
        // For now, let's reuse methods to ensure consistency.
        // This might be slightly less efficient (multiple network requests) but safest for now.

        const students = await supabaseApi.getMyStudents();
        const payments = await supabaseApi.getMyPayments();
        const upcomingEvents = await supabaseApi.getUpcomingEvents();
        const recentAnnouncements = await supabaseApi.getRecentAnnouncements(3);

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
        // Using cheap Count queries where possible

        const { count: totalStudents, error: err1 } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

        const { count: pendingAdmissions, error: err2 } = await supabase
            .from('admissions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'submitted');

        const { count: pendingPayments, error: err3 } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'under_verification');

        const { count: totalQueries, error: err7 } = await supabase
            .from('queries')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        // Total Revenue (requires sum)
        const { data: approvedPayments, error: err4 } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'approved');

        if (err1 || err2 || err3 || err4 || err7) throw new Error("Failed to fetch dashboard stats");

        const totalRevenue = (approvedPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

        // Recent Admissions
        const { data: recentAdmissionsRaw, error: err5 } = await supabase
            .from('admissions')
            .select('*, students(*)')
            .order('created_at', { ascending: false })
            .limit(5);

        // Recent Payments
        const { data: recentPaymentsRaw, error: err6 } = await supabase
            .from('payments')
            .select('*, admissions(*, students(*))')
            .order('created_at', { ascending: false })
            .limit(5);

        if (err5 || err6) throw new Error("Failed to fetch dashboard lists");

        const recentAdmissions = (recentAdmissionsRaw || []).map((a: any) => ({
            ...a,
            student: a.students
        }));

        const recentPayments = (recentPaymentsRaw || []).map((p: any) => ({
            ...p,
            admission: p.admissions ? {
                ...p.admissions,
                student: p.admissions.students
            } : undefined
        }));

        return {
            totalStudents: totalStudents || 0,
            pendingAdmissions: pendingAdmissions || 0,
            pendingPayments: pendingPayments || 0,
            totalRevenue,
            recentAdmissions,
            recentPayments,
            totalQueries: totalQueries || 0,
        };
    },

    // Storage
    uploadReceipt: async (file: File, paymentId: string): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${paymentId}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('receipts') // Ensure this bucket exists in Supabase
            .upload(filePath, file);

        if (uploadError) {
            // Fallback for demo if bucket doesn't exist
            console.error("Storage upload failed (bucket might be missing):", uploadError);
            return 'https://via.placeholder.com/400x300?text=Receipt+Upload+Failed';
        }

        const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
        return data.publicUrl;
    },

    uploadEventPhotos: async (files: File[]): Promise<string[]> => {
        const urls: string[] = [];
        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `event_${Date.now()}_${Math.random()}.${fileExt}`;
            const filePath = `events/${fileName}`;

            const { error } = await supabase.storage
                .from('events') // Ensure bucket exists
                .upload(filePath, file);

            if (!error) {
                const { data } = supabase.storage.from('events').getPublicUrl(filePath);
                urls.push(data.publicUrl);
            }
        }
        return urls;
    },

    uploadDocument: async (file: File, docType: string): Promise<string> => {
        const userId = await getCurrentUserId();
        const fileExt = file.name.split('.').pop();
        // Structure: UserID/DocType_Timestamp.ext
        const fileName = `${userId}/${docType}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        return fileName;
    },

    // Queries
    submitQuery: async (formData: QueryFormData, attachmentUrl?: string): Promise<HelpQuery> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('queries')
            .insert({
                parent_id: userId,
                subject: formData.subject,
                message: formData.message,
                attachment_url: attachmentUrl || null,
                status: 'open'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getMyQueries: async (): Promise<HelpQuery[]> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('queries')
            .select('*')
            .eq('parent_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    getAllQueries: async (): Promise<HelpQuery[]> => {
        const { data, error } = await supabase
            .from('queries')
            .select('*, parent:profiles(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((q: any) => ({
            ...q,
            parent: q.parent
        }));
    },

    uploadQueryAttachment: async (file: File): Promise<string> => {
        const userId = await getCurrentUserId();
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('attachments').getPublicUrl(fileName);
        return data.publicUrl;
    },
};
