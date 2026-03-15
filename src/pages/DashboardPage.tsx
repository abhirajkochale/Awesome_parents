import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
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
import { motion } from 'framer-motion';

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

export default function DashboardPage() {
  const { profile } = useAuth();
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
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24 bg-muted mb-4" />
                <Skeleton className="h-4 w-full bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="shadow-sm">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Dashboard</h1>
          <p className="text-base text-muted-foreground">Welcome back, {profile?.full_name?.split(' ')[0] || 'Parent'}</p>
        </div>
        {summary?.remainingBalance !== 0 && (
          <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-all duration-200">
            <Link to="/payments">
              Make Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </motion.div>

      {/* High Priority Announcements */}
      {summary?.recentAnnouncements && summary.recentAnnouncements.filter(a => a.priority === 'high').length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {summary.recentAnnouncements.filter(a => a.priority === 'high').map((announcement) => (
            <motion.div
              key={announcement.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileHover={{ x: 5 }}
            >
              <Alert className="border-l-4 border-l-red-500 bg-red-50 border-t-0 border-r-0 border-b-0 rounded-none shadow-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 ml-2">
                  <span className="font-semibold">{announcement.title}:</span> {announcement.content}
                </AlertDescription>
              </Alert>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Main Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* Payment Status Card */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
          <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-all duration-200 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                Fee Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-muted-foreground">Balance Due</span>
                <span className="text-3xl font-bold text-orange-600">₹{summary?.remainingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Payment Progress</span>
                  <span className="text-primary">{paymentPercent}% Paid</span>
                </div>
                <Progress value={paymentPercent} className="h-2.5" />
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">Total Fees</p>
                <p className="text-lg font-semibold text-gray-900">₹{summary?.totalFees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>

              <Link to="/payments" className="inline-flex items-center text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
                View Payment History <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Child Status Card */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
          <Card className="border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-all duration-200 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                Your Child
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.students.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">No admission submitted yet.</p>
                  <Button asChild variant="outline" size="sm" className="shadow-sm">
                    <Link to="/admission">Apply Now</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {summary?.students.map((student) => (
                    <div key={student.id} className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-lg text-gray-900 mb-1">{student.full_name}</p>
                        <p className="text-sm text-muted-foreground">{student.class} • {student.academic_year}</p>
                      </div>
                      {student.admission && getStatusBadge(student.admission.status)}
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <Link to="/admission" className="inline-flex items-center text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
                      View Admission Details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Events Card */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
          <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-all duration-200 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                Next Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.upcomingEvents.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No upcoming events.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {summary?.upcomingEvents.slice(0, 1).map((event) => (
                    <div key={event.id}>
                      <p className="font-semibold text-base text-gray-900 mb-2">{event.title}</p>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(event.event_date), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <Link to="/events" className="inline-flex items-center text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
                      View All Events <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Announcements Section */}
      {summary?.recentAnnouncements && summary.recentAnnouncements.filter(a => a.priority !== 'high').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Recent Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.recentAnnouncements.filter(a => a.priority !== 'high').slice(0, 3).map((announcement, idx) => (
                  <motion.div 
                    key={announcement.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="flex gap-4 items-start pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="bg-slate-100 p-2.5 rounded-full shrink-0 hidden sm:block">
                      <Bell className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{announcement.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{announcement.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{format(new Date(announcement.announcement_date), 'MMM d, yyyy')}</p>
                    </div>
                  </motion.div>
                ))}
                <div className="pt-2">
                  <Button variant="link" asChild className="px-0 h-auto font-medium">
                    <Link to="/announcements">Read All Announcements</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
