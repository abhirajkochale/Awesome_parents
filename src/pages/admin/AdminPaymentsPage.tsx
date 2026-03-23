import { useEffect, useState } from 'react';
import { paymentApi } from '@/db/api';
import type { PaymentWithAdmission } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { XCircle, IndianRupee, Clock, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'approved':
      return { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'Approved' };
    case 'rejected':
      return { icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', label: 'Rejected' };
    case 'under_verification':
      return { icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', label: 'Under Verification' };
    case 'pending_upload':
      return { icon: AlertCircle, color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', label: 'Pending Upload' };
    default:
      return { icon: Clock, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', label: status.replace('_', ' ') };
  }
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithAdmission | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [verifyAction, setVerifyAction] = useState<'approved' | 'rejected' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getAllPayments();
      // Sort by latest first
      const sorted = [...data].sort((a, b) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      );
      setPayments(sorted);
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load payments.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedPayment || !verifyAction) return;
    
    try {
      setIsProcessing(true);
      await paymentApi.verifyPayment(selectedPayment.id, verifyAction, notes);
      toast({
        title: 'Success',
        description: `Payment ${verifyAction} successfully`,
      });
      setSelectedPayment(null);
      setNotes('');
      setVerifyAction(null);
      loadPayments();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to verify payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openVerifyDialog = (payment: PaymentWithAdmission, action: 'approved' | 'rejected') => {
    setSelectedPayment(payment);
    setVerifyAction(action);
    setNotes('');
  };

  if (loading) {
    return (
      <div className="space-y-6 font-['Plus_Jakarta_Sans']">
        <Skeleton className="h-16 w-64 rounded-2xl mb-2" />
        <Skeleton className="h-4 w-48 rounded-md mb-8" />
        <div className="space-y-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  const filteredPayments = payments.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.status === 'under_verification' || p.status === 'pending_upload';
    if (filter === 'completed') return p.status === 'approved' || p.status === 'rejected';
    return true;
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-['Plus_Jakarta_Sans'] pb-12 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Verify <span className="text-blue-600">Payments</span> 💳
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg font-['Be_Vietnam_Pro']">
            Review and process student fee receipts
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 inline-flex overflow-x-auto hide-scrollbar">
        {[
          { id: 'all', label: 'All Payments' },
          { id: 'pending', label: 'Pending Verification' },
          { id: 'completed', label: 'Processed' },
        ].map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                "min-w-[140px] px-6 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap",
                isActive 
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </motion.div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white rounded-[48px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <IndianRupee className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No Payments Found</h3>
          <p className="text-slate-500 font-medium font-['Be_Vietnam_Pro'] text-lg max-w-sm">
            There are currently no {filter !== 'all' ? filter : ''} payments to process.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredPayments.map((payment) => {
              const statusConfig = getStatusConfig(payment.status);
              const StatusIcon = statusConfig.icon;
              const isPending = payment.status === 'under_verification' || payment.status === 'pending_upload';
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                  transition={{ duration: 0.3 }}
                  key={payment.id} 
                  className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between"
                >
                  <div className="flex items-start gap-6 flex-1 w-full">
                    {/* Amount Icon/Badge */}
                    <div className="h-16 w-16 shrink-0 rounded-[20px] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100/50">
                      <IndianRupee className="h-8 w-8" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                        <h3 className="text-2xl font-black text-slate-900">
                          ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border w-fit", statusConfig.bg, statusConfig.color, statusConfig.border)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig.label}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-6 text-sm font-medium text-slate-500 font-['Be_Vietnam_Pro']">
                        <p className="flex items-center gap-2 text-slate-700 font-bold">
                          {payment.admission?.student?.full_name || 'Unknown Student'}
                        </p>
                        <p className="flex items-center gap-2">
                           • {payment.payment_type === 'initial' ? 'Initial Admission Fee' : 'Installment Payment'}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                        </p>
                      </div>

                      {payment.verification_notes && (
                        <div className="mt-3 text-sm bg-slate-50 p-3 rounded-2xl border border-slate-100 inline-block font-['Be_Vietnam_Pro'] text-slate-600">
                          <span className="font-bold text-slate-700">Notes:</span> {payment.verification_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    {payment.receipt_url && (
                      <a 
                        href={payment.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-5 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors flex items-center gap-2 border border-slate-200"
                      >
                        <FileText className="h-4 w-4 text-slate-400" />
                        Receipt
                      </a>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-2 ml-auto lg:ml-0">
                        <button
                          onClick={() => openVerifyDialog(payment, 'rejected')}
                          className="px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm transition-colors border border-rose-100"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => openVerifyDialog(payment, 'approved')}
                          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Verification Dialog */}
      <Dialog open={!!selectedPayment && !!verifyAction} onOpenChange={(open) => {
        if (!open) {
          setSelectedPayment(null);
          setVerifyAction(null);
        }
      }}>
        {selectedPayment && verifyAction && (
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl rounded-[32px] p-0 overflow-hidden font-['Plus_Jakarta_Sans']">
            <div className="p-8">
              <DialogHeader className="mb-6 space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    verifyAction === 'approved' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                  )}>
                    {verifyAction === 'approved' ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                  </div>
                  <DialogTitle className="text-2xl font-black text-slate-900">
                    {verifyAction === 'approved' ? 'Approve Payment' : 'Reject Payment'}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-slate-500 font-['Be_Vietnam_Pro'] text-base">
                  {verifyAction === 'approved' 
                    ? 'Confirm verification of this payment receipt.' 
                    : 'Provide a reason for rejecting this payment.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Amount</span>
                    <span className="font-black text-lg text-slate-900">
                      ₹{Number(selectedPayment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Student</span>
                    <span className="font-bold text-slate-700">
                      {selectedPayment.admission?.student?.full_name}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">
                    Verification Notes {verifyAction === 'rejected' && <span className="text-rose-500">*</span>}
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={verifyAction === 'approved' ? "Optional internal notes..." : "Reason for rejection (Required)..."}
                    className="min-h-[100px] resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-[20px] text-base p-4 font-['Be_Vietnam_Pro']"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 lg:pt-8 mt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedPayment(null);
                      setVerifyAction(null);
                    }}
                    className="px-6 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={isProcessing || (verifyAction === 'rejected' && !notes.trim())}
                    className={cn(
                      "text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center min-w-[140px] disabled:opacity-50",
                      verifyAction === 'approved' 
                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30" 
                        : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30"
                    )}
                  >
                    {isProcessing ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                      <>{verifyAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}
