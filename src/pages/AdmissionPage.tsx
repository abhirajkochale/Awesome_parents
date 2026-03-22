import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { admissionApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, CheckCircle, ChevronRight, ChevronLeft, FileText, User, Users, ClipboardCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLoader } from '@/components/common/BrandLoader';

// Fee structure
const FEE_STRUCTURE: Record<string, number> = {
  playgroup: 20000,
  nursery: 25000,
  lkg: 30000,
  ukg: 35000,
};

const formSchema = z.object({
  // Step 1: Student
  academic_year: z.string().min(1, 'Academic year is required'),
  student_first_name: z.string().min(1, 'First name is required'),
  student_middle_name: z.string(),
  student_last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  class: z.string().min(1, 'Class is required'),
  language_known: z.string().optional(),
  residential_address: z.string().min(5, 'Residential address is required'),
  correspondence_address: z.string().min(5, 'Correspondence address is required'),
  religion: z.string(),
  caste: z.string(),
  medical_conditions: z.string(),
  allergies: z.string(),
  previous_school: z.string(),

  // Step 2: Parents & Emergency
  father_phone: z.string().min(10, 'Valid phone number is required'),
  father_email: z.string().email().optional().or(z.literal('')),
  mother_phone: z.string().min(10, 'Valid phone number is required'),
  mother_email: z.string().email().optional().or(z.literal('')),
  preferred_whatsapp: z.string().min(10, 'Valid phone number is required'),
  emergency_contact_number: z.string().min(10, 'Valid phone number is required'),
  emergency_contact_name: z.string().min(2, 'Contact name is required'),
  emergency_contact_relationship: z.string().min(1, 'Relationship is required'),

  // Step 3 & 4 Handled outside Zod (files/signatures)
  signatures_confirmed: z.boolean(),
});

type AdmissionFormValues = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, title: 'Child Info', icon: User, description: 'Basic details' },
  { id: 2, title: 'Parents & Emergency', icon: Users, description: 'Contact info' },
  { id: 3, title: 'Documents', icon: FileText, description: 'Upload limits' },
  { id: 4, title: 'Review & Sign', icon: ClipboardCheck, description: 'Declarations' }
];

