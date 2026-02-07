import { useEffect, useState } from 'react';
import { paymentApi, admissionApi, storageApi } from '@/db/api';
import type { Payment, AdmissionWithStudent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { DollarSign, Upload, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

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
    const config: Record<string, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending_upload: {
        icon: <Upload className="h-3 w-3" />,
        variant: 'outline',
        label: 'Pending Upload',
      },
      under_verification: {
        icon: <Clock className="h-3 w-3" />,
        variant: 'secondary',
        label: 'Under Verification',
      },
      approved: {
        icon: <CheckCircle className="h-3 w-3" />,
        variant: 'default',
        label: 'Approved',
      },
      rejected: {
        icon: <XCircle className="h-3 w-3" />,
        variant: 'destructive',
        label: 'Rejected',
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
      <div className="space-y-6">
        <Skeleton className="h-32 w-full bg-muted" />
        <Skeleton className="h-64 w-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage your fee payments and view history</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <DollarSign className="mr-2 h-4 w-4" />
              Make Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Payment</DialogTitle>
              <DialogDescription>
                Upload your payment receipt for verification
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select child" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {admissions.map((admission) => (
                            <SelectItem key={admission.id} value={admission.id}>
                              {admission.student?.full_name} - {admission.student?.class}
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
                        <Input type="number" step="0.01" placeholder="Enter amount" {...field} />
                      </FormControl>
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
                          <SelectItem value="initial">Initial Payment (50%)</SelectItem>
                          <SelectItem value="installment">Installment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receipt_file"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Receipt (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Upload receipt image (max 1MB)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
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
      </div>

      {admissions.length === 0 && (
        <Alert>
          <AlertDescription>
            No approved admissions found. Please submit an admission form first.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all your payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments yet</p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">₹{Number(payment.amount).toFixed(2)}</h3>
                      {getStatusBadge(payment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.payment_date), 'MMMM d, yyyy')} •{' '}
                      {payment.payment_type === 'initial' ? 'Initial Payment' : 'Installment'}
                    </p>
                    {payment.verification_notes && (
                      <p className="text-sm text-muted-foreground">
                        Note: {payment.verification_notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {payment.receipt_url ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                          View Receipt
                        </a>
                      </Button>
                    ) : (
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`upload-${payment.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadReceipt(payment.id, file);
                          }}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <label htmlFor={`upload-${payment.id}`} className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Receipt
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
