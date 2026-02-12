import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Loader2, Printer, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { AdmissionWithStudent } from '@/types';
import { supabase } from '@/db/supabase';

interface AdmissionDetailsDialogProps {
    admission: AdmissionWithStudent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AdmissionDetailsDialog({
    admission,
    open,
    onOpenChange,
}: AdmissionDetailsDialogProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [fileUrls, setFileUrls] = useState<Record<string, { url: string; type: 'image' | 'pdf' | 'other'; name: string }>>({});
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Admission_${admission?.student?.full_name || 'Form'}_${new Date().getFullYear()}`,
        onBeforeGetContent: async () => {
            if (Object.keys(fileUrls).length > 0 && !imagesLoaded) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } as any);

    useEffect(() => {
        if (open && admission?.uploaded_files) {
            loadFileUrls();
        } else {
            setFileUrls({});
            setImagesLoaded(false);
        }
    }, [open, admission]);

    const loadFileUrls = async () => {
        if (!admission?.uploaded_files) return;
        setLoadingFiles(true);
        setImagesLoaded(false);
        const urls: Record<string, { url: string; type: 'image' | 'pdf' | 'other'; name: string }> = {};

        const getFileType = (path: string): 'image' | 'pdf' | 'other' => {
            const lower = path.toLowerCase();
            if (lower.endsWith('.pdf')) return 'pdf';
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => lower.endsWith(ext))) return 'image';
            return 'other';
        };

        const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                console.error("Failed to fetch image for base64:", err);
                return null;
            }
        };

        const promises = Object.entries(admission.uploaded_files).map(async ([key, path]) => {
            if (typeof path === 'string') {
                let directUrl = path;
                if (!path.startsWith('http')) {
                    const { data, error } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(path, 3600);
                    if (data?.signedUrl) {
                        directUrl = data.signedUrl;
                    } else {
                        console.error('Failed to sign URL for', key, error);
                        return;
                    }
                }

                const fileType = getFileType(path);

                // For images, convert to Base64 to avoid CORS/Print issues
                if (fileType === 'image') {
                    const base64 = await fetchImageAsBase64(directUrl);
                    if (base64) {
                        urls[key] = { url: base64, type: 'image', name: key };
                    } else {
                        // Fallback to direct URL if fetch fails
                        urls[key] = { url: directUrl, type: 'image', name: key };
                    }
                } else {
                    urls[key] = { url: directUrl, type: fileType, name: key };
                }
            }
        });

        await Promise.all(promises);
        setFileUrls(urls);
        setImagesLoaded(true);
        setLoadingFiles(false);
    };

    if (!admission || !admission.student) return null;

    const { student } = admission;

    const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="grid grid-cols-3 gap-4 py-2 border-b last:border-0 text-sm">
            <span className="font-medium text-muted-foreground col-span-1">{label}</span>
            <span className="col-span-2 break-words">{value || '-'}</span>
        </div>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <h3 className="font-semibold text-lg text-primary mt-8 mb-4 flex items-center gap-2 border-b pb-2">
            {title}
        </h3>
    );

    // Print Components
    const PrintField = ({ label, value, fullWidth = false, className = "" }: { label: string, value: any, fullWidth?: boolean, className?: string }) => (
        <div className={`mb-3 ${fullWidth ? 'w-full' : ''} ${className}`}>
            <span className="block font-bold text-[9px] uppercase text-gray-500 mb-0.5 tracking-wider">{label}</span>
            <div className="border border-gray-100 rounded px-3 py-1.5 min-h-[30px] font-bold text-black text-[11px] leading-tight flex items-center">
                {value || '-'}
            </div>
        </div>
    );

    const PrintCheckbox = ({ label, checked }: { label: string, checked?: boolean }) => (
        <div className="flex items-center gap-2 mr-6 mb-2">
            <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center rounded-sm ${checked ? 'bg-black text-white' : 'bg-white'}`}>
                {checked && <span className="text-[9px] font-bold">✓</span>}
            </div>
            <span className={`font-bold text-[10px] uppercase tracking-tight ${checked ? 'text-black' : 'text-gray-400'}`}>{label}</span>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-3 border-b shrink-0 bg-background z-10">
                    <div className="flex items-center justify-between mr-8">
                        <div>
                            <DialogTitle className="text-xl">Admission Details</DialogTitle>
                            <DialogDescription>Full application for {student.full_name}</DialogDescription>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Badge variant={admission.status === 'approved' ? 'default' : admission.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {admission.status.toUpperCase()}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={loadFileUrls} title="Reload Images" className="h-8">
                                <RefreshCw className={`h-3 w-3 ${loadingFiles ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button onClick={() => handlePrint()} variant="default" size="sm" className="gap-2 h-8" disabled={loadingFiles}>
                                {loadingFiles ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                                Download / Print Form
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    {/* Screen View */}
                    <div className="p-6 max-w-4xl mx-auto bg-white min-h-screen">
                        <div className="text-center border-b pb-4 mb-4">
                            <h1 className="text-2xl font-bold uppercase tracking-wider">Admission Record</h1>
                            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase font-bold">
                                <span>Ref: {admission.id.slice(0, 8)}</span>
                                <span>Date: {format(new Date(admission.created_at), 'PPP')}</span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
                            <div>
                                <SectionHeader title="Student Details" />
                                <div className="grid gap-1">
                                    <InfoRow label="Full Name" value={student.full_name} />
                                    <InfoRow label="DOB" value={format(new Date(student.date_of_birth), 'PPP')} />
                                    <InfoRow label="Gender" value={student.gender} />
                                    <InfoRow label="Class" value={student.class} />
                                </div>
                            </div>
                            <div>
                                <SectionHeader title="Emergency" />
                                <div className="grid gap-1">
                                    <InfoRow label="Name" value={student.emergency_contact_name} />
                                    <InfoRow label="Phone" value={student.emergency_contact_phone} />
                                    <InfoRow label="Relation" value={student.emergency_contact_relationship} />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <SectionHeader title="Application Documents" />
                                {loadingFiles ? (
                                    <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {Object.entries(fileUrls).map(([key, file]) => (
                                            <div key={key} className="border p-2 rounded-lg flex items-center justify-between bg-gray-50/50 hover:bg-gray-100 transition-colors">
                                                <span className="font-bold text-[10px] uppercase text-gray-500">{key.replace(/_/g, ' ')}</span>
                                                <a href={file.url} target="_blank" rel="noreferrer" className="text-primary p-1 hover:bg-primary/10 rounded">
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Print View */}
                <div className="hidden print:block">
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4; margin: 15mm; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: sans-serif; color: #000; }
                            .print-container { line-height: 1.4; }
                            h3 { page-break-after: avoid; }
                            table { width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #000; }
                            th { background: #eee; color: #000; font-weight: bold; text-transform: uppercase; font-size: 9px; padding: 8px; border: 1px solid #000; }
                            td { padding: 8px; border: 1px solid #000; font-size: 11px; font-weight: bold; color: #000; }
                        `}
                    </style>
                    <div ref={printRef} className="print-container p-4 max-w-[210mm] mx-auto text-black bg-white">

                        {/* Minimalist Header */}
                        <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
                            <div className="flex items-center gap-6">
                                <img src="/AwesomeKids_logo.jpeg" alt="Logo" className="h-20 object-contain grayscale" />
                                <div>
                                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest leading-loose">
                                        Shop 1 & 2, Krishna Apt. CHS. Plot No.-18, Sector No.- 8,<br />
                                        Kamothe, Navi Mumbai. Mob. : 8108129532/31, 8355887929
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold uppercase mb-1">Admission Date</p>
                                <p className="text-sm font-bold border-b border-black inline-block">{format(new Date(admission.admission_date), 'dd / MM / yyyy')}</p>
                                <p className="text-[8px] font-mono mt-3 opacity-50 uppercase tracking-widest font-bold">ID: {admission.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold uppercase tracking-[0.2em] border-2 border-black inline-block px-10 py-1">Admission Form</h2>
                        </div>

                        {/* Photo Grid */}
                        <div className="flex justify-around mb-8">
                            {['Father', 'Mother', 'Child'].map(role => {
                                const key = `${role.toLowerCase()}_photo`;
                                const url = fileUrls[key]?.url;
                                return (
                                    <div key={role} className="flex flex-col items-center">
                                        <div className="w-24 h-28 border border-black flex items-center justify-center relative p-0.5">
                                            {url ? (
                                                <img src={url} alt={role} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[8px] font-bold uppercase opacity-30 text-center px-1">{role}'s Photo</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                        {/* Section 1: Information of Child */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-black/10 pb-1">Information of child</h3>

                            <PrintField label="Full Name of the Student" value={student.full_name?.toUpperCase()} fullWidth />

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <span className="block font-bold text-[9px] uppercase text-gray-400 mb-1.5 tracking-wider">Gender</span>
                                    <div className="flex gap-4">
                                        <PrintCheckbox label="Male" checked={student.gender.toLowerCase() === 'male'} />
                                        <PrintCheckbox label="Female" checked={student.gender.toLowerCase() === 'female'} />
                                    </div>
                                </div>
                                <PrintField label="Date of Birth" value={format(new Date(student.date_of_birth), 'dd / MM / yyyy')} />
                                <div className="col-span-1">
                                    <span className="block font-bold text-[9px] uppercase text-gray-400 mb-1.5 tracking-wider">Class Sought</span>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                        {['Playgroup', 'Nursery', 'L.K.G.', 'U.K.G.'].map(c => (
                                            <PrintCheckbox key={c} label={c} checked={student.class.replace(/\./g, '').toLowerCase() === c.replace(/\./g, '').toLowerCase()} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <PrintField label="Languages Known" value={student.language_known || 'English, Hindi, Marathi'} fullWidth />

                            <div className="grid grid-cols-2 gap-4">
                                <PrintField label="Residential Address" value={student.residential_address} className="col-span-1" />
                                <PrintField label="Correspondence Address" value={student.correspondence_address} className="col-span-1" />
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <PrintField label="Religion" value={student.religion} />
                                <PrintField label="Caste / Category" value={student.caste} />
                                <PrintField label="Mother's Contact" value={student.mother_phone} />
                                <PrintField label="Father's Contact" value={student.father_phone} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <PrintField label="Mother's Email" value={student.mother_email} />
                                <PrintField label="Father's Email" value={student.father_email} />
                                <PrintField label="Primary WhatsApp" value={student.preferred_whatsapp} />
                            </div>
                        </div>

                        {/* Page 2: Signatures & Office Use */}
                        <div style={{ pageBreakBefore: 'always' }} className="pt-10">
                            <div className="grid grid-cols-2 gap-10">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-black/10 pb-1">Emergency & History</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-[9px] font-bold uppercase opacity-50">Last School Attended</span>
                                            <span className="text-[11px] font-bold uppercase">{student.previous_school || 'NONE'}</span>
                                        </div>
                                        <div className="border border-black p-3">
                                            <p className="text-[9px] font-bold uppercase mb-2 opacity-50">Emergency Contact</p>
                                            <p className="text-sm font-bold">{student.emergency_contact_phone}</p>
                                            <p className="text-[10px] font-bold uppercase">{student.emergency_contact_name} ({student.emergency_contact_relationship})</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between pt-6">
                                    <div className="text-center">
                                        <div className="h-14 border-b border-black mb-1 flex items-end justify-center">
                                            {fileUrls['mother_signature_file']?.url && <img src={fileUrls['mother_signature_file'].url} className="max-h-full" />}
                                        </div>
                                        <p className="text-[8px] font-bold uppercase opacity-50">Mother Signature</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="h-14 border-b border-black mb-1 flex items-end justify-center">
                                            {fileUrls['father_signature_file']?.url && <img src={fileUrls['father_signature_file'].url} className="max-h-full" />}
                                        </div>
                                        <p className="text-[8px] font-bold uppercase opacity-50">Father Signature</p>
                                    </div>
                                </div>
                            </div>

                            {/* Minimalist Office Block */}
                            <div className="mt-10 border-2 border-black p-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-center underline">FOR OFFICE USE ONLY</h3>
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b border-black pb-1">
                                            <span className="text-[9px] font-bold">ADMISSION NO.</span>
                                            <span className="text-sm font-bold tracking-widest">{admission.id.slice(0, 8).toUpperCase()}</span>
                                        </div>
                                        <div className="space-y-2 pt-2">
                                            <p className="text-[8px] font-bold opacity-50 mb-2">DOCUMENTS VERIFIED:</p>
                                            <div className="grid grid-cols-1 gap-1">
                                                {['Birth Certificate', 'Aadhaar Card'].map(doc => {
                                                    const uploaded = !!admission.uploaded_files?.[doc.toLowerCase().replace(' ', '_')];
                                                    return (
                                                        <div key={doc} className="flex items-center gap-2">
                                                            <div className="w-3 h-3 border border-black flex items-center justify-center text-[8px] font-bold">
                                                                {uploaded ? 'X' : ''}
                                                            </div>
                                                            <span className="text-[8px] font-bold uppercase">{doc}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-between items-center text-center">
                                        <div className="w-full h-16 border border-dashed border-black/30 flex items-center justify-center text-[8px] font-bold opacity-20 italic">
                                            OFFICIAL SEAL
                                        </div>
                                        <div className="w-[80%] border-t border-black pt-1">
                                            <p className="text-[9px] font-bold uppercase tracking-widest">Coordinator Signature</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
