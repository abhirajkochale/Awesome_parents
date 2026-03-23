import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, admissionApi, paymentApi } from '@/db/api';
import type { AdminDashboardSummary, AdmissionWithStudent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, FileText, Users, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 120, damping: 14 }
  }
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [admissions, setAdmissions] = useState<AdmissionWithStudent[]>([]);
  const [payments, setPayments] = useState<{ [key: string]: { paid: number; total: number } }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const dashboardData = await dashboardApi.getAdminDashboard();
      setSummary(dashboardData);

      const allAdmissions = await admissionApi.getAllAdmissions();
      setAdmissions(allAdmissions);

      const allPayments = await paymentApi.getAllPayments();
      const paymentDetails: { [key: string]: { paid: number; total: number } } = {};

      for (const adm of allAdmissions) {
        const admPayments = allPayments.filter(
          (p) => p.admission_id === adm.id && p.status === 'approved'
        );
        const totalPaid = admPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        paymentDetails[adm.id] = { paid: totalPaid, total: Number(adm.total_fee) };
      }

      setPayments(paymentDetails);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFeeDetails = (admissionId: string, totalFee: number) => {
    const payment = payments[admissionId] || { paid: 0, total: totalFee };
    const remaining = payment.total - payment.paid;
    const status = remaining === 0 ? 'Paid' : payment.paid > 0 ? 'Partial' : 'Pending';
    return { paidAmount: payment.paid, remainingAmount: remaining, status };
  };

  if (loading) {
    return (
      <div className="space-y-6 font-['Plus_Jakarta_Sans']">
        <Skeleton className="h-14 w-72 rounded-2xl" />
        <div className="grid grid-cols-12 gap-6">
          <Skeleton className="col-span-12 lg:col-span-6 h-64 rounded-[40px]" />
          <Skeleton className="col-span-12 lg:col-span-6 h-64 rounded-[40px]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-['Plus_Jakarta_Sans'] pb-12 space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Admin <span className="text-blue-600">Dashboard</span> 🚀
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg font-['Be_Vietnam_Pro']">
            Overview of admissions, payments, and school activity.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/events"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 font-bold text-sm px-6 py-3 rounded-2xl transition-all active:scale-95"
          >
            <Calendar className="h-4 w-4" />
            Events
          </Link>
          <Link
            to="/admin/admissions"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95"
          >
            <CheckCircle className="h-4 w-4" />
            Admissions
          </Link>
        </div>
      </motion.div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        <motion.div variants={itemVariants} className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white rounded-[40px] p-6 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.05)] h-full relative overflow-hidden group">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
            <div className="relative z-10">
              <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl inline-block mb-4">
                <Users className="w-6 h-6" />
              </span>
              <p className="text-slate-500 font-bold font-['Be_Vietnam_Pro'] text-sm">Total Students</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{summary?.totalStudents || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white rounded-[40px] p-6 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.05)] h-full relative overflow-hidden group">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
            <div className="relative z-10">
              <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl inline-block mb-4">
                <Clock className="w-6 h-6" />
              </span>
              <p className="text-slate-500 font-bold font-['Be_Vietnam_Pro'] text-sm">Pending Admissions</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{summary?.pendingAdmissions || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white rounded-[40px] p-6 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.05)] h-full relative overflow-hidden group">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-orange-50 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
            <div className="relative z-10">
              <span className="p-3 bg-orange-50 text-orange-600 rounded-2xl inline-block mb-4">
                <FileText className="w-6 h-6" />
              </span>
              <p className="text-slate-500 font-bold font-['Be_Vietnam_Pro'] text-sm">Pending Payments</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{summary?.pendingPayments || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white rounded-[40px] p-6 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.05)] h-full relative overflow-hidden group">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-green-50 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
            <div className="relative z-10">
              <span className="p-3 bg-green-50 text-green-600 rounded-2xl inline-block mb-4">
                <DollarSign className="w-6 h-6" />
              </span>
              <p className="text-slate-500 font-bold font-['Be_Vietnam_Pro'] text-sm">Total Revenue</p>
              <p className="text-3xl font-black text-slate-900 mt-1">₹{(summary?.totalRevenue ?? 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Student List Section */}
      <motion.div variants={itemVariants} className="bg-slate-50 rounded-[48px] p-8 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-black text-slate-900">Recent Applications</h2>
          </div>
          <Link to="/admin/admissions" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm hover:text-blue-600 transition-colors">
            View All
          </Link>
        </div>

        {admissions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px]">
            <p className="text-slate-400 font-medium font-['Be_Vietnam_Pro']">No student admissions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {admissions.slice(0, 5).map((admission) => {
              const { paidAmount, status: feeStatus } = getFeeDetails(admission.id, admission.total_fee);
              const feeProgress = Math.min(100, Math.round((paidAmount / admission.total_fee) * 100));

              return (
                <div key={admission.id} className="bg-white rounded-[32px] p-6 flex flex-col lg:flex-row lg:items-center gap-6 hover:shadow-md transition-all">
                  
                  {/* Student Info */}
                  <div className="flex items-center gap-4 flex-[2]">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-blue-600 font-black text-lg">
                        {admission.student?.full_name?.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-black text-lg text-slate-900">{admission.student?.full_name}</p>
                      <p className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro']">
                        Submitted: {format(new Date(admission.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-3 flex-1">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider">
                      {admission.student?.class}
                    </span>
                    <Badge
                      variant={
                        admission.status === 'approved' ? 'default' :
                          admission.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                      className="px-4 py-1.5 rounded-xl uppercase tracking-wider text-xs font-bold"
                    >
                      {admission.status}
                    </Badge>
                  </div>

                  {/* Fee Progress */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>₹{paidAmount.toLocaleString()}</span>
                      <span>/ ₹{admission.total_fee.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all rounded-full", feeStatus === 'Paid' ? 'bg-green-500' : 'bg-blue-500')}
                        style={{ width: `${feeProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <Link
                      to="/admin/admissions"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
