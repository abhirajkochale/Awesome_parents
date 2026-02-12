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
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string; icon: React.ReactNode }> = {
      high: { variant: 'destructive', label: 'High Priority', icon: <AlertCircle className="h-3 w-3" /> },
      normal: { variant: 'default', label: 'Normal', icon: <Bell className="h-3 w-3" /> },
      low: { variant: 'secondary', label: 'Low Priority', icon: <Bell className="h-3 w-3" /> },
    };
    const { variant, label, icon } = config[priority] || config.normal;
    return (
      <Badge variant={variant} className="gap-1 flex-shrink-0">
        {icon}
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64 bg-muted" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Group announcements by priority
  const highPriority = announcements.filter(a => a.priority === 'high');
  const normalPriority = announcements.filter(a => a.priority === 'normal');
  const lowPriority = announcements.filter(a => a.priority === 'low');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Stay informed about school news and updates</p>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">No announcements at this time</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon for important updates</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* High Priority Announcements */}
          {highPriority.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold">Important - Requires Action</h2>
              </div>
              <div className="space-y-3">
                {highPriority.map((announcement) => (
                  <Card key={announcement.id} className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(announcement.announcement_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                        {getPriorityBadge(announcement.priority)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Normal Priority Announcements */}
          {normalPriority.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">General Announcements</h2>
              </div>
              <div className="space-y-3">
                {normalPriority.map((announcement) => (
                  <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-base">{announcement.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(announcement.announcement_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                        {getPriorityBadge(announcement.priority)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed line-clamp-2">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Low Priority Announcements */}
          {lowPriority.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Other Updates</h2>
              </div>
              <div className="space-y-3">
                {lowPriority.map((announcement) => (
                  <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-base">{announcement.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(announcement.announcement_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                        {getPriorityBadge(announcement.priority)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed line-clamp-2">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
