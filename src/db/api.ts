import { supabaseApi } from './supabaseApi';

export const profileApi = {
  getCurrentProfile: supabaseApi.getCurrentProfile,
  updateProfile: supabaseApi.updateProfile,
  getAllProfiles: supabaseApi.getAllProfiles,
  updateUserRole: supabaseApi.updateUserRole,
  deleteProfile: supabaseApi.deleteProfile,
};

export const studentApi = {
  getMyStudents: supabaseApi.getMyStudents,
  getAllStudents: supabaseApi.getAllStudents,
  createStudent: supabaseApi.createStudent,
  updateStudent: supabaseApi.updateStudent,
  cleanupOrphanedStudents: supabaseApi.cleanupOrphanedStudents,
};

export const admissionApi = {
  getMyAdmissions: supabaseApi.getMyAdmissions,
  getAllAdmissions: supabaseApi.getAllAdmissions,
  getPendingAdmissions: supabaseApi.getPendingAdmissions,
  createAdmission: supabaseApi.createAdmission,
  updateAdmissionStatus: supabaseApi.updateAdmissionStatus,
  updateAdmission: supabaseApi.updateAdmission,
  deleteAdmission: supabaseApi.deleteAdmission,
  uploadDocument: supabaseApi.uploadDocument,
};

export const paymentApi = {
  getMyPayments: supabaseApi.getMyPayments,
  getPaymentsByAdmission: supabaseApi.getPaymentsByAdmission,
  getAllPayments: supabaseApi.getAllPayments,
  getPendingPayments: supabaseApi.getPendingPayments,
  createPayment: supabaseApi.createPayment,
  updatePaymentReceipt: supabaseApi.updatePaymentReceipt,
  verifyPayment: supabaseApi.verifyPayment,
  getPaymentSummary: supabaseApi.getPaymentSummary,
};

export const eventApi = {
  getAllEvents: supabaseApi.getAllEvents,
  getUpcomingEvents: supabaseApi.getUpcomingEvents,
  getPastEvents: supabaseApi.getPastEvents,
  createEvent: supabaseApi.createEvent,
  updateEvent: supabaseApi.updateEvent,
  deleteEvent: supabaseApi.deleteEvent,
};

export const announcementApi = {
  getAllAnnouncements: supabaseApi.getAllAnnouncements,
  getRecentAnnouncements: supabaseApi.getRecentAnnouncements,
  createAnnouncement: supabaseApi.createAnnouncement,
  updateAnnouncement: supabaseApi.updateAnnouncement,
  deleteAnnouncement: supabaseApi.deleteAnnouncement,
};

export const dashboardApi = {
  getParentDashboard: supabaseApi.getParentDashboard,
  getAdminDashboard: supabaseApi.getAdminDashboard,
};

export const queryApi = {
  submitQuery: supabaseApi.submitQuery,
  getMyQueries: supabaseApi.getMyQueries,
  getAllQueries: supabaseApi.getAllQueries,
  uploadQueryAttachment: supabaseApi.uploadQueryAttachment,
  replyToQuery: supabaseApi.replyToQuery,
  deleteQuery: supabaseApi.deleteQuery,
};

export const storageApi = {
  uploadReceipt: supabaseApi.uploadReceipt,
  uploadEventPhotos: supabaseApi.uploadEventPhotos,
};
