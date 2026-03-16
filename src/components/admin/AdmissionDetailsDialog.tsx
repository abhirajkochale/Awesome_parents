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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
    ExternalLink, Loader2, Printer, RefreshCw, FileText, User, 
    Users, Calendar, Phone, MapPin, CheckCircle2, AlertTriangle
} from 'lucide-react';
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
    const [fileUrls, setFileUrls] = useState<Record<string, { url: string; printUrl: string; type: 'image' | 'pdf' | 'other'; name: string }>>({});
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
        const urls: Record<string, { url: string; printUrl: string; type: 'image' | 'pdf' | 'other'; name: string }> = {};

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

                if (fileType === 'image') {
                    const base64 = await fetchImageAsBase64(directUrl);
                    urls[key] = { url: directUrl, printUrl: base64 || directUrl, type: 'image', name: key };
                } else {
                    urls[key] = { url: directUrl, printUrl: directUrl, type: fileType, name: key };
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

    const InfoBlock = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) => (
        <div className="flex flex-col space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-100/50 hover:bg-slate-100 transition-colors">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 line-clamp-1">
                {Icon && <Icon className="w-3 h-3 text-slate-300" />} {label}
            </span>
            <span className="text-sm font-semibold text-slate-800 break-words">{value || '-'}</span>
        </div>
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

    const statusMap = {
        approved: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        rejected: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: null },
        submitted: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Loader2 },
    };
    const statusConfig = statusMap[admission.status as keyof typeof statusMap] || { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
    const StatusIcon = statusConfig.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* The CRITICAL fix: Explicit max-width overrides that trump Shadcn default 'sm:max-w-lg' */}
            <DialogContent className="max-w-[95vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-6xl w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100 sm:rounded-2xl">
                
                {/* Header Section */}
                <DialogHeader className="px-6 py-4 border-b shrink-0 bg-white z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                            <span className="text-lg font-black uppercase text-indigo-600">{student.full_name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight truncate">{student.full_name}</DialogTitle>
                            <DialogDescription className="text-xs font-semibold text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200 uppercase font-mono tracking-widest">
                                    {admission.id.slice(0, 8)}
                                </span>
                                <span>•</span>
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{student.academic_year}</span>
                                <span>•</span>
                                <span>Class: <strong className="uppercase">{student.class}</strong></span>
                            </DialogDescription>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center self-start sm:self-auto shrink-0">
                        <Badge variant="outline" className={`px-3 py-1 text-[10px] font-extrabold border uppercase tracking-widest rounded-full ${statusConfig.color}`}>
                            {StatusIcon && <StatusIcon className="w-3.5 h-3.5 mr-1 inline-block" />}
                            {admission.status}
                        </Badge>
                        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                        <Button variant="outline" size="sm" onClick={loadFileUrls} className="h-8 gap-2 bg-white hidden sm:flex" title="Refresh Documents">
                            <RefreshCw className={`h-3.5 w-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
                            Reload
                        </Button>
                        <Button onClick={() => handlePrint()} variant="default" size="sm" className="h-8 gap-2 font-bold px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full" disabled={loadingFiles}>
                            {loadingFiles ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                            PDF Print Form
                        </Button>
                    </div>
                </DialogHeader>

                {/* Main Content Area - Single Scrollable View */}
                <ScrollArea className="flex-1 overflow-y-auto w-full">
                    <div className="p-4 md:p-6 lg:p-8 max-w-full">
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                            
                            {/* LEFT COLUMN: Student & Parent Info (Takes up 8/12 on large screens) */}
                            <div className="lg:col-span-8 flex flex-col gap-6">
                                
                                {/* Admission Details Summary Bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Applied</span>
                                        <span className="text-sm font-bold text-slate-800">{format(new Date(admission.admission_date), 'MMM do, yyyy')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Estimated Fees</span>
                                        <span className="text-sm font-black text-indigo-700">₹{admission.total_fee.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DOB</span>
                                        <span className="text-sm font-bold text-slate-800">{format(new Date(student.date_of_birth), 'dd / MM / yyyy')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</span>
                                        <span className="text-sm font-bold text-slate-800 capitalize">{student.gender}</span>
                                    </div>
                                </div>

                                {/* Student Details Card */}
                                <Card className="border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b bg-slate-50 border-slate-100 flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-500" />
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Student Profile</h3>
                                    </div>
                                    <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <InfoBlock label="Religion" value={student.religion || '-'} />
                                        <InfoBlock label="Caste / Category" value={student.caste || '-'} />
                                        <InfoBlock label="Languages" value={student.language_known || '-'} />
                                        
                                        <div className="sm:col-span-2 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                            <InfoBlock icon={MapPin} label="Residential Address" value={student.residential_address || '-'} />
                                            <InfoBlock icon={MapPin} label="Correspondence Address" value={student.correspondence_address || '-'} />
                                        </div>
                                        
                                        <div className="sm:col-span-2 md:col-span-3 mt-2">
                                            <InfoBlock label="Previous School Attended" value={student.previous_school || 'None'} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Parents & Emergency Details Card */}
                                <Card className="border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b bg-slate-50 border-slate-100 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-slate-500" />
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Parents & Emergency Info</h3>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100">
                                            {/* Father */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 border-b pb-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"/>Father's Details</h4>
                                                <InfoBlock icon={Phone} label="Contact" value={student.father_phone} />
                                                <InfoBlock label="Email" value={student.father_email || '-'} />
                                            </div>
                                            {/* Mother */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 border-b pb-1"><div className="w-1.5 h-1.5 bg-pink-400 rounded-full"/>Mother's Details</h4>
                                                <InfoBlock icon={Phone} label="Contact" value={student.mother_phone} />
                                                <InfoBlock label="Email" value={student.mother_email || '-'} />
                                            </div>
                                        </div>
                                        
                                        <div className="bg-amber-50/50 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="sm:col-span-3 flex justify-between items-center mb-1">
                                                <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"/>Emergency Contact</h4>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase">Primary WA: {student.preferred_whatsapp}</span>
                                            </div>
                                            <InfoBlock label="Name" value={student.emergency_contact_name} />
                                            <InfoBlock icon={Phone} label="Phone" value={student.emergency_contact_phone} />
                                            <InfoBlock label="Relation" value={student.emergency_contact_relationship} />
                                        </div>
                                    </CardContent>
                                </Card>

                            </div>


                            {/* RIGHT COLUMN: Quick Vis Alerts & Documents (Takes up 4/12 on large screens) */}
                            <div className="lg:col-span-4 flex flex-col gap-6">

                                {/* Much Smaller Health Alerts Card */}
                                {(student.medical_conditions || student.allergies) && (
                                    <div className="border border-rose-200 bg-rose-50/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-rose-100 text-rose-600 rounded-md shrink-0 mt-0.5">
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-widest mb-2">Health Alerts</h3>
                                                {student.allergies && (
                                                    <div className="mb-2">
                                                        <span className="text-[10px] font-bold text-rose-700/70 uppercase">Allergies:</span>
                                                        <p className="text-xs font-semibold text-rose-950 mt-0.5">{student.allergies}</p>
                                                    </div>
                                                )}
                                                {student.medical_conditions && (
                                                    <div>
                                                        <span className="text-[10px] font-bold text-rose-700/70 uppercase">Conditions:</span>
                                                        <p className="text-xs font-semibold text-rose-950 mt-0.5">{student.medical_conditions}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Compact Visible Documents Card */}
                                <Card className="border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
                                    <div className="px-5 py-3 border-b bg-slate-900 border-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-300" />
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Required Documents</h3>
                                        </div>
                                        <Badge className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-none text-[10px]">
                                            {Object.keys(fileUrls).length} Files
                                        </Badge>
                                    </div>
                                    <CardContent className="p-4 flex-1 bg-slate-50/50">
                                        {loadingFiles ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                                                <Loader2 className="h-6 w-6 animate-spin mb-3 text-indigo-500" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Loading...</p>
                                            </div>
                                        ) : Object.keys(fileUrls).length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                                {Object.entries(fileUrls).map(([key, file]) => (
                                                    <a
                                                        key={key}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="group flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 pr-3">
                                                            <div className="p-2 rounded bg-indigo-50 text-indigo-600 shrink-0">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex flex-col overflow-hidden">
                                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide truncate group-hover:text-indigo-700 transition-colors">
                                                                    {key.replace(/_/g, ' ')}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{file.type}</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-indigo-100 shrink-0 transition-colors">
                                                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-200 rounded-xl bg-white">
                                                <FileText className="h-8 w-8 text-slate-300 mb-2" />
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Documents Found</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                            </div>

                        </div>
                    </div>
                </ScrollArea>
                

                {/* Print View (Hidden in Screen View) */}
                <div className="hidden print:block">
                    {/* ... (Print view remains perfectly unchanged for consistent printing) ... */}
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
                        <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-2">
                            <div className="flex items-center gap-6">
                                <img src="/AwesomeKids_logo.jpeg" alt="Logo" className="h-16 object-contain" />
                                <div>
                                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest leading-relaxed">
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

                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold uppercase tracking-[0.2em] border-2 border-black inline-block px-10 py-1">Admission Form</h2>
                        </div>

                        {/* Photo Grid */}
                        <div className="flex justify-around mb-4">
                            {['Father', 'Mother', 'Child'].map(role => {
                                const key = `${role.toLowerCase()}_photo`;
                                const url = fileUrls[key]?.printUrl;
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
                        <div className="mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black/10 pb-1">Information of child</h3>

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

                            <PrintField label="Languages Known" value={student.language_known || '-'} fullWidth />

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

                        {/* Page 2: Signatures & History */}
                        <div className="pt-2 border-t-2 border-dashed border-black/30 mt-4">
                            <div className="grid grid-cols-2 gap-10">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black/10 pb-1">Emergency & History</h3>
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
                                <div className="flex flex-col justify-between pt-2">
                                    <div className="text-center">
                                        <div className="h-12 border-b border-black mb-1 flex items-end justify-center">
                                            {fileUrls['mother_signature_file']?.printUrl && <img src={fileUrls['mother_signature_file'].printUrl} className="max-h-full" />}
                                        </div>
                                        <p className="text-[8px] font-bold uppercase opacity-50">Mother Signature</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="h-12 border-b border-black mb-1 flex items-end justify-center">
                                            {fileUrls['father_signature_file']?.printUrl && <img src={fileUrls['father_signature_file'].printUrl} className="max-h-full" />}
                                        </div>
                                        <p className="text-[8px] font-bold uppercase opacity-50">Father Signature</p>
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
