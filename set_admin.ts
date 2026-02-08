import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env file
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            console.error('ERROR: .env file not found.');
            return {};
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env: Record<string, string> = {};
        envContent.split('\n').forEach((line: string) => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                env[key] = value;
            }
        });
        return env;
    } catch (e: unknown) {
        console.error('Error loading .env', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials in .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setAdmin(email: string) {
    if (!email) {
        console.error('Usage: npx tsx set_admin.ts <email>');
        process.exit(1);
    }

    console.log(`Looking up user with email: ${email}...`);

    // 1. Get the user's profile
    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email);

    if (fetchError) {
        console.error('Error fetching profile:', fetchError.message);
        process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
        console.error(`No profile found for email: ${email}`);
        console.log('Please sign up/login in the app first to create a profile.');
        process.exit(1);
    }

    const profile = profiles[0];
    console.log(`Found profile for ${profile.full_name || 'User'} (${profile.id})`);
    console.log(`Current role: ${profile.role}`);

    if (profile.role === 'admin') {
        console.log('User is already an admin.');
        return;
    }

    // 2. Update the role
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', profile.id);

    if (updateError) {
        console.error('Error updating role:', updateError.message);
        console.log('\nTIP: If you have RLS policies preventing this, you might need to run this SQL in Supabase Editor:');
        console.log(`UPDATE profiles SET role = 'admin' WHERE email = '${email}';`);
    } else {
        console.log(`✅ Successfully promoted ${email} to 'admin'.`);
    }
}

const emailArg = process.argv[2];
setAdmin(emailArg);
