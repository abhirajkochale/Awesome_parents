import { useEffect, useState } from 'react';
import { admissionApi } from '@/db/api';
import type { AdmissionWithStudent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAdmissionsPage() {
  const [admissions, setAdmissions] = useState<AdmissionWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState<AdmissionWithStudent | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
      await admissionApi.updateAdmissionStatus(id, status, notes);
      toast({
        title: 'Success',
        description: `Admission ${status} successfully`,
      });
      setSelectedAdmission(null);
      setNotes('');
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

  if (loading) {
    return <Skeleton className="h-96 bg-muted" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Admissions</h1>
        <p className="text-muted-foreground">Review and approve admission applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Admissions ({admissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {admissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No admissions found</p>
          ) : (
            <div className="space-y-4">
              {admissions.map((admission) => (
                <div key={admission.id} className="p-4 border rounded-lg space-y-3">
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
                      <span className="text-muted-foreground">Total Fee:</span> $
                      {Number(admission.total_fee).toFixed(2)}
                    </div>
                  </div>

                  {admission.notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Notes:</span> {admission.notes}
                    </div>
                  )}

                  {admission.status === 'submitted' && (
                    <div className="flex gap-2">
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAdmission} onOpenChange={() => setSelectedAdmission(null)}>
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
