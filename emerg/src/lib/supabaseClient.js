import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL.startsWith('http')
  ? process.env.REACT_APP_SUPABASE_URL
  : `https://${process.env.REACT_APP_SUPABASE_URL}.supabase.co`

const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
