-- SQL Script to generate 200 Sample Students with Approved Admissions
-- Paste this into your Supabase SQL Editor and run it.

DO $$
DECLARE
    i INT;
    new_student_id UUID;
    v_full_name TEXT;
    v_class TEXT;
    v_batch_id TEXT;
    v_standard_list TEXT[] := ARRAY['playgroup', 'nursery', 'lkg', 'ukg'];
    -- Standard-wise batch list
    v_pg_batches TEXT[] := ARRAY['playgroup_9_11', 'playgroup_11_1'];
    v_nursery_batches TEXT[] := ARRAY['nursery_9_12', 'nursery_12_3', 'nursery_3_6'];
    v_lkg_batches TEXT[] := ARRAY['lkg_9_12', 'lkg_12_3', 'lkg_3_6'];
    v_ukg_batches TEXT[] := ARRAY['ukg_9_12', 'ukg_12_3', 'ukg_3_6'];
    
    -- Names for random selection
    v_first_names TEXT[] := ARRAY['Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Ishaan', 'Ananya', 'Diya', 'Myra', 'Aria', 'Advait', 'Kabir', 'Rohan', 'Sanya', 'Tara', 'Zoya', 'Karthik', 'Meera', 'Reyansh', 'Siva'];
    v_last_names TEXT[] := ARRAY['Sharma', 'Patel', 'Verma', 'Gupta', 'Singh', 'Reddy', 'Nair', 'Iyer', 'Joshi', 'Chopra', 'Malhotra', 'Kapoor', 'Mehta', 'Kulkarni', 'Deshmukh', 'Das', 'Bose', 'Rao', 'Yadav', 'Khan'];
    v_parent_id UUID;
BEGIN
    -- Automatically find the first user in the database to act as the sample parent
    SELECT id INTO v_parent_id FROM auth.users LIMIT 1;

    IF v_parent_id IS NULL THEN
        RAISE EXCEPTION 'No users found in auth.users. Please sign up at least one user (parent/admin) first.';
    END IF;

    FOR i IN 1..200 LOOP
        -- Select random names
        v_full_name := v_first_names[1 + floor(random() * 20)] || ' ' || v_last_names[1 + floor(random() * 20)];
        
        -- Select random class
        v_class := v_standard_list[1 + floor(random() * 4)];
        
        -- Select random batch based on class
        IF v_class = 'playgroup' THEN
            v_batch_id := v_pg_batches[1 + floor(random() * 2)];
        ELSIF v_class = 'nursery' THEN
            v_batch_id := v_nursery_batches[1 + floor(random() * 3)];
        ELSIF v_class = 'lkg' THEN
            v_batch_id := v_lkg_batches[1 + floor(random() * 3)];
        ELSE
            v_batch_id := v_ukg_batches[1 + floor(random() * 3)];
        END IF;

        -- Insert Student
        INSERT INTO students (
            parent_id,
            full_name,
            gender,
            class,
            academic_year,
            batch_id,
            emergency_contact_name,
            emergency_contact_phone,
            emergency_contact_relationship,
            residential_address,
            correspondence_address,
            mother_phone,
            father_phone,
            preferred_whatsapp,
            allergies,
            medical_conditions,
            date_of_birth
        ) VALUES (
            v_parent_id,
            v_full_name,
            CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
            v_class,
            '2024-2025', -- Current Academic Year
            v_batch_id,
            'Parent of ' || v_full_name,
            '+91 9' || floor(random() * 1000000000)::text,
            'Father',
            'Sample Residential Address ' || i,
            'Sample Correspondence Address ' || i,
            '+91 8' || floor(random() * 1000000000)::text,
            '+91 7' || floor(random() * 1000000000)::text,
            '+91 9' || floor(random() * 1000000000)::text,
            CASE WHEN random() < 0.1 THEN 'Peanuts, Dust' ELSE NULL END,
            CASE WHEN random() < 0.05 THEN 'Asthma' ELSE NULL END,
            (CURRENT_DATE - (interval '3 years' + (random() * 365 * 2) * interval '1 day'))::DATE -- Ages 3-5
        ) RETURNING id INTO new_student_id;

        -- Insert Approved Admission
        -- This ensures they show up as 'Active' in both portals immediately.
        INSERT INTO admissions (
            student_id,
            parent_id,
            status,
            admission_date,
            total_fee
        ) VALUES (
            new_student_id,
            v_parent_id,
            'approved',
            CURRENT_DATE - (random() * 30 * interval '1 day'),
            25000 -- Sample registration fee
        );
    END LOOP;
END $$;
