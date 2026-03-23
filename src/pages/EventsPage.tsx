import { useEffect, useState } from 'react';
import { eventApi } from '@/db/api';
import type { Event } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getAllEvents();
      setEvents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter(e => e.event_type === 'upcoming').sort((a, b) =>
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  const pastEvents = events.filter(e => e.event_type === 'past').sort((a, b) =>
    new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  const EventCard = ({ event }: { event: Event }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="bg-white rounded-[40px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.08)] transition-all duration-500 group"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
            {event.title}
          </h3>
          <div className="flex items-center gap-2 mt-3 text-slate-400">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-bold font-['Be_Vietnam_Pro']">
              {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${
          event.event_type === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
        }`}>
          {event.event_type === 'upcoming' ? 'Coming Up' : 'Past'}
        </span>
      </div>

      <p className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-relaxed line-clamp-3 mb-5 bg-slate-50 rounded-[20px] p-5">
        {event.description}
      </p>

      {event.photos && event.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {event.photos.slice(0, 3).map((photo, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx }}
              className="relative overflow-hidden rounded-[20px] aspect-square"
            >
              <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const EmptyEventsState = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-[24px] flex items-center justify-center mb-6">
        <Calendar className="w-10 h-10 text-slate-200" />
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">No {label} events</h3>
      <p className="text-slate-400 text-sm font-medium font-['Be_Vietnam_Pro'] max-w-[280px] leading-relaxed">
        {label === 'upcoming'
          ? 'Check back soon for new events and school activities.'
          : 'Memories from past events will appear here.'}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="font-['Plus_Jakarta_Sans'] space-y-8 pb-12">
        <Skeleton className="h-14 w-72 rounded-2xl" />
        <Skeleton className="h-14 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[40px]" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-['Plus_Jakarta_Sans'] pb-12"
    >
      <Tabs defaultValue="upcoming" className="w-full">
        {/* Tab Navigation */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">School Events</h1>
            <p className="text-slate-500 text-lg font-medium mt-2 font-['Be_Vietnam_Pro']">
              Stay updated with school activities and celebrations.
            </p>
          </div>
          <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto gap-1">
            <TabsTrigger
              value="upcoming"
              className="rounded-xl font-black px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
            >
              Upcoming
              <span className="ml-2 bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">{upcomingEvents.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-xl font-black px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-700"
            >
              Past
              <span className="ml-2 bg-slate-200 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">{pastEvents.length}</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="upcoming" className="mt-0">
          {upcomingEvents.length === 0 ? (
            <div className="bg-slate-50 rounded-[48px] p-8">
              <EmptyEventsState label="upcoming" />
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-0">
          {pastEvents.length === 0 ? (
            <div className="bg-slate-50 rounded-[48px] p-8">
              <EmptyEventsState label="past" />
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {pastEvents.map(event => <EventCard key={event.id} event={event} />)}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
