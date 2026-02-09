import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, admissionApi, paymentApi, studentApi } from '@/db/api';
import type { AdminDashboardSummary, AdmissionWithStudent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [admissions, setAdmissions] = useState<AdmissionWithStudent[]>([]);
  const [payments, setPayments] = useState<any[]>([]); // Using any for joined payment data simplification
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Auto-cleanup orphaned students to ensure correct counts
      try {
        await studentApi.cleanupOrphanedStudents();
      } catch (err) {
        console.error("Failed to cleanup orphans:", err);
        // Continue loading dashboard even if cleanup fails
      }

      const [dashboardData, admissionsData, paymentsData] = await Promise.all([
        dashboardApi.getAdminDashboard(),
        admissionApi.getAllAdmissions(),
        paymentApi.getAllPayments(),
      ]);

      setSummary(dashboardData);
      setAdmissions(admissionsData);
      setPayments(paymentsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate fees for a specific admission
  const getFeeDetails = (admissionId: string, totalFee: number) => {
    const admissionPayments = payments.filter(p => p.admission_id === admissionId && p.status === 'approved');
    const paidAmount = admissionPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = totalFee - paidAmount;
    const status = remaining <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';
    return { paidAmount, remaining, status };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground">Detailed view of all student admissions and fees</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/events">
              <Calendar className="mr-2 h-4 w-4" />
              Manage Events
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/admissions">
              <CheckCircle className="mr-2 h-4 w-4" />
              Review Admissions
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <div className="text-2xl font-bold">{summary?.totalStudents || 0}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Admissions</CardTitle>
            <div className="text-2xl font-bold text-amber-600">{summary?.pendingAdmissions || 0}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
            <div className="text-2xl font-bold text-amber-600">{summary?.pendingPayments || 0}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="text-2xl font-bold text-green-600">₹{summary?.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Student List Table */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Student Admissions & Fee Details</CardTitle>
          <CardDescription>Comprehensive list of students who have filled the admission form</CardDescription>
        </CardHeader>
        <CardContent>
          {admissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No student admissions found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
                  <tr>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Admission Status</th>
                    <th className="p-4">Fees Paid</th>
                    <th className="p-4">Fee Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {admissions.map((admission) => {
                    const { paidAmount, status: feeStatus } = getFeeDetails(admission.id, admission.total_fee);
                    const feeProgress = Math.min(100, Math.round((paidAmount / admission.total_fee) * 100));

                    return (
                      <tr key={admission.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {admission.student?.full_name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{admission.student?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(admission.created_at), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{admission.student?.class}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              admission.status === 'approved' ? 'default' :
                                admission.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                            className="capitalize"
                          >
                            {admission.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span>₹{paidAmount.toLocaleString()}</span>
                              <span className="text-muted-foreground">/ ₹{admission.total_fee.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full ${feeStatus === 'Paid' ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${feeProgress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                            ${feeStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                              feeStatus === 'Partial' ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'}`}>
                            {feeStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/admin/admissions">View</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
