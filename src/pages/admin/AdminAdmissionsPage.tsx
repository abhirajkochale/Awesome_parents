import { useEffect, useState } from 'react';
import { admissionApi, batchApi } from '@/db/api';
import type { AdmissionWithStudent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

      // If approving and a batch was selected, assign it
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

      toast({
        title: 'Success',
        description: `Admission ${status} successfully`,
      });
      setSelectedAdmission(null);
      setNotes('');
      setSelectedBatch('');
      setDiscountAmount('0');
      loadAdmissions();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to update admission status',
        variant: 'destructive',
      });
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
    if (!window.confirm('Are you sure you want to delete this admission? This action cannot be undone.')) {
      return;
    }

    try {
      setIsProcessing(true);
      await admissionApi.deleteAdmission(id);
      toast({
        title: 'Success',
        description: 'Admission deleted successfully',
      });
      loadAdmissions();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to delete admission',
        variant: 'destructive',
      });
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
    return <Skeleton className="h-96 bg-muted" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Manage Admissions</h1>
          <p className="text-muted-foreground">Review and approve admission applications</p>
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting}
          variant="outline"
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? 'Exporting...' : 'Download Excel'}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name, class, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {admissions.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No admissions found</p>
          </CardContent>
        </Card>
      ) : (
        STANDARDS.map((std) => {
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

          return (
            <Card key={std} className={cn("overflow-hidden border-2", styles?.borderColor || "border-muted")}>
              <div className={cn("h-1.5 w-full bg-gradient-to-r", styles?.gradient || "from-muted to-muted-foreground")} />
              <CardHeader className={cn("pb-3", styles?.bgColor || "bg-muted/10")}>
                <CardTitle className="text-base md:text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", styles?.accent || "bg-primary")}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <span className={cn("font-bold tracking-tight", styles?.color || "text-foreground")}>{label}</span>
                  </div>
                  <Badge variant="secondary" className={cn("text-xs font-medium border-none", styles?.bgColor || "bg-white")}>
                    {filtered.length} admission{filtered.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8 italic border-2 border-dashed rounded-xl">No pending admissions for {label}</p>
                ) : (
                  <div className="space-y-4">
                    {filtered.map((admission) => (
                <div key={admission.id} className={cn("p-4 border-2 rounded-xl space-y-3 transition-all hover:shadow-md bg-white", styles?.borderColor || "border-muted")}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{admission.student?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Class: {admission.student?.class} • Year: {admission.student?.academic_year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {format(new Date(admission.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge
                      variant={
                        admission.status === 'approved'
                          ? 'default'
                          : admission.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {admission.status}
                    </Badge>
                  </div>

                  {/* Show current batch for approved students */}
                  {admission.status === 'approved' && admission.student?.batch_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Batch:</span>
                      <Badge variant="outline" className="font-normal">
                        {admission.student.batch_label || admission.student.batch_time}
                      </Badge>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">DOB:</span>{' '}
                      {format(new Date(admission.student?.date_of_birth || ''), 'MMM d, yyyy')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender:</span>{' '}
                      {admission.student?.gender}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Emergency Contact:</span>{' '}
                      {admission.student?.emergency_contact_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Fee:</span> ₹
                      {Number(admission.total_fee).toFixed(2)}
                    </div>
                    {admission.status === 'approved' && admission.discount_amount && admission.discount_amount > 0 && (
                      <div className="md:col-span-2 flex flex-col gap-1 p-2 bg-orange-50 border border-orange-100 rounded">
                        <div className="flex justify-between text-xs text-orange-700">
                          <span>Base Fee: ₹{Number(admission.total_fee).toLocaleString()}</span>
                          <span className="font-bold">- Discount: ₹{Number(admission.discount_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-orange-800">
                          <span>Final Payable Amount:</span>
                          <span>₹{Number(admission.final_fee).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {admission.notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Notes:</span> {admission.notes}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {admission.status === 'submitted' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setSelectedAdmission(admission)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedAdmission(admission);
                            setNotes('');
                          }}
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    {/* Reassign batch for approved students */}
                    {admission.status === 'approved' && (() => {
                      const batches = getBatchesForStandard(admission.student?.class || '');
                      return batches.length > 0 ? (
                        <Select
                          value={admission.student?.batch_id || ''}
                          onValueChange={(val) => handleReassignBatch(admission.student!.id, val)}
                          disabled={isProcessing}
                        >
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Assign Batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((b) => (
                              <SelectItem key={b.batchId} value={b.batchId}>
                                {b.batchTime}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null;
                    })()}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAdmissionForDetails(admission)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Full Details
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedAdmissionForEdit(admission)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(admission.id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
          );
        })
      )}

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Admission Status</DialogTitle>
            <DialogDescription>
              {selectedAdmission?.student?.full_name} - {selectedAdmission?.student?.class}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or comments"
                className="mt-2"
              />
            </div>

            {/* Discount and Fee Summary — only shown for approval */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Admission Fee:</span>
                <span className="font-semibold">₹{Number(selectedAdmission?.total_fee || 0).toLocaleString()}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Apply Discount (₹)</label>
                <Input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  max={selectedAdmission?.total_fee}
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-dashed">
                <span className="text-sm font-bold">Final Payable Amount:</span>
                <span className="text-lg font-bold text-primary">
                  ₹{Math.max(0, (selectedAdmission?.total_fee || 0) - (parseFloat(discountAmount) || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Batch Selection — only shown for approval */}
            {(() => {
              const batches = getBatchesForStandard(selectedAdmission?.student?.class || '');
              if (batches.length === 0) return (
                <p className="text-xs text-muted-foreground italic">No batch options for this standard.</p>
              );
              return (
                <div>
                  <label className="text-sm font-medium">Assign Batch (for approval)</label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((b) => (
                        <SelectItem key={b.batchId} value={b.batchId}>
                          {b.batchTime} — {b.batchLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}

            <div className="flex gap-2">
              <Button
                onClick={() => handleUpdateStatus(selectedAdmission?.id || '', 'approved')}
                disabled={isProcessing}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus(selectedAdmission?.id || '', 'rejected')}
                disabled={isProcessing}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
