const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const rawUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseUrl = rawUrl.startsWith('http')
  ? rawUrl
  : (rawUrl ? `https://${rawUrl}.supabase.co` : 'https://placeholder.supabase.co');
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log("Signing up random user...");

  const email = `test_${Date.now()}@gmail.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });
  
  if (authError) {
    console.error("Auth failed:", authError);
    return;
  }
  
  if (!authData.session) {
      console.log("Signup succeeded, but email confirmation might be required (session is null).");
  } else {
      console.log("Signed in as:", authData.user.id);
  }

  console.log("Testing Supabase insert...");
  const { data, error } = await supabase.from('messages').insert({
      sender_id: authData.user.id,
      room_id: 'test-room',
      content: 'test content',
      priority: 'sos',
  }).select();
  
  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert succeeded:", data);
  }
}

testInsert();
