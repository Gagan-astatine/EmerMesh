require('dotenv').config({ path: 'c:/Users/ravit/Desktop/EmerMesh/emerg/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL.startsWith('http')
  ? process.env.REACT_APP_SUPABASE_URL
  : `https://${process.env.REACT_APP_SUPABASE_URL}.supabase.co`;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchMessages() {
  console.log("Fetching recent messages...");
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(10);
  
  if (error) {
    console.error("Fetch failed:", error);
  } else {
    console.log("Recent messages:", JSON.stringify(data, null, 2));
  }
}

fetchMessages();
