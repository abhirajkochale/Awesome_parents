-- Fix Queries Filtering for Parents vs Admins
-- Run this in your Supabase SQL Editor

-- 1. Ensure the is_admin function exists
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'::public.user_role
  );
$$;

-- 2. Drop the overly permissive policies that allowed any parent to see all queries
DROP POLICY IF EXISTS "Admins can view all queries" ON public.queries;
DROP POLICY IF EXISTS "Admins can update all queries" ON public.queries;
DROP POLICY IF EXISTS "Admins have full access to queries" ON public.queries;

-- 3. Create strict policies for Admins
CREATE POLICY "Admins have full access to queries" ON public.queries
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- 4. Ensure Parents only see their own queries
DROP POLICY IF EXISTS "Parents can view own queries" ON public.queries;
DROP POLICY IF EXISTS "Parents can view their own queries" ON public.queries;

CREATE POLICY "Parents can view their own queries" ON public.queries
  FOR SELECT TO authenticated USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can insert own queries" ON public.queries;
DROP POLICY IF EXISTS "Parents can insert their own queries" ON public.queries;

CREATE POLICY "Parents can insert their own queries" ON public.queries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
