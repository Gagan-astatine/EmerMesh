const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const rawUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseUrl = rawUrl.startsWith('http')
  ? rawUrl
  : (rawUrl ? `https://${rawUrl}.supabase.co` : 'https://placeholder.supabase.co');
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder';
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
