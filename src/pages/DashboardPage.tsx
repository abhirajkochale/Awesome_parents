import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '@/db/api';
import type { ParentDashboardSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  DollarSign,
  Calendar,
  Bell,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [summary, setSummary] = useState<ParentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      submitted: { variant: 'secondary', label: 'Pending Review' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const paymentPercent = summary
    ? Math.round((summary.paidAmount / summary.totalFees) * 100) || 0
    : 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64 bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-32 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {summary?.students[0]?.full_name?.split(' ')[0] || 'Parent'}</p>
        </div>
        {summary?.remainingBalance !== 0 && (
          <Button size="lg" asChild className="shadow-lg shadow-primary/20">
            <Link to="/payments">
              Make Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Announcements - Only High Priority */}
      {summary?.recentAnnouncements && summary.recentAnnouncements.filter(a => a.priority === 'high').length > 0 && (
        <div className="space-y-3">
          {summary.recentAnnouncements.filter(a => a.priority === 'high').map((announcement) => (
            <Alert key={announcement.id} className="border-l-4 border-l-red-500 bg-red-50 border-t-0 border-r-0 border-b-0 rounded-none shadow-sm">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900 ml-2">
                <span className="font-semibold">{announcement.title}:</span> {announcement.content}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Payment Status Card - Main Focus */}
        <Card className="col-span-1 border-t-4 border-t-primary shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Fee Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span className="text-2xl font-bold text-orange-600">₹{summary?.remainingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{paymentPercent}% Paid</span>
                </div>
                <Progress value={paymentPercent} className="h-2" />
              </div>

              <p className="text-xs text-muted-foreground">
                Total Fees: ₹{summary?.totalFees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link to="/payments" className="text-sm font-medium text-primary hover:underline flex items-center">
                View Payment History <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Child status */}
        <Card className="col-span-1 border-t-4 border-t-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Your Child
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.students.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No admission submitted yet.</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admission">Apply Now</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {summary?.students.map((student) => (
                  <div key={student.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{student.full_name}</p>
                      <p className="text-sm text-muted-foreground">{student.class} • {student.academic_year}</p>
                    </div>
                    {student.admission && getStatusBadge(student.admission.status)}
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <Link to="/admission" className="text-sm font-medium text-primary hover:underline flex items-center">
                    View Admission Details <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="col-span-1 border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Next Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              <div className="space-y-4">
                {summary?.upcomingEvents.slice(0, 1).map((event) => (
                  <div key={event.id}>
                    <p className="font-medium text-base mb-1">{event.title}</p>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Clock className="h-3 w-3" />
                      {format(new Date(event.event_date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <Link to="/events" className="text-sm font-medium text-primary hover:underline flex items-center">
                    View All Events <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {summary?.recentAnnouncements && summary.recentAnnouncements.filter(a => a.priority !== 'high').length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.recentAnnouncements.filter(a => a.priority !== 'high').slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="flex gap-4 items-start pb-4 border-b last:border-0 last:pb-0">
                  <div className="bg-slate-100 p-2 rounded-full hidden md:block">
                    <Bell className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(announcement.announcement_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
              <Button variant="link" asChild className="px-0">
                <Link to="/announcements">Read All Announcements</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
