import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { admissionApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, Upload, CheckCircle } from 'lucide-react';

// Fee structure based on class
const FEE_STRUCTURE: Record<string, number> = {
  playgroup: 20000,
  nursery: 25000,
  lkg: 30000,
  ukg: 35000,
};

const formSchema = z.object({
  // Student Information
  student_first_name: z.string().min(1, 'First name is required'),
  student_middle_name: z.string(), // Empty string allowed
  student_last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  class: z.string().min(1, 'Class is required'),

  // Languages
  language_known: z.string(),

  // Addresses
  residential_address: z.string().min(5, 'Residential address is required'),
  correspondence_address: z.string().min(5, 'Correspondence address is required'),

  // Personal Details
  religion: z.string(),
  caste: z.string(),

  // Mother's Details
  mother_phone: z.string().min(10, 'Valid phone number is required'),
  mother_email: z.string().email().optional().or(z.literal('')),

  // Father's Details
  father_phone: z.string().min(10, 'Valid phone number is required'),
  father_email: z.string().email().optional().or(z.literal('')),

  // WhatsApp
  preferred_whatsapp: z.string().min(10, 'Valid phone number is required'),

  // Emergency Contact
  emergency_contact_number: z.string().min(10, 'Valid phone number is required'),
  emergency_contact_name: z.string().min(2, 'Contact name is required'),
  emergency_contact_relationship: z.string().min(1, 'Relationship is required'),

  // Previous School
  previous_school: z.string(),

  // Medical
  medical_conditions: z.string(),
  allergies: z.string(),

  // Checklist
  admission_fees: z.boolean(),
  signatures_confirmed: z.boolean(),

  // Academic Year
  academic_year: z.string().min(1, 'Academic year is required'),
});

type AdmissionFormValues = z.infer<typeof formSchema>;

