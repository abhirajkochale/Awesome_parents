import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials in .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Verifying tables...');

async function check() {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
        console.error('Check failed:', error.message);
    } else {
        console.log('Profiles table exists! Connection successful.');
    }
}

check();
