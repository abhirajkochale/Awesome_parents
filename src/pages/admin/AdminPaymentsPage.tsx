import { useEffect, useState } from 'react';
import { paymentApi } from '@/db/api';
import type { PaymentWithAdmission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithAdmission | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getAllPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setIsProcessing(true);
      await paymentApi.verifyPayment(id, status, notes);
      toast({
        title: 'Success',
        description: `Payment ${status} successfully`,
      });
      setSelectedPayment(null);
      setNotes('');
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

  if (loading) {
    return <Skeleton className="h-96 bg-muted" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verify Payments</h1>
        <p className="text-muted-foreground">Review and verify payment receipts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments found</p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        ₹{Number(payment.amount).toFixed(2)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {payment.admission?.student?.full_name} •{' '}
                        {payment.payment_type === 'initial' ? 'Initial Payment' : 'Installment'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Date: {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge
                      variant={
                        payment.status === 'approved'
                          ? 'default'
                          : payment.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {payment.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {payment.verification_notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Notes:</span>{' '}
                      {payment.verification_notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {payment.receipt_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Receipt
                        </a>
                      </Button>
                    )}

                    {payment.status === 'under_verification' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setNotes('');
                          }}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setNotes('');
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Amount:</span> ₹
                {Number(selectedPayment?.amount).toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Student:</span>{' '}
                {selectedPayment?.admission?.student?.full_name}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Verification Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add verification notes"
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleVerify(selectedPayment?.id || '', 'approved')}
                disabled={isProcessing}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleVerify(selectedPayment?.id || '', 'rejected')}
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
