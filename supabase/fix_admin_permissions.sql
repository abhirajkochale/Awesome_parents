-- 1. Fix Queries Table Policies
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins have full access to queries" ON public.queries;
DROP POLICY IF EXISTS "Parents can view their own queries" ON public.queries;
DROP POLICY IF EXISTS "Parents can insert their own queries" ON public.queries;

-- Create comprehensive policies for queries
CREATE POLICY "Admins have full access to queries" ON public.queries
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Parents can view their own queries" ON public.queries
  FOR SELECT TO authenticated USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their own queries" ON public.queries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);

-- 2. Fix Profiles Table Policies (Ensure DELETE/UPDATE for admins)
-- Drop the restricted admin policy if it exists
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;

-- Create unrestricted admin policy
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 3. Verify Admin Function (Ensure it exists and is correct)
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- 4. Grant essential permissions
GRANT ALL ON public.queries TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.admissions TO authenticated;
