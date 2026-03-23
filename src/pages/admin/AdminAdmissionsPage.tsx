import { useEffect, useState } from 'react';
import { admissionApi, batchApi } from '@/db/api';
import type { AdmissionWithStudent } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AdmissionDetailsDialog } from '@/components/admin/AdmissionDetailsDialog';
import { AdminEditAdmissionDialog } from '@/components/admin/AdminEditAdmissionDialog';
import { format } from 'date-fns';
import { getBatchesForStandard, STANDARDS, STANDARD_LABELS, STANDARD_STYLES } from '@/lib/batchConfig';
import { Baby, Flower2, Palette, BookOpen, GraduationCap, CheckCircle, XCircle, Eye, Trash2, Edit, Clock, Download, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportStudentRegister } from '@/lib/exportStudentRegister';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

export default function AdminAdmissionsPage() {
  const [admissions, setAdmissions] = useState<AdmissionWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState<AdmissionWithStudent | null>(null);
  const [selectedAdmissionForDetails, setSelectedAdmissionForDetails] = useState<AdmissionWithStudent | null>(null);
  const [selectedAdmissionForEdit, setSelectedAdmissionForEdit] = useState<AdmissionWithStudent | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadAdmissions();
  }, []);

  const loadAdmissions = async () => {
    try {
      setLoading(true);
      const data = await admissionApi.getAllAdmissions();
      setAdmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setIsProcessing(true);
      
      const discount = parseFloat(discountAmount) || 0;
      const baseFee = selectedAdmission?.total_fee || 0;
      const finalFee = Math.max(0, baseFee - discount);

      await admissionApi.updateAdmissionStatus(
        id, 
        status, 
        notes, 
        status === 'approved' ? discount : undefined,
        status === 'approved' ? finalFee : undefined
      );

      if (status === 'approved' && selectedBatch && selectedAdmission?.student) {
        const batches = getBatchesForStandard(selectedAdmission.student.class);
        const batch = batches.find(b => b.batchId === selectedBatch);
        if (batch) {
          await batchApi.assignBatch(
            selectedAdmission.student.id,
            batch.batchId,
            batch.batchTime,
            batch.batchLabel
          );
        }
      }

      toast({ title: 'Success', description: `Admission ${status} successfully` });
      setSelectedAdmission(null);
      setNotes('');
      setSelectedBatch('');
      setDiscountAmount('0');
      loadAdmissions();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update admission status', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReassignBatch = async (studentId: string, batchId: string) => {
    const allBatches = getBatchesForStandard(
      admissions.find(a => a.student?.id === studentId)?.student?.class || ''
    );
    const batch = allBatches.find(b => b.batchId === batchId);
    if (!batch) return;

    try {
      setIsProcessing(true);
      await batchApi.assignBatch(studentId, batch.batchId, batch.batchTime, batch.batchLabel);
      toast({ title: 'Batch Reassigned', description: `Student assigned to ${batch.batchLabel}` });
      loadAdmissions();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to reassign batch', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this admission? This action cannot be undone.')) return;

    try {
      setIsProcessing(true);
      await admissionApi.deleteAdmission(id);
      toast({ title: 'Success', description: 'Admission deleted successfully' });
      loadAdmissions();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete admission', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportStudentRegister();
      toast({ title: 'Success', description: 'Student register downloaded successfully' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to export student register', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-['Plus_Jakarta_Sans']">
        <Skeleton className="h-14 w-72 rounded-2xl" />
        <Skeleton className="h-12 w-full max-w-md rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-[32px]" />
          <Skeleton className="h-40 w-full rounded-[32px]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-['Plus_Jakarta_Sans'] pb-12 space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Manage <span className="text-blue-600">Admissions</span> 📝
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg font-['Be_Vietnam_Pro']">
            Review and approve student applications
          </p>
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-6 py-6 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 self-start"
        >
          {isExporting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
          {isExporting ? 'Exporting...' : 'Download Excel'}
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder="Search by student name, class, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 bg-white border-none rounded-2xl shadow-md font-medium text-base text-slate-900 placeholder:text-slate-400"
        />
      </motion.div>

      {admissions.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white rounded-[48px] p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium font-['Be_Vietnam_Pro'] text-lg">No admissions found</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
        {STANDARDS.map((std) => {
          const label = STANDARD_LABELS[std] || std;
          const styles = STANDARD_STYLES[std];
          const iconMap: Record<string, any> = { Baby, Flower2, Palette, BookOpen, GraduationCap };
          const IconComponent = iconMap[styles?.icon || 'GraduationCap'] || GraduationCap;
          
          const query = searchQuery.toLowerCase().trim();
          const filtered = admissions.filter((a) => {
            if ((a.student?.class || '').toLowerCase() !== std) return false;
            if (!query) return true;
            const name = (a.student?.full_name || '').toLowerCase();
            const cls = (a.student?.class || '').toLowerCase();
            const status = (a.status || '').toLowerCase();
            return name.includes(query) || cls.includes(query) || status.includes(query);
          });

          if (filtered.length === 0) return null;

          return (
            <motion.div variants={itemVariants} key={std} className="bg-white rounded-[48px] overflow-hidden shadow-[0_16px_32px_-12px_rgba(0,0,0,0.05)] border border-slate-100">
              <div className={cn("h-3 w-full bg-gradient-to-r", styles?.gradient || "from-slate-200 to-slate-300")} />
              
              <div className="p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-4 rounded-2xl bg-gradient-to-br text-white shadow-lg", styles?.gradient || "from-slate-500 to-slate-600")}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{label}</h2>
                      <p className="text-slate-500 font-medium font-['Be_Vietnam_Pro']">
                        {filtered.length} application{filtered.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {filtered.map((admission) => (
                    <div key={admission.id} className="bg-slate-50 rounded-[32px] p-6 flex flex-col xl:flex-row gap-6 hover:shadow-md transition-all border border-slate-100/50">
                      
                      {/* Left: Info */}
                      <div className="flex-[2] space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-xl text-slate-900">{admission.student?.full_name}</h3>
                            <p className="text-sm text-slate-500 font-medium font-['Be_Vietnam_Pro'] mt-1">
                              Class: {admission.student?.class} • Year: {admission.student?.academic_year}
                            </p>
                          </div>
                          <Badge
                            variant={
                              admission.status === 'approved' ? 'default' :
                              admission.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                            className="px-4 py-1.5 rounded-xl uppercase tracking-wider text-xs font-bold shadow-sm"
                          >
                            {admission.status}
                          </Badge>
                        </div>

                        {admission.status === 'approved' && admission.student?.batch_id && (
                          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 w-fit">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-bold text-slate-700">Batch:</span>
                            <span className="text-sm font-medium text-slate-500 font-['Be_Vietnam_Pro']">
                              {admission.student.batch_label || admission.student.batch_time}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                          <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">DOB</span>
                            <span className="text-sm font-medium text-slate-700 font-['Be_Vietnam_Pro']">
                              {format(new Date(admission.student?.date_of_birth || ''), 'MMM d, yy')}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</span>
                            <span className="text-sm font-medium text-slate-700 font-['Be_Vietnam_Pro']">
                              {admission.student?.gender}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fee</span>
                            <span className="text-sm font-black text-slate-900 font-['Be_Vietnam_Pro']">
                              ₹{Number(admission.total_fee).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</span>
                            <span className="text-sm font-medium text-slate-700 font-['Be_Vietnam_Pro']">
                              {format(new Date(admission.created_at), 'MMM d, yy')}
                            </span>
                          </div>
                        </div>

                        {admission.status === 'approved' && admission.discount_amount && admission.discount_amount > 0 && (
                          <div className="flex justify-between items-center p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                            <span className="text-sm font-bold text-orange-800">Final Payable (after ₹{Number(admission.discount_amount).toLocaleString()} discount)</span>
                            <span className="text-lg font-black text-orange-600">₹{Number(admission.final_fee).toLocaleString()}</span>
                          </div>
                        )}

                        {admission.notes && (
                          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <span className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Notes</span>
                            <span className="text-sm font-medium text-amber-900 font-['Be_Vietnam_Pro']">{admission.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex-1 flex flex-row flex-wrap xl:flex-col gap-3 justify-end xl:justify-center border-t xl:border-t-0 xl:border-l border-slate-200 pt-4 xl:pt-0 xl:pl-6">
                        {admission.status === 'submitted' && (
                          <>
                            <Button onClick={() => setSelectedAdmission(admission)} className="w-full sm:w-auto xl:w-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl h-11 shadow-md">
                              <CheckCircle className="h-4 w-4 mr-2" /> Approve
                            </Button>
                            <Button onClick={() => { setSelectedAdmission(admission); setNotes(''); }} variant="destructive" className="w-full sm:w-auto xl:w-full font-bold rounded-xl h-11 shadow-md">
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </Button>
                          </>
                        )}
                        
                        {admission.status === 'approved' && (() => {
                          const batches = getBatchesForStandard(admission.student?.class || '');
                          return batches.length > 0 ? (
                            <Select
                              value={admission.student?.batch_id || ''}
                              onValueChange={(val) => handleReassignBatch(admission.student!.id, val)}
                              disabled={isProcessing}
                            >
                              <SelectTrigger className="w-full h-11 bg-white rounded-xl border-slate-200 font-medium text-sm">
                                <SelectValue placeholder="Assign Batch" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-none shadow-xl">
                                {batches.map((b) => (
                                  <SelectItem key={b.batchId} value={b.batchId} className="rounded-xl font-medium">
                                    {b.batchTime} — {b.batchLabel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : null;
                        })()}

                        <div className="flex gap-2 w-full">
                          <Button onClick={() => setSelectedAdmissionForDetails(admission)} variant="outline" className="flex-1 h-11 bg-white border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => setSelectedAdmissionForEdit(admission)} variant="outline" className="flex-1 h-11 bg-white border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleDelete(admission.id)} variant="outline" className="flex-1 h-11 bg-white border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>
      )}

      {/* Dialogs */}
      <AdmissionDetailsDialog
        admission={selectedAdmissionForDetails}
        open={!!selectedAdmissionForDetails}
        onOpenChange={(open) => !open && setSelectedAdmissionForDetails(null)}
      />

      <AdminEditAdmissionDialog
        admission={selectedAdmissionForEdit}
        open={!!selectedAdmissionForEdit}
        onOpenChange={(open) => !open && setSelectedAdmissionForEdit(null)}
        onSuccess={loadAdmissions}
      />

      <Dialog open={!!selectedAdmission} onOpenChange={() => { setSelectedAdmission(null); setSelectedBatch(''); }}>
        <DialogContent className="rounded-[32px] sm:max-w-md p-8 border-none shadow-2xl font-['Plus_Jakarta_Sans']">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900">Update Status</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium font-['Be_Vietnam_Pro']">
              {selectedAdmission?.student?.full_name} • {selectedAdmission?.student?.class}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any internal notes..."
                className="rounded-2xl border-slate-200 bg-slate-50 font-medium placeholder:text-slate-400"
              />
            </div>

            <div className="bg-blue-50/50 p-6 rounded-[24px] space-y-4 border border-blue-100/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-900 font-bold">Base Fee</span>
                <span className="font-black text-blue-900">₹{Number(selectedAdmission?.total_fee || 0).toLocaleString()}</span>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-blue-100">
                <label className="text-sm font-bold text-blue-900 block">Apply Discount (₹)</label>
                <Input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  max={selectedAdmission?.total_fee}
                  className="rounded-xl border-blue-200 bg-white font-bold"
                />
              </div>

              <div className="flex justify-between items-center pt-4 mt-2 border-t border-dashed border-blue-200">
                <span className="text-sm font-black text-blue-900">Final Payable:</span>
                <span className="text-xl font-black text-blue-600">
                  ₹{Math.max(0, (selectedAdmission?.total_fee || 0) - (parseFloat(discountAmount) || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {(() => {
              const batches = getBatchesForStandard(selectedAdmission?.student?.class || '');
              if (batches.length === 0) return null;
              return (
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Assign Batch</label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger className="w-full h-12 bg-slate-50 rounded-xl border-slate-200 font-medium">
                      <SelectValue placeholder="Select a batch..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      {batches.map((b) => (
                        <SelectItem key={b.batchId} value={b.batchId} className="rounded-xl font-medium cursor-pointer py-2">
                          {b.batchTime} — {b.batchLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleUpdateStatus(selectedAdmission?.id || '', 'approved')}
                disabled={isProcessing}
                className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black shadow-md shadow-green-200"
              >
                <CheckCircle className="mr-2 h-5 w-5" /> Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus(selectedAdmission?.id || '', 'rejected')}
                disabled={isProcessing}
                className="flex-1 h-12 rounded-xl font-black shadow-md shadow-red-200"
              >
                <XCircle className="mr-2 h-5 w-5" /> Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
