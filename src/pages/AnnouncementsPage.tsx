import { useEffect, useState } from 'react';
import { announcementApi } from '@/db/api';
import type { Announcement } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100
    }
  }
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

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

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto p-8 space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 rounded-full mb-12" />
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 h-[400px] bg-slate-100 rounded-[32px]" />
          <div className="col-span-12 lg:col-span-4 h-[400px] bg-slate-50 rounded-[32px]" />
        </div>
      </div>
    );
  }

  // Grouping for Bento Layout
  const highPriority = announcements.filter(a => a.priority === 'high');
  const others = announcements.filter(a => a.priority !== 'high');

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full font-['Plus_Jakarta_Sans'] pb-12"
    >
      {/* Editorial Header */}
      <motion.div variants={itemVariants} className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          School <span className="text-blue-600">Announcements</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium mt-4 max-w-2xl font-['Be_Vietnam_Pro']">
          Stay connected with the latest updates, essential alerts, and community news from AwesomeKids.
        </p>
      </motion.div>

      {announcements.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white rounded-[48px] p-24 text-center border-2 border-dashed border-slate-100">
           <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
             <Bell className="h-10 w-10 text-slate-300" />
           </div>
           <h3 className="text-2xl font-bold text-slate-900 mb-2">The desk is clear!</h3>
           <p className="text-slate-500 font-['Be_Vietnam_Pro']">No new announcements at this time. Check back later for updates.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* Bento Column 1: High Priority (The "Featured" Zone) */}
          <div className="col-span-12 lg:col-span-12 space-y-8 mb-8">
            <AnimatePresence>
               {highPriority.length > 0 && (
                 <motion.div 
                   variants={itemVariants}
                   className="bg-[#fff1f4] rounded-[48px] p-8 md:p-12 relative overflow-hidden group shadow-[0_32px_64px_-16px_rgba(184,0,73,0.1)]"
                 >
                    {/* Decorative Blob */}
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#ffd9de] rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-700" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-8">
                        <span className="p-3 bg-white rounded-2xl shadow-sm text-[#b80049]">
                          <AlertCircle className="w-6 h-6" />
                        </span>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-[#b80049]">Important Updates</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {highPriority.map((item) => (
                          <div key={item.id} className="space-y-6">
                            <h2 className="text-3xl font-black text-slate-900 leading-[1.15]">
                              {item.title}
                            </h2>
                            <p className="text-lg text-slate-700 leading-relaxed font-['Be_Vietnam_Pro'] whitespace-pre-wrap">
                              {item.content}
                            </p>
                            <div className="flex items-center gap-4 pt-4">
                               <div className="h-px flex-1 bg-[#fdb7c8]" />
                               <span className="text-sm font-bold text-[#b80049]/70 italic">
                                 Posted on {format(new Date(item.announcement_date), 'MMMM d, yyyy')}
                               </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
          </div>

          {/* Bento Column 2: Secondary Hub */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
             {others.length > 0 ? others.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className={cn(
                    "rounded-[40px] p-8 flex flex-col justify-between transition-all duration-300",
                    idx % 3 === 0 ? "bg-white shadow-[0_20px_40px_rgba(0,0,0,0.04)]" : 
                    idx % 3 === 1 ? "bg-blue-50/50" : "bg-orange-50/50"
                  )}
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={cn(
                        "p-3 rounded-2xl",
                        idx % 3 === 0 ? "bg-slate-100 text-slate-600" : 
                        idx % 3 === 1 ? "bg-white text-blue-600 shadow-sm" : "bg-white text-orange-600 shadow-sm"
                      )}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {format(new Date(item.announcement_date), 'MMM d')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 leading-tight">{item.title}</h3>
                    <p className="text-slate-600 font-['Be_Vietnam_Pro'] text-sm leading-relaxed line-clamp-4">
                      {item.content}
                    </p>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100/50 flex justify-between items-center">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      item.priority === 'low' ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-700"
                    )}>
                      {item.priority} priority
                    </span>
                    <button className="text-slate-400 hover:text-slate-900 transition-colors">
                       <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
             )) : (
                <div className="col-span-2 py-12 text-center text-slate-400 font-medium">No other updates currently cached.</div>
             )}
          </div>

          {/* Bento Column 3: Utility / Community Card */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
             <motion.div variants={itemVariants} className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Bell className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <h4 className="text-2xl font-black mb-4">Notification Settings</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8 font-['Be_Vietnam_Pro']">
                    Manage how you receive alerts for your child's activities and school updates.
                  </p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-full py-6 font-bold">
                    Configure Alerts
                  </Button>
                </div>
             </motion.div>

             <motion.div variants={itemVariants} className="bg-white rounded-[40px] p-10 shadow-[0_20px_40px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-orange-100 rounded-full blur-xl opacity-30 group-hover:scale-150 transition-transform duration-500" />
                <h4 className="text-xl font-bold text-slate-900 mb-4">Newsletter Archive</h4>
                <p className="text-slate-500 text-sm mb-6 font-['Be_Vietnam_Pro']">
                  Access previous weekly newsletters and school circulars.
                </p>
                <Link to="#" className="text-orange-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">
                   Browse Archive <ArrowRight className="w-4 h-4" />
                </Link>
             </motion.div>
          </div>

        </div>
      )}
    </motion.div>
  );
}

