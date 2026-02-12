-- ROBUST PERMISSION FIX SCRIPT
-- Run this in Supabase SQL Editor to fixing 'Permission denied' (42501) errors.

-- 1. Grant usage on the public schema
grant usage on schema public to postgres, anon, authenticated, service_role;

-- 2. Grant table access to anon and authenticated users
-- (RLS policies will still restrict what they can actually see/edit)
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- 3. Ensure RLS is enabled on all tables (Critical for security since we granted 'all')
alter table profiles enable row level security;
alter table students enable row level security;
alter table admissions enable row level security;
alter table payments enable row level security;
alter table events enable row level security;
alter table announcements enable row level security;
alter table queries enable row level security;

-- 4. Re-apply Policies (Force overwrite)

-- PROFILES
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- STUDENTS
drop policy if exists "Authenticated users can view students" on students;
create policy "Authenticated users can view students" on students for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert students" on students;
create policy "Authenticated users can insert students" on students for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update students" on students;
create policy "Authenticated users can update students" on students for update using (auth.role() = 'authenticated');

-- ADMISSIONS
drop policy if exists "Authenticated users can view admissions" on admissions;
create policy "Authenticated users can view admissions" on admissions for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert admissions" on admissions;
create policy "Authenticated users can insert admissions" on admissions for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update admissions" on admissions;
create policy "Authenticated users can update admissions" on admissions for update using (auth.role() = 'authenticated');

-- PAYMENTS
drop policy if exists "Authenticated users can view payments" on payments;
create policy "Authenticated users can view payments" on payments for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert payments" on payments;
create policy "Authenticated users can insert payments" on payments for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update payments" on payments;
create policy "Authenticated users can update payments" on payments for update using (auth.role() = 'authenticated');

-- EVENTS
drop policy if exists "Everyone can view events" on events;
create policy "Everyone can view events" on events for select using (true);

drop policy if exists "Authenticated users can insert events" on events;
create policy "Authenticated users can insert events" on events for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update events" on events;
create policy "Authenticated users can update events" on events for update using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete events" on events;
create policy "Authenticated users can delete events" on events for delete using (auth.role() = 'authenticated');

-- ANNOUNCEMENTS
drop policy if exists "Everyone can view announcements" on announcements;
create policy "Everyone can view announcements" on announcements for select using (true);

drop policy if exists "Authenticated users can insert announcements" on announcements;
create policy "Authenticated users can insert announcements" on announcements for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update announcements" on announcements;
create policy "Authenticated users can update announcements" on announcements for update using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete announcements" on announcements;
create policy "Authenticated users can delete announcements" on announcements for delete using (auth.role() = 'authenticated');

-- QUERIES
drop policy if exists "Parents can view own queries" on queries;
create policy "Parents can view own queries" on queries for select using (auth.uid() = parent_id);

drop policy if exists "Parents can insert own queries" on queries;
create policy "Parents can insert own queries" on queries for insert with check (auth.uid() = parent_id);

drop policy if exists "Admins can view all queries" on queries;
create policy "Admins can view all queries" on queries for select using (auth.role() = 'authenticated');

drop policy if exists "Admins can update all queries" on queries;
create policy "Admins can update all queries" on queries for update using (auth.role() = 'authenticated');
