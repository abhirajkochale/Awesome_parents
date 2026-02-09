import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { studentApi, admissionApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { AdmissionWithStudent } from '@/types';

interface AdminEditAdmissionDialogProps {
    admission: AdmissionWithStudent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AdminEditAdmissionDialog({
    admission,
    open,
    onOpenChange,
    onSuccess,
}: AdminEditAdmissionDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Student Fields
    const [studentName, setStudentName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    // Admission Fields
    const [totalFee, setTotalFee] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (admission && open) {
            setStudentName(admission.student?.full_name || '');
            // Ensure date is in YYYY-MM-DD format for input type="date"
            setDob(admission.student?.date_of_birth ? new Date(admission.student.date_of_birth).toISOString().split('T')[0] : '');
            setGender(admission.student?.gender || '');
            setStudentClass(admission.student?.class || '');
            setEmergencyName(admission.student?.emergency_contact_name || '');
            setEmergencyPhone(admission.student?.emergency_contact_phone || '');
            setTotalFee(admission.total_fee?.toString() || '0');
            setNotes(admission.notes || '');
        }
    }, [admission, open]);

    const handleSave = async () => {
        if (!admission || !admission.student) return;

        try {
            setLoading(true);

            // Update Student
            await studentApi.updateStudent(admission.student.id, {
                full_name: studentName,
                date_of_birth: dob,
                gender: gender,
                class: studentClass,
                emergency_contact_name: emergencyName,
                emergency_contact_phone: emergencyPhone,
            });

            // Update Admission
            await admissionApi.updateAdmission(admission.id, {
                total_fee: parseFloat(totalFee),
                notes: notes,
            });

            toast({
                title: 'Success',
                description: 'Admission details updated successfully',
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Failed to update details',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!admission) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Admission Details</DialogTitle>
                    <DialogDescription>
                        Update information for {admission.student?.full_name}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="student" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="student">Student Details</TabsTrigger>
                        <TabsTrigger value="admission">Admission Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="student" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Input value={gender} onChange={(e) => setGender(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Class</Label>
                                <Input value={studentClass} onChange={(e) => setStudentClass(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Emergency Contact Name</Label>
                                <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Emergency Contact Phone</Label>
                                <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="admission" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Total Fee (₹)</Label>
                            <Input
                                type="number"
                                value={totalFee}
                                onChange={(e) => setTotalFee(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