export default function AdmissionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    father_photo: null,
    mother_photo: null,
    child_photo: null,
    birth_certificate_file: null,
    aadhaar_card_file: null,
    mother_signature_file: null,
    father_signature_file: null,
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      academic_year: '2026-2027',
      student_first_name: '',
      student_middle_name: '',
      student_last_name: '',
      date_of_birth: '',
      gender: '',
      class: '',
      language_known: '',
      residential_address: '',
      correspondence_address: '',
      religion: '',
      caste: '',
      medical_conditions: '',
      allergies: '',
      previous_school: '',
      father_phone: '',
      father_email: '',
      mother_phone: '',
      mother_email: '',
      preferred_whatsapp: '',
      emergency_contact_number: '',
      emergency_contact_name: '',
      emergency_contact_relationship: '',
      signatures_confirmed: false,
    },
    mode: 'onTouched'
  });

  const selectedClass = form.watch('class');
  const totalFee = useMemo(() => FEE_STRUCTURE[selectedClass] || 0, [selectedClass]);

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof AdmissionFormValues)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['academic_year', 'student_first_name', 'student_last_name', 'date_of_birth', 'gender', 'class', 'residential_address', 'correspondence_address'];
    } else if (step === 2) {
      fieldsToValidate = ['father_phone', 'mother_phone', 'preferred_whatsapp', 'emergency_contact_number', 'emergency_contact_name', 'emergency_contact_relationship'];
    }
    
    // For Step 3 (Uploads), we don't strictly require files in Zod, so we just proceed, although we could add manual checks.
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      return isValid;
    }
    return true;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly before proceeding.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: AdmissionFormValues) => {
    if (currentStep !== STEPS.length) return; // Only submit on last step
    
    if (!data.signatures_confirmed) {
        toast({ title: "Signature Required", description: "You must confirm the signatures to proceed.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const fullName = [data.student_first_name, data.student_middle_name, data.student_last_name].filter(Boolean).join(' ');
      const finalFee = FEE_STRUCTURE[data.class] || 0;
      const fileUploadEntries = Object.entries(uploadedFiles).filter(([, f]) => f) as [string, File][];
      const uploadedUrls: Record<string, string> = {};

      if (fileUploadEntries.length > 0) {
        for (const [key, file] of fileUploadEntries) {
          try {
            const url = await admissionApi.uploadDocument(file, key);
            if (url) uploadedUrls[key] = url;
          } catch (err) {
            console.warn('Failed to upload', key, err);
          }
        }
      }

      await admissionApi.createAdmission({
        student_full_name: fullName,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        class: data.class,
        academic_year: data.academic_year,
        medical_conditions: data.medical_conditions,
        allergies: data.allergies,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_number,
        emergency_contact_relationship: data.emergency_contact_relationship,
        residential_address: data.residential_address,
        correspondence_address: data.correspondence_address,
        religion: data.religion,
        caste: data.caste,
        mother_phone: data.mother_phone,
        mother_email: data.mother_email,
        father_phone: data.father_phone,
        father_email: data.father_email,
        preferred_whatsapp: data.preferred_whatsapp,
        previous_school: data.previous_school,
        language_known: data.language_known,
        total_fee: finalFee,
        uploaded_files: uploadedUrls,
      });

      toast({
        title: 'Admission Submitted Successfully',
        description: `Your application has been submitted. Prepare for the initial payment of ₹${finalFee}.`,
      });

      navigate('/payments');
    } catch (err) {
      setError('Failed to submit admission. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (key: string, file: File | undefined | null) => {
      setUploadedFiles(prev => ({ ...prev, [key]: file || null }));
      if (file) toast({ title: 'File selected', description: file.name });
  };

  const FileUploader = ({ id, label, keyName, accept = "image/*" }: { id: string, label: string, keyName: string, accept?: string }) => (
    <div
      className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl p-8 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200 bg-surface"
      onClick={() => document.getElementById(id)?.click()}
    >
      {uploadedFiles[keyName] ? (
          <>
              <span className="material-symbols-outlined text-4xl text-green-500 mb-3">check_circle</span>
              <p className="text-base font-bold text-green-700 max-w-full truncate px-2">{uploadedFiles[keyName]?.name}</p>
              <p className="text-sm text-on-surface-variant mt-1 font-medium">Click to replace</p>
          </>
      ) : (
          <>
            <span className="material-symbols-outlined text-4xl text-outline mb-3">upload_file</span>
            <p className="text-base font-bold text-slate-700">{label}</p>
            <p className="text-sm text-on-surface-variant mt-1 font-medium">Click to browse & upload</p>
          </>
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFileUpload(keyName, e.target.files?.[0])}
      />
    </div>
  );

  const inputClasses = "w-full bg-surface border-none shadow-none rounded-md px-5 h-[56px] text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/20 font-medium placeholder:text-slate-400";
  const textareaClasses = "w-full bg-surface border-none shadow-none rounded-md px-5 py-4 text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/20 font-medium placeholder:text-slate-400 resize-none h-32";
  const selectTriggerClasses = "w-full bg-surface border-none shadow-none rounded-md px-5 h-[56px] text-slate-900 focus:ring-2 focus:ring-primary/20 font-medium";

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto w-full font-sans">
      
      {/* Horizontal Progress Stepper */}
      <div className="mb-12">
        <div className="flex items-center justify-between relative px-4">
          <div className="absolute top-7 left-0 w-full h-1 bg-surface-container-high -translate-y-1/2 -z-10 rounded-full shrink-0"></div>
          <motion.div 
            className="absolute top-7 left-0 h-1 bg-primary-container -translate-y-1/2 -z-10 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          ></motion.div>

          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            let iconText = "";
            if (step.id === 1) iconText = "child_care";
            if (step.id === 2) iconText = "family_restroom";
            if (step.id === 3) iconText = "description";
            if (step.id === 4) iconText = "verified";

            let bgClass = "bg-white text-slate-400 border-4 border-surface-container-high";
            if (isCurrent || isCompleted) bgClass = "bg-primary-container text-white shadow-lg shadow-blue-200 border-none";

            return (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ring-8 ring-[#f8f9fa] transition-all duration-300 ${bgClass} shrink-0`}>
                  <span className="material-symbols-outlined text-2xl">{iconText}</span>
                </div>
                <span className={`text-sm font-bold hidden md:block ${isCurrent || isCompleted ? 'text-primary' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8 rounded-xl border-none font-medium">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <section className="bg-surface-container-lowest rounded-2xl p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/50">
                  <header className="flex flex-col md:flex-row md:items-center gap-6 mb-10 pb-8 border-b border-surface-container-low">
                    <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-4xl">face_6</span>
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-['Plus_Jakarta_Sans'] font-bold text-slate-900 leading-tight">Child Information</h2>
                      <p className="text-on-surface-variant font-medium mt-1">Enter the core details of the student seeking admission.</p>
                    </div>
                  </header>
                  
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6 lg:gap-8">
                    <FormField control={form.control} name="academic_year" render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Academic Year *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className={selectTriggerClasses}><SelectValue placeholder="Select Year"/></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="2025-2026">2025-2026</SelectItem><SelectItem value="2026-2027">2026-2027</SelectItem><SelectItem value="2027-2028">2027-2028</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="class" render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Class *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className={selectTriggerClasses}><SelectValue placeholder="Select class"/></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="playgroup">Playgroup - ₹20,000</SelectItem><SelectItem value="nursery">Nursery - ₹25,000</SelectItem><SelectItem value="lkg">L.K.G. - ₹30,000</SelectItem><SelectItem value="ukg">U.K.G. - ₹35,000</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="student_first_name" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">First Name *</FormLabel>
                        <FormControl><Input className={inputClasses} placeholder="e.g. Advik" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="student_middle_name" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Middle Name</FormLabel>
                        <FormControl><Input className={inputClasses} placeholder="Father's name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="student_last_name" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Last Name *</FormLabel>
                        <FormControl><Input className={inputClasses} placeholder="Surname" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Date of Birth *</FormLabel>
                        <FormControl><Input type="date" className={inputClasses} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Gender *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className={selectTriggerClasses}><SelectValue placeholder="Select gender"/></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="religion" render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Religion</FormLabel>
                        <FormControl><Input className={inputClasses} placeholder="e.g. Hinduism" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="caste" render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Caste</FormLabel>
                        <FormControl><Input className={inputClasses} placeholder="e.g. General" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="language_known" render={({ field }) => (
                      <FormItem className="md:col-span-6">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Mother Tongue / Languages Known</FormLabel>
                        <FormControl><Input className={inputClasses} placeholder="e.g. English, Hindi" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="residential_address" render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Residential Address *</FormLabel>
                        <FormControl><Textarea className={textareaClasses} placeholder="Full residential address" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="correspondence_address" render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel className="text-sm font-bold text-slate-700 px-1">Correspondence Address *</FormLabel>
                        <FormControl><Textarea className={textareaClasses} placeholder="If same as above, type 'Same'" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                  </div>
                </section>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <section className="bg-surface-container-lowest rounded-2xl p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/50">
                  <header className="flex flex-col md:flex-row md:items-center gap-6 mb-10 pb-8 border-b border-surface-container-low">
                    <div className="w-16 h-16 rounded-2xl bg-secondary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary text-4xl">diversity_3</span>
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-['Plus_Jakarta_Sans'] font-bold text-slate-900 leading-tight">Parents & Emergency Contact</h2>
                      <p className="text-on-surface-variant font-medium mt-1">Provide contact details for parents and an emergency contact.</p>
                    </div>
                  </header>
                  
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6 lg:gap-8">
                    
                    {/* Father */}
                    <div className="md:col-span-3 space-y-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-3 pb-2">
                          <span className="material-symbols-outlined text-primary text-2xl">man</span> Father's Details
                        </h3>
                        <FormField control={form.control} name="father_phone" render={({ field }) => (
                            <FormItem><FormLabel className="text-sm font-bold text-slate-700 px-1">Phone Number *</FormLabel><FormControl><Input className={inputClasses} placeholder="e.g. 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="father_email" render={({ field }) => (
                            <FormItem><FormLabel className="text-sm font-bold text-slate-700 px-1">Email Address</FormLabel><FormControl><Input type="email" className={inputClasses} placeholder="father@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    
                    {/* Mother */}
                    <div className="md:col-span-3 space-y-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-3 pb-2">
                          <span className="material-symbols-outlined text-secondary text-2xl">woman</span> Mother's Details
                        </h3>
                        <FormField control={form.control} name="mother_phone" render={({ field }) => (
                            <FormItem><FormLabel className="text-sm font-bold text-slate-700 px-1">Phone Number *</FormLabel><FormControl><Input className={inputClasses} placeholder="e.g. 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="mother_email" render={({ field }) => (
                            <FormItem><FormLabel className="text-sm font-bold text-slate-700 px-1">Email Address</FormLabel><FormControl><Input type="email" className={inputClasses} placeholder="mother@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <div className="md:col-span-6 p-6 md:p-8 rounded-2xl bg-green-50 mt-4 border border-green-100 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                        <div className="shrink-0 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center shrink-0">
                               <span className="material-symbols-outlined text-green-700">chat</span>
                           </div>
                           <div>
                             <h4 className="font-bold text-green-900 text-lg">Primary Comms</h4>
                             <p className="text-sm font-medium text-green-800 mt-1">Updates sent here</p>
                           </div>
                        </div>
                        <div className="flex-1 w-full">
                          <FormField control={form.control} name="preferred_whatsapp" render={({ field }) => (
                              <FormItem>
                                  <FormControl>
                                      <Input className="w-full h-[64px] bg-white border-2 border-green-200 shadow-sm rounded-xl px-6 text-slate-900 focus-visible:ring-4 focus-visible:ring-green-500/30 font-bold text-lg placeholder:text-slate-400 placeholder:font-medium" placeholder="WhatsApp Number *" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )} />
                        </div>
                    </div>

                    <div className="md:col-span-6 p-6 lg:p-10 rounded-2xl bg-surface-container mt-6">
                        <h3 className="font-bold text-xl text-slate-900 mb-8 flex items-center gap-3">
                          <span className="material-symbols-outlined text-tertiary-container text-3xl">emergency</span> Emergency Contact
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm font-bold text-slate-700 px-1">Contact Name *</FormLabel><FormControl><Input className="w-full h-[56px] bg-white border-none shadow-sm rounded-md px-5 text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/20 font-medium" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="emergency_contact_relationship" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm font-bold text-slate-700 px-1">Relationship *</FormLabel><FormControl><Input className="w-full h-[56px] bg-white border-none shadow-sm rounded-md px-5 text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/20 font-medium" placeholder="e.g. Uncle" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="emergency_contact_number" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm font-bold text-slate-700 px-1">Contact Number *</FormLabel><FormControl><Input className="w-full h-[56px] bg-white border-none shadow-sm rounded-md px-5 text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/20 font-medium" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>

                    <FormField control={form.control} name="medical_conditions" render={({ field }) => (
                        <FormItem className="md:col-span-3 mt-4"><FormLabel className="text-sm font-bold text-slate-700 px-1">Medical Conditions</FormLabel><FormControl><Textarea className={textareaClasses} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="md:col-span-3 space-y-6 mt-4">
                        <FormField control={form.control} name="allergies" render={({ field }) => (
                            <FormItem><FormLabel className="text-sm font-bold text-slate-700 px-1">Allergies</FormLabel><FormControl><Input className={inputClasses} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="previous_school" render={({ field }) => (
                            <FormItem><FormLabel className="text-sm font-bold text-slate-700 px-1">Previous School (if any)</FormLabel><FormControl><Input className={inputClasses} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                  </div>
                </section>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <section className="bg-surface-container-lowest rounded-2xl p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/50">
                  <header className="flex flex-col md:flex-row md:items-center gap-6 mb-10 pb-8 border-b border-surface-container-low">
                    <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-tertiary text-4xl">folder_open</span>
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-['Plus_Jakarta_Sans'] font-bold text-slate-900 leading-tight">Key Documents</h2>
                      <p className="text-on-surface-variant font-medium mt-1">Upload photographs and required official documentation.</p>
                    </div>
                  </header>
                  
                  <div className="space-y-12">
                    <div>
                        <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">Photographs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FileUploader id="child-photo" label="Child's Photo" keyName="child_photo" />
                            <FileUploader id="father-photo" label="Father's Photo" keyName="father_photo" />
                            <FileUploader id="mother-photo" label="Mother's Photo" keyName="mother_photo" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">Official Documents</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <FileUploader id="birth-cert" label="Birth Certificate Document" keyName="birth_certificate_file" accept=".pdf,.jpg,.jpeg,.png" />
                            <FileUploader id="aadhaar" label="Aadhaar Card Document" keyName="aadhaar_card_file" accept=".pdf,.jpg,.jpeg,.png" />
                        </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <section className="bg-surface-container-lowest rounded-2xl p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/50">
                  <header className="flex flex-col md:flex-row md:items-center gap-6 mb-10 pb-8 border-b border-surface-container-low">
                    <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-green-700 text-4xl">verified</span>
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-['Plus_Jakarta_Sans'] font-bold text-slate-900 leading-tight">Review & Signatures</h2>
                      <p className="text-on-surface-variant font-medium mt-1">Provide digital signatures and finalize the application.</p>
                    </div>
                  </header>
                  
                  <div className="space-y-10">
                    <div className="bg-surface p-8 rounded-2xl text-sm text-slate-600 leading-relaxed font-medium">
                        <p className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-tertiary-container text-xl">gavel</span> Declaration
                        </p>
                        I hereby certify that the information given in the admission form is complete and accurate. I understand and
                        agree this misrepresentation or omission of facts will justify the denial of admission, the cancellation of
                        admission or expulsion. I have read and do hereby accede to all terms and conditions enclosed with the
                        registration form.
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-6 text-slate-900">Digital Signatures</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <FileUploader id="father-sig" label="Father's Signature Image" keyName="father_signature_file" accept="image/*,.pdf" />
                            <FileUploader id="mother-sig" label="Mother's Signature Image" keyName="mother_signature_file" accept="image/*,.pdf" />
                        </div>
                    </div>

                    <div className="pt-4">
                        <FormField control={form.control} name="signatures_confirmed" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-4 space-y-0 p-6 md:p-8 border-2 border-primary/20 rounded-2xl bg-primary-fixed/20 cursor-pointer transition-all hover:bg-primary-fixed/30">
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        id="signatures-confirm"
                                        className="h-6 w-6 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                </FormControl>
                                <label htmlFor="signatures-confirm" className="text-base md:text-lg font-bold text-primary cursor-pointer select-none">
                                    I confirm that the digital signatures are valid and authorized by the respective guardians
                                </label>
                            </FormItem>
                        )} />
                    </div>

                    {selectedClass && (
                        <div className="bg-gradient-to-br from-primary-container to-primary border border-primary rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-blue-200">
                            <div>
                                <h4 className="font-bold text-2xl text-white">Total Annual Fees</h4>
                                <p className="text-sm font-medium text-white/80 uppercase tracking-widest mt-1">For {selectedClass}</p>
                            </div>
                            <div className="text-5xl font-black text-white font-['Plus_Jakarta_Sans']">
                                ₹{totalFee.toLocaleString('en-IN')}
                            </div>
                        </div>
                    )}

                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Actions */}
          <div className="mt-12 flex flex-col-reverse sm:flex-row items-center justify-between pt-8 border-t border-surface-container-high gap-6">
             {currentStep > 1 ? (
               <button 
                 type="button" 
                 onClick={prevStep}
                 disabled={isSubmitting}
                 className="flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-slate-600 hover:bg-surface-container-high transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto"
               >
                 <span className="material-symbols-outlined text-slate-500">arrow_back</span>
                 <span className="text-lg">Go Back</span>
               </button>
             ) : (
                 <div className="hidden sm:block"></div>
             )}

            {currentStep < STEPS.length ? (
              <button 
                type="button" 
                onClick={nextStep} 
                className="bg-primary text-white px-10 py-5 rounded-full font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting || !totalFee || !form.getValues('signatures_confirmed')}
                className="bg-secondary text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-pink-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 w-full sm:w-auto"
              >
                {isSubmitting ? <BrandLoader text="" /> : <span className="material-symbols-outlined">task_alt</span>}
                <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
              </button>
            )}
          </div>
          
          {/* Helpful Tip Bento (Small) */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-secondary-fixed/50 rounded-2xl p-6 flex gap-4 items-start border border-secondary-fixed">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-white">lightbulb</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Tip for parents</h4>
                <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">Ensure the name matches the birth certificate exactly to avoid verification delays.</p>
              </div>
            </div>
            <div className="bg-tertiary-fixed/50 rounded-2xl p-6 flex gap-4 items-start border border-tertiary-fixed">
              <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-white">support_agent</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Need Help?</h4>
                <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">Our admission counselors are available Mon-Sat, 9AM to 4PM for guidance.</p>
              </div>
            </div>
          </div>

        </form>
      </Form>
    </div>
  );
}
