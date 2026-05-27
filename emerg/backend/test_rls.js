require('dotenv').config({ path: 'c:/Users/ravit/Desktop/EmerMesh/emerg/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL.startsWith('http')
  ? process.env.REACT_APP_SUPABASE_URL
  : `https://${process.env.REACT_APP_SUPABASE_URL}.supabase.co`;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Let's check if env has it

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function checkPolicies() {
    console.log("Checking table schema...");
    const { data, error } = await supabase.rpc('get_policies_or_something'); // we can't easily do this with anon key
}

checkPolicies();
