-- Fix missing DELETE policies for Admins
-- This ensures admins can clean up students and payments when an admission is deleted

-- 1. Students DELETE policy
DROP POLICY IF EXISTS "Admins delete all students" ON public.students;
CREATE POLICY "Admins delete all students" ON public.students 
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Payments DELETE policy
DROP POLICY IF EXISTS "Admins delete all payments" ON public.payments;
CREATE POLICY "Admins delete all payments" ON public.payments 
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Verify Admissions DELETE policy (already exists in harden_rls_policies.sql, but ensuring it)
DROP POLICY IF EXISTS "Admins delete admissions" ON public.admissions;
CREATE POLICY "Admins delete admissions" ON public.admissions 
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Grant permissions explicitly
GRANT DELETE ON public.students TO authenticated;
GRANT DELETE ON public.payments TO authenticated;
GRANT DELETE ON public.admissions TO authenticated;
