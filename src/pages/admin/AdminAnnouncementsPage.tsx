import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { announcementApi } from '@/db/api';
import type { Announcement } from '@/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Megaphone, Bell, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  priority: z.enum(['high', 'normal', 'low']),
  announcement_date: z.string().min(1, 'Date is required'),
});

type FormData = z.infer<typeof formSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

const priorityStyles = {
  high: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    icon: 'text-rose-500',
    gradient: 'from-rose-500 to-red-600',
    label: 'High Priority'
  },
  normal: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: 'text-blue-500',
    gradient: 'from-blue-500 to-indigo-600',
    label: 'Normal'
  },
  low: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: 'text-slate-500',
    gradient: 'from-slate-400 to-slate-500',
    label: 'Low Priority'
  }
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      priority: 'normal',
      announcement_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementApi.getAllAnnouncements();
      // Sort to show newest first
      const sorted = [...data].sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      setAnnouncements(sorted);
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load announcements.',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await announcementApi.createAnnouncement(data);

      toast({
        title: 'Success',
        description: 'Announcement created successfully',
      });

      setDialogOpen(false);
      form.reset();
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to create announcement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      setDeletingId(id);
      await announcementApi.deleteAnnouncement(id);
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully',
      });
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-['Plus_Jakarta_Sans']">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-12 w-64 rounded-2xl mb-2" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <Skeleton className="h-14 w-48 rounded-2xl" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-[280px] w-full rounded-[40px]" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-['Plus_Jakarta_Sans'] pb-12 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Broadcast <span className="text-orange-500">Center</span> 📢
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg font-['Be_Vietnam_Pro']">
            Create and manage school-wide announcements
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="group relative bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm -ml-2">
                <Megaphone className="h-5 w-5 text-orange-200" />
              </div>
              <span>New Broadcast</span>
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white/90 backdrop-blur-xl border-slate-200/50 shadow-2xl rounded-[40px] p-0 overflow-hidden font-['Plus_Jakarta_Sans']">
            <div className="p-8 md:p-10">
              <DialogHeader className="mb-6 space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <DialogTitle className="text-2xl font-black text-slate-900">Create Broadcast</DialogTitle>
                </div>
                <DialogDescription className="text-slate-500 font-['Be_Vietnam_Pro'] text-base">
                  Compose a new announcement to notify parents and staff.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-slate-700">Headline</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Annual Sports Day 2024" 
                            className="h-14 bg-slate-50/50 border-slate-200 focus-visible:ring-orange-500 rounded-2xl text-base px-4"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500" />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-slate-700">Importance Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-14 bg-slate-50/50 border-slate-200 focus:ring-orange-500 rounded-2xl text-base px-4">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl font-['Plus_Jakarta_Sans']">
                              <SelectItem value="high" className="rounded-xl focus:bg-rose-50 focus:text-rose-700 font-medium py-3">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-rose-500" /> High Priority
                                </div>
                              </SelectItem>
                              <SelectItem value="normal" className="rounded-xl focus:bg-blue-50 focus:text-blue-700 font-medium py-3">
                                <div className="flex items-center gap-2">
                                  <Bell className="h-4 w-4 text-blue-500" /> Normal
                                </div>
                              </SelectItem>
                              <SelectItem value="low" className="rounded-xl focus:bg-slate-100 focus:text-slate-700 font-medium py-3">
                                <div className="flex items-center gap-2">
                                  <Bell className="h-4 w-4 text-slate-400" /> Low Priority
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-rose-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="announcement_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-slate-700">Target Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              className="h-14 bg-slate-50/50 border-slate-200 focus-visible:ring-orange-500 rounded-2xl text-base px-4 font-medium"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-rose-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-slate-700">Message Body</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write the full details here..." 
                            className="min-h-[160px] resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-orange-500 rounded-[24px] text-base p-5 font-['Be_Vietnam_Pro']"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-3 pt-6 mt-8 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDialogOpen(false)}
                      className="px-6 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center min-w-[160px]"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing...</>
                      ) : (
                        <><Megaphone className="mr-2 h-5 w-5" /> Publish Broadcast</>
                      )}
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Announcements Grid */}
      {announcements.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white rounded-[48px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Megaphone className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No Active Broadcasts</h3>
          <p className="text-slate-500 font-medium font-['Be_Vietnam_Pro'] text-lg max-w-sm">
            Keep your school community informed by creating your first announcement.
          </p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {announcements.map((announcement) => {
              const priorityStr = (announcement.priority?.toLowerCase() || 'normal') as keyof typeof priorityStyles;
              const pStyle = priorityStyles[priorityStr] || priorityStyles.normal;
              const isDeleting = deletingId === announcement.id;
              
              const createdDateStr = format(new Date(announcement.created_at || new Date()), 'MMM d, yyyy');
              const targetDateStr = format(new Date(announcement.announcement_date), 'MMM d, yyyy');

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3 }}
                  key={announcement.id} 
                  className="group relative bg-white rounded-[40px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] border border-slate-100/60 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-400 overflow-hidden flex flex-col"
                >
                  {/* Decorative Background Blob */}
                  <div className={cn("absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none", pStyle.gradient)} />
                  
                  <div className="relative z-10 flex-1">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex flex-wrap gap-2">
                        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border", pStyle.badge)}>
                          <AlertCircle className="h-3.5 w-3.5" />
                          {pStyle.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100">
                          <Calendar className="h-3.5 w-3.5" />
                          For: {targetDateStr}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => handleDelete(announcement.id, e)}
                        disabled={isDeleting}
                        className="p-3 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-2xl transition-colors flex-shrink-0 disabled:opacity-50"
                        title="Delete Broadcast"
                      >
                        {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                      </button>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-4 leading-snug group-hover:text-slate-800 transition-colors">
                      {announcement.title}
                    </h3>

                    <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100/50 hide-scrollbar max-h-[160px] overflow-y-auto mb-6">
                      <p className="text-slate-600 font-medium font-['Be_Vietnam_Pro'] leading-relaxed whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 relative z-10 mt-auto">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-400 font-['Be_Vietnam_Pro']">
                      <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 pb-0.5 border border-slate-200 shadow-sm">
                        a
                      </div>
                      Posted on {createdDateStr}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
