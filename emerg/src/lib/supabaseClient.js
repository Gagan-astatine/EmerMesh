import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseUrl = rawUrl.startsWith('http')
  ? rawUrl
  : (rawUrl ? `https://${rawUrl}.supabase.co` : 'https://placeholder.supabase.co')

const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

