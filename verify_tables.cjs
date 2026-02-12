const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials in .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    console.log('Verifying tables exist in Supabase...');

    // We can't list tables directly with JS client easily without permissions or postgres function.
    // Instead, we will try to select 1 row from each table.
    // Error code 42P01 means table missing.

    const tables = ['profiles', 'students', 'admissions', 'payments', 'events', 'announcements'];
    const missingTables = [];
    const validTables = [];

    for (const table of tables) {
        process.stdout.write(`Checking ${table}... `);
        const { error } = await supabase.from(table).select('id').limit(1);

        if (error) {
            if (error.code === '42P01') {
                console.log('MISSING ❌');
                missingTables.push(table);
            } else {
                // Other errors (like permission denied) mean table exists but maybe empty or restricted
                // We'll consider it "found" but maybe restricted, which is expected before policies.
                console.log('FOUND ✅ (Policy/Data error: ' + error.message + ')');
                validTables.push(table);
            }
        } else {
            console.log('FOUND ✅');
            validTables.push(table);
        }
    }

    console.log('\nSummary:');
    console.log(`✅ Verified: ${validTables.length}/${tables.length}`);
    if (missingTables.length > 0) {
        console.log(`❌ Missing: ${missingTables.join(', ')}`);
        console.log('\nACTION REQUIRED: Run the updated schema.sql in Supabase SQL Editor.');
    } else {
        console.log('All tables verified! Ready for RLS policies.');
    }
}

verifyTables();
