import { useEffect, useState } from 'react';
import { eventApi } from '@/db/api';
import type { Event } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '@/components/common/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter((e) => e.event_type === 'upcoming').sort((a, b) => 
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  const pastEvents = events.filter((e) => e.event_type === 'past').sort((a, b) => 
    new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  const EventCard = ({ event }: { event: Event }) => {
    const eventDate = new Date(event.event_date);
    const isUpcoming = event.event_type === 'upcoming';
    
    return (
      <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
        <Card className="hover:shadow-md transition-shadow overflow-hidden h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <CardTitle className="text-base md:text-xl">{event.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs md:text-sm">{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
              </div>
              <Badge variant={isUpcoming ? 'default' : 'secondary'} className="flex-shrink-0">
                {isUpcoming ? 'Coming Up' : 'Past'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">{event.description}</p>
            {event.photos && event.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                {event.photos.map((photo, idx) => (
                  <motion.img
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    src={photo}
                    alt={`${event.title} photo ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-muted"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-8">
        <Skeleton className="h-10 w-64 bg-muted" />
        <Skeleton className="h-12 w-96 bg-muted rounded-lg" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-4 md:space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">School Events</h1>
        <p className="text-sm md:text-base text-muted-foreground">Stay updated with school activities and celebrations</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-sm">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              Upcoming
              <Badge variant="outline" className="ml-1">{upcomingEvents.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              Past
              <Badge variant="outline" className="ml-1">{pastEvents.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-8">
            {upcomingEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming events"
                description="Check back soon for new events! We regularly update this section with school activities and celebrations."
              />
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6"
              >
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-8">
            {pastEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No past events"
                description="Memories from past events will appear here once they represent historical activities."
              />
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6"
              >
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
