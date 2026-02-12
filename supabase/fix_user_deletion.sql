-- Fix User Deletion - Comprehensive Script

-- 1. Ensure the postgres role (which runs the security definer function) has access to auth schema
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON TABLE auth.users TO postgres;

-- 2. Verify and Recreate the Deletion Function
DROP FUNCTION IF EXISTS public.delete_user_account(uuid);

CREATE OR REPLACE FUNCTION public.delete_user_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth -- CRITICAL: Ensure we can see auth tables
AS $$
BEGIN
  -- 1. Check if the executor is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Only admins can delete users.';
  END IF;

  -- 2. Delete from auth.users (this should cascade to profiles)
  DELETE FROM auth.users WHERE id = user_id;
  
  -- 3. Safety Net: Also delete from profiles just in case cascade failed or user is only in profiles
  -- This won't throw error if row is already gone
  DELETE FROM public.profiles WHERE id = user_id;
  
END;
$$;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;
