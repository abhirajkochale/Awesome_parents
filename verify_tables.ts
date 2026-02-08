import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials in .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    console.log('Verifying tables exist in Supabase...');

    const tables = ['profiles', 'students', 'admissions', 'payments', 'events', 'announcements'];
    const missingTables: string[] = [];
    const validTables: string[] = [];

    for (const table of tables) {
        process.stdout.write(`Checking ${table}... `);
        const { error } = await supabase.from(table).select('id').limit(1);

        if (error) {
            if (error.code === '42P01') {
                console.log('MISSING ❌');
                missingTables.push(table);
            } else {
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