export default function AdmissionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    father_photo: null,
    mother_photo: null,
    child_photo: null,
    birth_certificate_file: null,
    aadhaar_card_file: null,
    immunization_record_file: null,
    mother_signature_file: null,
    father_signature_file: null,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
      mother_phone: '',
      mother_email: '',
      father_phone: '',
      father_email: '',
      preferred_whatsapp: '',
      emergency_contact_number: '',
      emergency_contact_name: '',
      emergency_contact_relationship: '',
      previous_school: '',
      medical_conditions: '',
      allergies: '',
      admission_fees: false,
      signatures_confirmed: false,

      // Academic Year
      academic_year: '2024-2025',
    },
  });

  // Calculate fee based on selected class
  const selectedClass = form.watch('class');
  const totalFee = useMemo(() => {
    return FEE_STRUCTURE[selectedClass] || 0;
  }, [selectedClass]);

  const onSubmit = async (data: AdmissionFormValues) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Calculate full name from parts
      const fullName = [data.student_first_name, data.student_middle_name, data.student_last_name]
        .filter(Boolean)
        .join(' ');

      // Calculate total fee
      // Calculate total fee
      const finalFee = FEE_STRUCTURE[data.class] || 0;
      const fileUploadEntries = Object.entries(uploadedFiles).filter(([, f]) => f) as [string, File][];
      const uploadedUrls: Record<string, string> = {};

      // If there are any files, upload them using storageApi (mock)
      if (fileUploadEntries.length > 0) {
        // upload in batches where appropriate
        for (const [key, file] of fileUploadEntries) {
          try {
            // Upload document securely
            const url = await admissionApi.uploadDocument(file, key);
            if (url) {
              uploadedUrls[key] = url;
            }
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
        description: `Your child's admission has been submitted. Total fee: ₹${finalFee}. Please proceed to make the initial payment.`,
      });

      navigate('/payments');
    } catch (err) {
      setError('Failed to submit admission. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Admission Form</h1>
        <p className="text-base text-muted-foreground">
          Awesome Kids International Preschool - Complete admission application
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Student Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold">Information of Child</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photos Upload Section */}
              <div className="grid md:grid-cols-3 gap-4 mb-6 pb-6 border-b">
                <div
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 hover:border-primary cursor-pointer"
                  onClick={() => document.getElementById('father-photo-input')?.click()}
                >
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Father's Photograph</p>
                  <input
                    id="father-photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setUploadedFiles(prev => ({ ...prev, father_photo: file }));
                      if (file) toast({ title: 'File selected', description: file.name });
                    }}
                  />
                  {uploadedFiles.father_photo && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-green-600 mt-2">✓ {uploadedFiles.father_photo.name}</p>
                      <button
                        type="button"
                        aria-label="Remove file"
                        className="text-red-600 text-sm hover:underline"
                        onClick={() => {
                          setUploadedFiles(prev => ({ ...prev, father_photo: null }));
                          const inp = document.getElementById('father-photo-input') as HTMLInputElement | null;
                          if (inp) inp.value = '';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 hover:border-primary cursor-pointer"
                  onClick={() => document.getElementById('mother-photo-input')?.click()}
                >
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Mother's Photograph</p>
                  <input
                    id="mother-photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setUploadedFiles(prev => ({ ...prev, mother_photo: file }));
                      if (file) toast({ title: 'File selected', description: file.name });
                    }}
                  />
                  {uploadedFiles.mother_photo && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-green-600 mt-2">✓ {uploadedFiles.mother_photo.name}</p>
                      <button
                        type="button"
                        aria-label="Remove file"
                        className="text-red-600 text-sm hover:underline"
                        onClick={() => {
                          setUploadedFiles(prev => ({ ...prev, mother_photo: null }));
                          const inp = document.getElementById('mother-photo-input') as HTMLInputElement | null;
                          if (inp) inp.value = '';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 hover:border-primary cursor-pointer"
                  onClick={() => document.getElementById('child-photo-input')?.click()}
                >
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Child's Photograph</p>
                  <input
                    id="child-photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setUploadedFiles(prev => ({ ...prev, child_photo: file }));
                      if (file) toast({ title: 'File selected', description: file.name });
                    }}
                  />
                  {uploadedFiles.child_photo && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-green-600 mt-2">✓ {uploadedFiles.child_photo.name}</p>
                      <button
                        type="button"
                        aria-label="Remove file"
                        className="text-red-600 text-sm hover:underline"
                        onClick={() => {
                          setUploadedFiles(prev => ({ ...prev, child_photo: null }));
                          const inp = document.getElementById('child-photo-input') as HTMLInputElement | null;
                          if (inp) inp.value = '';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="student_first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="student_middle_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Middle name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="student_last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gender and DOB */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Class Selection with Dynamic Fee */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class for which admission is sought</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="playgroup">Playgroup - ₹20,000</SelectItem>
                          <SelectItem value="nursery">Nursery - ₹25,000</SelectItem>
                          <SelectItem value="lkg">L.K.G. - ₹30,000</SelectItem>
                          <SelectItem value="ukg">U.K.G. - ₹35,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedClass && (
                  <div className="flex items-end">
                    <div className="w-full bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-muted-foreground">Annual Fees</p>
                      <p className="text-2xl font-bold text-blue-600">₹{totalFee.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Language */}
              <FormField
                control={form.control}
                name="language_known"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language Known</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., English, Hindi, Marathi" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Addresses */}
              <FormField
                control={form.control}
                name="residential_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Residential Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter residential address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="correspondence_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correspondence Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter correspondence address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Religion and Caste */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter religion" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="caste"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caste</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter caste (optional)" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Medical Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="medical_conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Conditions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any medical conditions" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any known allergies" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Parents Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold">Parents Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="text-lg">👨</span> Father's Information
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="father_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ph. No. Father</FormLabel>
                          <FormControl>
                            <Input placeholder="Father's phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="father_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address Father</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Father's email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="text-lg">👩</span> Mother's Information
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mother_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ph. No. Mother</FormLabel>
                          <FormControl>
                            <Input placeholder="Mother's phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mother_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address Mother</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Mother's email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="preferred_whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Phone Number for School WhatsApp Messages</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number for WhatsApp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="emergency_contact_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Emergency contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name the Person to be Contacted</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency_contact_relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grandmother, Aunt, Uncle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Previous School */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold">Previous Education</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="previous_school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous School (if any) Attended</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of previous school" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Required Documents Upload */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold">Upload Required Documents</CardTitle>
              <CardDescription className="text-sm">Upload each document separately (PDF, JPG, PNG)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Birth Certificate Upload */}
                <div className="space-y-3">
                  <FormLabel className="text-base font-semibold">Birth Certificate Xerox</FormLabel>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition"
                    onClick={() => document.getElementById('birth-cert-input')?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                    <input
                      id="birth-cert-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          setUploadedFiles(prev => ({ ...prev, birth_certificate_file: file }));
                          toast({ title: 'File selected', description: `${file.name} selected` });
                        }
                      }}
                      className="hidden"
                    />
                    {uploadedFiles['birth_certificate_file'] && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-green-600 mt-2">✓ {uploadedFiles['birth_certificate_file']?.name}</p>
                        <button
                          type="button"
                          className="text-red-600 text-sm hover:underline"
                          onClick={() => {
                            setUploadedFiles(prev => ({ ...prev, birth_certificate_file: null }));
                            const inp = document.getElementById('birth-cert-input') as HTMLInputElement | null;
                            if (inp) inp.value = '';
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Aadhaar Card Upload */}
                <div className="space-y-3">
                  <FormLabel className="text-base font-semibold">Aadhaar Card Xerox</FormLabel>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition"
                    onClick={() => document.getElementById('aadhaar-input')?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                    <input
                      id="aadhaar-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          setUploadedFiles(prev => ({ ...prev, aadhaar_card_file: file }));
                          toast({ title: 'File selected', description: `${file.name} selected` });
                        }
                      }}
                      className="hidden"
                    />
                    {uploadedFiles['aadhaar_card_file'] && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-green-600 mt-2">✓ {uploadedFiles['aadhaar_card_file']?.name}</p>
                        <button
                          type="button"
                          className="text-red-600 text-sm hover:underline"
                          onClick={() => {
                            setUploadedFiles(prev => ({ ...prev, aadhaar_card_file: null }));
                            const inp = document.getElementById('aadhaar-input') as HTMLInputElement | null;
                            if (inp) inp.value = '';
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Immunization Record Upload */}
                <div className="space-y-3">
                  <FormLabel className="text-base font-semibold">Immunization Record</FormLabel>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition"
                    onClick={() => document.getElementById('immunization-input')?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                    <input
                      id="immunization-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          setUploadedFiles(prev => ({ ...prev, immunization_record_file: file }));
                          toast({ title: 'File selected', description: `${file.name} selected` });
                        }
                      }}
                      className="hidden"
                    />
                    {uploadedFiles['immunization_record_file'] && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-green-600 mt-2">✓ {uploadedFiles['immunization_record_file']?.name}</p>
                        <button
                          type="button"
                          className="text-red-600 text-sm hover:underline"
                          onClick={() => {
                            setUploadedFiles(prev => ({ ...prev, immunization_record_file: null }));
                            const inp = document.getElementById('immunization-input') as HTMLInputElement | null;
                            if (inp) inp.value = '';
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signatures Section */}
          <Card>
            <CardHeader>
              <CardTitle>Declarations & Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-sm text-muted-foreground">
                <p className="mb-4">
                  I hereby certify that the information given in the admission form is complete and accurate. I understand and
                  agree this misrepresentation or omission of facts will justify the denial of admission, the cancellation of
                  admission or expulsion. I have read and do hereby accede to all terms and conditions enclosed with the
                  registration form.
                </p>
              </div>

              {/* Signature Upload Section */}
              <div className="border-t pt-6 space-y-6">
                <p className="font-semibold text-base">Upload Digital Signatures</p>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Mother's Signature */}
                  <div className="space-y-4">
                    <FormLabel className="text-base font-semibold">Mother's Digital Signature</FormLabel>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition aspect-video flex flex-col items-center justify-center"
                      onClick={() => document.getElementById('mother-sig-input')?.click()}
                    >
                      {uploadedFiles['mother_signature_file'] ? (
                        <>
                          <CheckCircle className="h-12 w-12 text-green-600 mb-2" />
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-green-600">{uploadedFiles['mother_signature_file']?.name}</p>
                            <button
                              type="button"
                              className="text-red-600 text-sm hover:underline"
                              onClick={() => {
                                setUploadedFiles(prev => ({ ...prev, mother_signature_file: null }));
                                const inp = document.getElementById('mother-sig-input') as HTMLInputElement | null;
                                if (inp) inp.value = '';
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Click to upload</p>
                          <p className="text-xs text-muted-foreground">Image or PDF</p>
                        </>
                      )}
                      <input
                        id="mother-sig-input"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            setUploadedFiles(prev => ({ ...prev, mother_signature_file: file }));
                            toast({ title: 'Signature selected', description: `${file.name} selected` });
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Father's Signature */}
                  <div className="space-y-4">
                    <FormLabel className="text-base font-semibold">Father's Digital Signature</FormLabel>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition aspect-video flex flex-col items-center justify-center"
                      onClick={() => document.getElementById('father-sig-input')?.click()}
                    >
                      {uploadedFiles['father_signature_file'] ? (
                        <>
                          <CheckCircle className="h-12 w-12 text-green-600 mb-2" />
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-green-600">{uploadedFiles['father_signature_file']?.name}</p>
                            <button
                              type="button"
                              className="text-red-600 text-sm hover:underline"
                              onClick={() => {
                                setUploadedFiles(prev => ({ ...prev, father_signature_file: null }));
                                const inp = document.getElementById('father-sig-input') as HTMLInputElement | null;
                                if (inp) inp.value = '';
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Click to upload</p>
                          <p className="text-xs text-muted-foreground">Image or PDF</p>
                        </>
                      )}
                      <input
                        id="father-sig-input"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            setUploadedFiles(prev => ({ ...prev, father_signature_file: file }));
                            toast({ title: 'Signature selected', description: `${file.name} selected` });
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Signature Confirmation */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Signature Confirmation</p>
                  <FormField
                    control={form.control}
                    name="signatures_confirmed"
                    render={({ field }) => (
                      <div className="flex flex-row items-center space-x-3">
                        <FormControl>
                          <input
                            type="checkbox"
                            id="signatures-confirm"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              if (e.target.checked) {
                                toast({
                                  title: 'Signatures Acknowledged',
                                  description: 'You have confirmed both signatures.',
                                });
                              }
                            }}
                          />
                        </FormControl>
                        <label htmlFor="signatures-confirm" className="text-sm font-medium cursor-pointer">
                          I confirm that the digital signatures are valid and authorized by the respective guardians
                        </label>
                      </div>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Year */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Year</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="academic_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2025-2026" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !totalFee}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Admission
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
