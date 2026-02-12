import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wggszblsmzqvsqsnmezs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ3N6YmxzbXpxdnNxc25tZXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NDc0NDUsImV4cCI6MjA4NjAyMzQ0NX0.ucJg0ExQD04wlB6nJJ7HjZ5nmIlX4rIQ_EQmZ-tjZmQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = ['profiles', 'students', 'admissions', 'payments', 'events', 'announcements'];

console.log('Starting verification...');

async function check() {
    for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code === '42P01') {
            console.error(`❌ ${table} MISSING`);
        } else {
            console.log(`✅ ${table} EXISTS`);
        }
    }
}

check();
