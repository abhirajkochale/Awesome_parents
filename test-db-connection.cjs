require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials in .env file.');
    console.error('VITE_SUPABASE_URL:', supabaseUrl);
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '********' : 'undefined');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase connection...');

    try {
        // Try to fetch from profiles table to see if it exists
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection failed:', error.message);
            if (error.code === '42P01') {
                console.log('DIAGNOSIS: Table "profiles" does not exist. You likely need to run the SQL schema.');
            } else {
                console.log('DIAGNOSIS: API Error. Check your connection or keys.');
            }
        } else {
            console.log('SUCCESS: Connected to Supabase and found "profiles" table.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
