import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import type { ParentDashboardSummary } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { STANDARD_STYLES } from '@/lib/batchConfig';
import { Baby, Flower2, Palette, BookOpen, GraduationCap, DollarSign, Calendar, Bell, ArrowRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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

export default function DashboardPage() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<ParentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getParentDashboard();
      setSummary(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const paymentPercent = summary
    ? Math.round(((summary.totalFees - (summary.remainingBalance || 0)) / summary.totalFees) * 100) || 0
    : 0;

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    submitted: { label: 'Pending Review', bg: 'bg-orange-100', text: 'text-orange-700' },
    approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-700' },
    rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' },
  };

  if (loading) {
    return (
      <div className="space-y-6 font-['Plus_Jakarta_Sans']">
        <Skeleton className="h-14 w-72 rounded-2xl" />
        <div className="grid grid-cols-12 gap-6">
          <Skeleton className="col-span-12 lg:col-span-5 h-64 rounded-[40px]" />
          <Skeleton className="col-span-12 lg:col-span-7 h-64 rounded-[40px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-[32px] flex items-center gap-4">
        <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
        <p className="font-bold text-red-700">{error}</p>
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
            Good Morning,{' '}
            <span className="text-blue-600">{profile?.full_name?.split(' ')[0] || 'Parent'}</span> 👋
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg font-['Be_Vietnam_Pro']">
            Here's what's happening at AwesomeKids today.
          </p>
        </div>
        {(summary?.remainingBalance ?? 0) > 0 && (
          <Link
            to="/payments"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-base px-8 py-4 rounded-[20px] shadow-xl shadow-blue-200 transition-all active:scale-95 self-start"
          >
            Pay Now <ArrowRight className="h-5 w-5" />
          </Link>
        )}
      </motion.div>

      {/* High Priority Alerts */}
      {summary?.recentAnnouncements?.filter(a => a.priority === 'high').map((ann) => (
        <motion.div
          key={ann.id}
          variants={itemVariants}
          className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-[32px] p-6 flex items-start gap-4 border-l-4 border-rose-400"
        >
          <span className="p-2 bg-rose-100 rounded-xl text-rose-600 flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </span>
          <div>
            <p className="font-black text-rose-900 text-base">{ann.title}</p>
            <p className="text-rose-700 font-medium text-sm mt-1 font-['Be_Vietnam_Pro'] leading-relaxed">{ann.content}</p>
          </div>
        </motion.div>
      ))}

      {/* Main Bento Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Fee Status Card */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-5">
          <div className="bg-white rounded-[48px] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] h-full flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-60 group-hover:scale-150 transition-all duration-700" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                  <DollarSign className="w-5 h-5" />
                </span>
                <h2 className="text-2xl font-black text-slate-900">Fees & Payments</h2>
              </div>

              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-black text-slate-900">
                  ₹{(summary?.remainingBalance ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-slate-400 font-bold mb-2 font-['Be_Vietnam_Pro']">outstanding</span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                  <span>Payment Progress</span>
                  <span className="text-blue-600">{paymentPercent}% Complete</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${paymentPercent}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 rounded-[24px] p-5 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total Fee</span>
                  <span className="font-black text-slate-900">₹{(summary?.totalFees ?? 0).toLocaleString('en-IN')}</span>
                </div>
                {summary?.students.some(s => (s.admission?.discount_amount ?? 0) > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600 font-medium">Discount Applied</span>
                    <span className="font-black text-orange-600">
                      - ₹{summary.students.reduce((sum, s) => sum + (s.admission?.discount_amount ?? 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              <Link
                to="/payments"
                className="inline-flex items-center gap-2 text-blue-600 font-black text-sm mt-5 hover:underline"
              >
                View Payment History <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Child Card + Events */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">

          {/* Child Status Card */}
          <motion.div variants={itemVariants}>
            <div className="bg-slate-50 rounded-[48px] p-8 md:p-10 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-50 rounded-full blur-3xl opacity-80 group-hover:scale-150 transition-all duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="p-3 bg-white rounded-2xl text-green-600 shadow-sm">
                    <GraduationCap className="w-5 h-5" />
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">Your Child</h2>
                </div>

                {!summary?.students?.length ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 font-medium font-['Be_Vietnam_Pro']">No admission submitted yet.</p>
                    <Link to="/admission" className="inline-flex mt-4 items-center gap-2 bg-blue-600 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-500 transition-all">
                      Apply Now <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {summary.students.map((student) => {
                      const stdValue = (student.class || '').toLowerCase();
                      const styles = STANDARD_STYLES[stdValue];
                      const iconMap: Record<string, any> = { Baby, Flower2, Palette, BookOpen, GraduationCap };
                      const IconComponent = iconMap[styles?.icon || 'GraduationCap'] || GraduationCap;
                      const sc = statusConfig[student.admission?.status ?? ''] || { label: student.admission?.status || 'Unknown', bg: 'bg-slate-100', text: 'text-slate-600' };

                      return (
                        <div key={student.id} className="bg-white rounded-[32px] p-6 flex items-center gap-4">
                          <div className={cn("p-3 rounded-2xl text-white shadow-md bg-gradient-to-br flex-shrink-0", styles?.gradient || "from-blue-500 to-blue-600")}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-xl text-slate-900">{student.full_name}</p>
                            <p className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro']">{student.class} • {student.academic_year}</p>
                            {student.batch_time && (
                              <p className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mt-1 uppercase tracking-wide">
                                <Clock className="w-3 h-3" /> {student.batch_time}
                              </p>
                            )}
                          </div>
                          <span className={cn("px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex-shrink-0", sc.bg, sc.text)}>
                            {sc.label}
                          </span>
                        </div>
                      );
                    })}
                    <Link to="/admission" className="inline-flex items-center gap-2 text-blue-600 font-black text-sm hover:underline">
                      View Admission Details <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Row: Events & Announcements */}
          <div className="grid grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <div className="bg-[#fffbf0] rounded-[40px] p-6 h-full relative overflow-hidden group">
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-orange-50 rounded-full blur-2xl group-hover:scale-125 transition-all duration-500" />
                <div className="relative z-10">
                  <span className="p-3 bg-white rounded-2xl text-orange-500 shadow-sm inline-block mb-4">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <h3 className="font-black text-slate-900 text-lg mb-1">Upcoming Events</h3>
                  {summary?.upcomingEvents?.length ? (
                    <>
                      <p className="font-bold text-slate-700 font-['Be_Vietnam_Pro'] text-sm leading-snug line-clamp-2">
                        {summary.upcomingEvents[0].title}
                      </p>
                      <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wide">
                        {format(new Date(summary.upcomingEvents[0].event_date), 'MMM d, yyyy')}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-400 text-sm font-medium font-['Be_Vietnam_Pro']">No upcoming events.</p>
                  )}
                  <Link to="/events" className="inline-flex mt-4 items-center gap-1 text-orange-600 font-black text-xs hover:underline">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-[#f0f4ff] rounded-[40px] p-6 h-full relative overflow-hidden group">
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-100 rounded-full blur-2xl group-hover:scale-125 transition-all duration-500" />
                <div className="relative z-10">
                  <span className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm inline-block mb-4">
                    <Bell className="w-5 h-5" />
                  </span>
                  <h3 className="font-black text-slate-900 text-lg mb-1">Announcements</h3>
                  {summary?.recentAnnouncements?.filter(a => a.priority !== 'high').length ? (
                    <p className="font-bold text-slate-700 font-['Be_Vietnam_Pro'] text-sm leading-snug line-clamp-2">
                      {summary.recentAnnouncements.filter(a => a.priority !== 'high')[0].title}
                    </p>
                  ) : (
                    <p className="text-slate-400 text-sm font-medium font-['Be_Vietnam_Pro']">No new announcements.</p>
                  )}
                  <Link to="/announcements" className="inline-flex mt-4 items-center gap-1 text-blue-600 font-black text-xs hover:underline">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Recent Announcements Feed */}
      {summary?.recentAnnouncements?.filter(a => a.priority !== 'high').length ? (
        <motion.div variants={itemVariants} className="bg-slate-50 rounded-[48px] p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-white rounded-2xl text-slate-400 shadow-sm">
                <Bell className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-black text-slate-900">Recent Announcements</h2>
            </div>
            <Link to="/announcements" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm hover:text-blue-600 transition-colors">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {summary.recentAnnouncements.filter(a => a.priority !== 'high').slice(0, 3).map((ann) => (
              <div key={ann.id} className="bg-white rounded-[32px] p-6 flex gap-4 hover:shadow-md transition-all">
                <div className="p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900">{ann.title}</p>
                  <p className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro'] mt-1 line-clamp-2">{ann.content}</p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">
                    {format(new Date(ann.announcement_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
