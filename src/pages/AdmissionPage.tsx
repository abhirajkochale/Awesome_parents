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
  language_known: z.string(),
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
      setUploadedFiles(prev => ({ ...prev, [key]: file }));
      if (file) toast({ title: 'File selected', description: file.name });
  };

  const FileUploader = ({ id, label, keyName, accept = "image/*" }: { id: string, label: string, keyName: string, accept?: string }) => (
    <div
      className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200"
      onClick={() => document.getElementById(id)?.click()}
    >
      {uploadedFiles[keyName] ? (
          <>
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm font-medium text-green-700 max-w-full truncate px-2">{uploadedFiles[keyName]?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
          </>
      ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">Click to upload</p>
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-4">
      
      {/* Step Progress Indicator */}
      <div className="relative mb-8">
        <div className="absolute top-5 left-8 right-8 h-1 bg-muted rounded-full">
            <motion.div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            />
        </div>
        
        <div className="relative flex justify-between">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 z-10 w-24">
                <motion.div 
                    animate={{ 
                        backgroundColor: isCompleted || isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                        color: isCompleted || isCurrent ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                        scale: isCurrent ? 1.15 : 1
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 border-background"
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <div className="text-center">
                    <p className={`text-xs font-semibold ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Card className="shadow-md border-border/50 overflow-hidden">
                  <div className="bg-primary/5 border-b p-6">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <User className="h-6 w-6 text-primary" /> Child Information
                    </CardTitle>
                    <CardDescription className="text-base mt-1">Enter the core details of the student seeking admission.</CardDescription>
                  </div>
                  <CardContent className="space-y-6 pt-6 grid grid-cols-1">
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="academic_year" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Academic Year *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "2026-2027"}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="2025-2026">2025-2026</SelectItem>
                                <SelectItem value="2026-2027">2026-2027</SelectItem>
                                <SelectItem value="2027-2028">2027-2028</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="class" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Class *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select class"/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="playgroup">Playgroup - ₹20,000</SelectItem>
                                <SelectItem value="nursery">Nursery - ₹25,000</SelectItem>
                                <SelectItem value="lkg">L.K.G. - ₹30,000</SelectItem>
                                <SelectItem value="ukg">U.K.G. - ₹35,000</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )} />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="student_first_name" render={({ field }) => (
                            <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="student_middle_name" render={({ field }) => (
                            <FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="student_last_name" render={({ field }) => (
                            <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                            <FormItem><FormLabel>Date of Birth *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Gender *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select gender"/></SelectTrigger></FormControl>
                                <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="religion" render={({ field }) => (
                            <FormItem><FormLabel>Religion</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="caste" render={({ field }) => (
                            <FormItem><FormLabel>Caste</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    
                    <FormField control={form.control} name="language_known" render={({ field }) => (
                        <FormItem><FormLabel>Mother Tongue / Languages Known</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="residential_address" render={({ field }) => (
                            <FormItem><FormLabel>Residential Address *</FormLabel><FormControl><Textarea className="resize-none h-24" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="correspondence_address" render={({ field }) => (
                            <FormItem><FormLabel>Correspondence Address *</FormLabel><FormControl><Textarea className="resize-none h-24" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Card className="shadow-md border-border/50 overflow-hidden">
                  <div className="bg-primary/5 border-b p-6">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" /> Parents & Emergency Contact
                    </CardTitle>
                    <CardDescription className="text-base mt-1">Provide contact details for parents and an emergency contact.</CardDescription>
                  </div>
                  <CardContent className="space-y-8 pt-6">
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Father */}
                        <div className="space-y-4 p-4 rounded-xl border bg-card">
                            <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2"><User className="h-4 w-4"/> Father's Details</h3>
                            <FormField control={form.control} name="father_phone" render={({ field }) => (
                                <FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="father_email" render={({ field }) => (
                                <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        {/* Mother */}
                        <div className="space-y-4 p-4 rounded-xl border bg-card">
                            <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2"><User className="h-4 w-4"/> Mother's Details</h3>
                            <FormField control={form.control} name="mother_phone" render={({ field }) => (
                                <FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="mother_email" render={({ field }) => (
                                <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border-l-4 border-l-green-500 bg-green-50">
                        <FormField control={form.control} name="preferred_whatsapp" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-green-900">Preferred WhatsApp Number *</FormLabel>
                                <FormControl><Input className="bg-white border-green-200" placeholder="For school updates" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <div className="p-5 rounded-xl border bg-red-50/50 border-red-100">
                        <h3 className="font-semibold text-lg text-red-900 mb-4">Emergency Contact</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
                                <FormItem><FormLabel>Contact Name *</FormLabel><FormControl><Input className="bg-white" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="emergency_contact_relationship" render={({ field }) => (
                                <FormItem><FormLabel>Relationship *</FormLabel><FormControl><Input className="bg-white" placeholder="e.g. Uncle" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="emergency_contact_number" render={({ field }) => (
                                <FormItem><FormLabel>Contact Number *</FormLabel><FormControl><Input className="bg-white" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="medical_conditions" render={({ field }) => (
                            <FormItem><FormLabel>Medical Conditions</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl></FormItem>
                        )} />
                        <div className="space-y-6">
                            <FormField control={form.control} name="allergies" render={({ field }) => (
                                <FormItem><FormLabel>Allergies</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="previous_school" render={({ field }) => (
                                <FormItem><FormLabel>Previous School (if any)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                        </div>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Card className="shadow-md border-border/50 overflow-hidden">
                  <div className="bg-primary/5 border-b p-6">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" /> Key Documents
                    </CardTitle>
                    <CardDescription className="text-base mt-1">Upload photos and required documentation. (Optional for now, but recommended)</CardDescription>
                  </div>
                  <CardContent className="space-y-8 pt-6">
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Photographs</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <FileUploader id="child-photo" label="Child's Photo" keyName="child_photo" />
                            <FileUploader id="father-photo" label="Father's Photo" keyName="father_photo" />
                            <FileUploader id="mother-photo" label="Mother's Photo" keyName="mother_photo" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Official Documents</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <FileUploader id="birth-cert" label="Birth Certificate Xerox" keyName="birth_certificate_file" accept=".pdf,.jpg,.jpeg,.png" />
                            <FileUploader id="aadhaar" label="Aadhaar Card Xerox" keyName="aadhaar_card_file" accept=".pdf,.jpg,.jpeg,.png" />
                        </div>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <Card className="shadow-md border-border/50 overflow-hidden">
                  <div className="bg-primary/5 border-b p-6">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-primary" /> Review & Signatures
                    </CardTitle>
                    <CardDescription className="text-base mt-1">Provide digital signatures and finalize the application.</CardDescription>
                  </div>
                  <CardContent className="space-y-8 pt-6">
                    
                    <div className="bg-muted/50 p-6 rounded-xl text-sm text-foreground/80 leading-relaxed border">
                        <p className="font-semibold text-foreground mb-2">Declaration:</p>
                        I hereby certify that the information given in the admission form is complete and accurate. I understand and
                        agree this misrepresentation or omission of facts will justify the denial of admission, the cancellation of
                        admission or expulsion. I have read and do hereby accede to all terms and conditions enclosed with the
                        registration form.
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Digital Signatures</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <FileUploader id="father-sig" label="Father's Signature" keyName="father_signature_file" accept="image/*,.pdf" />
                            <FileUploader id="mother-sig" label="Mother's Signature" keyName="mother_signature_file" accept="image/*,.pdf" />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <FormField control={form.control} name="signatures_confirmed" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-xl bg-primary/5">
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        id="signatures-confirm"
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                </FormControl>
                                <FormLabel htmlFor="signatures-confirm" className="text-base cursor-pointer">
                                    I confirm that the digital signatures are valid and authorized by the respective guardians
                                </FormLabel>
                            </FormItem>
                        )} />
                    </div>

                    {selectedClass && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-blue-900">Total Annual Fees</h4>
                                <p className="text-sm text-blue-700/80">For {selectedClass.toUpperCase()}</p>
                            </div>
                            <div className="text-3xl font-bold text-blue-700">
                                ₹{totalFee.toLocaleString('en-IN')}
                            </div>
                        </div>
                    )}

                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button 
              type="button" 
              variant="outline" 
              size="lg"
              className={currentStep === 1 ? 'invisible' : ''}
              onClick={prevStep}
              disabled={isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" size="lg" onClick={nextStep} className="px-8 shadow-md">
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="lg" className="px-8 shadow-md" disabled={isSubmitting || !totalFee || !form.getValues('signatures_confirmed')}>
                {isSubmitting ? <BrandLoader text="" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
