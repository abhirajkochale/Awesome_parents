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
} from '@/types';

// Mock current user
export const mockCurrentUser: Profile = {
  id: 'user-123',
  email: 'parent@example.com',
  full_name: 'Demo Parent',
  phone: '+1 (555) 000-0000',
  role: 'parent',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock students
export const mockStudents: Student[] = [];

// Mock admissions
export const mockAdmissions: Admission[] = [];

// Mock payments
export const mockPayments: Payment[] = [];

// Mock events
export const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Welcome Back to School',
    description: 'Exciting start to the 2025-2026 school year! Join us for activities, meet your child\'s teacher, and explore our wonderful classrooms.',
    event_date: '2025-09-05',
    event_type: 'upcoming',
    photos: [],
    created_by: 'admin-1',
    created_at: '2025-02-01T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'event-2',
    title: 'Fall Festival',
    description: 'Family-friendly festival with games, crafts, face painting, and refreshments. A wonderful opportunity to celebrate together!',
    event_date: '2025-10-18',
    event_type: 'upcoming',
    photos: [],
    created_by: 'admin-1',
    created_at: '2025-02-02T10:00:00Z',
    updated_at: '2025-02-02T10:00:00Z',
  },
  {
    id: 'event-3',
    title: 'Thanksgiving Feast',
    description: 'Celebrate gratitude with our special Thanksgiving meal and cultural learning activities.',
    event_date: '2025-11-21',
    event_type: 'upcoming',
    photos: [],
    created_by: 'admin-1',
    created_at: '2025-02-03T10:00:00Z',
    updated_at: '2025-02-03T10:00:00Z',
  },
  {
    id: 'event-4',
    title: 'Winter Holiday Celebration',
    description: 'Festive gathering with holiday performances, decorations, and seasonal treats.',
    event_date: '2025-12-19',
    event_type: 'upcoming',
    photos: [],
    created_by: 'admin-1',
    created_at: '2025-02-04T10:00:00Z',
    updated_at: '2025-02-04T10:00:00Z',
  },
  {
    id: 'event-5',
    title: 'Spring Field Day',
    description: 'Fun outdoor games and activities celebrating spring! Bring your family and enjoy a day of play.',
    event_date: '2025-05-17',
    event_type: 'upcoming',
    photos: [],
    created_by: 'admin-1',
    created_at: '2025-02-05T10:00:00Z',
    updated_at: '2025-02-05T10:00:00Z',
  },
  {
    id: 'event-6',
    title: 'End of Year Celebration',
    description: 'Special ceremony celebrating the achievements and growth of our students. See you there!',
    event_date: '2025-05-30',
    event_type: 'upcoming',
    photos: [],
    created_by: 'admin-1',
    created_at: '2025-02-06T10:00:00Z',
    updated_at: '2025-02-06T10:00:00Z',
  },
];

// Mock announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: 'announcement-1',
    title: 'Important: Final Payment Deadline - October 15, 2025',
    content:
      'Dear Parents, please note that the final outstanding balance must be paid by October 15, 2025. Balances not settled by this date may impact your child\'s enrollment continuation. Thank you for your cooperation.',
    priority: 'high',
    announcement_date: '2025-02-07',
    created_by: 'admin-1',
    created_at: '2025-02-07T08:00:00Z',
    updated_at: '2025-02-07T08:00:00Z',
  },
  {
    id: 'announcement-2',
    title: 'School Improvement Day - No Classes on February 14',
    content:
      'Our school will be closed on February 14 for scheduled staff professional development. Classes will resume on February 15. Thank you for your understanding.',
    priority: 'normal',
    announcement_date: '2025-02-06',
    created_by: 'admin-1',
    created_at: '2025-02-06T10:30:00Z',
    updated_at: '2025-02-06T10:30:00Z',
  },
  {
    id: 'announcement-3',
    title: 'Spring Registration Now Open',
    content:
      'Registration for spring semester and future terms is now open! Secure your child\'s spot by registering through your parent portal. Early bird discounts available until February 28.',
    priority: 'normal',
    announcement_date: '2025-02-05',
    created_by: 'admin-1',
    created_at: '2025-02-05T14:00:00Z',
    updated_at: '2025-02-05T14:00:00Z',
  },
  {
    id: 'announcement-4',
    title: 'Curriculum Updates & Learning Goals',
    content:
      'We\'ve updated our curriculum to include more hands-on STEM activities and multilingual learning components. View the detailed learning goals in your child\'s class page.',
    priority: 'low',
    announcement_date: '2025-02-04',
    created_by: 'admin-1',
    created_at: '2025-02-04T11:20:00Z',
    updated_at: '2025-02-04T11:20:00Z',
  },
  {
    id: 'announcement-5',
    title: 'New Safety Procedures Implemented',
    content:
      'For the safety of our students, we\'ve implemented new pickup and drop-off procedures. Please review the updated guidelines on our website.',
    priority: 'normal',
    announcement_date: '2025-02-03',
    created_by: 'admin-1',
    created_at: '2025-02-03T09:15:00Z',
    updated_at: '2025-02-03T09:15:00Z',
  },
];

