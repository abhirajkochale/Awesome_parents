-- ⚠️ DESTRUCTIVE: Drop existing tables to start fresh
drop table if exists payments cascade;
drop table if exists admissions cascade;
drop table if exists students cascade;
drop table if exists events cascade;
drop table if exists announcements cascade;
drop table if exists profiles cascade;

-- 1. PROFILES TABLE (Extends Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  email text,
  phone text,
  role text default 'parent' check (role in ('parent', 'admin')),

  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Trigger to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, role, email)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'role', 'parent'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. STUDENTS TABLE
create table students (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references profiles(id) on delete cascade not null,
  full_name text not null,
  date_of_birth date not null,
  gender text not null,
  class text not null,
  academic_year text not null,
  assigned_teacher text,
  
  -- Emergency Contact
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  emergency_contact_relationship text not null,
  
  -- Address & Contact (NEW)
  residential_address text,
  correspondence_address text,
  religion text,
  caste text,
  mother_phone text,
  mother_email text,
  father_phone text,
  father_email text,
  preferred_whatsapp text,
  previous_school text,
  
  -- Medical
  medical_conditions text,
  allergies text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table students enable row level security;

-- 3. ADMISSIONS TABLE
create table admissions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade not null,
  parent_id uuid references profiles(id) on delete cascade not null,
  admission_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  total_fee numeric not null,
  uploaded_files jsonb, -- Stores key-value pairs of file URLs
  notes text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table admissions enable row level security;

-- 4. PAYMENTS TABLE
create table payments (
  id uuid default gen_random_uuid() primary key,
  admission_id uuid references admissions(id) on delete cascade not null,
  parent_id uuid references profiles(id) on delete cascade not null,
  amount numeric not null,
  payment_date timestamp with time zone default timezone('utc'::text, now()) not null,
  receipt_url text,
  status text default 'pending_upload' check (status in ('pending_upload', 'under_verification', 'approved', 'rejected')),
  payment_type text default 'initial' check (payment_type in ('initial', 'installment')),
  
  verification_notes text,
  verified_by uuid references profiles(id),
  verified_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table payments enable row level security;

-- 5. EVENTS TABLE
create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  event_date timestamp with time zone not null,
  event_type text default 'upcoming' check (event_type in ('upcoming', 'past')),
  photos text[] default array[]::text[],
  created_by uuid references profiles(id),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table events enable row level security;

-- 6. ANNOUNCEMENTS TABLE
create table announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  priority text default 'normal' check (priority in ('high', 'normal', 'low')),
  announcement_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references profiles(id),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table announcements enable row level security;

-- 7. STORAGE BUCKETS
-- Insert buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false) -- Private bucket for admission docs
on conflict (id) do nothing;


-- 8. RLS POLICIES
-- For DEVELOPMENT purposes, we allow authenticated users broad access. 
-- In a real production app, you would refine 'using' clauses to check user IDs.

-- NOTE: Since storage policies are on the GLOBAL 'storage.objects' table, we must confirm existence or drop before creating
-- to avoid "policy already exists" errors when resetting the database.

-- Students
create policy "Authenticated users can view students" on students for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert students" on students for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update students" on students for update using (auth.role() = 'authenticated');

-- Admissions
create policy "Authenticated users can view admissions" on admissions for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert admissions" on admissions for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update admissions" on admissions for update using (auth.role() = 'authenticated');

-- Payments
create policy "Authenticated users can view payments" on payments for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert payments" on payments for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update payments" on payments for update using (auth.role() = 'authenticated');

-- Events
create policy "Everyone can view events" on events for select using (true);
create policy "Authenticated users can insert events" on events for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update events" on events for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete events" on events for delete using (auth.role() = 'authenticated');

-- Announcements
create policy "Everyone can view announcements" on announcements for select using (true);
create policy "Authenticated users can insert announcements" on announcements for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update announcements" on announcements for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete announcements" on announcements for delete using (auth.role() = 'authenticated');

-- Storage Policies
-- CAREFUL: These policies are on `storage.objects` which is NOT dropped by `drop table ...`.
-- We must drop them if they exist to avoid errors.

drop policy if exists "Public Access to Events" on storage.objects;
create policy "Public Access to Events" on storage.objects for select using (bucket_id = 'events');

drop policy if exists "Authenticated Insert to Events" on storage.objects;
create policy "Authenticated Insert to Events" on storage.objects for insert with check (bucket_id = 'events' and auth.role() = 'authenticated');

drop policy if exists "Public Access to Receipts" on storage.objects;
create policy "Public Access to Receipts" on storage.objects for select using (bucket_id = 'receipts');

drop policy if exists "Authenticated Insert to Receipts" on storage.objects;
create policy "Authenticated Insert to Receipts" on storage.objects for insert with check (bucket_id = 'receipts' and auth.role() = 'authenticated');

drop policy if exists "Authenticated Insert to Documents" on storage.objects;
create policy "Authenticated Insert to Documents" on storage.objects for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');

drop policy if exists "Users can view own documents" on storage.objects;
create policy "Users can view own documents" on storage.objects for select using (bucket_id = 'documents' and auth.uid() = owner);

drop policy if exists "Admins can view all documents" on storage.objects;
create policy "Admins can view all documents" on storage.objects
  for select using (
    bucket_id = 'documents' and
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 9. QUERIES TABLE (Help & Feedback)
create table queries (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references profiles(id) on delete cascade not null,
  subject text not null,
  message text not null,
  attachment_url text,
  status text default 'open' check (status in ('open', 'replied', 'closed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table queries enable row level security;

-- 10. STORAGE BUCKETS (Additional)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- 11. RLS POLICIES (Additional)
-- Queries
create policy "Parents can view own queries" on queries for select using (auth.uid() = parent_id);
create policy "Parents can insert own queries" on queries for insert with check (auth.uid() = parent_id);
create policy "Admins can view all queries" on queries for select using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
create policy "Admins can update all queries" on queries for update using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Storage for attachments
drop policy if exists "Authenticated Access to Attachments" on storage.objects;
create policy "Authenticated Access to Attachments" on storage.objects for select using (bucket_id = 'attachments' and auth.role() = 'authenticated');

drop policy if exists "Authenticated Insert to Attachments" on storage.objects;
create policy "Authenticated Insert to Attachments" on storage.objects for insert with check (bucket_id = 'attachments' and auth.role() = 'authenticated');
