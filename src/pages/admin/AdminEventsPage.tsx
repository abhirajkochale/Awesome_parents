import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { eventApi, storageApi } from '@/db/api';
import type { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Calendar, Image as ImageIcon, Sparkles, MapPin, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  event_date: z.string().min(1, 'Event date is required'),
  event_type: z.enum(['upcoming', 'past']),
  photo_files: z.any().optional(),
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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      event_date: '',
      event_type: 'upcoming',
    },
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getAllEvents();
      // Sort by date soonest first
      const sorted = [...data].sort((a, b) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );
      setEvents(sorted);
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load events.',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      let photoUrls: string[] = [];
      if (data.photo_files && data.photo_files.length > 0) {
        const files = Array.from(data.photo_files) as File[];
        photoUrls = await storageApi.uploadEventPhotos(files);
      }

      await eventApi.createEvent(
        {
          title: data.title,
          description: data.description,
          event_date: data.event_date,
          event_type: data.event_type,
        },
        photoUrls
      );

      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      setDialogOpen(false);
      form.reset();
      loadEvents();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      setDeletingId(id);
      await eventApi.deleteEvent(id);
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-['Plus_Jakarta_Sans']">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-12 w-64 rounded-2xl mb-2" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <Skeleton className="h-14 w-48 rounded-2xl" />
        </div>
        <Skeleton className="h-16 w-full max-w-md rounded-2xl mb-6" />
        <div className="grid lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-[300px] w-full rounded-[40px]" />)}
        </div>
      </div>
    );
  }

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    return e.event_type === filter;
  });

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
            Event <span className="text-blue-600">Calendar</span> 🗓️
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg font-['Be_Vietnam_Pro']">
            Manage upcoming activities and recap past events
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="group relative bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-4 rounded-2xl shadow-xl hover:shadow-2xl shadow-blue-500/30 transition-all duration-300 active:scale-95 flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm -ml-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span>Create Event</span>
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white/90 backdrop-blur-xl border-slate-200/50 shadow-2xl rounded-[40px] p-0 overflow-hidden font-['Plus_Jakarta_Sans']">
            <div className="p-8 md:p-10">
              <DialogHeader className="mb-6 space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <DialogTitle className="text-2xl font-black text-slate-900">Add New Event</DialogTitle>
                </div>
                <DialogDescription className="text-slate-500 font-['Be_Vietnam_Pro'] text-base">
                  Plan a new activity for the students and parents.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-slate-700">Event Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Annual Science Fair" 
                            className="h-14 bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-2xl text-base px-4"
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
                      name="event_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-slate-700">Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              className="h-14 bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-2xl text-base px-4 font-medium"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-rose-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="event_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-slate-700">Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-14 bg-slate-50/50 border-slate-200 focus:ring-blue-500 rounded-2xl text-base px-4">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl font-['Plus_Jakarta_Sans']">
                              <SelectItem value="upcoming" className="rounded-xl focus:bg-blue-50 focus:text-blue-700 font-medium py-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-500" /> Upcoming
                                </div>
                              </SelectItem>
                              <SelectItem value="past" className="rounded-xl focus:bg-slate-100 focus:text-slate-700 font-medium py-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-slate-500" /> Past
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-rose-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-slate-700">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide details about the event..." 
                            className="min-h-[120px] resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-[24px] text-base p-5 font-['Be_Vietnam_Pro']"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="photo_files"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-slate-400" /> Cover Photos (Optional)
                        </FormLabel>
                        <div className="relative group">
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              className="h-14 bg-slate-50/50 border-slate-200 border-dashed focus-visible:ring-blue-500 rounded-2xl text-base px-4 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 pt-3 opacity-0 absolute inset-0 w-full cursor-pointer z-10"
                              onChange={(e) => onChange(e.target.files)}
                              {...field}
                            />
                          </FormControl>
                          <div className="h-14 bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex items-center px-4 text-sm font-medium text-slate-500 group-hover:bg-slate-100 transition-colors pointer-events-none">
                            <ImageIcon className="h-5 w-5 mr-3 text-slate-400" />
                            {value?.length ? `${value.length} file(s) selected` : 'Click or drag files here to upload'}
                          </div>
                        </div>
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center min-w-[160px]"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
                      ) : (
                        <><Sparkles className="mr-2 h-5 w-5" /> Publish Event</>
                      )}
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 inline-flex overflow-x-auto hide-scrollbar">
        {[
          { id: 'all', label: 'All Events', icon: Calendar },
          { id: 'upcoming', label: 'Upcoming', icon: Clock },
          { id: 'past', label: 'Past Events', icon: ImageIcon },
        ].map((f) => {
          const isActive = filter === f.id;
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                "flex items-center justify-center min-w-[140px] px-6 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap gap-2",
                isActive 
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-blue-100" : "text-slate-400")} />
              {f.label}
            </button>
          );
        })}
      </motion.div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white rounded-[48px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Calendar className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No Events Found</h3>
          <p className="text-slate-500 font-medium font-['Be_Vietnam_Pro'] text-lg max-w-sm">
            There are currently no {filter !== 'all' ? filter : ''} events to display.
          </p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event) => {
              const isDeleting = deletingId === event.id;
              const date = new Date(event.event_date);
              const past = isPast(date) || event.event_type === 'past';
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3 }}
                  key={event.id} 
                  className={cn(
                    "group relative bg-white rounded-[40px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] border hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-400 overflow-hidden flex flex-col",
                    past ? "border-slate-100/60" : "border-blue-100/60"
                  )}
                >
                  {/* Decorative Background Blob */}
                  <div className={cn(
                    "absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none", 
                    past ? "bg-slate-400" : "bg-blue-500"
                  )} />
                  
                  <div className="relative z-10 flex-1">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="max-w-[75%]">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border mb-4 shadow-sm",
                          past ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-blue-100 text-blue-700 border-blue-200"
                        )}>
                          {past ? <Calendar className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          {format(date, 'MMMM d, yyyy')}
                        </span>
                        
                        <h3 className="text-2xl font-black text-slate-900 leading-snug group-hover:text-slate-800 transition-colors">
                          {event.title}
                        </h3>
                      </div>
                      
                      <button
                        onClick={(e) => handleDelete(event.id, e)}
                        disabled={isDeleting}
                        className="p-3 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-2xl transition-colors flex-shrink-0 disabled:opacity-50 shadow-sm"
                        title="Delete Event"
                      >
                        {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                      </button>
                    </div>

                    <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-100/80 hide-scrollbar overflow-y-auto mb-6">
                      <p className="text-slate-600 font-medium font-['Be_Vietnam_Pro'] leading-relaxed whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 relative z-10 mt-auto">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold",
                      past ? "bg-slate-50 text-slate-500" : "bg-blue-50 text-blue-600"
                    )}>
                       <span className={cn("w-2 h-2 rounded-full", past ? "bg-slate-400" : "bg-blue-500 animate-pulse")} />
                       {past ? "Completed" : "Upcoming"}
                    </div>

                    {event.photos && event.photos.length > 0 ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl font-['Be_Vietnam_Pro']">
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                        {event.photos.length} Photo{event.photos.length !== 1 ? 's' : ''}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-400 font-['Be_Vietnam_Pro']">
                        <ImageIcon className="h-4 w-4 opacity-50" />
                        No gallery
                      </div>
                    )}
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
