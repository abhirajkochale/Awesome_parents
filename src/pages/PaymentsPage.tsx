import { useEffect, useState } from 'react';
import { paymentApi, admissionApi, storageApi } from '@/db/api';
import type { Payment, AdmissionWithStudent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { DollarSign, Upload, CheckCircle, Clock, AlertCircle, Calendar, Loader2 } from 'lucide-react';

const paymentFormSchema = z.object({
  admission_id: z.string().min(1, 'Please select an admission'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_type: z.enum(['initial', 'installment']),
  receipt_file: z.any().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      admission_id: '',
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_type: 'installment',
    },
  });

  // Watch for admission change in form to update summary in dialog
  const watchedAdmissionId = form.watch('admission_id');

  // Sync default admission_id when admissions load
  useEffect(() => {
    if (admissions.length > 0 && !form.getValues('admission_id')) {
      form.setValue('admission_id', admissions[0].id);
    }
  }, [admissions, form]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, admissionsData] = await Promise.all([
        paymentApi.getMyPayments(),
        admissionApi.getMyAdmissions(),
      ]);
      setPayments(paymentsData);
      setAdmissions(admissionsData.filter((a) => a.status === 'approved'));
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);

      let receiptUrl: string | undefined;

      if (data.receipt_file && data.receipt_file[0]) {
        const file = data.receipt_file[0];
        const tempPaymentId = `temp_${Date.now()}`;
        receiptUrl = await storageApi.uploadReceipt(file, tempPaymentId);
      }

      await paymentApi.createPayment(
        {
          admission_id: data.admission_id,
          amount: data.amount,
          payment_date: data.payment_date,
          payment_type: data.payment_type,
        },
        receiptUrl
      );

      toast({
        title: 'Payment Submitted',
        description: receiptUrl
          ? 'Your payment has been submitted for verification'
          : 'Payment record created. Please upload receipt.',
      });

      setDialogOpen(false);
      form.reset();
      loadData();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to submit payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadReceipt = async (paymentId: string, file: File) => {
    try {
      const receiptUrl = await storageApi.uploadReceipt(file, paymentId);
      await paymentApi.updatePaymentReceipt(paymentId, receiptUrl);

      toast({
        title: 'Receipt Uploaded',
        description: 'Your receipt has been submitted for verification',
      });

      loadData();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to upload receipt',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; color: string }> = {
      pending_upload: {
        icon: <Upload className="h-3 w-3" />,
        variant: 'outline',
        label: 'Pending Upload',
        color: 'text-gray-600',
      },
      under_verification: {
        icon: <Clock className="h-3 w-3" />,
        variant: 'secondary',
        label: 'Under Review',
        color: 'text-blue-600',
      },
      approved: {
        icon: <CheckCircle className="h-3 w-3" />,
        variant: 'default',
        label: 'Approved',
        color: 'text-green-600',
      },
      rejected: {
        icon: <AlertCircle className="h-3 w-3" />,
        variant: 'destructive',
        label: 'Rejected',
        color: 'text-red-600',
      },
    };

    const { icon, variant, label } = config[status] || config.pending_upload;

    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48 bg-muted" />
        <Skeleton className="h-48 w-full bg-muted rounded-lg" />
        <Skeleton className="h-96 w-full bg-muted rounded-lg" />
      </div>
    );
  }

  // Calculate payment summary
  const currentAdmission = admissions.find(a => a.id === watchedAdmissionId) || admissions[0];
  const paymentSummary = currentAdmission
    ? (() => {
      const admission = currentAdmission;
      const admissionPayments = payments.filter(p => p.admission_id === admission.id);
      const paidAmount = admissionPayments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0);
      const totalFee = admission.total_fee || 0;
      return {
        totalFee,
        paidAmount,
        remainingBalance: totalFee - paidAmount,
        paymentPercent: Math.round((paidAmount / totalFee) * 100) || 0,
      };
    })()
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Fees & Payments</h1>
        <p className="text-muted-foreground">Manage and track all fee payments</p>
      </div>

      {/* Important Deadline Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-900">
          <strong>Important Deadline:</strong> Final payment must be completed by <strong>October 15, 2025</strong>
        </AlertDescription>
      </Alert>

      {admissions.length === 0 ? (
        <Alert>
          <AlertDescription>
            No approved admissions found. Please submit an admission form first.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Fee Summary Card */}
          {paymentSummary && (
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle>Your Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Fees</p>
                    <p className="text-3xl font-bold">₹{paymentSummary.totalFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-3xl font-bold text-green-600">₹{paymentSummary.paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-3xl font-bold text-orange-600">₹{paymentSummary.remainingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Payment Progress</span>
                    <span className="text-2xl font-bold">{paymentSummary.paymentPercent}%</span>
                  </div>
                  <Progress value={paymentSummary.paymentPercent} className="h-4" />
                </div>

                {/* Payment Button */}
                {paymentSummary.remainingBalance > 0 && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full">
                        <DollarSign className="mr-2 h-5 w-5" />
                        Make Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                          Submit your fee payment.
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="admission_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Child</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select child" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {admissions.map((admission) => (
                                      <SelectItem key={admission.id} value={admission.id}>
                                        {admission.student?.full_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount (₹)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Remaining: ₹{paymentSummary.remainingBalance.toLocaleString('en-IN')}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="payment_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="payment_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="initial">Initial Payment</SelectItem>
                                    <SelectItem value="installment">Installment</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setDialogOpen(false)}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Submit
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Timeline/History */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All your recorded payments</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">No payments recorded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Submit your first payment to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments
                    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                    .map((payment) => (
                      <div key={payment.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="mt-1">
                            <Calendar className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">₹{payment.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                              {getStatusBadge(payment.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.payment_date), 'EEEE, MMMM d, yyyy')} • {payment.payment_type === 'initial' ? 'Initial Payment' : 'Installment'}
                            </p>
                            {payment.verification_notes && (
                              <p className="text-sm text-muted-foreground italic mt-2">
                                Note: {payment.verification_notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="md:flex-shrink-0">
                          {payment.receipt_url ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                                <Upload className="mr-2 h-4 w-4" />
                                View Receipt
                              </a>
                            </Button>
                          ) : (
                            <div className="hidden">
                              <Input
                                type="file"
                                accept="image/*"
                                id={`upload-${payment.id}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadReceipt(payment.id, file);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
