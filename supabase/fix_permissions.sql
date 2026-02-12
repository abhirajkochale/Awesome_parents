-- RLS POLICY FIX SCRIPT
-- Run this script in your Supabase SQL Editor to fix "Permission Denied" (403) errors.

-- 1. PROFILES
alter table profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 2. STUDENTS
alter table students enable row level security;

drop policy if exists "Authenticated users can view students" on students;
create policy "Authenticated users can view students" on students for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert students" on students;
create policy "Authenticated users can insert students" on students for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update students" on students;
create policy "Authenticated users can update students" on students for update using (auth.role() = 'authenticated');

-- 3. ADMISSIONS
alter table admissions enable row level security;

drop policy if exists "Authenticated users can view admissions" on admissions;
create policy "Authenticated users can view admissions" on admissions for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert admissions" on admissions;
create policy "Authenticated users can insert admissions" on admissions for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update admissions" on admissions;
create policy "Authenticated users can update admissions" on admissions for update using (auth.role() = 'authenticated');

-- 4. PAYMENTS
alter table payments enable row level security;

drop policy if exists "Authenticated users can view payments" on payments;
create policy "Authenticated users can view payments" on payments for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert payments" on payments;
create policy "Authenticated users can insert payments" on payments for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update payments" on payments;
create policy "Authenticated users can update payments" on payments for update using (auth.role() = 'authenticated');

-- 5. EVENTS (Public View)
alter table events enable row level security;

drop policy if exists "Everyone can view events" on events;
create policy "Everyone can view events" on events for select using (true);

drop policy if exists "Authenticated users can insert events" on events;
create policy "Authenticated users can insert events" on events for insert with check (auth.role() = 'authenticated'); -- Ideally restricted to admin

drop policy if exists "Authenticated users can update events" on events;
create policy "Authenticated users can update events" on events for update using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete events" on events;
create policy "Authenticated users can delete events" on events for delete using (auth.role() = 'authenticated');

-- 6. ANNOUNCEMENTS (Public View)
alter table announcements enable row level security;

drop policy if exists "Everyone can view announcements" on announcements;
create policy "Everyone can view announcements" on announcements for select using (true);

drop policy if exists "Authenticated users can insert announcements" on announcements;
create policy "Authenticated users can insert announcements" on announcements for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update announcements" on announcements;
create policy "Authenticated users can update announcements" on announcements for update using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete announcements" on announcements;
create policy "Authenticated users can delete announcements" on announcements for delete using (auth.role() = 'authenticated');

-- 7. QUERIES
alter table queries enable row level security;

drop policy if exists "Parents can view own queries" on queries;
create policy "Parents can view own queries" on queries for select using (auth.uid() = parent_id);

drop policy if exists "Parents can insert own queries" on queries;
create policy "Parents can insert own queries" on queries for insert with check (auth.uid() = parent_id);

-- Admins permissions (simplified for now to allow any authenticated, or you can run specific admin setup later)
drop policy if exists "Admins can view all queries" on queries;
create policy "Admins can view all queries" on queries for select using (auth.role() = 'authenticated'); 

drop policy if exists "Admins can update all queries" on queries;
create policy "Admins can update all queries" on queries for update using (auth.role() = 'authenticated');

