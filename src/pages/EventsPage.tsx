import { useEffect, useState } from 'react';
import { eventApi } from '@/db/api';
import type { Event } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin } from 'lucide-react';
import { format, isPast } from 'date-fns';

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
      <Card className="hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
            </div>
            <Badge variant={isUpcoming ? 'default' : 'secondary'} className="flex-shrink-0">
              {isUpcoming ? 'Coming Up' : 'Past'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          {event.photos && event.photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {event.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`${event.title} photo ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-muted"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">School Events</h1>
        <p className="text-muted-foreground">Stay updated with school activities and celebrations</p>
      </div>

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
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">No upcoming events scheduled</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon for new events!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-8">
          {pastEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">No past events to display</p>
                <p className="text-sm text-muted-foreground mt-1">Memories from past events will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
