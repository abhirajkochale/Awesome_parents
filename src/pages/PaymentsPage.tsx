import { useEffect, useState } from 'react';
import { paymentApi, admissionApi, storageApi } from '@/db/api';
import type { Payment, AdmissionWithStudent } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { DollarSign, Upload, CheckCircle, Clock, AlertCircle, Calendar, Loader2, FileText, ArrowRight, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

const paymentFormSchema = z.object({
  admission_id: z.string().min(1, 'Please select an admission'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_type: z.enum(['initial', 'installment']),
  receipt_file: z.any().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending_upload: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Pending Upload' },
  under_verification: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Under Review' },
  approved: { bg: 'bg-green-100', text: 'text-green-600', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-600', label: 'Rejected' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      admission_id: '',
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_type: 'installment',
    },
  });

  const watchedAdmissionId = form.watch('admission_id');

  useEffect(() => {
    if (admissions.length > 0 && !form.getValues('admission_id')) {
      form.setValue('admission_id', admissions[0].id);
    }
  }, [admissions, form]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, admissionsData] = await Promise.all([
        paymentApi.getMyPayments(),
        admissionApi.getMyAdmissions(),
      ]);
      setPayments(paymentsData || []);
      setAdmissions((admissionsData || []).filter((a) => a.status === 'approved'));
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load payment data', variant: 'destructive' });
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
        { admission_id: data.admission_id, amount: data.amount, payment_date: data.payment_date, payment_type: data.payment_type },
        receiptUrl
      );

      toast({ title: 'Payment Submitted', description: 'Your payment has been submitted for verification.' });
      setDialogOpen(false);
      form.reset();
      loadData();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to submit payment', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadReceipt = async (paymentId: string, file: File) => {
    try {
      const receiptUrl = await storageApi.uploadReceipt(file, paymentId);
      await paymentApi.updatePaymentReceipt(paymentId, receiptUrl);
      toast({ title: 'Receipt Uploaded', description: 'Your receipt has been submitted for verification.' });
      loadData();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to upload receipt', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="font-['Plus_Jakarta_Sans'] space-y-6 pb-12">
        <Skeleton className="h-14 w-72 rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-[40px]" />
        <Skeleton className="h-96 w-full rounded-[40px]" />
      </div>
    );
  }

  const currentAdmission = admissions.find(a => a.id === watchedAdmissionId) || admissions[0];
  const paymentSummary = currentAdmission ? (() => {
    const admissionPayments = payments.filter(p => p.admission_id === currentAdmission.id);
    const paidAmount = admissionPayments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
    const totalFee = currentAdmission.total_fee || 0;
    const discountAmount = currentAdmission.discount_amount || 0;
    const finalFee = currentAdmission.final_fee || (totalFee - discountAmount) || totalFee;
    const remaining = Math.max(0, finalFee - paidAmount);
    return {
      totalFee,
      discountAmount,
      finalFee,
      paidAmount,
      remainingBalance: remaining,
      paymentPercent: Math.round((paidAmount / (finalFee || 1)) * 100),
    };
  })() : null;

  if (admissions.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="font-['Plus_Jakarta_Sans'] pb-12"
      >
        <motion.div variants={itemVariants} className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Fees &amp; Payments</h1>
          <p className="text-slate-500 text-lg font-medium mt-4 font-['Be_Vietnam_Pro']">
            Manage and track all fee payments.
          </p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <div className="bg-slate-50 rounded-[48px] p-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 shadow-sm">
              <FileText className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Approved Admissions</h3>
            <p className="text-slate-400 text-sm font-medium font-['Be_Vietnam_Pro'] max-w-xs leading-relaxed mb-6">
              You don't have any approved admissions yet. Submit an admission form to get started.
            </p>
            <button
              onClick={() => navigate('/admission')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-base px-8 py-4 rounded-[20px] shadow-xl shadow-blue-200 transition-all active:scale-95"
            >
              Apply Now <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-['Plus_Jakarta_Sans'] pb-12 space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Fees &amp; Payments</h1>
        <p className="text-slate-500 text-lg font-medium mt-4 font-['Be_Vietnam_Pro']">
          Manage and track all fee payments for your child.
        </p>
      </motion.div>

      {/* Payment Summary Bento Card */}
      {paymentSummary && (
        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-[48px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative overflow-hidden">
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60" />
            <div className="relative z-10">

              <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <DollarSign className="w-5 h-5" />
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">Payment Summary</h2>
                </div>
                {paymentSummary.remainingBalance > 0 && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-200 font-black px-8 text-base transition-all active:scale-95">
                        <DollarSign className="mr-2 h-5 w-5" />
                        Make Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="font-['Plus_Jakarta_Sans'] font-black text-xl">Record Payment</DialogTitle>
                        <DialogDescription className="font-['Be_Vietnam_Pro']">Submit your fee payment details below.</DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
                          <FormField
                            control={form.control}
                            name="admission_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Select Child</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-2xl bg-slate-50 border-none h-12">
                                      <SelectValue placeholder="Select child" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-2xl">
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
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Amount (₹)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    className="rounded-2xl bg-slate-50 border-none h-12"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs font-medium font-['Be_Vietnam_Pro']">
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
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Date</FormLabel>
                                <FormControl>
                                  <Input type="date" className="rounded-2xl bg-slate-50 border-none h-12" {...field} />
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
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-2xl bg-slate-50 border-none h-12">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-2xl">
                                    <SelectItem value="initial">Initial Payment</SelectItem>
                                    <SelectItem value="installment">Installment</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end gap-3 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setDialogOpen(false)}
                              disabled={isSubmitting}
                              className="rounded-2xl font-black"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="rounded-2xl bg-blue-600 hover:bg-blue-500 font-black shadow-lg shadow-blue-200"
                            >
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Submit Payment
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-50 rounded-[32px] p-6">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Fee Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Base Fee</span>
                      <span className="font-black text-slate-900">₹{Number(currentAdmission.total_fee).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    {(currentAdmission.discount_amount ?? 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600 font-medium">Discount</span>
                        <span className="font-black text-orange-600">- ₹{Number(currentAdmission.discount_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="font-black text-slate-900">Total Payable</span>
                      <span className="font-black text-blue-600">₹{Number(paymentSummary.finalFee).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-[32px] p-6 text-center flex flex-col justify-center">
                  <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-2">Amount Paid</p>
                  <p className="text-4xl font-black text-green-700">
                    ₹{paymentSummary.paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-[32px] p-6 text-center flex flex-col justify-center">
                  <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2">Balance Due</p>
                  <p className="text-4xl font-black text-orange-700">
                    ₹{paymentSummary.remainingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-600 uppercase tracking-wide">Payment Progress</span>
                  <span className="text-2xl font-black text-blue-600">{paymentSummary.paymentPercent}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${paymentSummary.paymentPercent}%` }}
                    transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  />
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* Payment History */}
      <motion.div variants={itemVariants}>
        <div className="bg-slate-50 rounded-[48px] p-8 md:p-12">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
                <Receipt className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-black text-slate-900">Payment History</h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm">
              {payments.length} Record{payments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 shadow-sm">
                <DollarSign className="w-10 h-10 text-slate-100" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No payments yet</h3>
              <p className="text-slate-400 text-sm font-medium font-['Be_Vietnam_Pro'] max-w-xs leading-relaxed">
                Click "Make Payment" above to record your first payment.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-5">
                {payments
                  .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                  .map((payment) => {
                    const ss = statusStyles[payment.status] || statusStyles.pending_upload;
                    return (
                      <motion.div
                        key={payment.id}
                        variants={itemVariants}
                        layout
                        className="bg-white rounded-[40px] p-8 shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] transition-all duration-500 group"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-start gap-5 flex-1">
                            <div className="p-3 bg-blue-50 rounded-2xl flex-shrink-0 self-start">
                              <Calendar className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-black text-2xl text-slate-900 group-hover:text-blue-600 transition-colors">
                                  ₹{payment.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </h3>
                                <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", ss.bg, ss.text)}>
                                  {ss.label}
                                </span>
                              </div>
                              <p className="text-sm text-slate-400 font-medium font-['Be_Vietnam_Pro']">
                                {format(new Date(payment.payment_date), 'EEEE, MMMM d, yyyy')} •{' '}
                                {payment.payment_type === 'initial' ? 'Initial Payment' : 'Installment'}
                              </p>
                              {payment.verification_notes && (
                                <p className="text-sm text-slate-500 font-['Be_Vietnam_Pro'] italic bg-slate-50 rounded-xl p-3 mt-2">
                                  Note: {payment.verification_notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {payment.receipt_url ? (
                              <a
                                href={payment.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm px-5 py-3 rounded-2xl transition-all"
                              >
                                <Upload className="h-4 w-4" />
                                View Receipt
                              </a>
                            ) : (
                              payment.status === 'pending_upload' && (
                                <>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    id={`upload-${payment.id}`}
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadReceipt(payment.id, file);
                                    }}
                                  />
                                  <label
                                    htmlFor={`upload-${payment.id}`}
                                    className="inline-flex cursor-pointer items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200"
                                  >
                                    <Upload className="h-4 w-4" />
                                    Upload Receipt
                                  </label>
                                </>
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
