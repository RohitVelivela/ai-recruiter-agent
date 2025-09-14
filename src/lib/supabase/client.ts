import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

  // For demo purposes, use placeholder values
  if (supabaseUrl.includes('demo') || supabaseKey.includes('demo')) {
    console.log('Demo mode: Supabase client not configured with real credentials')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}