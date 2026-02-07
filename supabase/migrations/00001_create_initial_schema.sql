-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('parent', 'admin');

-- Create admission status enum
CREATE TYPE public.admission_status AS ENUM ('submitted', 'approved', 'rejected');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending_upload', 'under_verification', 'approved', 'rejected');

-- Create profiles table (synced from auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'parent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  class TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  assigned_teacher TEXT,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_relationship TEXT NOT NULL,
  medical_conditions TEXT,
  allergies TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create admissions table
CREATE TABLE public.admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.admission_status NOT NULL DEFAULT 'submitted',
  total_fee DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending_upload',
  payment_type TEXT NOT NULL, -- 'initial' or 'installment'
  verification_notes TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL, -- 'upcoming' or 'past'
  photos TEXT[], -- Array of photo URLs
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'high', 'normal', 'low'
  announcement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admissions_updated_at BEFORE UPDATE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to sync auth.users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'parent'::public.user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger to sync users on confirmation
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Students policies
CREATE POLICY "Admins have full access to students" ON students
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view their own students" ON students
  FOR SELECT TO authenticated USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their own students" ON students
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own students" ON students
  FOR UPDATE TO authenticated USING (auth.uid() = parent_id);

-- Admissions policies
CREATE POLICY "Admins have full access to admissions" ON admissions
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view their own admissions" ON admissions
  FOR SELECT TO authenticated USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their own admissions" ON admissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);

-- Payments policies
CREATE POLICY "Admins have full access to payments" ON payments
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view their own payments" ON payments
  FOR SELECT TO authenticated USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their own payments" ON payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own payments" ON payments
  FOR UPDATE TO authenticated USING (auth.uid() = parent_id);

-- Events policies (all authenticated users can view)
CREATE POLICY "Admins have full access to events" ON events
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "All users can view events" ON events
  FOR SELECT TO authenticated USING (true);

-- Announcements policies (all authenticated users can view)
CREATE POLICY "Admins have full access to announcements" ON announcements
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "All users can view announcements" ON announcements
  FOR SELECT TO authenticated USING (true);

-- Create public view for user info
CREATE VIEW public_profiles AS
  SELECT id, full_name, role FROM profiles;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-9gq4xbatbncx_receipts_images', 'app-9gq4xbatbncx_receipts_images', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-9gq4xbatbncx_events_images', 'app-9gq4xbatbncx_events_images', true);

-- Storage policies for receipts bucket
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-9gq4xbatbncx_receipts_images');

CREATE POLICY "Anyone can view receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'app-9gq4xbatbncx_receipts_images');

CREATE POLICY "Users can update their own receipts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'app-9gq4xbatbncx_receipts_images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for events bucket
CREATE POLICY "Admins can upload event photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-9gq4xbatbncx_events_images' AND is_admin(auth.uid()));

CREATE POLICY "Anyone can view event photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'app-9gq4xbatbncx_events_images');

CREATE POLICY "Admins can update event photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'app-9gq4xbatbncx_events_images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete event photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'app-9gq4xbatbncx_events_images' AND is_admin(auth.uid()));