import { useEffect, useState } from 'react';
import { announcementApi } from '@/db/api';
import type { Announcement } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, AlertCircle, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnnouncements(); }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementApi.getAllAnnouncements();
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const highPriority = announcements.filter(a => a.priority === 'high');
  const normalPriority = announcements.filter(a => a.priority === 'normal');
  const lowPriority = announcements.filter(a => a.priority === 'low');

  if (loading) {
    return (
      <div className="font-['Plus_Jakarta_Sans'] space-y-6 pb-12">
        <Skeleton className="h-14 w-72 rounded-2xl" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-[40px]" />)}
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="font-['Plus_Jakarta_Sans'] pb-12"
      >
        <motion.div variants={itemVariants} className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Announcements</h1>
          <p className="text-slate-500 text-lg font-medium mt-4 font-['Be_Vietnam_Pro']">
            Stay informed about school news and updates.
          </p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <div className="bg-slate-50 rounded-[48px] p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 shadow-sm">
              <Bell className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">All quiet here</h3>
            <p className="text-slate-400 text-sm font-medium font-['Be_Vietnam_Pro'] max-w-xs leading-relaxed">
              No announcements at this time. Check back soon for important school updates.
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-['Plus_Jakarta_Sans'] pb-12"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Announcements
        </h1>
        <p className="text-slate-500 text-lg font-medium mt-4 font-['Be_Vietnam_Pro']">
          Stay informed about school news and updates.
        </p>
      </motion.div>

      <div className="space-y-10">

        {/* High Priority Section */}
        {highPriority.length > 0 && (
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-5">
              <span className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900">Important — Requires Attention</h2>
              <span className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 bg-rose-50 px-4 py-2 rounded-full">
                {highPriority.length} Alert{highPriority.length > 1 ? 's' : ''}
              </span>
            </div>
            <AnimatePresence>
              <div className="space-y-4">
                {highPriority.map((ann, i) => (
                  <motion.div
                    key={ann.id}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    className="bg-gradient-to-br from-white to-rose-50 rounded-[40px] p-8 shadow-[0_8px_32px_rgba(185,28,28,0.06)] relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-80 group-hover:scale-150 transition-all duration-700" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h3 className="text-xl font-black text-rose-900">{ann.title}</h3>
                        <span className="px-4 py-2 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full flex-shrink-0">
                          High Priority
                        </span>
                      </div>
                      <p className="text-rose-800 font-medium text-base font-['Be_Vietnam_Pro'] leading-relaxed mb-4">
                        {ann.content}
                      </p>
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                        {format(new Date(ann.announcement_date), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </motion.section>
        )}

        {/* Normal Priority Section */}
        {normalPriority.length > 0 && (
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-5">
              <span className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                <Bell className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900">General Announcements</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {normalPriority.map((ann, i) => (
                <motion.div
                  key={ann.id}
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className="bg-white rounded-[40px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] transition-all duration-500 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{ann.title}</h3>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-full flex-shrink-0">
                      Info
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-relaxed bg-slate-50 rounded-[20px] p-5 flex-1 line-clamp-3">
                    {ann.content}
                  </p>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-5">
                    {format(new Date(ann.announcement_date), 'MMM d, yyyy')}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Low Priority Section */}
        {lowPriority.length > 0 && (
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-5">
              <span className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
                <Megaphone className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900">Other Updates</h2>
            </div>
            <div className="bg-slate-50 rounded-[48px] p-8 space-y-4">
              {lowPriority.map((ann) => (
                <motion.div
                  key={ann.id}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  className="bg-white rounded-[32px] p-6 flex gap-4 hover:shadow-sm transition-all"
                >
                  <div className="p-2.5 bg-slate-100 rounded-xl flex-shrink-0 self-start">
                    <Bell className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900">{ann.title}</h4>
                    <p className="text-slate-400 text-sm font-medium font-['Be_Vietnam_Pro'] mt-1 line-clamp-2">{ann.content}</p>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">
                      {format(new Date(ann.announcement_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

      </div>
    </motion.div>
  );
}