// Mocked API functions
export const mockApi = {
  // Profile
  getCurrentProfile: async (): Promise<Profile> => {
    await new Promise(r => setTimeout(r, 300));
    return mockCurrentUser;
  },

  // Students
  getMyStudents: async (): Promise<StudentWithAdmission[]> => {
    await new Promise(r => setTimeout(r, 400));
    return mockStudents.map(student => {
      const admission = mockAdmissions.find(a => a.student_id === student.id);
      return {
        ...student,
        admission,
      };
    });
  },

  // Admissions
  getMyAdmissions: async (): Promise<AdmissionWithStudent[]> => {
    await new Promise(r => setTimeout(r, 350));
    return mockAdmissions.map(admission => {
      const student = mockStudents.find(s => s.id === admission.student_id);
      return {
        ...admission,
        student,
      };
    });
  },

  createAdmission: async (_data: any) => {
    await new Promise(r => setTimeout(r, 500));
    return { success: true };
  },

  // Payments
  getMyPayments: async (): Promise<PaymentWithAdmission[]> => {
    await new Promise(r => setTimeout(r, 400));
    return mockPayments.map(payment => {
      const admission = mockAdmissions.find(a => a.id === payment.admission_id);
      const student = mockStudents.find(s => s.id === admission?.student_id);
      return {
        ...payment,
        admission: admission
          ? {
            ...admission,
            student,
          }
          : undefined,
      };
    });
  },

  getPaymentsByAdmission: async (admissionId: string): Promise<Payment[]> => {
    await new Promise(r => setTimeout(r, 300));
    return mockPayments.filter(p => p.admission_id === admissionId);
  },

  createPayment: async (_data: any) => {
    await new Promise(r => setTimeout(r, 500));
    return { success: true };
  },

  getPaymentSummary: async (admissionId: string) => {
    await new Promise(r => setTimeout(r, 300));
    const admission = mockAdmissions.find(a => a.id === admissionId);
    const payments = mockPayments.filter(p => p.admission_id === admissionId && p.status === 'approved');
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      totalFee: admission?.total_fee || 0,
      paidAmount,
      remainingBalance: (admission?.total_fee || 0) - paidAmount,
    };
  },

  // Events
  getAllEvents: async (): Promise<Event[]> => {
    await new Promise(r => setTimeout(r, 350));
    return mockEvents;
  },

  getUpcomingEvents: async (): Promise<Event[]> => {
    await new Promise(r => setTimeout(r, 300));
    return mockEvents.filter(e => e.event_type === 'upcoming').slice(0, 5);
  },

  getPastEvents: async (): Promise<Event[]> => {
    await new Promise(r => setTimeout(r, 300));
    return mockEvents.filter(e => e.event_type === 'past');
  },

  createEvent: async (_data: any) => {
    await new Promise(r => setTimeout(r, 500));
    return { success: true };
  },

  // Announcements
  getAllAnnouncements: async (): Promise<Announcement[]> => {
    await new Promise(r => setTimeout(r, 350));
    return mockAnnouncements.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return (
        priorityOrder[a.priority as keyof typeof priorityOrder] -
        priorityOrder[b.priority as keyof typeof priorityOrder]
      );
    });
  },

  getRecentAnnouncements: async (limit = 5): Promise<Announcement[]> => {
    await new Promise(r => setTimeout(r, 300));
    return mockAnnouncements
      .sort((a, b) => new Date(b.announcement_date).getTime() - new Date(a.announcement_date).getTime())
      .slice(0, limit);
  },

  createAnnouncement: async (_data: any) => {
    await new Promise(r => setTimeout(r, 500));
    return { success: true };
  },

  // Dashboard
  getParentDashboard: async (): Promise<ParentDashboardSummary> => {
    await new Promise(r => setTimeout(r, 600));
    const students = await mockApi.getMyStudents();
    const payments = await mockApi.getMyPayments();
    const upcomingEvents = await mockApi.getUpcomingEvents();
    const recentAnnouncements = await mockApi.getRecentAnnouncements(3);

    const totalFees = students.reduce((sum, s) => sum + (s.admission?.total_fee || 0), 0);
    const paidAmount = payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);

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
    await new Promise(r => setTimeout(r, 600));
    // Calculate stats dynamically from current mock data
    const totalStudents = mockStudents.length;
    const pendingAdmissions = mockAdmissions.filter(a => a.status === 'submitted').length;
    const pendingPayments = mockPayments.filter(p => p.status === 'under_verification').length;
    const totalRevenue = mockPayments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);

    const recentPayments = mockPayments.slice(0, 5).map(p => {
      const admission = mockAdmissions.find(a => a.id === p.admission_id);
      const student = mockStudents.find(s => s.id === admission?.student_id);
      return {
        ...p,
        admission: admission
          ? ({
            ...admission,
            student,
          } as any)
          : undefined,
      };
    });

    return {
      totalStudents,
      pendingAdmissions,
      pendingPayments,
      totalRevenue,
      recentAdmissions: mockAdmissions.slice(0, 5).map(a => ({
        ...a,
        student: mockStudents.find(s => s.id === a.student_id),
      })),
      recentPayments,
    };
  },

  // Storage
  uploadReceipt: async (_file: File) => {
    await new Promise(r => setTimeout(r, 800));
    return 'https://via.placeholder.com/400x300?text=Receipt';
  },

  uploadEventPhotos: async (files: File[]) => {
    await new Promise(r => setTimeout(r, 1000));
    return files.map(() => 'https://via.placeholder.com/400x300?text=Event');
  },
};

export default mockApi;
