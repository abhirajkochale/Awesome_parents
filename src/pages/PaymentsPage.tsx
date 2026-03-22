import { useEffect, useState } from 'react';
import { paymentApi, admissionApi, storageApi } from '@/db/api';
import type { Payment, AdmissionWithStudent } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 100 }
  }
};

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
        description: receiptUrl ? 'Your payment has been submitted for verification' : 'Payment record created. Please upload receipt.',
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
    const config: Record<string, { icon: string; classes: string; label: string }> = {
      pending_upload: { icon: 'upload', classes: 'bg-slate-100 text-slate-700', label: 'Upload Required' },
      under_verification: { icon: 'schedule', classes: 'bg-blue-100 text-blue-700', label: 'Under Review' },
      approved: { icon: 'check_circle', classes: 'bg-green-100 text-green-700', label: 'Approved' },
      rejected: { icon: 'error', classes: 'bg-red-100 text-red-700', label: 'Rejected' },
    };

    const { icon, classes, label } = config[status] || config.pending_upload;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${classes}`}>
        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-12 max-w-7xl mx-auto w-full">
        <div className="h-16 w-64 bg-slate-200 rounded-lg mb-8"></div>
        <div className="h-96 w-full bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  const currentAdmission = admissions.find(a => a.id === watchedAdmissionId) || admissions[0];
  const paymentSummary = currentAdmission
    ? (() => {
      const admission = currentAdmission;
      const admissionPayments = payments.filter(p => p.admission_id === admission.id);
      const paidAmount = admissionPayments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
      const totalFee = admission.total_fee || 0;
      const discountAmount = admission.discount_amount || 0;
      const finalFee = admission.final_fee || (totalFee - discountAmount);
      return {
        totalFee,
        finalFee,
        paidAmount,
        remainingBalance: finalFee - paidAmount,
        paymentPercent: finalFee > 0 ? Math.round((paidAmount / finalFee) * 100) : 0,
      };
    })() : null;

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full font-['Plus_Jakarta_Sans']">

      <div className="grid grid-cols-12 gap-8 items-start">
        
        {admissions.length === 0 && (
          <motion.div variants={itemVariants} className="col-span-12 lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-10 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none"></div>
            <div className="relative z-10 w-full md:w-1/2">
              <div className="w-24 h-24 bg-pink-100 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-pink-100/50">
                <span className="material-symbols-outlined text-pink-600 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_late</span>
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">No Approved Admissions</h2>
              <p className="text-lg text-slate-500 font-['Be_Vietnam_Pro'] leading-relaxed mb-8">Submit an admission form to start making payments and secure your child's spot in our global curriculum.</p>
              <button onClick={() => navigate('/admission')} className="bg-[#F44336] text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center w-fit gap-3">
                Apply Now
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
            <div className="w-full md:w-1/2 flex justify-center items-center relative z-10">
              <div className="w-full aspect-square max-w-md bg-slate-50 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
                <img alt="Playful Illustration" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2sd_FbohivLxuYD2BncbVOSxQ2h_v8ffXXhEgWbtuKU7fosHnhsaJ70-In1ofRZliAdGCEfxptHajHKBkarZLxYRuOgtqP9-91GdGYxHfodKxI3oIPtWf99rG8W4DyI33a1tnAY6OxUqYZyoVZJVVM1PgwX_RorufEOGyLAKnvIojudNy5XY63Pta9HMCcmNC6S_tCeB1QPBlLeqjz-0HZqvotCsOIdE1G4P99YJ_TcdnA_O3aLJ5Pk_63fTvTCZqis6WozNt4jep" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Summary */}
        <motion.div variants={itemVariants} className={`col-span-12 md:col-span-6 lg:col-span-4 bg-blue-600 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-blue-600/20 group hover:scale-[1.01] transition-transform ${admissions.length === 0 ? 'h-full' : ''}`}>
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            </div>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-[10px] mb-1">Current Balance</p>
            <h3 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tighter">
              ₹{paymentSummary ? paymentSummary.remainingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
            </h3>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/20 space-y-4 font-['Be_Vietnam_Pro']">
            {paymentSummary ? (
              <>
                <div className="flex justify-between items-center text-white">
                  <span className="text-sm font-medium opacity-90">Base Fee:</span>
                  <span className="font-bold">₹{paymentSummary.totalFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                {currentAdmission?.discount_amount && currentAdmission.discount_amount > 0 && (
                  <div className="flex justify-between items-center text-yellow-300">
                    <span className="text-sm font-medium">Discount:</span>
                    <span className="font-bold">-₹{Number(currentAdmission.discount_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-white font-['Plus_Jakarta_Sans'] pt-2 border-t border-white/20">
                  <span className="text-sm font-bold opacity-90">Total Payable:</span>
                  <span className="font-bold text-lg">₹{paymentSummary.finalFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center text-white mt-4">
                  <span className="text-sm font-medium opacity-90">Amount Paid:</span>
                  <span className="font-bold">₹{paymentSummary.paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                
                <div className="space-y-1.5 mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Progress</span>
                    <span className="text-xs font-bold">{paymentSummary.paymentPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${paymentSummary.paymentPercent}%` }}></div>
                  </div>
                </div>

                {paymentSummary.remainingBalance > 0 && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="w-full mt-4 bg-white text-blue-600 font-bold py-3 rounded-full hover:scale-[1.02] active:scale-95 shadow-lg shadow-white/10 transition-transform flex items-center justify-center gap-2 text-sm">
                        Make a Payment
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-3xl border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 font-['Be_Vietnam_Pro']">
                      <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-slate-900">Record Payment</DialogTitle>
                        <DialogDescription className="text-base text-slate-500">Submit your fee payment details.</DialogDescription>
                      </DialogHeader>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                          <FormField
                            control={form.control}
                            name="admission_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-slate-700">Select Child</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-[56px] bg-slate-50 border-none rounded-xl px-5 text-base font-medium shadow-none focus:ring-2 focus:ring-blue-100">
                                      <SelectValue placeholder="Select child" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-xl border-none shadow-xl">
                                    {admissions.map((admission) => (
                                      <SelectItem key={admission.id} value={admission.id} className="cursor-pointer py-3 rounded-lg mx-1 focus:bg-blue-50 focus:text-blue-700">
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
                                <FormLabel className="font-bold text-slate-700">Amount (₹)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="Enter amount" className="h-[56px] bg-slate-50 border-none rounded-xl px-5 text-base font-medium shadow-none focus-visible:ring-2 focus-visible:ring-blue-100" {...field} />
                                </FormControl>
                                <FormDescription className="text-blue-600 font-medium pt-1">
                                  Remaining Balance: ₹{paymentSummary.remainingBalance.toLocaleString('en-IN')}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="payment_date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" className="h-[56px] bg-slate-50 border-none rounded-xl px-5 text-base font-medium shadow-none focus-visible:ring-2 focus-visible:ring-blue-100" {...field} />
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
                                  <FormLabel className="font-bold text-slate-700">Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-[56px] bg-slate-50 border-none rounded-xl px-5 text-base font-medium shadow-none focus:ring-2 focus:ring-blue-100">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl border-none shadow-xl">
                                      <SelectItem value="initial" className="cursor-pointer py-3 rounded-lg mx-1 focus:bg-blue-50 focus:text-blue-700">Initial</SelectItem>
                                      <SelectItem value="installment" className="cursor-pointer py-3 rounded-lg mx-1 focus:bg-blue-50 focus:text-blue-700">Installment</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                            <button type="button" onClick={() => setDialogOpen(false)} disabled={isSubmitting} className="px-6 py-3 rounded-full font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                              Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center min-w-[140px]">
                              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Submit'}
                            </button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            ) : (
              <p className="text-white text-sm font-medium opacity-90">Total Due: ₹0</p>
            )}
          </div>
        </motion.div>

        {admissions.length === 0 && (
          <motion.div variants={itemVariants} className="col-span-12 md:col-span-6 lg:col-span-4 bg-slate-100 rounded-3xl p-8 hover:bg-slate-100/80 transition-all cursor-pointer group shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200/50">
            <div className="flex items-start justify-between mb-8">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-600 text-3xl">menu_book</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">open_in_new</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Fee Structure</h3>
            <p className="text-slate-500 font-['Be_Vietnam_Pro'] text-sm leading-relaxed">Download the comprehensive breakdown of tuition, activity fees, and meal plans.</p>
          </motion.div>
        )}

        {/* Payment History */}
        <motion.div variants={itemVariants} className={`${admissions.length === 0 ? 'col-span-12 lg:col-span-8' : 'col-span-12 lg:col-span-8'} bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col overflow-hidden`}>
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 shrink-0">
            <h3 className="text-xl font-bold text-slate-900">Payment History</h3>
            <span className="text-slate-500 text-[10px] font-bold tracking-wide px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">Academic Year 2023-24</span>
          </div>
          
          <div className="flex flex-col gap-4 font-['Be_Vietnam_Pro'] pr-1">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 opacity-80">
                <span className="material-symbols-outlined text-[72px] mb-6 text-slate-200 font-light">receipt_long</span>
                <p className="text-xl font-bold text-slate-500 mb-2 font-['Plus_Jakarta_Sans']">No transactions found</p>
                <p className="text-base max-w-sm">Once you begin your journey and make a payment, your history will elegantly appear here.</p>
              </div>
            ) : (
              payments
                .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                .map((payment) => (
                  <motion.div key={payment.id} variants={itemVariants} whileHover={{ scale: 1.005 }} className="group">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-300 gap-5">
                      <div className="flex items-start md:items-center gap-5 flex-1">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                        </div>
                        <div className="space-y-1.5 flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-extrabold text-[18px] text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                              ₹{payment.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </h3>
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            {format(new Date(payment.payment_date), 'EEEE, MMMM d, yyyy')}
                            <span className="opacity-40">•</span>
                            <span className="uppercase tracking-wider text-[11px] font-bold">{payment.payment_type === 'initial' ? 'Initial' : 'Installment'}</span>
                          </div>
                          {payment.verification_notes && (
                            <p className="text-sm text-red-600 italic mt-2 font-medium flex items-center gap-1.5 bg-red-50 p-2.5 rounded-lg border border-red-100 w-fit">
                              <span className="material-symbols-outlined text-[16px] text-red-500">info</span> 
                              {payment.verification_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="md:flex-shrink-0 flex gap-2">
                        {payment.receipt_url ? (
                          <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="flex justify-center items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 shadow-sm transition-all w-full xl:w-auto">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            Receipt
                          </a>
                        ) : (
                          <div className="w-full xl:w-auto">
                            <Input type="file" accept="image/*,application/pdf" id={`upload-${payment.id}`} className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadReceipt(payment.id, file);
                              }} />
                            <label htmlFor={`upload-${payment.id}`} className="flex justify-center flex-1 items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 cursor-pointer shadow-sm transition-all border border-blue-100">
                              <span className="material-symbols-outlined text-[18px]">upload</span>
                              Upload Receipt
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
