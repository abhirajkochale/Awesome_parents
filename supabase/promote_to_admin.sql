-- PROMOTE USER TO ADMIN
-- Run this in your Supabase SQL Editor

UPDATE profiles
SET role = 'admin'
WHERE email = 'kochaleabhiraj@gmail.com';

-- Verify the change. This should return your profile.
SELECT * FROM profiles WHERE email = 'kochaleabhiraj@gmail.com';
