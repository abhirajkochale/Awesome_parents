import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, admissionApi, paymentApi, studentApi } from '@/db/api';
import type { AdminDashboardSummary, AdmissionWithStudent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, FileText, Users, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [admissions, setAdmissions] = useState<AdmissionWithStudent[]>([]);
  const [payments, setPayments] = useState<{ [key: string]: { paid: number; total: number } }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Fetch dashboard summary
      const dashboardData = await dashboardApi.getAdminDashboard();
      setSummary(dashboardData);

      // Fetch all admissions
      const allAdmissions = await admissionApi.getAllAdmissions();
      setAdmissions(allAdmissions);

      // Fetch payment details for each admission
      const paymentDetails: { [key: string]: { paid: number; total: number } } = {};

      for (const adm of allAdmissions) {
        const p = await paymentApi.getPaymentsByAdmission(adm.id);
        const approvedPayments = p.filter(payment => payment.status === 'approved');
        const totalPaid = approvedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        paymentDetails[adm.id] = { paid: totalPaid, total: Number(adm.total_fee) };
      }

      setPayments(paymentDetails);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate fees for a specific admission
  const getFeeDetails = (admissionId: string, totalFee: number) => {
    const payment = payments[admissionId] || { paid: 0, total: totalFee };
    const remaining = payment.total - payment.paid;
    const status = remaining === 0 ? 'Paid' : payment.paid > 0 ? 'Partial' : 'Pending';
    return { paidAmount: payment.paid, remainingAmount: remaining, status };
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-muted shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Student Dashboard</h1>
          <p className="text-base text-muted-foreground">Detailed view of all student admissions and fees</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="shadow-sm">
            <Link to="/admin/events">
              <Calendar className="mr-2 h-4 w-4" />
              Manage Events
            </Link>
          </Button>
          <Button asChild className="shadow-sm">
            <Link to="/admin/admissions">
              <CheckCircle className="mr-2 h-4 w-4" />
              Review Admissions
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{summary?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active enrollments</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Admissions</CardTitle>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{summary?.pendingAdmissions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{summary?.pendingPayments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs verification</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{summary?.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Student List Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Student Admissions & Fee Details</CardTitle>
          <CardDescription className="text-sm">Comprehensive list of students who have filled the admission form</CardDescription>
        </CardHeader>
        <CardContent>
          {admissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No student admissions found</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">Student Name</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">Class</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">Admission Status</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">Fees Paid</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-muted-foreground">Fee Status</th>
                    <th className="px-4 py-3.5 text-right font-semibold text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {admissions.map((admission) => {
                    const { paidAmount, status: feeStatus } = getFeeDetails(admission.id, admission.total_fee);
                    const feeProgress = Math.min(100, Math.round((paidAmount / admission.total_fee) * 100));

                    return (
                      <tr key={admission.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-primary font-semibold text-sm">
                                {admission.student?.full_name?.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{admission.student?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(admission.created_at), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="font-medium">{admission.student?.class}</Badge>
                        </td>
                        <td className="px-4 py-4">
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
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs gap-2">
                              <span className="font-medium">₹{paidAmount.toLocaleString()}</span>
                              <span className="text-muted-foreground">/ ₹{admission.total_fee.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 w-28 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${feeStatus === 'Paid' ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${feeProgress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                            ${feeStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                              feeStatus === 'Partial' ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'}`}>
                            {feeStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" asChild className="hover:bg-muted">
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
