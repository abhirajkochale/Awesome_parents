-- ============================================================
-- MIGRATION: Harden RLS Policies + Add Query Reply Columns
-- Run this on your existing Supabase database (SQL Editor)
-- This does NOT drop/recreate tables — it only updates policies
-- ============================================================

-- ==================
-- 1. DROP OLD BROAD POLICIES
-- ==================

-- Students
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;

-- Admissions
DROP POLICY IF EXISTS "Authenticated users can view admissions" ON admissions;
DROP POLICY IF EXISTS "Authenticated users can insert admissions" ON admissions;
DROP POLICY IF EXISTS "Authenticated users can update admissions" ON admissions;

-- Payments
DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;

-- Events
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON events;

-- Announcements
DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON announcements;


-- ==================
-- 2. CREATE NEW SECURE POLICIES
-- ==================

-- Students: parents see own, admins see all
CREATE POLICY "Parents view own students" ON students FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Admins view all students" ON students FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Parents insert own students" ON students FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents update own students" ON students FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Admins update all students" ON students FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admissions: parents see own, admins see all, admins can delete
CREATE POLICY "Parents view own admissions" ON admissions FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Admins view all admissions" ON admissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Parents insert own admissions" ON admissions FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents update own admissions" ON admissions FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Admins update all admissions" ON admissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins delete admissions" ON admissions FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Payments: parents see own, admins see all
CREATE POLICY "Parents view own payments" ON payments FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Admins view all payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Parents insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents update own payments" ON payments FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Admins update all payments" ON payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Events: admin-only write (keep existing public SELECT)
CREATE POLICY "Admins insert events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins update events" ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins delete events" ON events FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Announcements: admin-only write (keep existing public SELECT)
CREATE POLICY "Admins insert announcements" ON announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins update announcements" ON announcements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins delete announcements" ON announcements FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);


-- ==================
-- 3. ADD MISSING COLUMNS TO QUERIES TABLE
-- ==================

ALTER TABLE queries ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE queries ADD COLUMN IF NOT EXISTS replied_by uuid REFERENCES profiles(id);
ALTER TABLE queries ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone;
