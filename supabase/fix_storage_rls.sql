-- Run this in your Supabase project's SQL Editor to fix the 'Object not found' error for Admin file downloads.

-- Drop the broken policies
drop policy if exists "Users can view own documents" on storage.objects;
drop policy if exists "Admins can view all documents" on storage.objects;

-- Recreate with proper schema prefix ('public.profiles')
create policy "Users can view own documents" on storage.objects 
  for select using (bucket_id = 'documents' and auth.uid() = owner);

create policy "Admins can view all documents" on storage.objects
  for select using (
    bucket_id = 'documents' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
