import { useEffect, useState } from 'react';
import { announcementApi } from '@/db/api';
import type { Announcement } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

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
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      high: { variant: 'destructive', label: 'High Priority' },
      normal: { variant: 'default', label: 'Normal' },
      low: { variant: 'secondary', label: 'Low Priority' },
    };
    const { variant, label } = config[priority] || config.normal;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground">Important notices and updates from the school</p>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No announcements at this time
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {announcement.priority === 'high' ? (
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    ) : (
                      <Bell className="h-5 w-5 text-primary mt-0.5" />
                    )}
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(announcement.announcement_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {getPriorityBadge(announcement.priority)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
